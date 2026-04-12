import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Coupon, CouponType } from '../../entities/coupon.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { QueryCouponDto } from './dto/query-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { PaginatedResponseDto } from '../../common/dto/response.dto';

@Injectable()
export class CouponService {
  constructor(
    @InjectRepository(Coupon)
    private couponRepository: Repository<Coupon>,
  ) {}

  async create(dto: CreateCouponDto): Promise<Coupon> {
    const existingCoupon = await this.couponRepository.findOne({
      where: { code: dto.code },
    });

    if (existingCoupon) {
      throw new BadRequestException('优惠券码已存在');
    }

    const coupon = this.couponRepository.create(dto);
    return this.couponRepository.save(coupon);
  }

  async findAll(query: QueryCouponDto): Promise<PaginatedResponseDto<Coupon>> {
    const where: any = {};

    if (query.code) {
      where.code = Like(`%${query.code}%`);
    }
    if (query.name) {
      where.name = Like(`%${query.name}%`);
    }
    if (query.status !== undefined) {
      where.status = query.status;
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const [list, total] = await this.couponRepository.findAndCount({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { id: 'DESC' },
    });

    return PaginatedResponseDto.create(list, total, page, pageSize);
  }

  async findOne(id: number): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({
      where: { id },
    });

    if (!coupon) {
      throw new NotFoundException('优惠券不存在');
    }

    return coupon;
  }

  async update(id: number, dto: UpdateCouponDto): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({
      where: { id },
    });

    if (!coupon) {
      throw new NotFoundException('优惠券不存在');
    }

    if (dto.code && dto.code !== coupon.code) {
      const existingCoupon = await this.couponRepository.findOne({
        where: { code: dto.code },
      });
      if (existingCoupon) {
        throw new BadRequestException('优惠券码已存在');
      }
    }

    Object.assign(coupon, dto);
    return this.couponRepository.save(coupon);
  }

  async remove(id: number): Promise<void> {
    const coupon = await this.couponRepository.findOne({
      where: { id },
    });

    if (!coupon) {
      throw new NotFoundException('优惠券不存在');
    }

    await this.couponRepository.remove(coupon);
  }

  async validateCoupon(dto: ValidateCouponDto): Promise<{ valid: boolean; discountAmount: number; message: string; coupon?: Coupon }> {
    const coupon = await this.couponRepository.findOne({
      where: { code: dto.code },
    });

    if (!coupon) {
      return { valid: false, discountAmount: 0, message: '优惠券不存在' };
    }

    if (!coupon.status) {
      return { valid: false, discountAmount: 0, message: '优惠券已禁用' };
    }

    const now = new Date();
    if (now < coupon.startTime) {
      return { valid: false, discountAmount: 0, message: '优惠券尚未生效' };
    }
    if (now > coupon.endTime) {
      return { valid: false, discountAmount: 0, message: '优惠券已过期' };
    }

    if (coupon.totalCount > 0 && coupon.usedCount >= coupon.totalCount) {
      return { valid: false, discountAmount: 0, message: '优惠券已用完' };
    }

    if (dto.orderAmount < coupon.minAmount) {
      return { valid: false, discountAmount: 0, message: `订单金额需满${coupon.minAmount}元` };
    }

    let discountAmount = 0;
    switch (coupon.type) {
      case CouponType.FULL_REDUCTION:
      case CouponType.CASH:
        discountAmount = Number(coupon.discountValue);
        break;
      case CouponType.DISCOUNT:
        discountAmount = dto.orderAmount * (1 - Number(coupon.discountValue) / 100);
        break;
    }

    return { valid: true, discountAmount, message: '优惠券可用', coupon };
  }

  async useCoupon(id: number): Promise<void> {
    await this.couponRepository.increment({ id }, 'usedCount', 1);
  }
}
