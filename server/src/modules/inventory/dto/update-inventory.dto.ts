import { IsNumber, IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { InventoryLogType } from '../../../entities/inventory-log.entity';

export class UpdateInventoryDto {
  @IsNumber()
  @IsNotEmpty({ message: '商品ID不能为空' })
  productId: number;

  @IsNumber()
  @IsNotEmpty({ message: '数量不能为空' })
  quantity: number;

  @IsEnum(InventoryLogType)
  @IsNotEmpty({ message: '类型不能为空' })
  type: InventoryLogType;

  @IsString()
  @IsOptional()
  remark?: string;
}
