import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscountController } from './discount.controller';
import { DiscountService } from './discount.service';
import { CouponController } from './coupon.controller';
import { CouponService } from './coupon.service';
import { Discount } from '../../entities/discount.entity';
import { Coupon } from '../../entities/coupon.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Discount, Coupon])],
  controllers: [DiscountController, CouponController],
  providers: [DiscountService, CouponService],
  exports: [DiscountService, CouponService],
})
export class DiscountModule {}
