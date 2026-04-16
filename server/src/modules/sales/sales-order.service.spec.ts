import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SalesOrderService } from './sales-order.service';
import { SalesOrder, SalesOrderStatus } from '../../entities/sales-order.entity';
import { SalesOrderItem } from '../../entities/sales-order-item.entity';
import { Product } from '../../entities/product.entity';
import { Customer } from '../../entities/customer.entity';
import { Inventory } from '../../entities/inventory.entity';
import { InventoryLog, InventoryLogType } from '../../entities/inventory-log.entity';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { UpdateSalesOrderStatusDto } from './dto/update-sales-order-status.dto';
import { createMockRepository } from '../../common/test/mock-repository';

describe('SalesOrderService', () => {
  let service: SalesOrderService;
  let salesOrderRepository: ReturnType<typeof createMockRepository<SalesOrder>>;
  let salesOrderItemRepository: ReturnType<typeof createMockRepository<SalesOrderItem>>;
  let productRepository: ReturnType<typeof createMockRepository<Product>>;
  let customerRepository: ReturnType<typeof createMockRepository<Customer>>;
  let dataSource: DataSource;
  let mockQueryRunner: any;

  const createMockProduct = (): Product => ({
    id: 1,
    name: 'Test Product',
    sku: 'SKU001',
    costPrice: 50,
    salePrice: 100,
    spec: 'Test Spec',
    unit: 'pcs',
    barcode: '1234567890',
    description: 'Test description',
    status: true,
    categoryId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    deletedBy: null,
    category: null,
  } as unknown as Product);

  const createMockCustomerLevel = () => ({
    id: 1,
    name: 'VIP',
    discountPercent: 10,
    minAmount: 100,
    level: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    deletedBy: null,
    customers: [],
  });

  const createMockCustomer = (): Customer => ({
    id: 1,
    name: 'Test Customer',
    phone: '13800138000',
    address: 'Test Address',
    levelId: 1,
    totalAmount: 1000,
    status: true,
    level: createMockCustomerLevel(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    deletedBy: null,
  } as unknown as Customer);

  const createMockCustomerWithoutLevel = (): Customer => ({
    id: 2,
    name: 'Regular Customer',
    phone: '13800138001',
    address: 'Test Address 2',
    levelId: null,
    totalAmount: 0,
    status: true,
    level: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    deletedBy: null,
  } as unknown as Customer);

  const createMockOrderItem = (): SalesOrderItem => ({
    id: 1,
    orderId: 1,
    productId: 1,
    quantity: 2,
    unitPrice: 100,
    discountRate: 0,
    discountAmount: 0,
    amount: 200,
    createdAt: new Date(),
    deletedAt: null,
    deletedBy: null,
    product: createMockProduct(),
    order: null,
  } as unknown as SalesOrderItem);

  const createMockOrder = (): SalesOrder => ({
    id: 1,
    orderNo: 'SO20240101123456',
    customerId: 1,
    totalAmount: 200,
    discountAmount: 0,
    couponDiscount: 0,
    finalAmount: 200,
    status: SalesOrderStatus.DRAFT,
    createdById: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    deletedBy: null,
    customer: createMockCustomer(),
    items: [createMockOrderItem()],
    createdBy: null,
  } as unknown as SalesOrder);

  const createMockInventory = (): Inventory => ({
    id: 1,
    productId: 1,
    quantity: 100,
    warningQuantity: 10,
    updatedAt: new Date(),
    deletedAt: null,
    deletedBy: null,
    product: createMockProduct(),
  } as unknown as Inventory);

  beforeEach(async () => {
    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        findOne: jest.fn(),
        find: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        decrement: jest.fn(),
        increment: jest.fn(),
      },
    };

    salesOrderRepository = createMockRepository<SalesOrder>();
    salesOrderItemRepository = createMockRepository<SalesOrderItem>();
    productRepository = createMockRepository<Product>();
    customerRepository = createMockRepository<Customer>();

    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    } as unknown as DataSource;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesOrderService,
        { provide: 'SalesOrderRepository', useValue: salesOrderRepository },
        { provide: 'SalesOrderItemRepository', useValue: salesOrderItemRepository },
        { provide: 'ProductRepository', useValue: productRepository },
        { provide: 'CustomerRepository', useValue: customerRepository },
        { provide: 'CustomerLevelRepository', useValue: createMockRepository() },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<SalesOrderService>(SalesOrderService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateSalesOrderDto = {
      customerId: 1,
      items: [
        { productId: 1, quantity: 2, unitPrice: 100 },
      ],
    };

    it('should throw BadRequestException when customer does not exist', async () => {
      customerRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto, 1)).rejects.toThrow(BadRequestException);
      await expect(service.create(createDto, 1)).rejects.toThrow('客户不存在');
    });

    it('should throw BadRequestException when product does not exist', async () => {
      customerRepository.findOne.mockResolvedValue(createMockCustomer());
      productRepository.findOne.mockResolvedValue(null);

      await expect(service.create(createDto, 1)).rejects.toThrow(BadRequestException);
      await expect(service.create(createDto, 1)).rejects.toThrow('商品ID 1 不存在');
    });

    it('should create order successfully with item discount', async () => {
      const dtoWithDiscount: CreateSalesOrderDto = {
        customerId: 2,
        items: [
          { productId: 1, quantity: 2, unitPrice: 100, discountRate: 10 },
        ],
      };

      customerRepository.findOne.mockResolvedValue(createMockCustomerWithoutLevel());
      productRepository.findOne.mockResolvedValue(createMockProduct());
      salesOrderItemRepository.create.mockReturnValue({
        productId: 1,
        quantity: 2,
        unitPrice: 100,
        discountRate: 10,
        discountAmount: 20,
        amount: 180,
      } as unknown as SalesOrderItem);
      salesOrderRepository.create.mockReturnValue({
        orderNo: 'SO20240101123456',
        customerId: 2,
        totalAmount: 200,
        discountAmount: 20,
        couponDiscount: 0,
        finalAmount: 180,
        status: SalesOrderStatus.DRAFT,
        createdById: 1,
      } as unknown as SalesOrder);
      salesOrderRepository.save.mockResolvedValue({ id: 1 } as unknown as SalesOrder);

      await service.create(dtoWithDiscount, 1);

      expect(salesOrderItemRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          discountRate: 10,
          discountAmount: 20,
          amount: 180,
        })
      );
    });

    it('should create order successfully with customer level discount', async () => {
      customerRepository.findOne.mockResolvedValue(createMockCustomer());
      productRepository.findOne.mockResolvedValue(createMockProduct());
      salesOrderItemRepository.create.mockReturnValue(createMockOrderItem());
      salesOrderRepository.create.mockReturnValue(createMockOrder());
      salesOrderRepository.save.mockResolvedValue(createMockOrder());

      await service.create(createDto, 1);

      expect(salesOrderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 1,
          totalAmount: 200,
        })
      );
    });

    it('should create order successfully with coupon discount', async () => {
      const dtoWithCoupon: CreateSalesOrderDto = {
        customerId: 2,
        items: [
          { productId: 1, quantity: 2, unitPrice: 100 },
        ],
        couponDiscount: 50,
      };

      customerRepository.findOne.mockResolvedValue(createMockCustomerWithoutLevel());
      productRepository.findOne.mockResolvedValue(createMockProduct());
      salesOrderItemRepository.create.mockReturnValue(createMockOrderItem());
      salesOrderRepository.create.mockReturnValue({
        orderNo: 'SO20240101123456',
        customerId: 2,
        totalAmount: 200,
        discountAmount: 0,
        couponDiscount: 50,
        finalAmount: 150,
        status: SalesOrderStatus.DRAFT,
        createdById: 1,
      } as unknown as SalesOrder);
      salesOrderRepository.save.mockResolvedValue({ id: 1 } as unknown as SalesOrder);

      await service.create(dtoWithCoupon, 1);

      expect(salesOrderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          couponDiscount: 50,
          finalAmount: 150,
        })
      );
    });

    it('should create order with custom status', async () => {
      const dtoWithStatus: CreateSalesOrderDto = {
        customerId: 2,
        items: [
          { productId: 1, quantity: 2, unitPrice: 100 },
        ],
        status: SalesOrderStatus.PENDING,
      };

      customerRepository.findOne.mockResolvedValue(createMockCustomerWithoutLevel());
      productRepository.findOne.mockResolvedValue(createMockProduct());
      salesOrderItemRepository.create.mockReturnValue(createMockOrderItem());
      salesOrderRepository.create.mockImplementation((data) => data as unknown as SalesOrder);
      salesOrderRepository.save.mockResolvedValue({ id: 1 } as unknown as SalesOrder);

      await service.create(dtoWithStatus, 1);

      expect(salesOrderRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: SalesOrderStatus.PENDING,
        })
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated orders', async () => {
      const orders = [createMockOrder()];
      salesOrderRepository.findAndCount.mockResolvedValue([orders, 1]);

      const result = await service.findAll({ page: 1, pageSize: 20 });

      expect(result.list).toEqual(orders);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('should filter by orderNo', async () => {
      salesOrderRepository.findAndCount.mockResolvedValue([[createMockOrder()], 1]);

      await service.findAll({ orderNo: 'SO2024' });

      expect(salesOrderRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            orderNo: expect.anything(),
          }),
        })
      );
    });

    it('should filter by customerId', async () => {
      salesOrderRepository.findAndCount.mockResolvedValue([[createMockOrder()], 1]);

      await service.findAll({ customerId: 1 });

      expect(salesOrderRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            customerId: 1,
          }),
        })
      );
    });

    it('should filter by status', async () => {
      salesOrderRepository.findAndCount.mockResolvedValue([[createMockOrder()], 1]);

      await service.findAll({ status: SalesOrderStatus.DRAFT });

      expect(salesOrderRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: SalesOrderStatus.DRAFT,
          }),
        })
      );
    });

    it('should use default pagination values', async () => {
      salesOrderRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({});

      expect(salesOrderRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        })
      );
    });

    it('should calculate correct skip value for pagination', async () => {
      salesOrderRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 3, pageSize: 10 });

      expect(salesOrderRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        })
      );
    });
  });

  describe('findOne', () => {
    it('should return order when found', async () => {
      const mockOrder = createMockOrder();
      salesOrderRepository.findOne.mockResolvedValue(mockOrder);

      const result = await service.findOne(1);

      expect(result).toEqual(mockOrder);
      expect(salesOrderRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: expect.anything() },
        relations: ['customer', 'customer.level', 'items', 'items.product', 'createdBy'],
      });
    });

    it('should throw NotFoundException when order not found', async () => {
      salesOrderRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('销售订单不存在');
    });
  });

  describe('update', () => {
    const updateDto: UpdateSalesOrderDto = {
      couponDiscount: 10,
    };

    it('should update order successfully', async () => {
      const mockOrder = createMockOrder();
      salesOrderRepository.findOne.mockResolvedValue(mockOrder);
      salesOrderRepository.save.mockResolvedValue({ ...mockOrder, couponDiscount: 10 });

      const result = await service.update(1, updateDto);

      expect(salesOrderRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when order not found', async () => {
      salesOrderRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(NotFoundException);
      await expect(service.update(999, updateDto)).rejects.toThrow('销售订单不存在');
    });
  });

  describe('remove', () => {
    it('should soft delete order successfully', async () => {
      const mockOrder = createMockOrder();
      salesOrderRepository.findOne.mockResolvedValue(mockOrder);
      salesOrderRepository.save.mockResolvedValue({ ...mockOrder, deletedAt: new Date(), deletedBy: 1 });

      await service.remove(1, 1);

      expect(salesOrderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          deletedAt: expect.any(Date),
          deletedBy: 1,
        })
      );
    });

    it('should throw NotFoundException when order not found', async () => {
      salesOrderRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
      await expect(service.remove(999, 1)).rejects.toThrow('销售订单不存在');
    });
  });

  describe('updateStatus', () => {
    const statusDto: UpdateSalesOrderStatusDto = { status: SalesOrderStatus.PENDING };

    it('should throw NotFoundException when order not found', async () => {
      salesOrderRepository.findOne.mockResolvedValue(null);

      await expect(service.updateStatus(999, statusDto, 1)).rejects.toThrow(NotFoundException);
      await expect(service.updateStatus(999, statusDto, 1)).rejects.toThrow('销售订单不存在');
    });

    it('should throw BadRequestException when order is already completed', async () => {
      const completedOrder = { ...createMockOrder(), status: SalesOrderStatus.COMPLETED };
      salesOrderRepository.findOne.mockResolvedValue(completedOrder);

      await expect(service.updateStatus(1, statusDto, 1)).rejects.toThrow(BadRequestException);
      await expect(service.updateStatus(1, statusDto, 1)).rejects.toThrow('订单已完成，无法修改状态');
    });

    it('should throw BadRequestException when order is already cancelled', async () => {
      const cancelledOrder = { ...createMockOrder(), status: SalesOrderStatus.CANCELLED };
      salesOrderRepository.findOne.mockResolvedValue(cancelledOrder);

      await expect(service.updateStatus(1, statusDto, 1)).rejects.toThrow(BadRequestException);
      await expect(service.updateStatus(1, statusDto, 1)).rejects.toThrow('订单已取消，无法修改状态');
    });

    it('should update status to pending successfully', async () => {
      const mockOrder = createMockOrder();
      salesOrderRepository.findOne.mockResolvedValueOnce(mockOrder);
      salesOrderRepository.save.mockResolvedValue({ ...mockOrder, status: SalesOrderStatus.PENDING });
      salesOrderRepository.findOne.mockResolvedValueOnce({ ...mockOrder, status: SalesOrderStatus.PENDING });

      await service.updateStatus(1, statusDto, 1);

      expect(salesOrderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: SalesOrderStatus.PENDING,
        })
      );
    });

    describe('when completing order', () => {
      const completeDto: UpdateSalesOrderStatusDto = { status: SalesOrderStatus.COMPLETED };

      it('should throw BadRequestException when inventory is insufficient', async () => {
        const mockProduct = createMockProduct();
        const mockOrderItem = createMockOrderItem();
        const orderWithLargeQuantity = {
          ...createMockOrder(),
          items: [{ ...mockOrderItem, quantity: 200, product: mockProduct }],
        };
        salesOrderRepository.findOne.mockResolvedValue(orderWithLargeQuantity);
        mockQueryRunner.manager.findOne.mockResolvedValue({ ...createMockInventory(), quantity: 50 });

        await expect(service.updateStatus(1, completeDto, 1)).rejects.toThrow(BadRequestException);
        await expect(service.updateStatus(1, completeDto, 1)).rejects.toThrow('库存不足');
      });

      it('should throw BadRequestException when inventory record not found', async () => {
        salesOrderRepository.findOne.mockResolvedValue(createMockOrder());
        mockQueryRunner.manager.findOne.mockResolvedValueOnce(null);

        await expect(service.updateStatus(1, completeDto, 1)).rejects.toThrow(BadRequestException);
        await expect(service.updateStatus(1, completeDto, 1)).rejects.toThrow('库存不足');
      });

      it('should complete order and decrement inventory', async () => {
        const mockOrder = createMockOrder();
        salesOrderRepository.findOne.mockResolvedValueOnce(mockOrder);
        salesOrderRepository.findOne.mockResolvedValueOnce({ ...mockOrder, status: SalesOrderStatus.COMPLETED });

        mockQueryRunner.manager.findOne
          .mockResolvedValueOnce(createMockInventory())
          .mockResolvedValueOnce({ ...createMockInventory(), quantity: 98 });
        mockQueryRunner.manager.create.mockReturnValue({} as unknown as InventoryLog);
        mockQueryRunner.manager.save.mockResolvedValue({});

        const result = await service.updateStatus(1, completeDto, 1);

        expect(mockQueryRunner.connect).toHaveBeenCalled();
        expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
        expect(mockQueryRunner.manager.decrement).toHaveBeenCalledWith(
          Inventory,
          { productId: 1 },
          'quantity',
          2
        );
        expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
        expect(mockQueryRunner.release).toHaveBeenCalled();
      });

      it('should create inventory log when completing order', async () => {
        const mockOrder = createMockOrder();
        salesOrderRepository.findOne.mockResolvedValueOnce(mockOrder);
        salesOrderRepository.findOne.mockResolvedValueOnce({ ...mockOrder, status: SalesOrderStatus.COMPLETED });

        mockQueryRunner.manager.findOne
          .mockResolvedValueOnce(createMockInventory())
          .mockResolvedValueOnce({ ...createMockInventory(), quantity: 98 });
        mockQueryRunner.manager.create.mockReturnValue({} as unknown as InventoryLog);
        mockQueryRunner.manager.save.mockResolvedValue({});

        await service.updateStatus(1, completeDto, 1);

        expect(mockQueryRunner.manager.create).toHaveBeenCalledWith(
          InventoryLog,
          expect.objectContaining({
            productId: 1,
            type: InventoryLogType.SALES,
            quantity: 2,
          })
        );
      });

      it('should rollback transaction on error', async () => {
        salesOrderRepository.findOne.mockResolvedValue(createMockOrder());
        mockQueryRunner.manager.findOne.mockResolvedValue(createMockInventory());
        mockQueryRunner.manager.decrement.mockRejectedValue(new Error('Database error'));

        await expect(service.updateStatus(1, completeDto, 1)).rejects.toThrow();

        expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
        expect(mockQueryRunner.release).toHaveBeenCalled();
      });

      it('should throw BadRequestException when inventory record missing after decrement', async () => {
        const mockOrder = createMockOrder();
        salesOrderRepository.findOne.mockResolvedValue(mockOrder);

        const mockInventory = createMockInventory();
        mockQueryRunner.manager.findOne
          .mockResolvedValueOnce(mockInventory)
          .mockResolvedValueOnce(null);

        const promise = service.updateStatus(1, completeDto, 1);
        
        await expect(promise).rejects.toThrow(BadRequestException);
        await expect(promise).rejects.toThrow('商品库存记录不存在');
      });
    });
  });
});
