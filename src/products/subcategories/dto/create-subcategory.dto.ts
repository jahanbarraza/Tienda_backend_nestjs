import { IsString, IsNotEmpty, MaxLength, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateSubcategoryDto {
  @IsNumber()
  @IsNotEmpty()
  category_id: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

