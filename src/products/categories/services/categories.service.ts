import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../../../database/services/database.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { QueryCategoryDto } from '../dto/query-category.dto';
import { Category } from '../interfaces/category.interface';
import { PaginationResult } from '../../../common/interfaces/pagination.interface';

@Injectable()
export class CategoriesService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createCategoryDto: CreateCategoryDto, companyId: string): Promise<Category> {
    const { name, description, is_active } = createCategoryDto;

    // Check if category name already exists for this company
    const existingCategory = await this.databaseService.query<Category>(
      `SELECT * FROM product_categories WHERE company_id = $1 AND name = $2 AND deleted_at IS NULL`,
      [companyId, name]
    );

    if (existingCategory.rows.length > 0) {
      throw new ConflictException(`Category with name '${name}' already exists for this company.`);
    }

    const result = await this.databaseService.query<Category>(
      `INSERT INTO product_categories (company_id, name, description, is_active)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [companyId, name, description, is_active]
    );
    return result.rows[0];
  }

  async findAll(query: QueryCategoryDto, companyId: string): Promise<PaginationResult<Category>> {
    const { page = 1, limit = 10, name, is_active } = query;
    const offset = (page - 1) * limit;
    let filterQuery = `WHERE company_id = $1 AND deleted_at IS NULL`;
    const params: any[] = [companyId];
    let paramIndex = 2;

    if (name) {
      filterQuery += ` AND name ILIKE $${paramIndex++}`;
      params.push(`%${name}%`);
    }
    if (is_active !== undefined) {
      filterQuery += ` AND is_active = $${paramIndex++}`;
      params.push(is_active);
    }

    const totalResult = await this.databaseService.query<{ count: string }>(
      `SELECT COUNT(*) FROM product_categories ${filterQuery}`,
      params
    );
    const total = parseInt(totalResult.rows[0].count, 10);

    const data = await this.databaseService.query<Category>(
      `SELECT * FROM product_categories ${filterQuery} ORDER BY name ASC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );

    return {
      data: data.rows,
      total,
      page,
      last_page: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, companyId: string): Promise<Category> {
    const result = await this.databaseService.query<Category>(
      `SELECT * FROM product_categories WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL`,
      [id, companyId]
    );
    if (result.rows.length === 0) {
      throw new NotFoundException(`Category with ID ${id} not found for this company.`);
    }
    return result.rows[0];
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto, companyId: string): Promise<Category> {
    const existingCategory = await this.findOne(id, companyId); // Check if category exists and belongs to company

    if (updateCategoryDto.name && updateCategoryDto.name !== existingCategory.name) {
      const nameExists = await this.databaseService.query<Category>(
        `SELECT * FROM product_categories WHERE company_id = $1 AND name = $2 AND id != $3 AND deleted_at IS NULL`,
        [companyId, updateCategoryDto.name, id]
      );
      if (nameExists.rows.length > 0) {
        throw new ConflictException(`Category with name '${updateCategoryDto.name}' already exists for this company.`);
      }
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (updateCategoryDto.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      updateValues.push(updateCategoryDto.name);
    }
    if (updateCategoryDto.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(updateCategoryDto.description);
    }
    if (updateCategoryDto.is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      updateValues.push(updateCategoryDto.is_active);
    }

    if (updateFields.length === 0) {
      throw new BadRequestException("No fields to update.");
    }

    updateValues.push(id, companyId);

    const result = await this.databaseService.query<Category>(
      `UPDATE product_categories SET ${updateFields.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex++} AND company_id = $${paramIndex++} AND deleted_at IS NULL RETURNING *`,
      [...updateValues]
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(`Category with ID ${id} not found or could not be updated for this company.`);
    }
    return result.rows[0];
  }

  async remove(id: string, companyId: string): Promise<void> {
    const result = await this.databaseService.query<Category>(
      `UPDATE product_categories SET deleted_at = NOW() WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL RETURNING id`,
      [id, companyId]
    );
    if (result.rows.length === 0) {
      throw new NotFoundException(`Category with ID ${id} not found or already deleted for this company.`);
    }
  }
}


