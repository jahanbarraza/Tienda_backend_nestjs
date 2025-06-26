import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../../../database/services/database.service';
import { CreateStoreDto } from '../dto/create-store.dto';
import { UpdateStoreDto } from '../dto/update-store.dto';
import { QueryStoreDto } from '../dto/query-store.dto';
import { PaginationResponseDto } from '../../common/dto/pagination.dto';
import { Store, StoreWithCompany, StoreResponse } from '../interfaces/store.interface';
import { UserWithDetails } from '../../../auth/interfaces/auth.interface';

@Injectable()
export class StoresService {
  constructor(private databaseService: DatabaseService) {}

  async create(createStoreDto: CreateStoreDto, user: UserWithDetails): Promise<StoreResponse> {
    const { companyId, name, code, address, phone, email } = createStoreDto;

    // Usar la compañía del usuario si no se especifica otra (solo super admin puede especificar otra)
    const targetCompanyId = companyId && user.role.name === 'Super Admin' ? companyId : user.company_id;

    // Verificar si ya existe una tienda con el mismo código en la compañía
    const existingStore = await this.findByCompanyAndCode(targetCompanyId, code);
    if (existingStore) {
      throw new ConflictException('Ya existe una tienda con este código en la compañía');
    }

    // Verificar que la compañía existe y el usuario tiene acceso
    await this.validateCompanyAccess(targetCompanyId, user);

    const query = `
      INSERT INTO stores (company_id, name, code, address, phone, email, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING id, company_id, name, code, address, phone, email, is_active, created_at, updated_at
    `;

    const { rows } = await this.databaseService.query(query, [
      targetCompanyId,
      name,
      code,
      address || null,
      phone || null,
      email || null,
    ]);

    return this.mapToResponse(rows[0]);
  }

  async findAll(queryDto: QueryStoreDto, user: UserWithDetails): Promise<PaginationResponseDto<StoreResponse>> {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      companyId, 
      isActive, 
      createdFrom, 
      createdTo, 
      includeStats, 
      includeCompany,
      sortBy = 'name', 
      sortOrder = 'ASC' 
    } = queryDto;
    
    const offset = (page - 1) * limit;

    // Construir condiciones WHERE
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Control de acceso por compañía
    if (user.role.name === 'Super Admin') {
      // Super admin puede filtrar por compañía específica o ver todas
      if (companyId) {
        conditions.push(`s.company_id = $${paramIndex}`);
        params.push(companyId);
        paramIndex++;
      }
    } else {
      // Otros usuarios solo ven tiendas de su compañía
      conditions.push(`s.company_id = $${paramIndex}`);
      params.push(user.company_id);
      paramIndex++;
    }

