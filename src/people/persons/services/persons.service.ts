import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../../../database/services/database.service';
import { CreatePersonDto } from '../dto/create-person.dto';
import { UpdatePersonDto } from '../dto/update-person.dto';
import { QueryPersonDto } from '../dto/query-person.dto';
import { PaginationResponseDto } from '../../../organization/common/dto/pagination.dto';
import { Person, PersonResponse } from '../interfaces/person.interface';
import { UserWithDetails } from '../../../auth/interfaces/auth.interface';

@Injectable()
export class PersonsService {
  constructor(private databaseService: DatabaseService) {}

  async create(createPersonDto: CreatePersonDto, user: UserWithDetails): Promise<PersonResponse> {
    const { identificationTypeId, identificationNumber, firstName, lastName, email, phone, address, birthDate } = createPersonDto;

    // Verificar si ya existe una persona con el mismo tipo y número de identificación
    const existingPerson = await this.findByIdentification(identificationTypeId, identificationNumber);
    if (existingPerson) {
      throw new ConflictException('Ya existe una persona con este tipo y número de identificación');
    }

    // Verificar que el tipo de identificación existe
    const identificationTypeQuery = 'SELECT id FROM identification_types WHERE id = $1 AND is_active = true';
    const { rows: identificationTypeRows } = await this.databaseService.query(identificationTypeQuery, [identificationTypeId]);
    
    if (identificationTypeRows.length === 0) {
      throw new NotFoundException('Tipo de identificación no encontrado');
    }

    const query = `
      INSERT INTO persons (identification_type_id, identification_number, first_name, last_name, email, phone, address, birth_date, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      RETURNING id, identification_type_id, identification_number, first_name, last_name, email, phone, address, birth_date, is_active, created_at, updated_at
    `;

    const { rows } = await this.databaseService.query(query, [
      identificationTypeId,
      identificationNumber,
      firstName,
      lastName,
      email || null,
      phone || null,
      address || null,
      birthDate || null,
    ]);

    return this.mapToResponse(rows[0]);
  }

  async findAll(queryDto: QueryPersonDto, user: UserWithDetails): Promise<PaginationResponseDto<PersonResponse>> {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      identificationTypeId, 
      isActive, 
      createdFrom, 
      createdTo, 
      includeStats, 
      includeIdentificationType = true,
      sortBy = 'first_name', 
      sortOrder = 'ASC' 
    } = queryDto;
    const offset = (page - 1) * limit;

