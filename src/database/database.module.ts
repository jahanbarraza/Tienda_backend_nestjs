import { Module, Global } from '@nestjs/common';
import { DatabaseService } from './services/database.service';
import { MigrationService } from './services/migration.service';

@Global()
@Module({
  providers: [DatabaseService, MigrationService],
  exports: [DatabaseService, MigrationService],
})
export class DatabaseModule {}

