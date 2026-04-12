import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
} from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty({ message: '客户名称不能为空' })
  name: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsNumber()
  @IsOptional()
  levelId?: number;

  @IsBoolean()
  @IsOptional()
  status?: boolean;
}
