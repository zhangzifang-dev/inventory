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
import { DiscountType, DiscountScope } from '../../../entities/discount.entity';

export class CreateDiscountDto {
  @IsString()
  @IsNotEmpty({ message: '折扣名称不能为空' })
  name: string;

  @IsEnum(DiscountScope)
  @IsOptional()
  scope?: DiscountScope;

  @IsEnum(DiscountType)
  @IsOptional()
  discountType?: DiscountType;

  @IsNumber()
  @IsNotEmpty({ message: '折扣值不能为空' })
  discountValue: number;

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
