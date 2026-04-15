import {
  IsNumber,
  IsNotEmpty,
} from 'class-validator';

export class CreatePurchaseOrderItemDto {
  @IsNumber()
  @IsNotEmpty({ message: '商品ID不能为空' })
  productId: number;

  @IsNumber()
  @IsNotEmpty({ message: '数量不能为空' })
  quantity: number;

  @IsNumber()
  @IsNotEmpty({ message: '单价不能为空' })
  unitPrice: number;
}
