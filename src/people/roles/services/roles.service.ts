import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../../../database/services/database.service';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { QueryRoleDto } from '../dto/query-role.dto';
import { PaginationResponseDto } from '../../../organization/common/dto/pagination.dto';
import { Role, RoleResponse } from '../interfaces/role.interface';
import { UserWithDetails } from '../../../auth/interfaces/auth.interface';

@Injectable()
export class RolesService {
  constructor(private databaseService: DatabaseService) {}

  async create(createRoleDto: CreateRoleDto, user: UserWithDetails): Promise<RoleResponse> {
    // Solo Super Admin puede crear roles
    if (user.role.name !== 'Super Admin') {
      throw new ForbiddenException('No tienes permisos para crear roles');
    }

    const { name, description, permissions } = createRoleDto;

    // Verificar si ya existe un rol con el mismo nombre
    const existingRole = await this.findByName(name);
    if (existingRole) {
      throw new ConflictException('Ya existe un rol con este nombre');
    }

    const query = `
      INSERT INTO roles (name, description, permissions, is_active)
      VALUES ($1, $2, $3, true)
      RETURNING id, name, description, permissions, is_active, created_at, updated_at
    `;

    const { rows } = await this.databaseService.query(query, [
      name,
      description || null,
      JSON.stringify(permissions || {}),
    ]);

    return this.mapToResponse(rows[0]);
  }

  async findAll(queryDto: QueryRoleDto, user: UserWithDetails): Promise<PaginationResponseDto<RoleResponse>> {
    const { page = 1, limit = 10, search, isActive, createdFrom, createdTo, includeStats, sortBy = 'name', sortOrder = 'ASC' } = queryDto;
    const offset = (page - 1) * limit;

    // Construir condiciones WHERE
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(r.name ILIKE $${paramIndex} OR r.description ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (isActive !== undefined) {
      conditions.push(`r.is_active = $${paramIndex}`);
      params.push(isActive);
      paramIndex++;
    }

    if (createdFrom) {
      conditions.push(`r.created_at >= $${paramIndex}`);
      params.push(createdFrom);
      paramIndex++;
    }

    if (createdTo) {
      conditions.push(`r.created_at <= $${paramIndex}`);
      params.push(createdTo);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validar campo de ordenamiento
    const allowedSortFields = ['name', 'created_at', 'updated_at'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'name';
    const orderDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Query principal con o sin estadísticas
    let selectFields = 'r.id, r.name, r.description, r.permissions, r.is_active, r.created_at, r.updated_at';
    let joinClause = '';

    if (includeStats) {
      selectFields += ', COUNT(DISTINCT u.id) as users_count';
      joinClause = 'LEFT JOIN users u ON r.id = u.role_id AND u.is_active = true';
    }

    const dataQuery = `
      SELECT ${selectFields}
      FROM roles r
      ${joinClause}
      ${whereClause}
      ${includeStats ? 'GROUP BY r.id, r.name, r.description, r.permissions, r.is_active, r.created_at, r.updated_at' : ''}
      ORDER BY r.${orderField} ${orderDirection}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `
      SELECT COUNT(DISTINCT r.id) as total
      FROM roles r
      ${whereClause}
    `;

    // Ejecutar consultas
    const [dataResult, countResult] = await Promise.all([
      this.databaseService.query(dataQuery, [...params, limit, offset]),
      this.databaseService.query(countQuery, params),
    ]);

    const roles = dataResult.rows.map(row => this.mapToResponse(row, includeStats));
    const total = parseInt(countResult.rows[0].total);

    return new PaginationResponseDto(roles, total, page, limit);
  }

  async findOne(id: string, user: UserWithDetails): Promise<RoleResponse> {
    const query = `
      SELECT r.id, r.name, r.description, r.permissions, r.is_active, r.created_at, r.updated_at,
             COUNT(DISTINCT u.id) as users_count
      FROM roles r
      LEFT JOIN users u ON r.id = u.role_id AND u.is_active = true
      WHERE r.id = $1
      GROUP BY r.id, r.name, r.description, r.permissions, r.is_active, r.created_at, r.updated_at
    `;

    const { rows } = await this.databaseService.query(query, [id]);

    if (rows.length === 0) {
      throw new NotFoundException('Rol no encontrado');
    }

    return this.mapToResponse(rows[0], true);
  }

  async update(id: string, updateRoleDto: UpdateRoleDto, user: UserWithDetails): Promise<RoleResponse> {
    // Solo Super Admin puede actualizar roles
    if (user.role.name !== 'Super Admin') {
      throw new ForbiddenException('No tienes permisos para actualizar roles');
    }

    const { name, description, permissions, isActive } = updateRoleDto;

    // Verificar si el rol existe
    await this.findOne(id, user);

    // Verificar si el nombre ya existe en otro rol
    if (name) {
      const existingRole = await this.findByName(name);
      if (existingRole && existingRole.id !== id) {
        throw new ConflictException('Ya existe otro rol con este nombre');
      }
    }

    // Construir query dinámicamente
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex}`);
      params.push(name);
      paramIndex++;
    }

    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      params.push(description);
      paramIndex++;
    }

    if (permissions !== undefined) {
      updateFields.push(`permissions = $${paramIndex}`);
      params.push(JSON.stringify(permissions));
      paramIndex++;
    }

    if (isActive !== undefined) {
      updateFields.push(`is_active = $${paramIndex}`);
      params.push(isActive);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      // Si no hay campos para actualizar, retornar el rol actual
      return this.findOne(id, user);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE roles 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, name, description, permissions, is_active, created_at, updated_at
    `;

    params.push(id);

    const { rows } = await this.databaseService.query(query, params);

    return this.mapToResponse(rows[0]);
  }

  async remove(id: string, user: UserWithDetails): Promise<void> {
    // Solo Super Admin puede eliminar roles
    if (user.role.name !== 'Super Admin') {
      throw new ForbiddenException('No tienes permisos para eliminar roles');
    }

    // Verificar si el rol existe
    const role = await this.findOne(id, user);

    // No permitir eliminar roles del sistema
    const systemRoles = ['Super Admin', 'Admin', 'Manager', 'Cashier'];
    if (systemRoles.includes(role.name)) {
      throw new ConflictException('No se puede eliminar un rol del sistema');
    }

    // Verificar si el rol tiene usuarios asociados
    const checkQuery = `
      SELECT COUNT(*) as users_count
      FROM users u
      WHERE u.role_id = $1 AND u.is_active = true
    `;

    const { rows } = await this.databaseService.query(checkQuery, [id]);
    
    if (parseInt(rows[0].users_count) > 0) {
      throw new ConflictException('No se puede eliminar el rol porque tiene usuarios asociados');
    }

    // Soft delete
    await this.databaseService.query(
      'UPDATE roles SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  }

  private async findByName(name: string): Promise<Role | null> {
    const query = 'SELECT * FROM roles WHERE name = $1 AND is_active = true';
    const { rows } = await this.databaseService.query(query, [name]);
    return rows.length > 0 ? rows[0] : null;
  }

  private mapToResponse(row: any, includeStats: boolean = false): RoleResponse {
    const response: RoleResponse = {
      id: row.id,
      name: row.name,
      description: row.description,
      permissions: typeof row.permissions === 'string' ? JSON.parse(row.permissions) : row.permissions,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    if (includeStats) {
      response.usersCount = parseInt(row.users_count) || 0;
    }

    return response;
  }
}

