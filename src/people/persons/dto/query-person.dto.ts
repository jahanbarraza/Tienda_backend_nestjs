import { IsOptional, IsBoolean, IsDateString, IsUUID, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../organization/common/dto/pagination.dto';

export class QueryPersonDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  identificationTypeId?: string;

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

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeIdentificationType?: boolean = true;
}

