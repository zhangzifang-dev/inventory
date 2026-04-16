import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { PurchaseOrderService } from './purchase-order.service';
import { PurchaseOrder, PurchaseOrderStatus } from '../../entities/purchase-order.entity';
import { PurchaseOrderItem } from '../../entities/purchase-order-item.entity';
import { Product } from '../../entities/product.entity';
import { createMockRepository } from '../../common/test/mock-repository';

describe('PurchaseOrderService', () => {
  let service: PurchaseOrderService;
  let purchaseOrderRepository: ReturnType<typeof createMockRepository<PurchaseOrder>>;
  let purchaseOrderItemRepository: ReturnType<typeof createMockRepository<PurchaseOrderItem>>;
  let productRepository: ReturnType<typeof createMockRepository<Product>>;
  let dataSource: DataSource;

  const mockSupplierRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    purchaseOrderRepository = createMockRepository<PurchaseOrder>();
    purchaseOrderItemRepository = createMockRepository<PurchaseOrderItem>();
    productRepository = createMockRepository<Product>();

    dataSource = {
      getRepository: jest.fn().mockReturnValue(mockSupplierRepository),
    } as unknown as DataSource;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseOrderService,
        { provide: 'PurchaseOrderRepository', useValue: purchaseOrderRepository },
        { provide: 'PurchaseOrderItemRepository', useValue: purchaseOrderItemRepository },
        { provide: 'ProductRepository', useValue: productRepository },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<PurchaseOrderService>(PurchaseOrderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const userId = 1;
    const createDto = {
      supplierId: 1,
      remark: 'Test order',
      items: [
        { productId: 1, quantity: 10, unitPrice: 100 },
        { productId: 2, quantity: 5, unitPrice: 200 },
      ],
    };

    it('should create a purchase order successfully', async () => {
      mockSupplierRepository.findOne.mockResolvedValue({ id: 1, name: 'Supplier A' });
      productRepository.findOne
        .mockResolvedValueOnce({ id: 1, name: 'Product 1' } as unknown as Product)
        .mockResolvedValueOnce({ id: 2, name: 'Product 2' } as unknown as Product);

      purchaseOrderItemRepository.create
        .mockImplementationOnce((item) => ({ ...item, amount: 1000 }) as PurchaseOrderItem)
        .mockImplementationOnce((item) => ({ ...item, amount: 1000 }) as PurchaseOrderItem);

      const mockOrder = {
        id: 1,
        orderNo: 'PO20260416ABC123',
        supplierId: 1,
        totalAmount: 2000,
        status: PurchaseOrderStatus.DRAFT,
        remark: 'Test order',
        createdById: userId,
        items: [],
      };
      purchaseOrderRepository.create.mockReturnValue(mockOrder as unknown as PurchaseOrder);
      purchaseOrderRepository.save.mockResolvedValue(mockOrder as unknown as PurchaseOrder);

      const result = await service.create(createDto, userId);

      expect(dataSource.getRepository).toHaveBeenCalledWith('Supplier');
      expect(mockSupplierRepository.findOne).toHaveBeenCalledWith({
        where: { id: createDto.supplierId },
      });
      expect(productRepository.findOne).toHaveBeenCalledTimes(2);
      expect(purchaseOrderItemRepository.create).toHaveBeenCalledTimes(2);
      expect(purchaseOrderRepository.create).toHaveBeenCalled();
      expect(purchaseOrderRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockOrder);
    });

    it('should create order with specified status', async () => {
      const dtoWithStatus = { ...createDto, status: PurchaseOrderStatus.PENDING };
      mockSupplierRepository.findOne.mockResolvedValue({ id: 1 });
      productRepository.findOne.mockResolvedValue({ id: 1 } as unknown as Product);
      purchaseOrderItemRepository.create.mockReturnValue({} as PurchaseOrderItem);

      const mockOrder = {
        id: 1,
        status: PurchaseOrderStatus.PENDING,
        items: [],
      };
      purchaseOrderRepository.create.mockReturnValue(mockOrder as unknown as PurchaseOrder);
      purchaseOrderRepository.save.mockResolvedValue(mockOrder as unknown as PurchaseOrder);

      const result = await service.create(dtoWithStatus, userId);

      expect(result.status).toBe(PurchaseOrderStatus.PENDING);
    });

    it('should throw BadRequestException when supplier does not exist', async () => {
      mockSupplierRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto, userId)).rejects.toThrow(BadRequestException);
      await expect(service.create(createDto, userId)).rejects.toThrow('供应商不存在');
    });

    it('should throw BadRequestException when product does not exist', async () => {
      mockSupplierRepository.findOne.mockResolvedValue({ id: 1 });
      productRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto, userId)).rejects.toThrow(BadRequestException);
      await expect(service.create(createDto, userId)).rejects.toThrow('商品ID 1 不存在');
    });

    it('should calculate total amount correctly', async () => {
      mockSupplierRepository.findOne.mockResolvedValue({ id: 1 });
      productRepository.findOne.mockResolvedValue({ id: 1 } as unknown as Product);

      let capturedTotal = 0;
      purchaseOrderItemRepository.create.mockImplementation((item) => {
        capturedTotal += Number(item.quantity) * Number(item.unitPrice);
        return item as PurchaseOrderItem;
      });

      purchaseOrderRepository.create.mockImplementation((order) => {
        expect(order.totalAmount).toBe(2000);
        return order as unknown as PurchaseOrder;
      });
      purchaseOrderRepository.save.mockResolvedValue({} as unknown as PurchaseOrder);

      await service.create(createDto, userId);
    });
  });

  describe('findAll', () => {
    const mockOrders = [
      { id: 1, orderNo: 'PO001', deletedAt: null },
      { id: 2, orderNo: 'PO002', deletedAt: null },
    ];

    it('should return paginated orders with default pagination', async () => {
      purchaseOrderRepository.findAndCount.mockResolvedValue([
        mockOrders as unknown as PurchaseOrder[],
        2,
      ]);

      const result = await service.findAll({});

      expect(purchaseOrderRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['supplier', 'items', 'items.product', 'createdBy'],
          skip: 0,
          take: 20,
          order: { id: 'DESC' },
        }),
      );
      expect(result.list).toEqual(mockOrders);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('should return paginated orders with custom pagination', async () => {
      purchaseOrderRepository.findAndCount.mockResolvedValue([
        mockOrders as unknown as PurchaseOrder[],
        2,
      ]);

      const result = await service.findAll({ page: 2, pageSize: 10 });

      expect(purchaseOrderRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(10);
    });

    it('should filter by orderNo', async () => {
      purchaseOrderRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ orderNo: 'PO001' });

      const callArgs = purchaseOrderRepository.findAndCount.mock.calls[0][0] as any;
      expect(callArgs.where.orderNo).toBeDefined();
    });

    it('should filter by supplierId', async () => {
      purchaseOrderRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ supplierId: 1 });

      const callArgs = purchaseOrderRepository.findAndCount.mock.calls[0][0] as any;
      expect(callArgs.where.supplierId).toBe(1);
    });

    it('should filter by status', async () => {
      purchaseOrderRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ status: PurchaseOrderStatus.PENDING });

      const callArgs = purchaseOrderRepository.findAndCount.mock.calls[0][0] as any;
      expect(callArgs.where.status).toBe(PurchaseOrderStatus.PENDING);
    });

    it('should combine multiple filters', async () => {
      purchaseOrderRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({
        orderNo: 'PO',
        supplierId: 1,
        status: PurchaseOrderStatus.APPROVED,
      });

      const callArgs = purchaseOrderRepository.findAndCount.mock.calls[0][0] as any;
      expect(callArgs.where.orderNo).toBeDefined();
      expect(callArgs.where.supplierId).toBe(1);
      expect(callArgs.where.status).toBe(PurchaseOrderStatus.APPROVED);
    });

    it('should return empty list when no orders found', async () => {
      purchaseOrderRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll({});

      expect(result.list).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('findOne', () => {
    const mockOrder = {
      id: 1,
      orderNo: 'PO001',
      deletedAt: null,
    };

    it('should return an order by id', async () => {
      purchaseOrderRepository.findOne.mockResolvedValue(mockOrder as unknown as PurchaseOrder);

      const result = await service.findOne(1);

      expect(purchaseOrderRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: expect.anything() },
        relations: ['supplier', 'items', 'items.product', 'createdBy'],
      });
      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundException when order does not exist', async () => {
      purchaseOrderRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('采购订单不存在');
    });

    it('should not return soft deleted orders', async () => {
      purchaseOrderRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const mockOrder = {
      id: 1,
      orderNo: 'PO001',
      supplierId: 1,
      status: PurchaseOrderStatus.DRAFT,
    };

    it('should update an order successfully', async () => {
      purchaseOrderRepository.findOne.mockResolvedValue(mockOrder as unknown as PurchaseOrder);
      purchaseOrderRepository.save.mockResolvedValue({
        ...mockOrder,
        remark: 'Updated',
      } as unknown as PurchaseOrder);

      const result = await service.update(1, { remark: 'Updated' });

      expect(purchaseOrderRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(purchaseOrderRepository.save).toHaveBeenCalled();
      expect(result.remark).toBe('Updated');
    });

    it('should update order status', async () => {
      purchaseOrderRepository.findOne.mockResolvedValue(mockOrder as unknown as PurchaseOrder);
      purchaseOrderRepository.save.mockResolvedValue({
        ...mockOrder,
        status: PurchaseOrderStatus.APPROVED,
      } as unknown as PurchaseOrder);

      const result = await service.update(1, { status: PurchaseOrderStatus.APPROVED });

      expect(result.status).toBe(PurchaseOrderStatus.APPROVED);
    });

    it('should throw NotFoundException when order does not exist', async () => {
      purchaseOrderRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, { remark: 'Test' })).rejects.toThrow(NotFoundException);
      await expect(service.update(999, { remark: 'Test' })).rejects.toThrow('采购订单不存在');
    });

    it('should update supplierId', async () => {
      purchaseOrderRepository.findOne.mockResolvedValue(mockOrder as unknown as PurchaseOrder);
      purchaseOrderRepository.save.mockResolvedValue({
        ...mockOrder,
        supplierId: 2,
      } as unknown as PurchaseOrder);

      const result = await service.update(1, { supplierId: 2 });

      expect(result.supplierId).toBe(2);
    });
  });

  describe('remove', () => {
    const userId = 1;
    const mockOrder = {
      id: 1,
      orderNo: 'PO001',
      deletedAt: null,
    };

    it('should soft delete an order successfully', async () => {
      purchaseOrderRepository.findOne.mockResolvedValue(mockOrder as unknown as PurchaseOrder);
      purchaseOrderRepository.save.mockResolvedValue({
        ...mockOrder,
        deletedAt: expect.any(Date),
        deletedBy: userId,
      } as unknown as PurchaseOrder);

      await service.remove(1, userId);

      expect(purchaseOrderRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: expect.anything() },
      });
      expect(purchaseOrderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          deletedAt: expect.any(Date),
          deletedBy: userId,
        }),
      );
    });

    it('should throw NotFoundException when order does not exist', async () => {
      purchaseOrderRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999, userId)).rejects.toThrow(NotFoundException);
      await expect(service.remove(999, userId)).rejects.toThrow('采购订单不存在');
    });

    it('should throw NotFoundException when order is already deleted', async () => {
      purchaseOrderRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(1, userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('generateOrderNo', () => {
    it('should generate order number with correct format', () => {
      const orderNo = service['generateOrderNo']();

      expect(orderNo).toMatch(/^PO\d{8}[A-Z0-9]{6}$/);
      expect(orderNo.startsWith('PO')).toBe(true);
    });

    it('should generate unique order numbers', () => {
      const orderNos = new Set<string>();
      for (let i = 0; i < 100; i++) {
        orderNos.add(service['generateOrderNo']());
      }
      expect(orderNos.size).toBe(100);
    });
  });
});
