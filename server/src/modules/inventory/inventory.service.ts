import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, IsNull } from 'typeorm';
import { Inventory } from '../../entities/inventory.entity';
import { InventoryLog, InventoryLogType } from '../../entities/inventory-log.entity';
import { Product } from '../../entities/product.entity';
import { QueryInventoryDto } from './dto/query-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { QueryInventoryLogDto } from './dto/query-inventory-log.dto';
import { PaginatedResponseDto } from '../../common/dto/response.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
    @InjectRepository(InventoryLog)
    private inventoryLogRepository: Repository<InventoryLog>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async findAll(query: QueryInventoryDto): Promise<PaginatedResponseDto<Inventory>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const qb = this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.product', 'product')
      .where('inventory.deletedAt IS NULL');

    if (query.productId) {
      qb.andWhere('inventory.productId = :productId', { productId: query.productId });
    }
    if (query.sku) {
      qb.andWhere('product.sku LIKE :sku', { sku: `%${query.sku}%` });
    }
    if (query.name) {
      qb.andWhere('product.name LIKE :name', { name: `%${query.name}%` });
    }

    qb.skip((page - 1) * pageSize).take(pageSize).orderBy('inventory.id', 'DESC');

    const [list, total] = await qb.getManyAndCount();
    return PaginatedResponseDto.create(list, total, page, pageSize);
  }

  async findOne(productId: number): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { productId, deletedAt: IsNull() },
      relations: ['product'],
    });

    if (!inventory) {
      throw new NotFoundException('库存记录不存在');
    }

    return inventory;
  }

  async getOrCreateInventory(productId: number): Promise<Inventory> {
    let inventory = await this.inventoryRepository.findOne({
      where: { productId, deletedAt: IsNull() },
    });

    if (!inventory) {
      const product = await this.productRepository.findOne({
        where: { id: productId },
      });

      if (!product) {
        throw new NotFoundException('商品不存在');
      }

      inventory = this.inventoryRepository.create({
        productId,
        quantity: 0,
        warningQuantity: 10,
      });
      await this.inventoryRepository.save(inventory);
    }

    return inventory;
  }

  async updateStock(dto: UpdateInventoryDto, userId: number): Promise<Inventory> {
    const product = await this.productRepository.findOne({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException('商品不存在');
    }

    const inventory = await this.getOrCreateInventory(dto.productId);
    const beforeQty = inventory.quantity;
    let afterQty = beforeQty;

    switch (dto.type) {
      case InventoryLogType.PURCHASE:
        afterQty = beforeQty + dto.quantity;
        break;
      case InventoryLogType.SALES:
        afterQty = beforeQty - dto.quantity;
        if (afterQty < 0) {
          throw new BadRequestException('库存不足');
        }
        break;
      case InventoryLogType.ADJUSTMENT:
        afterQty = dto.quantity;
        break;
    }

    inventory.quantity = afterQty;
    await this.inventoryRepository.save(inventory);

    const log = this.inventoryLogRepository.create({
      productId: dto.productId,
      type: dto.type,
      quantity: dto.type === InventoryLogType.ADJUSTMENT ? afterQty - beforeQty : dto.quantity,
      beforeQty,
      afterQty,
      remark: dto.remark,
      createdById: userId,
    });
    await this.inventoryLogRepository.save(log);

    return inventory;
  }

  async getLogs(query: QueryInventoryLogDto): Promise<PaginatedResponseDto<InventoryLog>> {
    const where: any = { deletedAt: IsNull() };

    if (query.productId) {
      where.productId = query.productId;
    }
    if (query.type) {
      where.type = query.type;
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const [list, total] = await this.inventoryLogRepository.findAndCount({
      where,
      relations: ['product', 'createdBy'],
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { id: 'DESC' },
    });

    return PaginatedResponseDto.create(list, total, page, pageSize);
  }

  async getLowStockProducts(): Promise<Inventory[]> {
    return this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.product', 'product')
      .where('inventory.quantity <= inventory.warningQuantity')
      .andWhere('inventory.deletedAt IS NULL')
      .getMany();
  }

  async remove(productId: number, userId: number): Promise<void> {
    const inventory = await this.inventoryRepository.findOne({
      where: { productId, deletedAt: IsNull() },
    });

    if (!inventory) {
      throw new NotFoundException('库存记录不存在');
    }

    inventory.deletedAt = new Date();
    inventory.deletedBy = userId;
    await this.inventoryRepository.save(inventory);
  }
}
