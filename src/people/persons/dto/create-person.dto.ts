import { IsString, IsNotEmpty, IsOptional, MaxLength, MinLength, IsEmail, IsUUID, IsDateString } from 'class-validator';

export class CreatePersonDto {
  @IsUUID()
  @IsNotEmpty()
  identificationTypeId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  identificationNumber: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  lastName: string;

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
}

