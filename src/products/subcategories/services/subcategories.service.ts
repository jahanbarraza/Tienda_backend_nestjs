import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../../../database/services/database.service';
import { CreateSubcategoryDto } from '../dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from '../dto/update-subcategory.dto';
import { QuerySubcategoryDto } from '../dto/query-subcategory.dto';
import { Subcategory } from '../interfaces/subcategory.interface';
import { PaginationResult } from '../../../common/interfaces/pagination.interface';

@Injectable()
export class SubcategoriesService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createSubcategoryDto: CreateSubcategoryDto, companyId: string): Promise<Subcategory> {
    const { category_id, name, description, is_active } = createSubcategoryDto;

    // Check if category exists and belongs to the company
    const categoryExists = await this.databaseService.query<any>(
      `SELECT id FROM product_categories WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL`,
      [category_id, companyId]
    );
    if (categoryExists.rows.length === 0) {
      throw new NotFoundException(`Category with ID ${category_id} not found or does not belong to this company.`);
    }

    // Check if subcategory name already exists for this category and company
    const existingSubcategory = await this.databaseService.query<Subcategory>(
      `SELECT * FROM product_subcategories WHERE company_id = $1 AND category_id = $2 AND name = $3 AND deleted_at IS NULL`,
      [companyId, category_id, name]
    );

    if (existingSubcategory.rows.length > 0) {
      throw new ConflictException(`Subcategory with name '${name}' already exists for this category and company.`);
    }

    const result = await this.databaseService.query<Subcategory>(
      `INSERT INTO product_subcategories (company_id, category_id, name, description, is_active)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [companyId, category_id, name, description, is_active]
    );
    return result.rows[0];
  }

  async findAll(query: QuerySubcategoryDto, companyId: string): Promise<PaginationResult<Subcategory>> {
    const { page = 1, limit = 10, name, is_active, category_id } = query;
    const offset = (page - 1) * limit;
    let filterQuery = `WHERE s.company_id = $1 AND s.deleted_at IS NULL`;
    const params: any[] = [companyId];
    let paramIndex = 2;

    if (name) {
      filterQuery += ` AND s.name ILIKE $${paramIndex++}`;
      params.push(`%${name}%`);
    }
    if (is_active !== undefined) {
      filterQuery += ` AND s.is_active = $${paramIndex++}`;
      params.push(is_active);
    }
    if (category_id) {
      filterQuery += ` AND s.category_id = $${paramIndex++}`;
      params.push(category_id);
    }

    const totalResult = await this.databaseService.query<{ count: string }>(
      `SELECT COUNT(*) FROM product_subcategories s ${filterQuery}`,
      params
    );
    const total = parseInt(totalResult.rows[0].count, 10);

    const data = await this.databaseService.query<Subcategory>(
      `SELECT s.*, c.name as category_name FROM product_subcategories s
       JOIN product_categories c ON s.category_id = c.id
       ${filterQuery} ORDER BY s.name ASC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );

    return {
      data: data.rows,
      total,
      page,
      last_page: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, companyId: string): Promise<Subcategory> {
    const result = await this.databaseService.query<Subcategory>(
      `SELECT s.*, c.name as category_name FROM product_subcategories s
       JOIN product_categories c ON s.category_id = c.id
       WHERE s.id = $1 AND s.company_id = $2 AND s.deleted_at IS NULL`,
      [id, companyId]
    );
    if (result.rows.length === 0) {
      throw new NotFoundException(`Subcategory with ID ${id} not found for this company.`);
    }
    return result.rows[0];
  }

  async update(id: string, updateSubcategoryDto: UpdateSubcategoryDto, companyId: string): Promise<Subcategory> {
    const existingSubcategory = await this.findOne(id, companyId); // Check if subcategory exists and belongs to company

    if (updateSubcategoryDto.category_id && updateSubcategoryDto.category_id !== existingSubcategory.category_id) {
      const categoryExists = await this.databaseService.query<any>(
        `SELECT id FROM product_categories WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL`,
        [updateSubcategoryDto.category_id, companyId]
      );
      if (categoryExists.rows.length === 0) {
        throw new NotFoundException(`Category with ID ${updateSubcategoryDto.category_id} not found or does not belong to this company.`);
      }
    }

    if (updateSubcategoryDto.name && updateSubcategoryDto.name !== existingSubcategory.name) {
      const nameExists = await this.databaseService.query<Subcategory>(
        `SELECT * FROM product_subcategories WHERE company_id = $1 AND category_id = $2 AND name = $3 AND id != $4 AND deleted_at IS NULL`,
        [companyId, updateSubcategoryDto.category_id || existingSubcategory.category_id, updateSubcategoryDto.name, id]
      );
      if (nameExists.rows.length > 0) {
        throw new ConflictException(`Subcategory with name '${updateSubcategoryDto.name}' already exists for this category and company.`);
      }
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (updateSubcategoryDto.category_id !== undefined) {
      updateFields.push(`category_id = $${paramIndex++}`);
      updateValues.push(updateSubcategoryDto.category_id);
    }
    if (updateSubcategoryDto.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      updateValues.push(updateSubcategoryDto.name);
    }
    if (updateSubcategoryDto.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(updateSubcategoryDto.description);
    }
    if (updateSubcategoryDto.is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      updateValues.push(updateSubcategoryDto.is_active);
    }

    if (updateFields.length === 0) {
      throw new BadRequestException("No fields to update.");
    }

    updateValues.push(id, companyId);

    const result = await this.databaseService.query<Subcategory>(
      `UPDATE product_subcategories SET ${updateFields.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex++} AND company_id = $${paramIndex++} AND deleted_at IS NULL RETURNING *`,
      [...updateValues]
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(`Subcategory with ID ${id} not found or could not be updated for this company.`);
    }
    return result.rows[0];
  }

  async remove(id: string, companyId: string): Promise<void> {
    const result = await this.databaseService.query<Subcategory>(
      `UPDATE product_subcategories SET deleted_at = NOW() WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL RETURNING id`,
      [id, companyId]
    );
    if (result.rows.length === 0) {
      throw new NotFoundException(`Subcategory with ID ${id} not found or already deleted for this company.`);
    }
  }
}


