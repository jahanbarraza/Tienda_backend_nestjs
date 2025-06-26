import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MigrationService {
  constructor(private databaseService: DatabaseService) {}

  async runMigrations(): Promise<void> {
    const migrationsPath = path.join(process.cwd(), 'database', 'migrations');
    
    try {
      // Crear tabla de migraciones si no existe
      await this.createMigrationsTable();
      
      // Obtener archivos de migración
      const migrationFiles = fs.readdirSync(migrationsPath)
        .filter(file => file.endsWith('.sql'))
        .sort();

      for (const file of migrationFiles) {
        const migrationName = file.replace('.sql', '');
        
        // Verificar si la migración ya fue ejecutada
        const { rows } = await this.databaseService.query(
          'SELECT * FROM migrations WHERE name = $1',
          [migrationName]
        );

        if (rows.length === 0) {
          console.log(`Ejecutando migración: ${migrationName}`);
          
          // Leer y ejecutar el archivo SQL
          const sqlContent = fs.readFileSync(path.join(migrationsPath, file), 'utf8');
          
          await this.databaseService.transaction(async (client) => {
            await client.query(sqlContent);
            await client.query(
              'INSERT INTO migrations (name, executed_at) VALUES ($1, $2)',
              [migrationName, new Date()]
            );
          });
          
          console.log(`Migración completada: ${migrationName}`);
        } else {
          console.log(`Migración ya ejecutada: ${migrationName}`);
        }
      }
      
      console.log('Todas las migraciones han sido ejecutadas');
    } catch (error) {
      console.error('Error ejecutando migraciones:', error);
      throw error;
    }
  }

  private async createMigrationsTable(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await this.databaseService.query(createTableSQL);
  }
}

