import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class ValidateCouponDto {
  @IsString()
  @IsNotEmpty({ message: '优惠券码不能为空' })
  code: string;

  @IsNumber()
  @IsNotEmpty({ message: '订单金额不能为空' })
  orderAmount: number;
}
