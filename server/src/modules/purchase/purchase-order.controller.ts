import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { QueryPurchaseOrderDto } from './dto/query-purchase-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('采购订单')
@ApiBearerAuth('JWT-auth')
@Controller('purchase-orders')
@UseGuards(JwtAuthGuard)
export class PurchaseOrderController {
  constructor(private readonly purchaseOrderService: PurchaseOrderService) {}

  @Post()
  @ApiOperation({ summary: '创建采购订单' })
  async create(@Body() dto: CreatePurchaseOrderDto, @Request() req: any) {
    return this.purchaseOrderService.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: '获取采购订单列表' })
  async findAll(@Query() query: QueryPurchaseOrderDto) {
    return this.purchaseOrderService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取采购订单详情' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.purchaseOrderService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新采购订单' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePurchaseOrderDto) {
    return this.purchaseOrderService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除采购订单' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.purchaseOrderService.remove(id);
  }
}
