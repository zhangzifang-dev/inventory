import {
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PurchaseOrderStatus } from '../../../entities/purchase-order.entity';
import { CreatePurchaseOrderItemDto } from './create-purchase-order-item.dto';

export class CreatePurchaseOrderDto {
  @IsNumber()
  @IsNotEmpty({ message: '供应商ID不能为空' })
  supplierId: number;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsEnum(PurchaseOrderStatus)
  status?: PurchaseOrderStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderItemDto)
  items: CreatePurchaseOrderItemDto[];
}
