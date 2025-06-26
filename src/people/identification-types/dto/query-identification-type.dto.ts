import { IsOptional, IsBoolean, IsDateString, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../organization/common/dto/pagination.dto';

export class QueryIdentificationTypeDto extends PaginationDto {
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeStats?: boolean = false;
}

