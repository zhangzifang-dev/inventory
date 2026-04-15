import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CouponType } from '../../../entities/coupon.entity';

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty({ message: '优惠券码不能为空' })
  code: string;

  @IsString()
  @IsNotEmpty({ message: '优惠券名称不能为空' })
  name: string;

  @IsEnum(CouponType)
  @IsOptional()
  type?: CouponType;

  @IsNumber()
  @IsOptional()
  minAmount?: number;

  @IsNumber()
  @IsNotEmpty({ message: '折扣值不能为空' })
  discountValue: number;

  @IsNumber()
  @IsOptional()
  totalCount?: number;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty({ message: '开始时间不能为空' })
  startTime: Date;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty({ message: '结束时间不能为空' })
  endTime: Date;

  @IsBoolean()
  @IsOptional()
  status?: boolean;
}
