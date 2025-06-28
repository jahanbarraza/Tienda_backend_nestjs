import { IsString, IsOptional, IsBoolean, IsNumberString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QuerySubcategoryDto extends PaginationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsNumberString()
  @IsOptional()
  category_id?: number;

  @IsNumberString()
  @IsOptional()
  company_id?: number;
}


