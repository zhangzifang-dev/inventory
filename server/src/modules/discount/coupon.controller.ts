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
import { CouponService } from './coupon.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { QueryCouponDto } from './dto/query-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Coupon } from '../../entities/coupon.entity';

@Controller('coupons')
@UseGuards(JwtAuthGuard)
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Post()
  async create(@Body() dto: CreateCouponDto): Promise<Coupon> {
    return this.couponService.create(dto);
  }

  @Get()
  async findAll(@Query() query: QueryCouponDto) {
    return this.couponService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Coupon> {
    return this.couponService.findOne(id);
  }

  @Post('validate')
  async validate(@Body() dto: ValidateCouponDto) {
    return this.couponService.validateCoupon(dto);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCouponDto,
  ): Promise<Coupon> {
    return this.couponService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any): Promise<void> {
    const userId = req.user?.id;
    return this.couponService.remove(id, userId);
  }
}
