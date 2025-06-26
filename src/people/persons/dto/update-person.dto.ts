import { IsString, IsOptional, MaxLength, MinLength, IsEmail, IsUUID, IsDateString, IsBoolean } from 'class-validator';

export class UpdatePersonDto {
  @IsOptional()
  @IsUUID()
  identificationTypeId?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  identificationNumber?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

