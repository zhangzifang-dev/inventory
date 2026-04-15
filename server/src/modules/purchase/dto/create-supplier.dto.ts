import { IsString, IsNotEmpty, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSupplierDto {
  @ApiProperty({ description: '供应商名称', example: '深圳科技有限公司' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: '联系人', example: '张经理' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  contact?: string;

  @ApiPropertyOptional({ description: '电话', example: '13800138001' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ description: '地址', example: '深圳市南山区科技园' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @ApiPropertyOptional({ description: '状态', default: true })
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}
