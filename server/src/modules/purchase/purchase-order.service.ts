import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Like } from 'typeorm';
import { PurchaseOrder, PurchaseOrderStatus } from '../../entities/purchase-order.entity';
import { PurchaseOrderItem } from '../../entities/purchase-order-item.entity';
import { Product } from '../../entities/product.entity';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { QueryPurchaseOrderDto } from './dto/query-purchase-order.dto';
import { PaginatedResponseDto } from '../../common/dto/response.dto';

@Injectable()
export class PurchaseOrderService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private purchaseOrderRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private purchaseOrderItemRepository: Repository<PurchaseOrderItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private dataSource: DataSource,
  ) {}

  private generateOrderNo(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PO${year}${month}${day}${random}`;
  }

  async create(dto: CreatePurchaseOrderDto, userId: number): Promise<PurchaseOrder> {
    const supplier = await this.dataSource.getRepository('Supplier').findOne({
      where: { id: dto.supplierId },
    });

    if (!supplier) {
      throw new BadRequestException('供应商不存在');
    }

    let totalAmount = 0;
    const items: PurchaseOrderItem[] = [];

    for (const itemDto of dto.items) {
      const product = await this.productRepository.findOne({
        where: { id: itemDto.productId },
      });

      if (!product) {
        throw new BadRequestException(`商品ID ${itemDto.productId} 不存在`);
      }

      const amount = Number(itemDto.quantity) * Number(itemDto.unitPrice);
      totalAmount += amount;

      const item = this.purchaseOrderItemRepository.create({
        productId: itemDto.productId,
        quantity: itemDto.quantity,
        unitPrice: itemDto.unitPrice,
        amount,
      });
      items.push(item);
    }

    const order = this.purchaseOrderRepository.create({
      orderNo: this.generateOrderNo(),
      supplierId: dto.supplierId,
      totalAmount,
      status: dto.status || PurchaseOrderStatus.DRAFT,
      remark: dto.remark,
      createdById: userId,
      items,
    });

    return this.purchaseOrderRepository.save(order);
  }

  async findAll(query: QueryPurchaseOrderDto): Promise<PaginatedResponseDto<PurchaseOrder>> {
    const where: any = {};
    
    if (query.orderNo) {
      where.orderNo = Like(`%${query.orderNo}%`);
    }
    if (query.supplierId) {
      where.supplierId = query.supplierId;
    }
    if (query.status) {
      where.status = query.status;
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const [list, total] = await this.purchaseOrderRepository.findAndCount({
      where,
      relations: ['supplier', 'items', 'items.product', 'createdBy'],
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { id: 'DESC' },
    });

    return PaginatedResponseDto.create(list, total, page, pageSize);
  }

  async findOne(id: number): Promise<PurchaseOrder> {
    const order = await this.purchaseOrderRepository.findOne({
      where: { id },
      relations: ['supplier', 'items', 'items.product', 'createdBy'],
    });

    if (!order) {
      throw new NotFoundException('采购订单不存在');
    }

    return order;
  }

  async update(id: number, dto: UpdatePurchaseOrderDto): Promise<PurchaseOrder> {
    const order = await this.purchaseOrderRepository.findOne({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('采购订单不存在');
    }

    Object.assign(order, dto);
    return this.purchaseOrderRepository.save(order);
  }

  async remove(id: number): Promise<void> {
    const order = await this.purchaseOrderRepository.findOne({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('采购订单不存在');
    }

    await this.purchaseOrderRepository.remove(order);
  }
}
