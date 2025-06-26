import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from '../../database/services/database.service';
import { LoginDto } from '../dto/login.dto';
import { JwtPayload, LoginResponse, UserWithDetails } from '../interfaces/auth.interface';

@Injectable()
export class AuthService {
  constructor(
    private databaseService: DatabaseService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const { username, password } = loginDto;

    // Buscar usuario con detalles
    const user = await this.findUserByUsername(username);
    
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Actualizar último login
    await this.updateLastLogin(user.id);

    // Generar JWT
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      companyId: user.company.id,
      roleId: user.role.id,
      roleName: user.role.name,
    };

    const access_token = this.jwtService.sign(payload);

    // Guardar sesión
    await this.createUserSession(user.id, access_token);

    return {
      access_token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        person: {
          firstName: user.person.first_name,
          lastName: user.person.last_name,
        },
        company: {
          id: user.company.id,
          name: user.company.name,
        },
        role: {
          id: user.role.id,
          name: user.role.name,
          permissions: user.role.permissions,
        },
      },
    };
  }

  async validateUser(payload: JwtPayload): Promise<UserWithDetails | null> {
    try {
      const user = await this.findUserById(payload.sub);
      
      if (!user || !user.is_active) {
        return null;
      }

      return user;
    } catch (error) {
      return null;
    }
  }

  async logout(userId: string, token: string): Promise<void> {
    const tokenHash = await bcrypt.hash(token, 10);
    
    await this.databaseService.query(
      'UPDATE user_sessions SET is_active = false WHERE user_id = $1 AND token_hash = $2',
      [userId, tokenHash]
    );
  }

  private async findUserByUsername(username: string): Promise<UserWithDetails | null> {
    const query = `
      SELECT 
        u.id, u.username, u.email, u.password_hash, u.is_active, u.company_id, 
        u.role_id, u.person_id, u.last_login, u.created_at, u.updated_at,
        p.id as person_id, p.first_name, p.last_name, p.email as person_email, 
        p.identification_number,
        c.id as company_id, c.name as company_name,
        r.id as role_id, r.name as role_name, r.permissions
      FROM users u
      INNER JOIN persons p ON u.person_id = p.id
      INNER JOIN companies c ON u.company_id = c.id
      INNER JOIN roles r ON u.role_id = r.id
      WHERE u.username = $1 AND u.is_active = true
    `;

    const { rows } = await this.databaseService.query(query, [username]);
    
    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return this.mapRowToUserWithDetails(row);
  }

  private async findUserById(userId: string): Promise<UserWithDetails | null> {
    const query = `
      SELECT 
        u.id, u.username, u.email, u.password_hash, u.is_active, u.company_id, 
        u.role_id, u.person_id, u.last_login, u.created_at, u.updated_at,
        p.id as person_id, p.first_name, p.last_name, p.email as person_email, 
        p.identification_number,
        c.id as company_id, c.name as company_name,
        r.id as role_id, r.name as role_name, r.permissions
      FROM users u
      INNER JOIN persons p ON u.person_id = p.id
      INNER JOIN companies c ON u.company_id = c.id
      INNER JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1 AND u.is_active = true
    `;

    const { rows } = await this.databaseService.query(query, [userId]);
    
    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return this.mapRowToUserWithDetails(row);
  }

  private mapRowToUserWithDetails(row: any): UserWithDetails {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      password_hash: row.password_hash,
      is_active: row.is_active,
      company_id: row.company_id,
      role_id: row.role_id,
      person_id: row.person_id,
      last_login: row.last_login,
      created_at: row.created_at,
      updated_at: row.updated_at,
      person: {
        id: row.person_id,
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.person_email,
        identification_number: row.identification_number,
      },
      company: {
        id: row.company_id,
        name: row.company_name,
      },
      role: {
        id: row.role_id,
        name: row.role_name,
        permissions: row.permissions,
      },
    };
  }

  private async updateLastLogin(userId: string): Promise<void> {
    await this.databaseService.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [userId]
    );
  }

  private async createUserSession(userId: string, token: string): Promise<void> {
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 horas

    await this.databaseService.query(
      `INSERT INTO user_sessions (user_id, token_hash, expires_at, is_active) 
       VALUES ($1, $2, $3, true)`,
      [userId, tokenHash, expiresAt]
    );
  }
}

