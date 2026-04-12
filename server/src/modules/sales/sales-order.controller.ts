import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SalesOrderService } from './sales-order.service';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { QuerySalesOrderDto } from './dto/query-sales-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SalesOrder } from '../../entities/sales-order.entity';

@Controller('sales-orders')
@UseGuards(JwtAuthGuard)
export class SalesOrderController {
  constructor(private readonly salesOrderService: SalesOrderService) {}

  @Post()
  async create(@Body() dto: CreateSalesOrderDto, @Request() req: any): Promise<SalesOrder> {
    return this.salesOrderService.create(dto, req.user.id);
  }

  @Get()
  async findAll(@Query() query: QuerySalesOrderDto) {
    return this.salesOrderService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<SalesOrder> {
    return this.salesOrderService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSalesOrderDto,
  ): Promise<SalesOrder> {
    return this.salesOrderService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.salesOrderService.remove(id);
  }
}
