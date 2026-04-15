import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Like, IsNull } from 'typeorm';
import { SalesOrder, SalesOrderStatus } from '../../entities/sales-order.entity';
import { SalesOrderItem } from '../../entities/sales-order-item.entity';
import { Product } from '../../entities/product.entity';
import { Customer } from '../../entities/customer.entity';
import { CustomerLevel } from '../../entities/customer-level.entity';
import { Inventory } from '../../entities/inventory.entity';
import { InventoryLog, InventoryLogType } from '../../entities/inventory-log.entity';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { UpdateSalesOrderStatusDto } from './dto/update-sales-order-status.dto';
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
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
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

    // 检查库存
    for (const itemDto of dto.items) {
      const inventory = await this.inventoryRepository.findOne({
        where: { productId: itemDto.productId, deletedAt: IsNull() },
      });
      const currentStock = inventory?.quantity || 0;
      if (itemDto.quantity > currentStock) {
        const product = await this.productRepository.findOne({ where: { id: itemDto.productId } });
        throw new BadRequestException(`商品"${product?.name || itemDto.productId}"库存不足，当前库存: ${currentStock}`);
      }
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

  async updateStatus(id: number, dto: UpdateSalesOrderStatusDto, userId: number): Promise<SalesOrder> {
    const order = await this.salesOrderRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['items', 'items.product'],
    });

    if (!order) {
      throw new NotFoundException('销售订单不存在');
    }

    if (order.status === SalesOrderStatus.COMPLETED) {
      throw new BadRequestException('订单已完成，无法修改状态');
    }

    if (order.status === SalesOrderStatus.CANCELLED) {
      throw new BadRequestException('订单已取消，无法修改状态');
    }

    if (dto.status === SalesOrderStatus.COMPLETED) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        for (const item of order.items) {
          const inventory = await queryRunner.manager.findOne(Inventory, {
            where: { productId: item.productId, deletedAt: IsNull() },
          });

          if (!inventory || inventory.quantity < Number(item.quantity)) {
            throw new BadRequestException(
              `商品【${item.product.name}】库存不足，当前库存：${inventory?.quantity || 0}，需要：${item.quantity}`
            );
          }
        }

        for (const item of order.items) {
          await queryRunner.manager.decrement(
            Inventory,
            { productId: item.productId },
            'quantity',
            Number(item.quantity)
          );

          const inventory = await queryRunner.manager.findOne(Inventory, {
            where: { productId: item.productId },
          });

          if (!inventory) {
            throw new BadRequestException(`商品库存记录不存在`);
          }

          const log = queryRunner.manager.create(InventoryLog, {
            productId: item.productId,
            type: InventoryLogType.SALES,
            quantity: Number(item.quantity),
            beforeQty: Number(inventory.quantity) + Number(item.quantity),
            afterQty: Number(inventory.quantity),
            orderId: order.id,
            remark: `销售订单 ${order.orderNo}`,
            createdById: userId,
          });
          await queryRunner.manager.save(log);
        }

        order.status = dto.status;
        await queryRunner.manager.save(order);

        await queryRunner.commitTransaction();
      } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
      } finally {
        await queryRunner.release();
      }
    } else {
      order.status = dto.status;
      await this.salesOrderRepository.save(order);
    }

    return this.findOne(id);
  }
}