    // Construir condiciones WHERE
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(p.first_name ILIKE $${paramIndex} OR p.last_name ILIKE $${paramIndex} OR p.identification_number ILIKE $${paramIndex} OR p.email ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (identificationTypeId) {
      conditions.push(`p.identification_type_id = $${paramIndex}`);
      params.push(identificationTypeId);
      paramIndex++;
    }

    if (isActive !== undefined) {
      conditions.push(`p.is_active = $${paramIndex}`);
      params.push(isActive);
      paramIndex++;
    }

    if (createdFrom) {
      conditions.push(`p.created_at >= $${paramIndex}`);
      params.push(createdFrom);
      paramIndex++;
    }

    if (createdTo) {
      conditions.push(`p.created_at <= $${paramIndex}`);
      params.push(createdTo);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validar campo de ordenamiento
    const allowedSortFields = ['first_name', 'last_name', 'identification_number', 'created_at', 'updated_at'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'first_name';
    const orderDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Query principal
    let selectFields = 'p.id, p.identification_type_id, p.identification_number, p.first_name, p.last_name, p.email, p.phone, p.address, p.birth_date, p.is_active, p.created_at, p.updated_at';
    let joinClause = '';

    if (includeIdentificationType) {
      selectFields += ', it.name as identification_type_name, it.code as identification_type_code';
      joinClause += ' INNER JOIN identification_types it ON p.identification_type_id = it.id';
    }

    if (includeStats) {
      selectFields += ', COUNT(DISTINCT u.id) as users_count';
      joinClause += ' LEFT JOIN users u ON p.id = u.person_id AND u.is_active = true';
    }

    const dataQuery = `
      SELECT ${selectFields}
      FROM persons p
      ${joinClause}
      ${whereClause}
      ${includeStats ? 'GROUP BY p.id, p.identification_type_id, p.identification_number, p.first_name, p.last_name, p.email, p.phone, p.address, p.birth_date, p.is_active, p.created_at, p.updated_at' + (includeIdentificationType ? ', it.name, it.code' : '') : ''}
      ORDER BY p.${orderField} ${orderDirection}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM persons p
      ${includeIdentificationType ? 'INNER JOIN identification_types it ON p.identification_type_id = it.id' : ''}
      ${whereClause}
    `;

    // Ejecutar consultas
    const [dataResult, countResult] = await Promise.all([
      this.databaseService.query(dataQuery, [...params, limit, offset]),
      this.databaseService.queryCount(countQuery, params),
    ]);

    const persons = dataResult.rows.map(row => this.mapToResponse(row, includeIdentificationType, includeStats));
    const total = parseInt(countResult.rows[0].total as any as string);

    return new PaginationResponseDto(persons, total, page, limit);
  }

  async findOne(id: string, user: UserWithDetails): Promise<PersonResponse> {
    const query = `
      SELECT p.id, p.identification_type_id, p.identification_number, p.first_name, p.last_name, 
             p.email, p.phone, p.address, p.birth_date, p.is_active, p.created_at, p.updated_at,
             it.name as identification_type_name, it.code as identification_type_code,
             COUNT(DISTINCT u.id) as users_count
      FROM persons p
      INNER JOIN identification_types it ON p.identification_type_id = it.id
      LEFT JOIN users u ON p.id = u.person_id AND u.is_active = true
      WHERE p.id = $1
      GROUP BY p.id, p.identification_type_id, p.identification_number, p.first_name, p.last_name, 
               p.email, p.phone, p.address, p.birth_date, p.is_active, p.created_at, p.updated_at,
               it.name, it.code
    `;

    const { rows } = await this.databaseService.query(query, [id]);

    if (rows.length === 0) {
      throw new NotFoundException('Persona no encontrada');
    }

    return this.mapToResponse(rows[0], true, true);
  }

  async update(id: string, updatePersonDto: UpdatePersonDto, user: UserWithDetails): Promise<PersonResponse> {
    const { identificationTypeId, identificationNumber, firstName, lastName, email, phone, address, birthDate, isActive } = updatePersonDto;

    // Verificar si la persona existe
    await this.findOne(id, user);

    // Verificar si el tipo y número de identificación ya existe en otra persona
    if (identificationTypeId && identificationNumber) {
      const existingPerson = await this.findByIdentification(identificationTypeId, identificationNumber);
      if (existingPerson && existingPerson.id !== id) {
        throw new ConflictException('Ya existe otra persona con este tipo y número de identificación');
      }
    }

    // Verificar que el tipo de identificación existe si se está actualizando
    if (identificationTypeId) {
      const identificationTypeQuery = 'SELECT id FROM identification_types WHERE id = $1 AND is_active = true';
      const { rows: identificationTypeRows } = await this.databaseService.query(identificationTypeQuery, [identificationTypeId]);
      
      if (identificationTypeRows.length === 0) {
        throw new NotFoundException('Tipo de identificación no encontrado');
      }
    }

    // Construir query dinámicamente
    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (identificationTypeId !== undefined) {
      updateFields.push(`identification_type_id = $${paramIndex}`);
      params.push(identificationTypeId);
      paramIndex++;
    }

    if (identificationNumber !== undefined) {
      updateFields.push(`identification_number = $${paramIndex}`);
      params.push(identificationNumber);
      paramIndex++;
    }

    if (firstName !== undefined) {
      updateFields.push(`first_name = $${paramIndex}`);
      params.push(firstName);
      paramIndex++;
    }

    if (lastName !== undefined) {
      updateFields.push(`last_name = $${paramIndex}`);
      params.push(lastName);
      paramIndex++;
    }

    if (email !== undefined) {
      updateFields.push(`email = $${paramIndex}`);
      params.push(email);
      paramIndex++;
    }

    if (phone !== undefined) {
      updateFields.push(`phone = $${paramIndex}`);
      params.push(phone);
      paramIndex++;
    }

    if (address !== undefined) {
      updateFields.push(`address = $${paramIndex}`);
      params.push(address);
      paramIndex++;
    }

    if (birthDate !== undefined) {
      updateFields.push(`birth_date = $${paramIndex}`);
      params.push(birthDate);
      paramIndex++;
    }

    if (isActive !== undefined) {
      updateFields.push(`is_active = $${paramIndex}`);
      params.push(isActive);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      // Si no hay campos para actualizar, retornar la persona actual
      return this.findOne(id, user);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE persons 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, identification_type_id, identification_number, first_name, last_name, email, phone, address, birth_date, is_active, created_at, updated_at
    `;

    params.push(id);

    const { rows } = await this.databaseService.query(query, params);

    return this.mapToResponse(rows[0]);
  }

  async remove(id: string, user: UserWithDetails): Promise<void> {
    // Verificar si la persona existe
    await this.findOne(id, user);

    // Verificar si la persona tiene usuarios asociados
    const checkQuery = `
      SELECT COUNT(*) as users_count
      FROM users u
      WHERE u.person_id = $1 AND u.is_active = true
    `;

    const { rows } = await this.databaseService.query(checkQuery, [id]);
    
    if (parseInt((rows[0] as any).users_count) > 0) {
      throw new ConflictException('No se puede eliminar la persona porque tiene usuarios asociados');
    }

    // Soft delete
    await this.databaseService.query(
      'UPDATE persons SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  }

  private async findByIdentification(identificationTypeId: string, identificationNumber: string): Promise<Person | null> {
    const query = 'SELECT * FROM persons WHERE identification_type_id = $1 AND identification_number = $2 AND is_active = true';
    const { rows } = await this.databaseService.query(query, [identificationTypeId, identificationNumber]);
    return rows.length > 0 ? (rows[0] as Person) : null;
  }

  private mapToResponse(row: any, includeIdentificationType: boolean = false, includeStats: boolean = false): PersonResponse {
    const response: PersonResponse = {
      id: row.id,
      identificationTypeId: row.identification_type_id,
      identificationNumber: row.identification_number,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      address: row.address,
      birthDate: row.birth_date,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    if (includeIdentificationType && row.identification_type_name) {
      response.identificationType = {
        id: row.identification_type_id,
        name: row.identification_type_name,
        code: row.identification_type_code,
      };
    }

    if (includeStats) {
      response.usersCount = parseInt(row.users_count) || 0;
    }

    return response;
  }
}

