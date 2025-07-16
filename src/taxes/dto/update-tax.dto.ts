import { IsString, IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateTaxDto } from './create-tax.dto';

export class UpdateTaxDto extends PartialType(CreateTaxDto) {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  rate?: number; // Ej. 0.19 para 19%

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

