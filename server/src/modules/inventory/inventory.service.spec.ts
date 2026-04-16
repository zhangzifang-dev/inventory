import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { Inventory } from '../../entities/inventory.entity';
import { InventoryLog, InventoryLogType } from '../../entities/inventory-log.entity';
import { Product } from '../../entities/product.entity';
import { createMockRepository } from '../../common/test/mock-repository';
import { QueryInventoryDto } from './dto/query-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { QueryInventoryLogDto } from './dto/query-inventory-log.dto';

describe('InventoryService', () => {
  let service: InventoryService;
  let inventoryRepository: ReturnType<typeof createMockRepository<Inventory>>;
  let inventoryLogRepository: ReturnType<typeof createMockRepository<InventoryLog>>;
  let productRepository: ReturnType<typeof createMockRepository<Product>>;

  const mockProduct: Product = {
    id: 1,
    name: 'Test Product',
    sku: 'SKU001',
    categoryId: 1,
    spec: '100g',
    unit: 'box',
    costPrice: 50,
    salePrice: 100,
    barcode: '123456',
    description: 'Test description',
    status: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    deletedBy: null,
    category: {} as any,
  } as unknown as Product;

  const mockInventory: Inventory = {
    id: 1,
    productId: 1,
    quantity: 100,
    warningQuantity: 10,
    updatedAt: new Date(),
    deletedAt: null,
    deletedBy: null,
    product: mockProduct,
  } as unknown as Inventory;

  const mockInventoryLog: InventoryLog = {
    id: 1,
    productId: 1,
    type: InventoryLogType.PURCHASE,
    quantity: 50,
    beforeQty: 50,
    afterQty: 100,
    orderId: null,
    remark: 'Test log',
    createdById: 1,
    createdAt: new Date(),
    deletedAt: null,
    deletedBy: null,
    product: mockProduct,
    createdBy: {} as any,
  } as unknown as InventoryLog;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getMany: jest.fn(),
  };

  beforeEach(async () => {
    inventoryRepository = createMockRepository<Inventory>();
    inventoryLogRepository = createMockRepository<InventoryLog>();
    productRepository = createMockRepository<Product>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: getRepositoryToken(Inventory),
          useValue: inventoryRepository,
        },
        {
          provide: getRepositoryToken(InventoryLog),
          useValue: inventoryLogRepository,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: productRepository,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated inventory list', async () => {
      const query: QueryInventoryDto = { page: 1, pageSize: 20 };
      const inventories = [mockInventory];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([inventories, 1]);
      inventoryRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAll(query);

      expect(result.list).toEqual(inventories);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('should filter by productId', async () => {
      const query: QueryInventoryDto = { page: 1, pageSize: 20, productId: 1 };
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockInventory], 1]);
      inventoryRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await service.findAll(query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'inventory.productId = :productId',
        { productId: 1 }
      );
    });

    it('should filter by sku', async () => {
      const query: QueryInventoryDto = { page: 1, pageSize: 20, sku: 'SKU' };
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockInventory], 1]);
      inventoryRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await service.findAll(query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.sku LIKE :sku',
        { sku: '%SKU%' }
      );
    });

    it('should filter by name', async () => {
      const query: QueryInventoryDto = { page: 1, pageSize: 20, name: 'Test' };
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockInventory], 1]);
      inventoryRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await service.findAll(query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.name LIKE :name',
        { name: '%Test%' }
      );
    });

    it('should use default pagination values', async () => {
      const query: QueryInventoryDto = {};
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      inventoryRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.findAll(query);

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
    });
  });

  describe('findOne', () => {
    it('should return inventory by productId', async () => {
      inventoryRepository.findOne.mockResolvedValue(mockInventory);

      const result = await service.findOne(1);

      expect(result).toEqual(mockInventory);
      expect(inventoryRepository.findOne).toHaveBeenCalledWith({
        where: { productId: 1, deletedAt: expect.anything() },
        relations: ['product'],
      });
    });

    it('should throw NotFoundException when inventory not found', async () => {
      inventoryRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('库存记录不存在');
    });
  });

  describe('getOrCreateInventory', () => {
    it('should return existing inventory', async () => {
      inventoryRepository.findOne.mockResolvedValue(mockInventory);

      const result = await service.getOrCreateInventory(1);

      expect(result).toEqual(mockInventory);
    });

    it('should create new inventory when not exists', async () => {
      inventoryRepository.findOne.mockResolvedValueOnce(null);
      productRepository.findOne.mockResolvedValue(mockProduct);
      inventoryRepository.create.mockReturnValue(mockInventory);
      inventoryRepository.save.mockResolvedValue(mockInventory);

      const result = await service.getOrCreateInventory(1);

      expect(productRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(inventoryRepository.create).toHaveBeenCalledWith({
        productId: 1,
        quantity: 0,
        warningQuantity: 10,
      });
      expect(inventoryRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when product not found', async () => {
      inventoryRepository.findOne.mockResolvedValue(null);
      productRepository.findOne.mockResolvedValue(null);

      await expect(service.getOrCreateInventory(999)).rejects.toThrow(NotFoundException);
      await expect(service.getOrCreateInventory(999)).rejects.toThrow('商品不存在');
    });
  });

  describe('updateStock', () => {
    const userId = 1;

    it('should throw NotFoundException when product not found', async () => {
      productRepository.findOne.mockResolvedValue(null);

      const dto: UpdateInventoryDto = {
        productId: 999,
        quantity: 10,
        type: InventoryLogType.PURCHASE,
      };

      await expect(service.updateStock(dto, userId)).rejects.toThrow(NotFoundException);
      await expect(service.updateStock(dto, userId)).rejects.toThrow('商品不存在');
    });

    describe('PURCHASE type', () => {
      it('should increase inventory quantity', async () => {
        const dto: UpdateInventoryDto = {
          productId: 1,
          quantity: 50,
          type: InventoryLogType.PURCHASE,
          remark: 'Purchase order',
        };

        productRepository.findOne.mockResolvedValue(mockProduct);
        inventoryRepository.findOne.mockResolvedValue({ ...mockInventory });
        inventoryRepository.save.mockResolvedValue({ ...mockInventory, quantity: 150 });
        inventoryLogRepository.create.mockReturnValue(mockInventoryLog);
        inventoryLogRepository.save.mockResolvedValue(mockInventoryLog);

        const result = await service.updateStock(dto, userId);

        expect(result.quantity).toBe(150);
        expect(inventoryLogRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            productId: 1,
            type: InventoryLogType.PURCHASE,
            quantity: 50,
            beforeQty: 100,
            afterQty: 150,
            remark: 'Purchase order',
            createdById: userId,
          })
        );
      });
    });

    describe('SALES type', () => {
      it('should decrease inventory quantity', async () => {
        const dto: UpdateInventoryDto = {
          productId: 1,
          quantity: 30,
          type: InventoryLogType.SALES,
        };

        productRepository.findOne.mockResolvedValue(mockProduct);
        inventoryRepository.findOne.mockResolvedValue({ ...mockInventory });
        inventoryRepository.save.mockResolvedValue({ ...mockInventory, quantity: 70 });
        inventoryLogRepository.create.mockReturnValue(mockInventoryLog);
        inventoryLogRepository.save.mockResolvedValue(mockInventoryLog);

        const result = await service.updateStock(dto, userId);

        expect(result.quantity).toBe(70);
      });

      it('should throw BadRequestException when insufficient stock', async () => {
        const dto: UpdateInventoryDto = {
          productId: 1,
          quantity: 200,
          type: InventoryLogType.SALES,
        };

        productRepository.findOne.mockResolvedValue(mockProduct);
        inventoryRepository.findOne.mockResolvedValue({ ...mockInventory });

        await expect(service.updateStock(dto, userId)).rejects.toThrow(BadRequestException);
        await expect(service.updateStock(dto, userId)).rejects.toThrow('库存不足');
      });

      it('should allow sales when quantity equals current stock', async () => {
        const dto: UpdateInventoryDto = {
          productId: 1,
          quantity: 100,
          type: InventoryLogType.SALES,
        };

        productRepository.findOne.mockResolvedValue(mockProduct);
        inventoryRepository.findOne.mockResolvedValue({ ...mockInventory });
        inventoryRepository.save.mockResolvedValue({ ...mockInventory, quantity: 0 });
        inventoryLogRepository.create.mockReturnValue(mockInventoryLog);
        inventoryLogRepository.save.mockResolvedValue(mockInventoryLog);

        const result = await service.updateStock(dto, userId);

        expect(result.quantity).toBe(0);
      });
    });

    describe('ADJUSTMENT type', () => {
      it('should set inventory quantity to specified value', async () => {
        const dto: UpdateInventoryDto = {
          productId: 1,
          quantity: 80,
          type: InventoryLogType.ADJUSTMENT,
          remark: 'Stock adjustment',
        };

        productRepository.findOne.mockResolvedValue(mockProduct);
        inventoryRepository.findOne.mockResolvedValue({ ...mockInventory });
        inventoryRepository.save.mockResolvedValue({ ...mockInventory, quantity: 80 });
        inventoryLogRepository.create.mockReturnValue(mockInventoryLog);
        inventoryLogRepository.save.mockResolvedValue(mockInventoryLog);

        const result = await service.updateStock(dto, userId);

        expect(result.quantity).toBe(80);
        expect(inventoryLogRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            quantity: -20,
            beforeQty: 100,
            afterQty: 80,
          })
        );
      });

      it('should create inventory if not exists during adjustment', async () => {
        const dto: UpdateInventoryDto = {
          productId: 1,
          quantity: 50,
          type: InventoryLogType.ADJUSTMENT,
        };

        const newInventory = { ...mockInventory, quantity: 50 };

        productRepository.findOne.mockResolvedValue(mockProduct);
        inventoryRepository.findOne.mockResolvedValueOnce(null);
        inventoryRepository.create.mockReturnValue(newInventory);
        inventoryRepository.save.mockResolvedValue(newInventory);
        inventoryLogRepository.create.mockReturnValue(mockInventoryLog);
        inventoryLogRepository.save.mockResolvedValue(mockInventoryLog);

        const result = await service.updateStock(dto, userId);

        expect(result.quantity).toBe(50);
      });
    });
  });

  describe('getLogs', () => {
    it('should return paginated inventory logs', async () => {
      const query: QueryInventoryLogDto = { page: 1, pageSize: 20 };
      const logs = [mockInventoryLog];
      inventoryLogRepository.findAndCount.mockResolvedValue([logs, 1]);

      const result = await service.getLogs(query);

      expect(result.list).toEqual(logs);
      expect(result.total).toBe(1);
    });

    it('should filter by productId', async () => {
      const query: QueryInventoryLogDto = { page: 1, pageSize: 20, productId: 1 };
      inventoryLogRepository.findAndCount.mockResolvedValue([[mockInventoryLog], 1]);

      await service.getLogs(query);

      expect(inventoryLogRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ productId: 1 }),
        })
      );
    });

    it('should filter by type', async () => {
      const query: QueryInventoryLogDto = {
        page: 1,
        pageSize: 20,
        type: InventoryLogType.PURCHASE,
      };
      inventoryLogRepository.findAndCount.mockResolvedValue([[mockInventoryLog], 1]);

      await service.getLogs(query);

      expect(inventoryLogRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: InventoryLogType.PURCHASE }),
        })
      );
    });

    it('should use default pagination values', async () => {
      const query: QueryInventoryLogDto = {};
      inventoryLogRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.getLogs(query);

      expect(inventoryLogRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        })
      );
    });

    it('should include relations', async () => {
      const query: QueryInventoryLogDto = { page: 1, pageSize: 20 };
      inventoryLogRepository.findAndCount.mockResolvedValue([[mockInventoryLog], 1]);

      await service.getLogs(query);

      expect(inventoryLogRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['product', 'createdBy'],
        })
      );
    });
  });

  describe('getLowStockProducts', () => {
    it('should return products with quantity below warning level', async () => {
      const lowStockInventory = [
        { ...mockInventory, quantity: 5, warningQuantity: 10 },
        { ...mockInventory, id: 2, quantity: 0, warningQuantity: 10 },
      ];
      mockQueryBuilder.getMany.mockResolvedValue(lowStockInventory);
      inventoryRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getLowStockProducts();

      expect(result).toEqual(lowStockInventory);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'inventory.quantity <= inventory.warningQuantity'
      );
    });

    it('should return empty array when no low stock products', async () => {
      mockQueryBuilder.getMany.mockResolvedValue([]);
      inventoryRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getLowStockProducts();

      expect(result).toEqual([]);
    });
  });

  describe('remove', () => {
    it('should soft delete inventory', async () => {
      const userId = 1;
      inventoryRepository.findOne.mockResolvedValue(mockInventory);
      inventoryRepository.save.mockResolvedValue({
        ...mockInventory,
        deletedAt: expect.any(Date),
        deletedBy: userId,
      });

      await service.remove(1, userId);

      expect(inventoryRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          deletedAt: expect.any(Date),
          deletedBy: userId,
        })
      );
    });

    it('should throw NotFoundException when inventory not found', async () => {
      inventoryRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
      await expect(service.remove(999, 1)).rejects.toThrow('库存记录不存在');
    });
  });
});
