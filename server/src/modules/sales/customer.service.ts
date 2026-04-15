import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, IsNull } from 'typeorm';
import { Customer } from '../../entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { PaginatedResponseDto } from '../../common/dto/response.dto';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  async create(dto: CreateCustomerDto): Promise<Customer> {
    const customer = this.customerRepository.create(dto);
    return this.customerRepository.save(customer);
  }

  async findAll(query: QueryCustomerDto): Promise<PaginatedResponseDto<Customer>> {
    const where: any = { deletedAt: IsNull() };
    
    if (query.name) {
      where.name = Like(`%${query.name}%`);
    }
    if (query.phone) {
      where.phone = Like(`%${query.phone}%`);
    }
    if (query.levelId) {
      where.levelId = query.levelId;
    }
    if (query.status !== undefined) {
      where.status = query.status;
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const [list, total] = await this.customerRepository.findAndCount({
      where,
      relations: ['level'],
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { id: 'DESC' },
    });

    return PaginatedResponseDto.create(list, total, page, pageSize);
  }

  async findOne(id: number): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['level'],
    });

    if (!customer) {
      throw new NotFoundException('客户不存在');
    }

    return customer;
  }

  async update(id: number, dto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!customer) {
      throw new NotFoundException('客户不存在');
    }

    Object.assign(customer, dto);
    return this.customerRepository.save(customer);
  }

  async remove(id: number, userId: number): Promise<void> {
    const customer = await this.customerRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!customer) {
      throw new NotFoundException('客户不存在');
    }

    customer.deletedAt = new Date();
    customer.deletedBy = userId;
    await this.customerRepository.save(customer);
  }

  async updateTotalAmount(id: number, amount: number): Promise<void> {
    await this.customerRepository.increment({ id }, 'totalAmount', amount);
  }
}
