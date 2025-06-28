import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';

interface CountResult {
  total: string;
}

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
  }

  async onModuleInit() {
    await this.pool.connect();
    console.log('Database connected');
  }

  async onModuleDestroy() {
    await this.pool.end();
    console.log('Database connection closed');
  }

  async query<T>(text: string, params?: any[]): Promise<{ rows: T[] }> {
    const result = await this.pool.query(text, params);
    return { rows: result.rows as T[] };
  }

  async queryCount(text: string, params?: any[]): Promise<{ rows: CountResult[] }> {
    const result = await this.pool.query(text, params);
    return { rows: result.rows as CountResult[] };
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}


