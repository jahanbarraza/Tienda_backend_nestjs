import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../../database/services/database.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { QueryCategoryDto } from '../dto/query-category.dto';
import { Category } from '../interfaces/category.interface';

@Injectable()
export class CategoriesService {
  constructor(private databaseService: DatabaseService) {}

  async create(createCategoryDto: CreateCategoryDto, companyId: string): Promise<Category> {
    const { name, description } = createCategoryDto;

    // Verificar si ya existe una categoría con el mismo nombre en la empresa
    const existingCategory = await this.findByNameAndCompany(name, companyId);
    if (existingCategory) {
      throw new ConflictException(`Category with name '${name}' already exists for this company.`);
    }

    const query = `
      INSERT INTO categories (company_id, name, description, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const { rows } = await this.databaseService.query(query, [
      companyId,
      name,
      description || null,
    ]);

    return this.mapRowToCategory(rows[0]);
  }

  async findAll(queryDto: QueryCategoryDto, companyId: string): Promise<{ data: Category[]; total: number }> {
    const { page = 1, limit = 10, name, is_active, search } = queryDto;
    const offset = (page - 1) * limit;

    let whereConditions = ['company_id = $1'];
    let queryParams: any[] = [companyId];
    let paramIndex = 2;

    if (name) {
      whereConditions.push(`name ILIKE $${paramIndex}`);
      queryParams.push(`%${name}%`);
      paramIndex++;
    }

    if (is_active !== undefined) {
      whereConditions.push(`is_active = $${paramIndex}`);
      queryParams.push(is_active);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    // Consulta para obtener el total
    const countQuery = `SELECT COUNT(*) FROM categories WHERE ${whereClause}`;
    const { rows: countRows } = await this.databaseService.query(countQuery, queryParams);
    const total = parseInt((countRows[0] as any).count);

    // Consulta para obtener los datos paginados
    const dataQuery = `
      SELECT * FROM categories 
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(limit, offset);

    const { rows } = await this.databaseService.query(dataQuery, queryParams);

    return {
      data: rows.map(row => this.mapRowToCategory(row)),
      total,
    };
  }

  async findOne(id: string, companyId: string): Promise<Category> {
    const query = `
      SELECT * FROM categories 
      WHERE id = $1 AND company_id = $2
    `;

    const { rows } = await this.databaseService.query(query, [id, companyId]);

    if (rows.length === 0) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return this.mapRowToCategory(rows[0]);
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto, companyId: string): Promise<Category> {
    // Verificar que la categoría existe
    const existingCategory = await this.findOne(id, companyId);

    // Verificar si el nuevo nombre ya existe (si se está actualizando el nombre)
    if (updateCategoryDto.name && updateCategoryDto.name !== existingCategory.name) {
      const categoryWithSameName = await this.findByNameAndCompany(updateCategoryDto.name, companyId);
      if (categoryWithSameName) {
        throw new ConflictException(`Category with name '${updateCategoryDto.name}' already exists for this company.`);
      }
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (updateCategoryDto.name !== undefined) {
      updateFields.push(`name = $${paramIndex}`);
      updateValues.push(updateCategoryDto.name);
      paramIndex++;
    }

    if (updateCategoryDto.description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      updateValues.push(updateCategoryDto.description);
      paramIndex++;
    }

    if (updateCategoryDto.is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex}`);
      updateValues.push(updateCategoryDto.is_active);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      throw new BadRequestException('No fields to update');
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id, companyId);

    const query = `
      UPDATE categories 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex} AND company_id = $${paramIndex + 1}
      RETURNING *
    `;

    const { rows } = await this.databaseService.query(query, updateValues);

    return this.mapRowToCategory(rows[0]);
  }

  async remove(id: string, companyId: string): Promise<void> {
    // Verificar que la categoría existe
    await this.findOne(id, companyId);

    const query = `
      DELETE FROM categories 
      WHERE id = $1 AND company_id = $2
    `;

    await this.databaseService.query(query, [id, companyId]);
  }

  private async findByNameAndCompany(name: string, companyId: string): Promise<Category | null> {
    const query = `
      SELECT * FROM categories 
      WHERE name = $1 AND company_id = $2
    `;

    const { rows } = await this.databaseService.query(query, [name, companyId]);

    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToCategory(rows[0]);
  }

  private mapRowToCategory(row: any): Category {
    return {
      id: row.id,
      company_id: row.company_id,
      name: row.name,
      description: row.description,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

