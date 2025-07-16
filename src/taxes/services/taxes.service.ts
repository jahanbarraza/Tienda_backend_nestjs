import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/services/database.service';
import { CreateTaxDto } from '../dto/create-tax.dto';
import { UpdateTaxDto } from '../dto/update-tax.dto';
import { QueryTaxDto } from '../dto/query-tax.dto';
import { Tax } from '../interfaces/tax.interface';
import { PaginationResult } from '../../common/interfaces/pagination.interface';

@Injectable()
export class TaxesService {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(createTaxDto: CreateTaxDto, companyId: string): Promise<Tax> {
    const { name, rate, is_active } = createTaxDto;

    const existingTax = await this.databaseService.query<Tax>(
      `SELECT * FROM taxes WHERE company_id = $1 AND name = $2`,
      [companyId, name]
    );

    if (existingTax.rows.length > 0) {
      throw new ConflictException(`Tax with name '${name}' already exists for this company.`);
    }

    const result = await this.databaseService.query<Tax>(
      `INSERT INTO taxes (company_id, name, rate, is_active)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [companyId, name, rate, is_active]
    );
    return result.rows[0];
  }

  async findAll(query: QueryTaxDto, companyId: string): Promise<PaginationResult<Tax>> {
    const { page = 1, limit = 10, name, is_active } = query;
    const offset = (page - 1) * limit;
    let filterQuery = `WHERE t.company_id = $1`;
    const params: any[] = [companyId];
    let paramIndex = 2;

    if (name) {
      filterQuery += ` AND t.name ILIKE $${paramIndex++}`;
      params.push(`%${name}%`);
    }
    if (is_active !== undefined) {
      filterQuery += ` AND t.is_active = $${paramIndex++}`;
      params.push(is_active);
    }

    const totalResult = await this.databaseService.query<{ count: string }>(
      `SELECT COUNT(*) FROM taxes t ${filterQuery}`,
      params
    );
    const total = parseInt((totalResult.rows[0] as any).count, 10);

    const data = await this.databaseService.query<Tax>(
      `SELECT t.* FROM taxes t
       ${filterQuery} ORDER BY t.name ASC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );

    return {
      data: data.rows,
      total,
      page,
      last_page: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, companyId: string): Promise<Tax> {
    const result = await this.databaseService.query<Tax>(
      `SELECT * FROM taxes WHERE id = $1 AND company_id = $2`,
      [id, companyId]
    );
    if (result.rows.length === 0) {
      throw new NotFoundException(`Tax with ID ${id} not found for this company.`);
    }
    return result.rows[0];
  }

  async update(id: string, updateTaxDto: UpdateTaxDto, companyId: string): Promise<Tax> {
    const existingTax = await this.findOne(id, companyId); // Check if tax exists and belongs to company

    if (updateTaxDto.name && updateTaxDto.name !== existingTax.name) {
      const nameExists = await this.databaseService.query<Tax>(
        `SELECT * FROM taxes WHERE company_id = $1 AND name = $2 AND id != $3`,
        [companyId, updateTaxDto.name, id]
      );
      if (nameExists.rows.length > 0) {
        throw new ConflictException(`Tax with name '${updateTaxDto.name}' already exists for this company.`);
      }
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (updateTaxDto.name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      updateValues.push(updateTaxDto.name);
    }
    if (updateTaxDto.rate !== undefined) {
      updateFields.push(`rate = $${paramIndex++}`);
      updateValues.push(updateTaxDto.rate);
    }
    if (updateTaxDto.is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      updateValues.push(updateTaxDto.is_active);
    }

    if (updateFields.length === 0) {
      throw new BadRequestException("No fields to update.");
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(id, companyId);

    const result = await this.databaseService.query<Tax>(
      `UPDATE taxes SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex++} AND company_id = $${paramIndex++} RETURNING *`,
      [...updateValues]
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(`Tax with ID ${id} not found or could not be updated for this company.`);
    }
    return result.rows[0];
  }

  async remove(id: string, companyId: string): Promise<void> {
    const result = await this.databaseService.query<Tax>(
      `DELETE FROM taxes WHERE id = $1 AND company_id = $2 RETURNING id`,
      [id, companyId]
    );
    if (result.rows.length === 0) {
      throw new NotFoundException(`Tax with ID ${id} not found for this company.`);
    }
  }
}

