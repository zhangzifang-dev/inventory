import { IsEnum } from 'class-validator';
import { SalesOrderStatus } from '../../../entities/sales-order.entity';

export class UpdateSalesOrderStatusDto {
  @IsEnum(SalesOrderStatus, { message: '状态值不合法' })
  status: SalesOrderStatus;
}
