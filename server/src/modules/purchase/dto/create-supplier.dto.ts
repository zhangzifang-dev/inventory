import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty({ message: '供应商名称不能为空' })
  name: string;

  @IsString()
  @IsOptional()
  contact?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsBoolean()
  @IsOptional()
  status?: boolean;
}
