import { Controller, Post, Body, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { LoginResponse, UserWithDetails } from '../interfaces/auth.interface';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: UserWithDetails) {
    return {
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
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: UserWithDetails) {
    // En una implementación real, aquí invalidarías el token
    return { message: 'Logout exitoso' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('validate')
  async validateToken(@CurrentUser() user: UserWithDetails) {
    return {
      valid: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role.name,
        company: user.company.name,
      },
    };
  }
}

