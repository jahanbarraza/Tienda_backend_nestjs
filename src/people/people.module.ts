import { Module } from '@nestjs/common';
import { IdentificationTypesModule } from './identification-types/identification-types.module';
import { RolesModule } from './roles/roles.module';
import { PersonsModule } from './persons/persons.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    IdentificationTypesModule,
    RolesModule,
    PersonsModule,
    UsersModule,
  ],
  exports: [
    IdentificationTypesModule,
    RolesModule,
    PersonsModule,
    UsersModule,
  ],
})
export class PeopleModule {}

