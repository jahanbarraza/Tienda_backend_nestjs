import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../../../database/services/database.service';
import { CreateCompanyDto } from '../dto/create-company.dto';
import { UpdateCompanyDto } from '../dto/update-company.dto';
import { QueryCompanyDto } from '../dto/query-company.dto';
import { PaginationResponseDto } from '../../common/dto/pagination.dto';
import { Company, CompanyWithStats, CompanyResponse } from '../interfaces/company.interface';
import { UserWithDetails } from '../../../auth/interfaces/auth.interface';
import { PoolClient } from 'pg';

@Injectable()
export class CompaniesService {
  constructor(private databaseService: DatabaseService) {}

  async create(createCompanyDto: CreateCompanyDto, user: UserWithDetails): Promise<CompanyResponse> {
    const { name, taxId, email, phone, address } = createCompanyDto;

    // Verificar si ya existe una compañía con el mismo tax_id
    if (taxId) {
      const existingCompany = await this.findByTaxId(taxId);
      if (existingCompany) {
        throw new ConflictException('Ya existe una compañía con este NIT/Tax ID');
      }
    }

    const query = `
      INSERT INTO companies (name, tax_id, email, phone, address, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING id, name, tax_id, email, phone, address, is_active, created_at, updated_at
    `;

    const { rows } = await this.databaseService.query(query, [
      name,
      taxId || null,
      email || null,
      phone || null,
      address || null,
    ]);

    return this.mapToResponse(rows[0]);
  }

