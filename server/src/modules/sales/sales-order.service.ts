import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Like, IsNull } from 'typeorm';
import { SalesOrder, SalesOrderStatus } from '../../entities/sales-order.entity';
import { SalesOrderItem } from '../../entities/sales-order-item.entity';
import { Product } from '../../entities/product.entity';
import { Customer } from '../../entities/customer.entity';
import { CustomerLevel } from '../../entities/customer-level.entity';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { QuerySalesOrderDto } from './dto/query-sales-order.dto';
import { PaginatedResponseDto } from '../../common/dto/response.dto';

@Injectable()
export class SalesOrderService {
  constructor(
    @InjectRepository(SalesOrder)
    private salesOrderRepository: Repository<SalesOrder>,
    @InjectRepository(SalesOrderItem)
    private salesOrderItemRepository: Repository<SalesOrderItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(CustomerLevel)
    private customerLevelRepository: Repository<CustomerLevel>,
    private dataSource: DataSource,
  ) {}

  private generateOrderNo(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `SO${year}${month}${day}${random}`;
  }

  async create(dto: CreateSalesOrderDto, userId: number): Promise<SalesOrder> {
    const customer = await this.customerRepository.findOne({
      where: { id: dto.customerId },
      relations: ['level'],
    });

    if (!customer) {
      throw new BadRequestException('客户不存在');
    }

    let totalAmount = 0;
    let totalDiscountAmount = 0;
    const items: SalesOrderItem[] = [];

    for (const itemDto of dto.items) {
      const product = await this.productRepository.findOne({
        where: { id: itemDto.productId },
      });

      if (!product) {
        throw new BadRequestException(`商品ID ${itemDto.productId} 不存在`);
      }

      const itemTotal = Number(itemDto.quantity) * Number(itemDto.unitPrice);
      const discountRate = itemDto.discountRate || 0;
      const itemDiscount = itemTotal * (discountRate / 100);
      const amount = itemTotal - itemDiscount;

      totalAmount += itemTotal;
      totalDiscountAmount += itemDiscount;

      const item = this.salesOrderItemRepository.create({
        productId: itemDto.productId,
        quantity: itemDto.quantity,
        unitPrice: itemDto.unitPrice,
        discountRate,
        discountAmount: itemDiscount,
        amount,
      });
      items.push(item);
    }

    let customerDiscount = 0;
    if (customer.level) {
      customerDiscount = totalAmount * (Number(customer.level.discountPercent) / 100);
    }

    const couponDiscount = dto.couponDiscount || 0;
    const finalAmount = totalAmount - totalDiscountAmount - customerDiscount - couponDiscount;

    const order = this.salesOrderRepository.create({
      orderNo: this.generateOrderNo(),
      customerId: dto.customerId,
      totalAmount,
      discountAmount: totalDiscountAmount + customerDiscount,
      couponDiscount,
      finalAmount,
      status: dto.status || SalesOrderStatus.DRAFT,
      createdById: userId,
      items,
    });

    return this.salesOrderRepository.save(order);
  }

  async findAll(query: QuerySalesOrderDto): Promise<PaginatedResponseDto<SalesOrder>> {
    const where: any = { deletedAt: IsNull() };
    
    if (query.orderNo) {
      where.orderNo = Like(`%${query.orderNo}%`);
    }
    if (query.customerId) {
      where.customerId = query.customerId;
    }
    if (query.status) {
      where.status = query.status;
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const [list, total] = await this.salesOrderRepository.findAndCount({
      where,
      relations: ['customer', 'customer.level', 'items', 'items.product', 'createdBy'],
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { id: 'DESC' },
    });

    return PaginatedResponseDto.create(list, total, page, pageSize);
  }

  async findOne(id: number): Promise<SalesOrder> {
    const order = await this.salesOrderRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['customer', 'customer.level', 'items', 'items.product', 'createdBy'],
    });

    if (!order) {
      throw new NotFoundException('销售订单不存在');
    }

    return order;
  }

  async update(id: number, dto: UpdateSalesOrderDto): Promise<SalesOrder> {
    const order = await this.salesOrderRepository.findOne({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('销售订单不存在');
    }

    Object.assign(order, dto);
    return this.salesOrderRepository.save(order);
  }

  async remove(id: number, userId: number): Promise<void> {
    const order = await this.salesOrderRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!order) {
      throw new NotFoundException('销售订单不存在');
    }

    order.deletedAt = new Date();
    order.deletedBy = userId;
    await this.salesOrderRepository.save(order);
  }
}
