import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { SalesOrderStatus } from '../../../entities/sales-order.entity';

export class QuerySalesOrderDto extends PaginationDto {
  @IsOptional()
  @IsString()
  orderNo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  customerId?: number;

  @IsOptional()
  @IsEnum(SalesOrderStatus)
  status?: SalesOrderStatus;
}
