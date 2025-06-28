import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { SubcategoriesService } from '../services/subcategories.service';
import { CreateSubcategoryDto } from '../dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from '../dto/update-subcategory.dto';
import { QuerySubcategoryDto } from '../dto/query-subcategory.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../../people/users/interfaces/user.interface';

@UseGuards(JwtAuthGuard)
@Controller("products/subcategories")
export class SubcategoriesController {
  constructor(private readonly subcategoriesService: SubcategoriesService) {}

  @Post()
  create(@Body() createSubcategoryDto: CreateSubcategoryDto, @CurrentUser() user: User) {
    return this.subcategoriesService.create(createSubcategoryDto, user.company_id);
  }

  @Get()
  findAll(@Query() query: QuerySubcategoryDto, @CurrentUser() user: User) {
    return this.subcategoriesService.findAll(query, user.company_id);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @CurrentUser() user: User) {
    return this.subcategoriesService.findOne(id, user.company_id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateSubcategoryDto: UpdateSubcategoryDto, @CurrentUser() user: User) {
    return this.subcategoriesService.update(id, updateSubcategoryDto, user.company_id);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() user: User) {
    return this.subcategoriesService.remove(id, user.company_id);
  }
}


