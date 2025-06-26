import { IsString, IsNotEmpty, IsOptional, MaxLength, MinLength, IsObject } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsObject()
  permissions?: Record<string, any> = {};
}

