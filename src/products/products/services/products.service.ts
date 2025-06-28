import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../../../database/services/database.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { QueryProductDto } from '../dto/query-product.dto';
import { Product } from '../interfaces/product.interface';
import { PaginationResult } from '../../../common/interfaces/pagination.interface';

@Injectable()
export class ProductsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createProductDto: CreateProductDto, companyId: string): Promise<Product> {
    const { category_id, subcategory_id, name, description, sku, price, cost, stock, is_active } = createProductDto;

    // Check if category exists and belongs to the company
    const categoryExists = await this.databaseService.query<any>(
      `SELECT id FROM categories WHERE id = $1 AND company_id = $2 AND is_active = true`,
      [category_id, companyId]
    );
    if (categoryExists.rows.length === 0) {
      throw new NotFoundException(`Category with ID ${category_id} not found or does not belong to this company.`);
    }

    // Check if subcategory exists and belongs to the category and company
    if (subcategory_id) {
      const subcategoryExists = await this.databaseService.query<any>(
        `SELECT id FROM subcategories WHERE id = $1 AND category_id = $2 AND company_id = $3 AND is_active = true`,
        [subcategory_id, category_id, companyId]
      );
      if (subcategoryExists.rows.length === 0) {
        throw new NotFoundException(`Subcategory with ID ${subcategory_id} not found or does not belong to this category or company.`);
      }
    }

    // Check if product SKU already exists for this company
    const existingProductSku = await this.databaseService.query<Product>(
      `SELECT * FROM products WHERE company_id = $1 AND sku = $2`,
      [companyId, sku]
    );

    if (existingProductSku.rows.length > 0) {
      throw new ConflictException(`Product with SKU '${sku}' already exists for this company.`);
    }

