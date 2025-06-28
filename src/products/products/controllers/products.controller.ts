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
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ProductsService } from '../services/products.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { QueryProductDto } from '../dto/query-product.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createProductDto: CreateProductDto, @Request() req: any) {
    const companyId = req.user.company_id;
    return this.productsService.create(createProductDto, companyId);
  }

  @Get()
  findAll(@Query() query: QueryProductDto, @Request() req: any) {
    const companyId = req.user.company_id;
    return this.productsService.findAll(query, companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user.company_id;
    return this.productsService.findOne(id, companyId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Request() req: any,
  ) {
    const companyId = req.user.company_id;
    return this.productsService.update(id, updateProductDto, companyId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Request() req: any) {
    const companyId = req.user.company_id;
    return this.productsService.remove(id, companyId);
  }
}

