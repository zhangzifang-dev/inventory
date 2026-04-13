import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ description: 'SKU', example: 'PHONE001' })
  @IsString()
  @IsNotEmpty({ message: 'SKU不能为空' })
  sku: string;

  @ApiProperty({ description: '商品名称', example: 'iPhone 15 Pro' })
  @IsString()
  @IsNotEmpty({ message: '商品名称不能为空' })
  name: string;

  @ApiProperty({ description: '分类ID', example: 1 })
  @IsNumber()
  @IsNotEmpty({ message: '分类ID不能为空' })
  categoryId: number;

  @ApiPropertyOptional({ description: '规格', example: '256GB 深空黑' })
  @IsString()
  @IsOptional()
  spec?: string;

  @ApiProperty({ description: '单位', example: '台' })
  @IsString()
  @IsNotEmpty({ message: '单位不能为空' })
  unit: string;

  @ApiPropertyOptional({ description: '成本价', example: 7999.00 })
  @IsNumber()
  @IsOptional()
  costPrice?: number;

  @ApiProperty({ description: '销售价格', example: 8999.00 })
  @IsNumber()
  @IsNotEmpty({ message: '销售价格不能为空' })
  salePrice: number;

  @ApiPropertyOptional({ description: '条码', example: '6901234567001' })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiPropertyOptional({ description: '描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '状态', default: true })
  @IsBoolean()
  @IsOptional()
  status?: boolean;
}
