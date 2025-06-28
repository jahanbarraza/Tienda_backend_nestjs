import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../../../database/services/database.service';
import { CreateIdentificationTypeDto } from '../dto/create-identification-type.dto';
import { UpdateIdentificationTypeDto } from '../dto/update-identification-type.dto';
import { QueryIdentificationTypeDto } from '../dto/query-identification-type.dto';
import { PaginationResponseDto } from '../../../organization/common/dto/pagination.dto';
import { IdentificationType, IdentificationTypeResponse } from '../interfaces/identification-type.interface';
import { UserWithDetails } from '../../../auth/interfaces/auth.interface';

@Injectable()
export class IdentificationTypesService {
  constructor(private databaseService: DatabaseService) {}

  async create(createIdentificationTypeDto: CreateIdentificationTypeDto, user: UserWithDetails): Promise<IdentificationTypeResponse> {
    // Solo Super Admin puede crear tipos de identificación
    if (user.role.name !== 'Super Admin') {
      throw new ForbiddenException('No tienes permisos para crear tipos de identificación');
    }

    const { name, code, description } = createIdentificationTypeDto;

    // Verificar si ya existe un tipo con el mismo código
    const existingType = await this.findByCode(code);
    if (existingType) {
      throw new ConflictException('Ya existe un tipo de identificación con este código');
    }

    const query = `
      INSERT INTO identification_types (name, code, description, is_active)
      VALUES ($1, $2, $3, true)
      RETURNING id, name, code, description, is_active, created_at, updated_at
    `;

    const { rows } = await this.databaseService.query(query, [
      name,
      code,
      description || null,
    ]);

    return this.mapToResponse(rows[0]);
  }

  async findAll(queryDto: QueryIdentificationTypeDto, user: UserWithDetails): Promise<PaginationResponseDto<IdentificationTypeResponse>> {
    const { page = 1, limit = 10, search, isActive, createdFrom, createdTo, includeStats, sortBy = 'name', sortOrder = 'ASC' } = queryDto;
    const offset = (page - 1) * limit;

    // Construir condiciones WHERE
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(it.name ILIKE $${paramIndex} OR it.code ILIKE $${paramIndex} OR it.description ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (isActive !== undefined) {
      conditions.push(`it.is_active = $${paramIndex}`);
      params.push(isActive);
      paramIndex++;
    }

    if (createdFrom) {
      conditions.push(`it.created_at >= $${paramIndex}`);
      params.push(createdFrom);
      paramIndex++;
    }

    if (createdTo) {
      conditions.push(`it.created_at <= $${paramIndex}`);
      params.push(createdTo);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validar campo de ordenamiento
    const allowedSortFields = ['name', 'code', 'created_at', 'updated_at'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'name';
    const orderDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Query principal con o sin estadísticas
    let selectFields = 'it.id, it.name, it.code, it.description, it.is_active, it.created_at, it.updated_at';
    let joinClause = '';

    if (includeStats) {
      selectFields += ', COUNT(DISTINCT p.id) as persons_count';
      joinClause = 'LEFT JOIN persons p ON it.id = p.identification_type_id AND p.is_active = true';
    }

    const dataQuery = `
      SELECT ${selectFields}
      FROM identification_types it
      ${joinClause}
      ${whereClause}
      ${includeStats ? 'GROUP BY it.id, it.name, it.code, it.description, it.is_active, it.created_at, it.updated_at' : ''}
      ORDER BY it.${orderField} ${orderDirection}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `
      SELECT COUNT(DISTINCT it.id) as total
      FROM identification_types it
      ${whereClause}
    `;

    // Ejecutar consultas
    const [dataResult, countResult] = await Promise.all([
      this.databaseService.query(dataQuery, [...params, limit, offset]),
      this.databaseService.queryCount(countQuery, params),
    ]);

    const identificationTypes = dataResult.rows.map(row => this.mapToResponse(row, includeStats));
    const total = parseInt(countResult.rows[0].total as any as string);

    return new PaginationResponseDto(identificationTypes, total, page, limit);
  }

  async findOne(id: string, user: UserWithDetails): Promise<IdentificationTypeResponse> {
    const query = `
      SELECT it.id, it.name, it.code, it.description, it.is_active, it.created_at, it.updated_at,
             COUNT(DISTINCT p.id) as persons_count
      FROM identification_types it
      LEFT JOIN persons p ON it.id = p.identification_type_id AND p.is_active = true
      WHERE it.id = $1
      GROUP BY it.id, it.name, it.code, it.description, it.is_active, it.created_at, it.updated_at
    `;

    const { rows } = await this.databaseService.query(query, [id]);

    if (rows.length === 0) {
      throw new NotFoundException('Tipo de identificación no encontrado');
    }

    return this.mapToResponse(rows[0], true);
  }

  async update(id: string, updateIdentificationTypeDto: UpdateIdentificationTypeDto, user: UserWithDetails): Promise<IdentificationTypeResponse> {
    // Solo Super Admin puede actualizar tipos de identificación
    if (user.role.name !== 'Super Admin') {
      throw new ForbiddenException('No tienes permisos para actualizar tipos de identificación');
    }

    const { name, code, description, isActive } = updateIdentificationTypeDto;

    // Verificar si el tipo existe
    await this.findOne(id, user);

    // Verificar si el código ya existe en otro tipo
    if (code) {
      const existingType = await this.findByCode(code);
      if (existingType && existingType.id !== id) {
        throw new ConflictException('Ya existe otro tipo de identificación con este código');
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

    if (code !== undefined) {
      updateFields.push(`code = $${paramIndex}`);
      params.push(code);
      paramIndex++;
    }

    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      params.push(description);
      paramIndex++;
    }

    if (isActive !== undefined) {
      updateFields.push(`is_active = $${paramIndex}`);
      params.push(isActive);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      // Si no hay campos para actualizar, retornar el tipo actual
      return this.findOne(id, user);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE identification_types 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, name, code, description, is_active, created_at, updated_at
    `;

    params.push(id);

    const { rows } = await this.databaseService.query(query, params);

    return this.mapToResponse(rows[0]);
  }

  async remove(id: string, user: UserWithDetails): Promise<void> {
    // Solo Super Admin puede eliminar tipos de identificación
    if (user.role.name !== 'Super Admin') {
      throw new ForbiddenException('No tienes permisos para eliminar tipos de identificación');
    }

    // Verificar si el tipo existe
    await this.findOne(id, user);

    // Verificar si el tipo tiene personas asociadas
    const checkQuery = `
      SELECT COUNT(*) as persons_count
      FROM persons p
      WHERE p.identification_type_id = $1 AND p.is_active = true
    `;

    const { rows } = await this.databaseService.query(checkQuery, [id]);
    
    if (parseInt((rows[0] as any).persons_count) > 0) {
      throw new ConflictException('No se puede eliminar el tipo de identificación porque tiene personas asociadas');
    }

    // Soft delete
    await this.databaseService.query(
      'UPDATE identification_types SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  }

  private async findByCode(code: string): Promise<IdentificationType | null> {
    const query = 'SELECT * FROM identification_types WHERE code = $1 AND is_active = true';
    const { rows } = await this.databaseService.query(query, [code]);
    return rows.length > 0 ? (rows[0] as IdentificationType) : null;
  }

  private mapToResponse(row: any, includeStats: boolean = false): IdentificationTypeResponse {
    const response: IdentificationTypeResponse = {
      id: row.id,
      name: row.name,
      code: row.code,
      description: row.description,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    if (includeStats) {
      response.personsCount = parseInt(row.persons_count) || 0;
    }

    return response;
  }
}

