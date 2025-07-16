import { Module } from '@nestjs/common';
import { TaxesService } from './services/taxes.service';
import { TaxesController } from './controllers/taxes.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [TaxesController],
  providers: [TaxesService],
  exports: [TaxesService], // Export TaxesService if it needs to be used by other modules
})
export class TaxesModule {}

