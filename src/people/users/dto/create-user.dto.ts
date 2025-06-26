import { IsString, IsNotEmpty, IsOptional, MaxLength, MinLength, IsEmail, IsUUID } from 'class-validator';

export class CreateUserDto {
  @IsUUID()
  @IsNotEmpty()
  personId: string;

  @IsOptional()
  @IsUUID()
  companyId?: string; // Si no se especifica, se usa la del usuario actual

  @IsUUID()
  @IsNotEmpty()
  roleId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(100)
  password: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;
}

