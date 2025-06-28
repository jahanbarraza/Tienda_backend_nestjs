import { Module } from '@nestjs/common';
import { SubcategoriesService } from './services/subcategories.service';
import { SubcategoriesController } from './controllers/subcategories.controller';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [SubcategoriesController],
  providers: [SubcategoriesService],
  exports: [SubcategoriesService]
})
export class SubcategoriesModule {}


