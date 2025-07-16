import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TaxesService } from '../services/taxes.service';
import { CreateTaxDto } from '../dto/create-tax.dto';
import { UpdateTaxDto } from '../dto/update-tax.dto';
import { QueryTaxDto } from '../dto/query-tax.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@UseGuards(JwtAuthGuard)
@Controller("taxes")
export class TaxesController {
  constructor(private readonly taxesService: TaxesService) {}

  @Post()
  create(@Body() createTaxDto: CreateTaxDto, @Req() req: Request) {
    const companyId = (req.user as any).companyId;
    return this.taxesService.create(createTaxDto, companyId);
  }

  @Get()
  findAll(@Query() query: QueryTaxDto, @Req() req: Request) {
    const companyId = (req.user as any).companyId;
    return this.taxesService.findAll(query, companyId);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @Req() req: Request) {
    const companyId = (req.user as any).companyId;
    return this.taxesService.findOne(id, companyId);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateTaxDto: UpdateTaxDto, @Req() req: Request) {
    const companyId = (req.user as any).companyId;
    return this.taxesService.update(id, updateTaxDto, companyId);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Req() req: Request) {
    const companyId = (req.user as any).companyId;
    return this.taxesService.remove(id, companyId);
  }
}

