import { IsOptional, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { InventoryLogType } from '../../../entities/inventory-log.entity';

export class QueryInventoryLogDto extends PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  productId?: number;

  @IsOptional()
  @IsEnum(InventoryLogType)
  type?: InventoryLogType;
}
