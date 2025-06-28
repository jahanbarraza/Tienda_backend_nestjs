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
  Request,
} from '@nestjs/common';
import { SubcategoriesService } from '../services/subcategories.service';
import { CreateSubcategoryDto } from '../dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from '../dto/update-subcategory.dto';
import { QuerySubcategoryDto } from '../dto/query-subcategory.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

@Controller('products/subcategories')
@UseGuards(JwtAuthGuard)
export class SubcategoriesController {
  constructor(private readonly subcategoriesService: SubcategoriesService) {}

  @Post()
  create(@Body() createSubcategoryDto: CreateSubcategoryDto, @Request() req) {
    return this.subcategoriesService.create(createSubcategoryDto, req.user.companyId);
  }

  @Get()
  findAll(@Query() queryDto: QuerySubcategoryDto, @Request() req) {
    return this.subcategoriesService.findAll(queryDto, req.user.companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.subcategoriesService.findOne(id, req.user.companyId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSubcategoryDto: UpdateSubcategoryDto,
    @Request() req,
  ) {
    return this.subcategoriesService.update(id, updateSubcategoryDto, req.user.companyId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.subcategoriesService.remove(id, req.user.companyId);
  }
}

