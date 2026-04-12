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
import { PurchaseOrderService } from './purchase-order.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { QueryPurchaseOrderDto } from './dto/query-purchase-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PurchaseOrder } from '../../entities/purchase-order.entity';

@Controller('purchase-orders')
@UseGuards(JwtAuthGuard)
export class PurchaseOrderController {
  constructor(private readonly purchaseOrderService: PurchaseOrderService) {}

  @Post()
  async create(@Body() dto: CreatePurchaseOrderDto, @Request() req: any): Promise<PurchaseOrder> {
    return this.purchaseOrderService.create(dto, req.user.id);
  }

  @Get()
  async findAll(@Query() query: QueryPurchaseOrderDto) {
    return this.purchaseOrderService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<PurchaseOrder> {
    return this.purchaseOrderService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePurchaseOrderDto,
  ): Promise<PurchaseOrder> {
    return this.purchaseOrderService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.purchaseOrderService.remove(id);
  }
}
