import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Discount } from '../../entities/discount.entity';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { QueryDiscountDto } from './dto/query-discount.dto';
import { PaginatedResponseDto } from '../../common/dto/response.dto';

@Injectable()
export class DiscountService {
  constructor(
    @InjectRepository(Discount)
    private discountRepository: Repository<Discount>,
  ) {}

  async create(dto: CreateDiscountDto): Promise<Discount> {
    const discount = this.discountRepository.create(dto);
    return this.discountRepository.save(discount);
  }

  async findAll(query: QueryDiscountDto): Promise<PaginatedResponseDto<Discount>> {
    const where: any = {};

    if (query.name) {
      where.name = Like(`%${query.name}%`);
    }
    if (query.status !== undefined) {
      where.status = query.status;
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const [list, total] = await this.discountRepository.findAndCount({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { id: 'DESC' },
    });

    return PaginatedResponseDto.create(list, total, page, pageSize);
  }

  async findOne(id: number): Promise<Discount> {
    const discount = await this.discountRepository.findOne({
      where: { id },
    });

    if (!discount) {
      throw new NotFoundException('折扣活动不存在');
    }

    return discount;
  }

  async update(id: number, dto: UpdateDiscountDto): Promise<Discount> {
    const discount = await this.discountRepository.findOne({
      where: { id },
    });

    if (!discount) {
      throw new NotFoundException('折扣活动不存在');
    }

    Object.assign(discount, dto);
    return this.discountRepository.save(discount);
  }

  async remove(id: number): Promise<void> {
    const discount = await this.discountRepository.findOne({
      where: { id },
    });

    if (!discount) {
      throw new NotFoundException('折扣活动不存在');
    }

    await this.discountRepository.remove(discount);
  }

  async getActiveDiscounts(): Promise<Discount[]> {
    const now = new Date();
    return this.discountRepository.find({
      where: {
        status: true,
      },
    });
  }
}
