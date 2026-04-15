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
  Req,
} from '@nestjs/common';
import { DiscountService } from './discount.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { QueryDiscountDto } from './dto/query-discount.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Discount } from '../../entities/discount.entity';

@Controller('discounts')
@UseGuards(JwtAuthGuard)
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  @Post()
  async create(@Body() dto: CreateDiscountDto): Promise<Discount> {
    return this.discountService.create(dto);
  }

  @Get()
  async findAll(@Query() query: QueryDiscountDto) {
    return this.discountService.findAll(query);
  }

  @Get('active')
  async getActive(): Promise<Discount[]> {
    return this.discountService.getActiveDiscounts();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Discount> {
    return this.discountService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDiscountDto,
  ): Promise<Discount> {
    return this.discountService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any): Promise<void> {
    const userId = req.user?.id;
    return this.discountService.remove(id, userId);
  }
}
