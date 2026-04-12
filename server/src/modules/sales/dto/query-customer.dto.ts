import { IsOptional, IsString, IsBoolean, IsNumber } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryCustomerDto extends PaginationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  levelId?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  status?: boolean;
}
