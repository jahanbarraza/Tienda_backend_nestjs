import { IsString, IsOptional, MaxLength, MinLength, IsBoolean, IsObject } from 'class-validator';

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsObject()
  permissions?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

