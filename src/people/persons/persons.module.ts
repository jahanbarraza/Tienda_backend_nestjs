import { Module } from '@nestjs/common';
import { PersonsService } from './services/persons.service';
import { PersonsController } from './controllers/persons.controller';

@Module({
  controllers: [PersonsController],
  providers: [PersonsService],
  exports: [PersonsService],
})
export class PersonsModule {}

