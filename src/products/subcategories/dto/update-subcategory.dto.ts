import { IsString, IsOptional, IsBoolean, MaxLength, IsUUID } from 'class-validator';

export class UpdateSubcategoryDto {
  @IsString()
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

