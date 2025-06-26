import { Module } from '@nestjs/common';
import { IdentificationTypesService } from './services/identification-types.service';
import { IdentificationTypesController } from './controllers/identification-types.controller';

@Module({
  controllers: [IdentificationTypesController],
  providers: [IdentificationTypesService],
  exports: [IdentificationTypesService],
})
export class IdentificationTypesModule {}