    const result = await this.databaseService.query<Product>(
      `INSERT INTO products (company_id, category_id, subcategory_id, name, description, sku, price, cost, stock, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *`,
      [companyId, category_id, subcategory_id, name, description, sku, price, cost, stock, is_active]
    );
    return result.rows[0];
  }

  async findAll(query: QueryProductDto, companyId: string): Promise<PaginationResult<Product>> {
    const { page = 1, limit = 10, name, is_active, category_id, subcategory_id } = query;
    const offset = (page - 1) * limit;
    let filterQuery = `WHERE p.company_id = $1`;
    const params: any[] = [companyId];
    let paramIndex = 2;

    if (name) {
      filterQuery += ` AND p.name ILIKE $${paramIndex++}`;
      params.push(`%${name}%`);
    }
    if (is_active !== undefined) {
      filterQuery += ` AND p.is_active = $${paramIndex++}`;
      params.push(is_active);
    }
    if (category_id) {
      filterQuery += ` AND p.category_id = $${paramIndex++}`;
      params.push(category_id);
    }
    if (subcategory_id) {
      filterQuery += ` AND p.subcategory_id = $${paramIndex++}`;
      params.push(subcategory_id);
    }

    const totalResult = await this.databaseService.query<{ count: string }>(
      `SELECT COUNT(*) FROM products p ${filterQuery}`,
      params
    );
    const total = parseInt(totalResult.rows[0].count, 10);

    const data = await this.databaseService.query<Product>(
      `SELECT p.*, c.name as category_name, s.name as subcategory_name FROM products p
       JOIN categories c ON p.category_id = c.id
       LEFT JOIN subcategories s ON p.subcategory_id = s.id
       ${filterQuery} ORDER BY p.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );

    return {
      data: data.rows,
      total,
      page,
      last_page: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, companyId: string): Promise<Product> {
    const result = await this.databaseService.query<Product>(
      `SELECT p.*, c.name as category_name, s.name as subcategory_name FROM products p
       JOIN categories c ON p.category_id = c.id
       LEFT JOIN subcategories s ON p.subcategory_id = s.id
       WHERE p.id = $1 AND p.company_id = $2`,
      [id, companyId]
    );
    if (result.rows.length === 0) {
      throw new NotFoundException(`Product with ID ${id} not found for this company.`);
    }
    return result.rows[0];
  }

  async update(id: string, updateProductDto: UpdateProductDto, companyId: string): Promise<Product> {
    const existingProduct = await this.findOne(id, companyId); // Check if product exists and belongs to company

    if (updateProductDto.category_id && updateProductDto.category_id !== existingProduct.category_id) {
      const categoryExists = await this.databaseService.query<any>(
        `SELECT id FROM categories WHERE id = $1 AND company_id = $2 AND is_active = true`,
        [updateProductDto.category_id, companyId]
      );
      if (categoryExists.rows.length === 0) {
        throw new NotFoundException(`Category with ID ${updateProductDto.category_id} not found or does not belong to this company.`);
      }
    }

    if (updateProductDto.subcategory_id && updateProductDto.subcategory_id !== existingProduct.subcategory_id) {
      const subcategoryExists = await this.databaseService.query<any>(
        `SELECT id FROM subcategories WHERE id = $1 AND category_id = $2 AND company_id = $3 AND is_active = true`,
        [updateProductDto.subcategory_id, updateProductDto.category_id || existingProduct.category_id, companyId]
      );
      if (subcategoryExists.rows.length === 0) {
        throw new NotFoundException(`Subcategory with ID ${updateProductDto.subcategory_id} not found or does not belong to this category or company.`);
      }
    }

    if (updateProductDto.sku && updateProductDto.sku !== existingProduct.sku) {
      const skuExists = await this.databaseService.query<Product>(
        `SELECT * FROM products WHERE company_id = $1 AND sku = $2 AND id != $3`,
        [companyId, updateProductDto.sku, id]
      );
      if (skuExists.rows.length > 0) {
        throw new ConflictException(`Product with SKU '${updateProductDto.sku}' already exists for this company.`);
      }
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (updateProductDto.category_id !== undefined) {
      updateFields.push(`category_id = $${paramIndex++}`);
      updateValues.push(updateProductDto.category_id);
    }
    if (updateProductDto.subcategory_id !== undefined) {
      updateFields.push(`subcategory_id = $${paramIndex++}`);
      updateValues.push(updateProductDto.subcategory_id);
    }
    if (updateProductDto.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      updateValues.push(updateProductDto.name);
    }
    if (updateProductDto.description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(updateProductDto.description);
    }
    if (updateProductDto.sku !== undefined) {
      updateFields.push(`sku = $${paramIndex++}`);
      updateValues.push(updateProductDto.sku);
    }
    if (updateProductDto.price !== undefined) {
      updateFields.push(`price = $${paramIndex++}`);
      updateValues.push(updateProductDto.price);
    }
    if (updateProductDto.cost !== undefined) {
      updateFields.push(`cost = $${paramIndex++}`);
      updateValues.push(updateProductDto.cost);
    }
    if (updateProductDto.stock !== undefined) {
      updateFields.push(`stock = $${paramIndex++}`);
      updateValues.push(updateProductDto.stock);
    }
    if (updateProductDto.is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      updateValues.push(updateProductDto.is_active);
    }

    if (updateFields.length === 0) {
      throw new BadRequestException("No fields to update.");
    }

    // Add updated_at field
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add id and companyId to the end of updateValues for the WHERE clause
    updateValues.push(id, companyId);

    const result = await this.databaseService.query<Product>(
      `UPDATE products SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex++} AND company_id = $${paramIndex++} RETURNING *`,
      [...updateValues]
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(`Product with ID ${id} not found or could not be updated for this company.`);
    }
    return result.rows[0];
  }

  async remove(id: string, companyId: string): Promise<void> {
    const result = await this.databaseService.query<Product>(
      `DELETE FROM products WHERE id = $1 AND company_id = $2 RETURNING id`,
      [id, companyId]
    );
    if (result.rows.length === 0) {
      throw new NotFoundException(`Product with ID ${id} not found for this company.`);
    }
  }
}

