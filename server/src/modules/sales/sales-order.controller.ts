import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { SalesOrderService } from './sales-order.service';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { UpdateSalesOrderStatusDto } from './dto/update-sales-order-status.dto';
import { QuerySalesOrderDto } from './dto/query-sales-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('销售订单')
@ApiBearerAuth('JWT-auth')
@Controller('sales-orders')
@UseGuards(JwtAuthGuard)
export class SalesOrderController {
  constructor(private readonly salesOrderService: SalesOrderService) {}

  @Post()
  @ApiOperation({ summary: '创建销售订单' })
  async create(@Body() dto: CreateSalesOrderDto, @Request() req: any) {
    return this.salesOrderService.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: '获取销售订单列表' })
  async findAll(@Query() query: QuerySalesOrderDto) {
    return this.salesOrderService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取销售订单详情' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.salesOrderService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新销售订单' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSalesOrderDto) {
    return this.salesOrderService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除销售订单' })
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.salesOrderService.remove(id, req.user.id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: '更新销售订单状态' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSalesOrderStatusDto,
    @Request() req: any,
  ) {
    const order = await this.salesOrderService.findOne(id);
    if (order.createdById !== req.user.id) {
      const user = req.user;
      const isAdmin = user.roles?.some((role: any) => role.code === 'admin');
      if (!isAdmin) {
        throw new BadRequestException('无权限操作此订单');
      }
    }
    return this.salesOrderService.updateStatus(id, dto, req.user.id);
  }
}
