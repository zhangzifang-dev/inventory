import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateSalesOrderDto } from './create-sales-order.dto';

export class UpdateSalesOrderDto extends PartialType(
  OmitType(CreateSalesOrderDto, ['items'] as const),
) {}
