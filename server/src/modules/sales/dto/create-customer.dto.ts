import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ description: '客户名称', example: '测试客户A' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: '电话', example: '13900139001' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ description: '地址', example: '北京市海淀区' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @ApiPropertyOptional({ description: '客户等级ID' })
  @IsOptional()
  @IsNumber()
  levelId?: number;

  @ApiPropertyOptional({ description: '状态', default: true })
  @IsOptional()
  @IsBoolean()
  status?: boolean;
}
