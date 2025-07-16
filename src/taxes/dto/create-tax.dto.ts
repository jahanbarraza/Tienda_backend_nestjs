import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTaxDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  rate: number; // Ej. 0.19 para 19%

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

