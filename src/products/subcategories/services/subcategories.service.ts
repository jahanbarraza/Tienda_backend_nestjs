import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../../database/services/database.service';
import { CreateSubcategoryDto } from '../dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from '../dto/update-subcategory.dto';
import { QuerySubcategoryDto } from '../dto/query-subcategory.dto';
import { Subcategory } from '../interfaces/subcategory.interface';

@Injectable()
export class SubcategoriesService {
  constructor(private databaseService: DatabaseService) {}

  async create(createSubcategoryDto: CreateSubcategoryDto, companyId: string): Promise<Subcategory> {
    const { category_id, name, description } = createSubcategoryDto;

    // Verificar que la categoría existe y pertenece a la empresa
    await this.validateCategoryExists(category_id, companyId);

    // Verificar si ya existe una subcategoría con el mismo nombre en la categoría
    const existingSubcategory = await this.findByNameAndCategory(name, category_id, companyId);
    if (existingSubcategory) {
      throw new ConflictException(`Subcategory with name '${name}' already exists in this category.`);
    }

    const query = `
      INSERT INTO subcategories (company_id, category_id, name, description, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const { rows } = await this.databaseService.query(query, [
      companyId,
      category_id,
      name,
      description || null,
    ]);

    return this.mapRowToSubcategory(rows[0]);
  }

  async findAll(queryDto: QuerySubcategoryDto, companyId: string): Promise<{ data: Subcategory[]; total: number }> {
    const { page = 1, limit = 10, category_id, name, is_active, search } = queryDto;
    const offset = (page - 1) * limit;

    let whereConditions = ['company_id = $1'];
    let queryParams: any[] = [companyId];
    let paramIndex = 2;

    if (category_id) {
      whereConditions.push(`category_id = $${paramIndex}`);
      queryParams.push(category_id);
      paramIndex++;
    }

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
    const countQuery = `SELECT COUNT(*) FROM subcategories WHERE ${whereClause}`;
    const { rows: countRows } = await this.databaseService.query(countQuery, queryParams);
    const total = parseInt((countRows[0] as any).count);

    // Consulta para obtener los datos paginados
    const dataQuery = `
      SELECT * FROM subcategories 
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    queryParams.push(limit, offset);

    const { rows } = await this.databaseService.query(dataQuery, queryParams);

    return {
      data: rows.map(row => this.mapRowToSubcategory(row)),
      total,
    };
  }

  async findOne(id: string, companyId: string): Promise<Subcategory> {
    const query = `
      SELECT * FROM subcategories 
      WHERE id = $1 AND company_id = $2
    `;

    const { rows } = await this.databaseService.query(query, [id, companyId]);

    if (rows.length === 0) {
      throw new NotFoundException(`Subcategory with ID ${id} not found`);
    }

    return this.mapRowToSubcategory(rows[0]);
  }

  async update(id: string, updateSubcategoryDto: UpdateSubcategoryDto, companyId: string): Promise<Subcategory> {
    // Verificar que la subcategoría existe
    const existingSubcategory = await this.findOne(id, companyId);

    // Si se está actualizando la categoría, verificar que existe
    if (updateSubcategoryDto.category_id) {
      await this.validateCategoryExists(updateSubcategoryDto.category_id, companyId);
    }

    // Verificar si el nuevo nombre ya existe en la categoría (si se está actualizando el nombre o categoría)
    if (updateSubcategoryDto.name || updateSubcategoryDto.category_id) {
      const nameToCheck = updateSubcategoryDto.name || existingSubcategory.name;
      const categoryToCheck = updateSubcategoryDto.category_id || existingSubcategory.category_id;
      
      if (nameToCheck !== existingSubcategory.name || categoryToCheck !== existingSubcategory.category_id) {
        const subcategoryWithSameName = await this.findByNameAndCategory(nameToCheck, categoryToCheck, companyId);
        if (subcategoryWithSameName) {
          throw new ConflictException(`Subcategory with name '${nameToCheck}' already exists in this category.`);
        }
      }
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (updateSubcategoryDto.category_id !== undefined) {
      updateFields.push(`category_id = $${paramIndex}`);
      updateValues.push(updateSubcategoryDto.category_id);
      paramIndex++;
    }

    if (updateSubcategoryDto.name !== undefined) {
      updateFields.push(`name = $${paramIndex}`);
      updateValues.push(updateSubcategoryDto.name);
      paramIndex++;
    }

    if (updateSubcategoryDto.description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      updateValues.push(updateSubcategoryDto.description);
      paramIndex++;
    }

    if (updateSubcategoryDto.is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex}`);
      updateValues.push(updateSubcategoryDto.is_active);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      throw new BadRequestException('No fields to update');
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id, companyId);

    const query = `
      UPDATE subcategories 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex} AND company_id = $${paramIndex + 1}
      RETURNING *
    `;

    const { rows } = await this.databaseService.query(query, updateValues);

    return this.mapRowToSubcategory(rows[0]);
  }

  async remove(id: string, companyId: string): Promise<void> {
    // Verificar que la subcategoría existe
    await this.findOne(id, companyId);

    const query = `
      DELETE FROM subcategories 
      WHERE id = $1 AND company_id = $2
    `;

    await this.databaseService.query(query, [id, companyId]);
  }

  private async validateCategoryExists(categoryId: string, companyId: string): Promise<void> {
    const query = `
      SELECT id FROM categories 
      WHERE id = $1 AND company_id = $2 AND is_active = true
    `;

    const { rows } = await this.databaseService.query(query, [categoryId, companyId]);

    if (rows.length === 0) {
      throw new NotFoundException(`Category with ID ${categoryId} not found or inactive`);
    }
  }

  private async findByNameAndCategory(name: string, categoryId: string, companyId: string): Promise<Subcategory | null> {
    const query = `
      SELECT * FROM subcategories 
      WHERE name = $1 AND category_id = $2 AND company_id = $3
    `;

    const { rows } = await this.databaseService.query(query, [name, categoryId, companyId]);

    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToSubcategory(rows[0]);
  }

  private mapRowToSubcategory(row: any): Subcategory {
    return {
      id: row.id,
      company_id: row.company_id,
      category_id: row.category_id,
      name: row.name,
      description: row.description,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

