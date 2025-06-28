import { IsString, IsOptional, IsBoolean, IsNumberString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryCategoryDto extends PaginationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsNumberString()
  @IsOptional()
  company_id?: number;
}


