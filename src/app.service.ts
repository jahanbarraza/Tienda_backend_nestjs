import { Injectable, OnModuleInit } from '@nestjs/common';
import { MigrationService } from './database/services/migration.service';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private migrationService: MigrationService) {}

  async onModuleInit() {
    // try {
    //   console.log("Ejecutando migraciones de base de datos...");
    //   await this.migrationService.runMigrations();
    //   console.log("Migraciones completadas exitosamente");
    // } catch (error) {
    //   console.error("Error ejecutando migraciones:", error);
    //   // No detener la aplicación, solo registrar el error
    // }
  }

  getHello(): string {
    return 'StampOut POS Backend API - Sistema de Punto de Venta';
  }
}

