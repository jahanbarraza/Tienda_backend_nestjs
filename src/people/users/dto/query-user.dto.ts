import { IsOptional, IsBoolean, IsDateString, IsUUID, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../organization/common/dto/pagination.dto';

export class QueryUserDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsUUID()
  roleId?: string;

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
  includeDetails?: boolean = true;
}

