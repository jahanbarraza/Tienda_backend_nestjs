import { Module } from '@nestjs/common';
import { CategoriesModule } from './categories/categories.module';
import { SubcategoriesModule } from './subcategories/subcategories.module';
import { ProductsModule as ProductsSubModule } from './products/products.module';

@Module({
  imports: [
    CategoriesModule,
    SubcategoriesModule,
    ProductsSubModule,
  ],
  exports: [
    CategoriesModule,
    SubcategoriesModule,
    ProductsSubModule,
  ],
})
export class ProductsModule {}