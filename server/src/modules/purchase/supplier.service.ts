import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Supplier } from '../../entities/supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { QuerySupplierDto } from './dto/query-supplier.dto';
import { PaginatedResponseDto } from '../../common/dto/response.dto';

@Injectable()
export class SupplierService {
  constructor(
    @InjectRepository(Supplier)
    private supplierRepository: Repository<Supplier>,
  ) {}

  async create(dto: CreateSupplierDto): Promise<Supplier> {
    const supplier = this.supplierRepository.create(dto);
    return this.supplierRepository.save(supplier);
  }

  async findAll(query: QuerySupplierDto): Promise<PaginatedResponseDto<Supplier>> {
    const where: any = {};
    
    if (query.name) {
      where.name = Like(`%${query.name}%`);
    }
    if (query.phone) {
      where.phone = Like(`%${query.phone}%`);
    }
    if (query.status !== undefined) {
      where.status = query.status;
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const [list, total] = await this.supplierRepository.findAndCount({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { id: 'DESC' },
    });

    return PaginatedResponseDto.create(list, total, page, pageSize);
  }

  async findOne(id: number): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne({
      where: { id },
    });

    if (!supplier) {
      throw new NotFoundException('供应商不存在');
    }

    return supplier;
  }

  async update(id: number, dto: UpdateSupplierDto): Promise<Supplier> {
    const supplier = await this.supplierRepository.findOne({
      where: { id },
    });

    if (!supplier) {
      throw new NotFoundException('供应商不存在');
    }

    Object.assign(supplier, dto);
    return this.supplierRepository.save(supplier);
  }

  async remove(id: number): Promise<void> {
    const supplier = await this.supplierRepository.findOne({
      where: { id },
    });

    if (!supplier) {
      throw new NotFoundException('供应商不存在');
    }

    await this.supplierRepository.remove(supplier);
  }
}
