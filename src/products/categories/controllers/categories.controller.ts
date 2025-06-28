import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { CategoriesService } from '../services/categories.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { QueryCategoryDto } from '../dto/query-category.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../../people/users/interfaces/user.interface';

@UseGuards(JwtAuthGuard)
@Controller("products/categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto, @CurrentUser() user: User) {
    return this.categoriesService.create(createCategoryDto, user.company_id);
  }

  @Get()
  findAll(@Query() query: QueryCategoryDto, @CurrentUser() user: User) {
    return this.categoriesService.findAll(query, user.company_id);
  }

  @Get(":id")
  findOne(@Param("id") id: string, @CurrentUser() user: User) {
    return this.categoriesService.findOne(id, user.company_id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateCategoryDto: UpdateCategoryDto, @CurrentUser() user: User) {
    return this.categoriesService.update(id, updateCategoryDto, user.company_id);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() user: User) {
    return this.categoriesService.remove(id, user.company_id);
  }
}


