import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsUUID()
  @IsNotEmpty()
  category_id: string;

  @IsOptional()
  @IsUUID()
  subcategory_id?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  @Min(0)
  cost?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  is_active?: boolean;
}

