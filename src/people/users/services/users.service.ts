import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../../../database/services/database.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { QueryUserDto } from '../dto/query-user.dto';
import { PaginationResponseDto } from '../../../organization/common/dto/pagination.dto';
import { User, UserResponse } from '../interfaces/user.interface';
import { UserWithDetails } from '../../../auth/interfaces/auth.interface';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private databaseService: DatabaseService) {}

  async create(createUserDto: CreateUserDto, currentUser: UserWithDetails): Promise<UserResponse> {
    const { personId, companyId, roleId, username, password, email } = createUserDto;

    // Determinar la compañía
    const targetCompanyId = companyId || currentUser.company_id;

    // Verificar permisos: Solo Super Admin puede crear usuarios en cualquier compañía
    if (currentUser.role.name !== 'Super Admin' && targetCompanyId !== currentUser.company_id) {
      throw new ForbiddenException('No tienes permisos para crear usuarios en otra compañía');
    }

    // Verificar si ya existe un usuario con el mismo username
    const existingUser = await this.findByUsername(username);
    if (existingUser) {
      throw new ConflictException('Ya existe un usuario con este nombre de usuario');
    }

    // Verificar que la persona existe y no tiene usuario activo
    const personQuery = 'SELECT id FROM persons WHERE id = $1 AND is_active = true';
    const { rows: personRows } = await this.databaseService.query(personQuery, [personId]);
    
    if (personRows.length === 0) {
      throw new NotFoundException('Persona no encontrada');
    }

    // Verificar que la persona no tenga ya un usuario activo
    const existingUserForPerson = await this.findByPersonId(personId);
    if (existingUserForPerson) {
      throw new ConflictException('Esta persona ya tiene un usuario asociado');
    }

    // Verificar que la compañía existe
    const companyQuery = 'SELECT id FROM companies WHERE id = $1 AND is_active = true';
    const { rows: companyRows } = await this.databaseService.query(companyQuery, [targetCompanyId]);
    
    if (companyRows.length === 0) {
      throw new NotFoundException('Compañía no encontrada');
    }

    // Verificar que el rol existe
    const roleQuery = 'SELECT id FROM roles WHERE id = $1 AND is_active = true';
    const { rows: roleRows } = await this.databaseService.query(roleQuery, [roleId]);
    
    if (roleRows.length === 0) {
      throw new NotFoundException('Rol no encontrado');
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO users (person_id, company_id, role_id, username, password_hash, email, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING id, person_id, company_id, role_id, username, email, is_active, created_at, updated_at
    `;

    const { rows } = await this.databaseService.query(query, [
      personId,
      targetCompanyId,
      roleId,
      username,
      hashedPassword,
      email || null,
    ]);

    return this.mapToResponse(rows[0]);
  }

  async findAll(queryDto: QueryUserDto, currentUser: UserWithDetails): Promise<PaginationResponseDto<UserResponse>> {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      companyId, 
      roleId, 
      isActive, 
      createdFrom, 
      createdTo, 
      includeDetails = true,
      sortBy = 'username', 
      sortOrder = 'ASC' 
    } = queryDto;
    const offset = (page - 1) * limit;

    // Construir condiciones WHERE
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Control de acceso: Solo Super Admin puede ver usuarios de todas las compañías
    if (currentUser.role.name !== 'Super Admin') {
      conditions.push(`u.company_id = $${paramIndex}`);
      params.push(currentUser.company_id);
      paramIndex++;
    } else if (companyId) {
      conditions.push(`u.company_id = $${paramIndex}`);
      params.push(companyId);
      paramIndex++;
    }

    if (search) {
      conditions.push(`(u.username ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR p.first_name ILIKE $${paramIndex} OR p.last_name ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (roleId) {
      conditions.push(`u.role_id = $${paramIndex}`);
      params.push(roleId);
      paramIndex++;
    }

    if (isActive !== undefined) {
      conditions.push(`u.is_active = $${paramIndex}`);
      params.push(isActive);
      paramIndex++;
    }

    if (createdFrom) {
      conditions.push(`u.created_at >= $${paramIndex}`);
      params.push(createdFrom);
      paramIndex++;
    }

    if (createdTo) {
      conditions.push(`u.created_at <= $${paramIndex}`);
      params.push(createdTo);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validar campo de ordenamiento
    const allowedSortFields = ['username', 'email', 'created_at', 'updated_at', 'last_login'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'username';
    const orderDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Query principal
    let selectFields = 'u.id, u.person_id, u.company_id, u.role_id, u.username, u.email, u.is_active, u.last_login, u.created_at, u.updated_at';
    let joinClause = '';

    if (includeDetails) {
      selectFields += ', p.first_name, p.last_name, p.identification_number, it.name as identification_type_name, it.code as identification_type_code, c.name as company_name, r.name as role_name, r.permissions as role_permissions';
      joinClause = `
        INNER JOIN persons p ON u.person_id = p.id
        INNER JOIN identification_types it ON p.identification_type_id = it.id
        INNER JOIN companies c ON u.company_id = c.id
        INNER JOIN roles r ON u.role_id = r.id
      `;
    }

    const dataQuery = `
      SELECT ${selectFields}
      FROM users u
      ${joinClause}
      ${whereClause}
      ORDER BY u.${orderField} ${orderDirection}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      ${includeDetails ? 'INNER JOIN persons p ON u.person_id = p.id INNER JOIN companies c ON u.company_id = c.id INNER JOIN roles r ON u.role_id = r.id' : ''}
      ${whereClause}
    `;

    // Ejecutar consultas
    const [dataResult, countResult] = await Promise.all([
      this.databaseService.query(dataQuery, [...params, limit, offset]),
      this.databaseService.query(countQuery, params),
    ]);

    const users = dataResult.rows.map(row => this.mapToResponse(row, includeDetails));
    const total = parseInt(countResult.rows[0].total);

    return new PaginationResponseDto(users, total, page, limit);
  }

  async findOne(id: string, currentUser: UserWithDetails): Promise<UserResponse> {
    const query = `
      SELECT u.id, u.person_id, u.company_id, u.role_id, u.username, u.email, u.is_active, u.last_login, u.created_at, u.updated_at,
             p.first_name, p.last_name, p.identification_number,
             it.name as identification_type_name, it.code as identification_type_code,
             c.name as company_name,
             r.name as role_name, r.permissions as role_permissions
      FROM users u
      INNER JOIN persons p ON u.person_id = p.id
      INNER JOIN identification_types it ON p.identification_type_id = it.id
      INNER JOIN companies c ON u.company_id = c.id
      INNER JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
    `;

    const { rows } = await this.databaseService.query(query, [id]);

    if (rows.length === 0) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const user = rows[0];

    // Control de acceso: Solo Super Admin puede ver usuarios de otras compañías
    if (currentUser.role.name !== 'Super Admin' && user.company_id !== currentUser.company_id) {
      throw new ForbiddenException('No tienes permisos para ver este usuario');
    }

    return this.mapToResponse(user, true);
  }

  async update(id: string, updateUserDto: UpdateUserDto, currentUser: UserWithDetails): Promise<UserResponse> {
    const { personId, companyId, roleId, username, password, email, isActive } = updateUserDto;

    // Verificar si el usuario existe y obtener sus datos actuales
    const existingUser = await this.findOne(id, currentUser);

    // Control de acceso: Solo Super Admin puede actualizar usuarios de otras compañías
    if (currentUser.role.name !== 'Super Admin' && existingUser.companyId !== currentUser.company_id) {
      throw new ForbiddenException('No tienes permisos para actualizar este usuario');
    }

    // Verificar si el username ya existe en otro usuario
    if (username) {
      const existingUserByUsername = await this.findByUsername(username);
      if (existingUserByUsername && existingUserByUsername.id !== id) {
        throw new ConflictException('Ya existe otro usuario con este nombre de usuario');
      }
    }

    // Verificar entidades relacionadas si se están actualizando
    if (personId) {
      const personQuery = 'SELECT id FROM persons WHERE id = $1 AND is_active = true';
      const { rows: personRows } = await this.databaseService.query(personQuery, [personId]);
      
      if (personRows.length === 0) {
        throw new NotFoundException('Persona no encontrada');
      }

      // Verificar que la persona no tenga ya otro usuario activo
      const existingUserForPerson = await this.findByPersonId(personId);
      if (existingUserForPerson && existingUserForPerson.id !== id) {
        throw new ConflictException('Esta persona ya tiene otro usuario asociado');
      }
    }

    if (companyId) {
      const companyQuery = 'SELECT id FROM companies WHERE id = $1 AND is_active = true';
      const { rows: companyRows } = await this.databaseService.query(companyQuery, [companyId]);
      
      if (companyRows.length === 0) {
        throw new NotFoundException('Compañía no encontrada');
      }
    }

    if (roleId) {
      const roleQuery = 'SELECT id FROM roles WHERE id = $1 AND is_active = true';
      const { rows: roleRows } = await this.databaseService.query(roleQuery, [roleId]);
      
      if (roleRows.length === 0) {
        throw new NotFoundException('Rol no encontrado');
      }
    }

    // Construir query dinámicamente
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (personId !== undefined) {
      updateFields.push(`person_id = $${paramIndex}`);
      params.push(personId);
      paramIndex++;
    }

    if (companyId !== undefined) {
      updateFields.push(`company_id = $${paramIndex}`);
      params.push(companyId);
      paramIndex++;
    }

    if (roleId !== undefined) {
      updateFields.push(`role_id = $${paramIndex}`);
      params.push(roleId);
      paramIndex++;
    }

    if (username !== undefined) {
      updateFields.push(`username = $${paramIndex}`);
      params.push(username);
      paramIndex++;
    }

    if (password !== undefined) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push(`password_hash = $${paramIndex}`);
      params.push(hashedPassword);
      paramIndex++;
    }

    if (email !== undefined) {
      updateFields.push(`email = $${paramIndex}`);
      params.push(email);
      paramIndex++;
    }

    if (isActive !== undefined) {
      updateFields.push(`is_active = $${paramIndex}`);
      params.push(isActive);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      // Si no hay campos para actualizar, retornar el usuario actual
      return this.findOne(id, currentUser);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, person_id, company_id, role_id, username, email, is_active, last_login, created_at, updated_at
    `;

    params.push(id);

    const { rows } = await this.databaseService.query(query, params);

    return this.mapToResponse(rows[0]);
  }

  async remove(id: string, currentUser: UserWithDetails): Promise<void> {
    // Verificar si el usuario existe
    const user = await this.findOne(id, currentUser);

    // No permitir que un usuario se elimine a sí mismo
    if (user.id === currentUser.id) {
      throw new ConflictException('No puedes eliminar tu propio usuario');
    }

    // Control de acceso: Solo Super Admin puede eliminar usuarios de otras compañías
    if (currentUser.role.name !== 'Super Admin' && user.companyId !== currentUser.company_id) {
      throw new ForbiddenException('No tienes permisos para eliminar este usuario');
    }

    // Soft delete
    await this.databaseService.query(
      'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  }

  private async findByUsername(username: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE username = $1 AND is_active = true';
    const { rows } = await this.databaseService.query(query, [username]);
    return rows.length > 0 ? rows[0] : null;
  }

  private async findByPersonId(personId: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE person_id = $1 AND is_active = true';
    const { rows } = await this.databaseService.query(query, [personId]);
    return rows.length > 0 ? rows[0] : null;
  }

  private mapToResponse(row: any, includeDetails: boolean = false): UserResponse {
    const response: UserResponse = {
      id: row.id,
      personId: row.person_id,
      companyId: row.company_id,
      roleId: row.role_id,
      username: row.username,
      email: row.email,
      isActive: row.is_active,
      lastLogin: row.last_login,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    if (includeDetails) {
      if (row.first_name) {
        response.person = {
          id: row.person_id,
          firstName: row.first_name,
          lastName: row.last_name,
          identificationType: {
            id: row.identification_type_id,
            name: row.identification_type_name,
            code: row.identification_type_code,
          },
          identificationNumber: row.identification_number,
        };
      }

      if (row.company_name) {
        response.company = {
          id: row.company_id,
          name: row.company_name,
        };
      }

      if (row.role_name) {
        response.role = {
          id: row.role_id,
          name: row.role_name,
          permissions: typeof row.role_permissions === 'string' ? JSON.parse(row.role_permissions) : row.role_permissions,
        };
      }
    }

    return response;
  }
}

