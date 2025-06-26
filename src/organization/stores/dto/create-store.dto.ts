import { IsString, IsNotEmpty, IsOptional, IsEmail, MaxLength, MinLength, IsUUID } from 'class-validator';

export class CreateStoreDto {
  @IsOptional()
  @IsUUID()
  companyId?: string; // Opcional porque se puede tomar del usuario autenticado

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  code: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;
}

