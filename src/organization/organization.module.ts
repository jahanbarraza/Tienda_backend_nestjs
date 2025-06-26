import { Module } from '@nestjs/common';
import { CompaniesModule } from './companies/companies.module';
import { StoresModule } from './stores/stores.module';

@Module({
  imports: [CompaniesModule, StoresModule],
  exports: [CompaniesModule, StoresModule],
})
export class OrganizationModule {}