    if (search) {
      conditions.push(`(s.name ILIKE $${paramIndex} OR s.code ILIKE $${paramIndex} OR s.address ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (isActive !== undefined) {
      conditions.push(`s.is_active = $${paramIndex}`);
      params.push(isActive);
      paramIndex++;
    }

    if (createdFrom) {
      conditions.push(`s.created_at >= $${paramIndex}`);
      params.push(createdFrom);
      paramIndex++;
    }

    if (createdTo) {
      conditions.push(`s.created_at <= $${paramIndex}`);
      params.push(createdTo);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validar campo de ordenamiento
    const allowedSortFields = ['name', 'code', 'created_at', 'updated_at'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'name';
    const orderDirection = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Construir SELECT y JOIN
    let selectFields = 's.id, s.company_id, s.name, s.code, s.address, s.phone, s.email, s.is_active, s.created_at, s.updated_at';
    let joinClause = '';

    if (includeCompany) {
      selectFields += ', c.name as company_name';
      joinClause += ' INNER JOIN companies c ON s.company_id = c.id';
    }

    if (includeStats) {
      selectFields += ', COUNT(DISTINCT u.id) as users_count';
      joinClause += ' LEFT JOIN users u ON s.company_id = u.company_id AND u.is_active = true';
    }

    const dataQuery = `
      SELECT ${selectFields}
      FROM stores s
      ${joinClause}
      ${whereClause}
      ${includeStats ? 'GROUP BY s.id, s.company_id, s.name, s.code, s.address, s.phone, s.email, s.is_active, s.created_at, s.updated_at' + (includeCompany ? ', c.name' : '') : ''}
      ORDER BY s.${orderField} ${orderDirection}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const countQuery = `
      SELECT COUNT(DISTINCT s.id) as total
      FROM stores s
      ${includeCompany ? 'INNER JOIN companies c ON s.company_id = c.id' : ''}
      ${whereClause}
    `;

    // Ejecutar consultas
    const [dataResult, countResult] = await Promise.all([
      this.databaseService.query(dataQuery, [...params, limit, offset]),
      this.databaseService.query(countQuery, params),
    ]);

    const stores = dataResult.rows.map(row => this.mapToResponse(row, includeCompany, includeStats));
    const total = parseInt(countResult.rows[0].total);

    return new PaginationResponseDto(stores, total, page, limit);
  }

  async findOne(id: string, user: UserWithDetails): Promise<StoreResponse> {
    let query = `
      SELECT s.id, s.company_id, s.name, s.code, s.address, s.phone, s.email, s.is_active, s.created_at, s.updated_at,
             c.name as company_name,
             COUNT(DISTINCT u.id) as users_count
      FROM stores s
      INNER JOIN companies c ON s.company_id = c.id
      LEFT JOIN users u ON s.company_id = u.company_id AND u.is_active = true
      WHERE s.id = $1
    `;

    const params = [id];

    // Control de acceso
    if (user.role.name !== 'Super Admin') {
      query += ' AND s.company_id = $2';
      params.push(user.company_id);
    }

    query += ' GROUP BY s.id, s.company_id, s.name, s.code, s.address, s.phone, s.email, s.is_active, s.created_at, s.updated_at, c.name';

    const { rows } = await this.databaseService.query(query, params);

    if (rows.length === 0) {
      throw new NotFoundException('Tienda no encontrada');
    }

    return this.mapToResponse(rows[0], true, true);
  }

  async update(id: string, updateStoreDto: UpdateStoreDto, user: UserWithDetails): Promise<StoreResponse> {
    const { name, code, address, phone, email, isActive } = updateStoreDto;

    // Verificar que la tienda existe y el usuario tiene acceso
    const existingStore = await this.findOne(id, user);

    // Verificar si el código ya existe en otra tienda de la misma compañía
    if (code) {
      const storeWithCode = await this.findByCompanyAndCode(existingStore.companyId, code);
      if (storeWithCode && storeWithCode.id !== id) {
        throw new ConflictException('Ya existe otra tienda con este código en la compañía');
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

    if (address !== undefined) {
      updateFields.push(`address = $${paramIndex}`);
      params.push(address);
      paramIndex++;
    }

    if (phone !== undefined) {
      updateFields.push(`phone = $${paramIndex}`);
      params.push(phone);
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
      // Si no hay campos para actualizar, retornar la tienda actual
      return existingStore;
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    const query = `
      UPDATE stores 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, company_id, name, code, address, phone, email, is_active, created_at, updated_at
    `;

    params.push(id);

    const { rows } = await this.databaseService.query(query, params);

    return this.mapToResponse(rows[0]);
  }

  async remove(id: string, user: UserWithDetails): Promise<void> {
    // Verificar que la tienda existe y el usuario tiene acceso
    await this.findOne(id, user);

    // Verificar si la tienda tiene usuarios activos
    const checkQuery = `
      SELECT COUNT(*) as users_count
      FROM users u
      INNER JOIN stores s ON u.company_id = s.company_id
      WHERE s.id = $1 AND u.is_active = true
    `;

    const { rows } = await this.databaseService.query(checkQuery, [id]);
    
    if (parseInt(rows[0].users_count) > 0) {
      throw new ConflictException('No se puede eliminar la tienda porque tiene usuarios activos asociados');
    }

    // Soft delete
    await this.databaseService.query(
      'UPDATE stores SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  }

  private async findByCompanyAndCode(companyId: string, code: string): Promise<Store | null> {
    const query = 'SELECT * FROM stores WHERE company_id = $1 AND code = $2 AND is_active = true';
    const { rows } = await this.databaseService.query(query, [companyId, code]);
    return rows.length > 0 ? rows[0] : null;
  }

  private async validateCompanyAccess(companyId: string, user: UserWithDetails): Promise<void> {
    if (user.role.name === 'Super Admin') {
      // Super admin puede acceder a cualquier compañía, solo verificar que existe
      const query = 'SELECT id FROM companies WHERE id = $1 AND is_active = true';
      const { rows } = await this.databaseService.query(query, [companyId]);
      if (rows.length === 0) {
        throw new NotFoundException('Compañía no encontrada');
      }
    } else {
      // Otros usuarios solo pueden acceder a su compañía
      if (companyId !== user.company_id) {
        throw new ForbiddenException('No tienes acceso a esta compañía');
      }
    }
  }

  private mapToResponse(row: any, includeCompany: boolean = false, includeStats: boolean = false): StoreResponse {
    const response: StoreResponse = {
      id: row.id,
      companyId: row.company_id,
      name: row.name,
      code: row.code,
      address: row.address,
      phone: row.phone,
      email: row.email,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    if (includeCompany && row.company_name) {
      response.company = {
        id: row.company_id,
        name: row.company_name,
      };
    }

    if (includeStats) {
      response.usersCount = parseInt(row.users_count) || 0;
      response.salesCount = 0; // TODO: Implementar cuando se tenga el módulo de ventas
    }

    return response;
  }
}

