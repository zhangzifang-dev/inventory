import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'SKU不能为空' })
  sku: string;

  @IsString()
  @IsNotEmpty({ message: '商品名称不能为空' })
  name: string;

  @IsNumber()
  @IsNotEmpty({ message: '分类ID不能为空' })
  categoryId: number;

  @IsString()
  @IsOptional()
  spec?: string;

  @IsString()
  @IsNotEmpty({ message: '单位不能为空' })
  unit: string;

  @IsNumber()
  @IsOptional()
  costPrice?: number;

  @IsNumber()
  @IsNotEmpty({ message: '销售价格不能为空' })
  salePrice: number;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  status?: boolean;
}