  async findAll(queryDto: QueryCompanyDto, user: UserWithDetails): Promise<PaginationResponseDto<CompanyResponse>> {
    const { page = 1, limit = 10, search, isActive, createdFrom, createdTo, includeStats, sortBy = 'name', sortOrder = 'ASC' } = queryDto;
    const offset = (page - 1) * limit;

    // Construir condiciones WHERE
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Solo super admin puede ver todas las compañías, otros usuarios solo ven su compañía
    if (user.role.name !== 'Super Admin') {
      conditions.push(`c.id = $${paramIndex}`);
      params.push(user.company_id);
      paramIndex++;
    }

    if (search) {
      conditions.push(`(c.name ILIKE $${paramIndex} OR c.tax_id ILIKE $${paramIndex} OR c.email ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (isActive !== undefined) {
      conditions.push(`c.is_active = $${paramIndex}`);
      params.push(isActive);
      paramIndex++;
    }

    if (createdFrom) {
      conditions.push(`c.created_at >= $${paramIndex}`);
      params.push(createdFrom);
      paramIndex++;
    }

    if (createdTo) {
      conditions.push(`c.created_at <= $${paramIndex}`);
      params.push(createdTo);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validar campo de ordenamiento
    const allowedSortFields = ['name', 'tax_id', 'email', 'created_at', 'updated_at'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'name';
    const orderDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Query principal con o sin estadísticas
    let selectFields = 'c.id, c.name, c.tax_id, c.email, c.phone, c.address, c.is_active, c.created_at, c.updated_at';
    let joinClause = '';

    if (includeStats) {
      selectFields += ', COUNT(DISTINCT s.id) as stores_count, COUNT(DISTINCT u.id) as users_count';
      joinClause = `
        LEFT JOIN stores s ON c.id = s.company_id AND s.is_active = true
        LEFT JOIN users u ON c.id = u.company_id AND u.is_active = true
      `;
    }

    const dataQuery = `
      SELECT ${selectFields}
      FROM companies c
      ${joinClause}
      ${whereClause}
      ${includeStats ? 'GROUP BY c.id, c.name, c.tax_id, c.email, c.phone, c.address, c.is_active, c.created_at, c.updated_at' : ''}
      ORDER BY c.${orderField} ${orderDirection}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `
      SELECT COUNT(DISTINCT c.id) as total
      FROM companies c
      ${whereClause}
    `;

    // Ejecutar consultas
    const [dataResult, countResult] = await Promise.all([
      this.databaseService.query(dataQuery, [...params, limit, offset]),
      this.databaseService.queryCount(countQuery, params),
    ]);

    const companies = dataResult.rows.map(row => this.mapToResponse(row, includeStats));
    const total = parseInt(countResult.rows[0].total as any as string);

    return new PaginationResponseDto(companies, total, page, limit);
  }

  async findOne(id: string, user: UserWithDetails): Promise<CompanyResponse> {
    // Solo super admin puede ver cualquier compañía, otros usuarios solo su compañía
    let query = `
      SELECT c.id, c.name, c.tax_id, c.email, c.phone, c.address, c.is_active, c.created_at, c.updated_at,
             COUNT(DISTINCT s.id) as stores_count,
             COUNT(DISTINCT u.id) as users_count
      FROM companies c
      LEFT JOIN stores s ON c.id = s.company_id AND s.is_active = true
      LEFT JOIN users u ON c.id = u.company_id AND u.is_active = true
      WHERE c.id = $1
    `;

    const params = [id];

    if (user.role.name !== 'Super Admin') {
      query += ' AND c.id = $2';
      params.push(user.company_id);
    }

    query += ' GROUP BY c.id, c.name, c.tax_id, c.email, c.phone, c.address, c.is_active, c.created_at, c.updated_at';

    const { rows } = await this.databaseService.query(query, params);

    if (rows.length === 0) {
      throw new NotFoundException('Compañía no encontrada');
    }

    return this.mapToResponse(rows[0], true);
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto, user: UserWithDetails): Promise<CompanyResponse> {
    // Solo super admin puede actualizar cualquier compañía, otros usuarios solo su compañía
    if (user.role.name !== 'Super Admin' && id !== user.company_id) {
      throw new ForbiddenException('No tienes permisos para actualizar esta compañía');
    }

    const { name, taxId, email, phone, address, isActive } = updateCompanyDto;

    // Verificar si la compañía existe
    await this.findOne(id, user);

    // Verificar si el tax_id ya existe en otra compañía
    if (taxId) {
      const existingCompany = await this.findByTaxId(taxId);
      if (existingCompany && existingCompany.id !== id) {
        throw new ConflictException('Ya existe otra compañía con este NIT/Tax ID');
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

    if (taxId !== undefined) {
      updateFields.push(`tax_id = $${paramIndex}`);
      params.push(taxId);
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

    if (isActive !== undefined) {
      updateFields.push(`is_active = $${paramIndex}`);
      params.push(isActive);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      // Si no hay campos para actualizar, retornar la compañía actual
      return this.findOne(id, user);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE companies 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, name, tax_id, email, phone, address, is_active, created_at, updated_at
    `;

    params.push(id);

    const { rows } = await this.databaseService.query(query, params);

    return this.mapToResponse(rows[0]);
  }

  async remove(id: string, user: UserWithDetails): Promise<void> {
    // Solo super admin puede eliminar compañías
    if (user.role.name !== 'Super Admin') {
      throw new ForbiddenException('No tienes permisos para eliminar compañías');
    }

    // Verificar si la compañía existe
    await this.findOne(id, user);

    // Verificar si la compañía tiene tiendas o usuarios activos
    const checkQuery = `
      SELECT 
        COUNT(DISTINCT s.id) as stores_count,
        COUNT(DISTINCT u.id) as users_count
      FROM companies c
      LEFT JOIN stores s ON c.id = s.company_id AND s.is_active = true
      LEFT JOIN users u ON c.id = u.company_id AND u.is_active = true
      WHERE c.id = $1
      GROUP BY c.id
    `;

    const { rows } = await this.databaseService.query(checkQuery, [id]);
    
    if (rows.length > 0) {
      const { stores_count, users_count } = rows[0] as CompanyWithStats;
      if (parseInt(stores_count as unknown as string) > 0 || parseInt(users_count as unknown as string) > 0) {
        throw new ConflictException('No se puede eliminar la compañía porque tiene tiendas o usuarios activos');
      }
    }

    // Soft delete
    await this.databaseService.query(
      'UPDATE companies SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  }

  private async findByTaxId(taxId: string): Promise<Company | null> {
    const query = 'SELECT * FROM companies WHERE tax_id = $1 AND is_active = true';
    const { rows } = await this.databaseService.query(query, [taxId]);
    return rows.length > 0 ? (rows[0] as Company) : null;
  }

  private mapToResponse(row: any, includeStats: boolean = false): CompanyResponse {
    const response: CompanyResponse = {
      id: row.id,
      name: row.name,
      taxId: row.tax_id,
      email: row.email,
      phone: row.phone,
      address: row.address,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    if (includeStats) {
      response.storesCount = parseInt(row.stores_count) || 0;
      response.usersCount = parseInt(row.users_count) || 0;
    }

    return response;
  }
}

