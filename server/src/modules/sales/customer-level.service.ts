import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { CustomerLevel } from '../../entities/customer-level.entity';
import { CreateCustomerLevelDto } from './dto/create-customer-level.dto';
import { UpdateCustomerLevelDto } from './dto/update-customer-level.dto';

@Injectable()
export class CustomerLevelService {
  constructor(
    @InjectRepository(CustomerLevel)
    private customerLevelRepository: Repository<CustomerLevel>,
  ) {}

  async create(dto: CreateCustomerLevelDto): Promise<CustomerLevel> {
    const level = this.customerLevelRepository.create(dto);
    return this.customerLevelRepository.save(level);
  }

  async findAll(): Promise<CustomerLevel[]> {
    return this.customerLevelRepository.find({
      where: { deletedAt: IsNull() },
      order: { level: 'ASC' },
    });
  }

  async findOne(id: number): Promise<CustomerLevel> {
    const level = await this.customerLevelRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!level) {
      throw new NotFoundException('客户等级不存在');
    }

    return level;
  }

  async update(id: number, dto: UpdateCustomerLevelDto): Promise<CustomerLevel> {
    const level = await this.customerLevelRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!level) {
      throw new NotFoundException('客户等级不存在');
    }

    Object.assign(level, dto);
    return this.customerLevelRepository.save(level);
  }

  async remove(id: number, userId: number): Promise<void> {
    const level = await this.customerLevelRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!level) {
      throw new NotFoundException('客户等级不存在');
    }

    await this.customerLevelRepository.update(id, {
      deletedAt: new Date(),
      deletedBy: userId,
    });
  }
}
