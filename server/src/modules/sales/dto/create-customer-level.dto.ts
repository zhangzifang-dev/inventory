import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class CreateCustomerLevelDto {
  @IsString()
  @IsNotEmpty({ message: '等级名称不能为空' })
  name: string;

  @IsNumber()
  @IsNotEmpty({ message: '最低金额不能为空' })
  minAmount: number;

  @IsNumber()
  @IsNotEmpty({ message: '折扣百分比不能为空' })
  discountPercent: number;

  @IsNumber()
  @IsOptional()
  level?: number;
}
