import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { PurchaseOrderStatus } from '../../../entities/purchase-order.entity';

export class QueryPurchaseOrderDto extends PaginationDto {
  @IsOptional()
  @IsString()
  orderNo?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  supplierId?: number;

  @IsOptional()
  @IsEnum(PurchaseOrderStatus)
  status?: PurchaseOrderStatus;
}
