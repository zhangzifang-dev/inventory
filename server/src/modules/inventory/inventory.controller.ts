import { Controller, Get, Post, Body, Param, Query, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { QueryInventoryDto } from './dto/query-inventory.dto';
import { QueryInventoryLogDto } from './dto/query-inventory-log.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('库存管理')
@ApiBearerAuth('JWT-auth')
@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: '获取库存列表' })
  async findAll(@Query() query: QueryInventoryDto) {
    return this.inventoryService.findAll(query);
  }

  @Get('low-stock')
  @ApiOperation({ summary: '获取库存预警列表' })
  async findLowStock() {
    return this.inventoryService.getLowStockProducts();
  }

  @Get('logs')
  @ApiOperation({ summary: '获取库存变动日志' })
  async findLogs(@Query() query: QueryInventoryLogDto) {
    return this.inventoryService.getLogs(query);
  }

  @Get(':productId')
  @ApiOperation({ summary: '获取商品库存详情' })
  async findOne(@Param('productId', ParseIntPipe) productId: number) {
    return this.inventoryService.findOne(productId);
  }

  @Post('update')
  @ApiOperation({ summary: '更新库存' })
  async update(@Body() dto: UpdateInventoryDto, @Request() req: any) {
    return this.inventoryService.updateStock(dto, req.user.id);
  }
}
