import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { QueryInventoryDto } from './dto/query-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { QueryInventoryLogDto } from './dto/query-inventory-log.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Inventory } from '../../entities/inventory.entity';
import { InventoryLog } from '../../entities/inventory-log.entity';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  async findAll(@Query() query: QueryInventoryDto) {
    return this.inventoryService.findAll(query);
  }

  @Get('low-stock')
  async getLowStock(): Promise<Inventory[]> {
    return this.inventoryService.getLowStockProducts();
  }

  @Get('logs')
  async getLogs(@Query() query: QueryInventoryLogDto) {
    return this.inventoryService.getLogs(query);
  }

  @Get(':productId')
  async findOne(@Param('productId', ParseIntPipe) productId: number): Promise<Inventory> {
    return this.inventoryService.findOne(productId);
  }

  @Post('update')
  async updateStock(
    @Body() dto: UpdateInventoryDto,
    @Request() req: any,
  ): Promise<Inventory> {
    return this.inventoryService.updateStock(dto, req.user.id);
  }
}
