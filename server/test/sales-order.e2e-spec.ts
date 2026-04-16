import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SalesOrderService } from '../src/modules/sales/sales-order.service';
import { SalesOrder, SalesOrderStatus } from '../src/entities/sales-order.entity';
import { SalesOrderItem } from '../src/entities/sales-order-item.entity';
import { Product } from '../src/entities/product.entity';
import { Customer } from '../src/entities/customer.entity';
import { CustomerLevel } from '../src/entities/customer-level.entity';
import { Inventory } from '../src/entities/inventory.entity';
import { InventoryLog, InventoryLogType } from '../src/entities/inventory-log.entity';
import { Category } from '../src/entities/category.entity';
import { User } from '../src/entities/user.entity';
import { Role } from '../src/entities/role.entity';
import { CreateSalesOrderDto } from '../src/modules/sales/dto/create-sales-order.dto';
import { UpdateSalesOrderStatusDto } from '../src/modules/sales/dto/update-sales-order-status.dto';
import { createTestModule, cleanupDatabase, closeDatabase } from './test-utils';

import { Permission } from '../src/entities/permission.entity';

describe('SalesOrderService (e2e)', () => {
  let service: SalesOrderService;
  let dataSource: DataSource;
  let productRepository: Repository<Product>;
  let customerRepository: Repository<Customer>;
  let customerLevelRepository: Repository<CustomerLevel>;
  let inventoryRepository: Repository<Inventory>;
  let inventoryLogRepository: Repository<InventoryLog>;
  let salesOrderRepository: Repository<SalesOrder>;
  let userRepository: Repository<User>;
  let categoryRepository: Repository<Category>;

  let testUser: User;
  let testCategory: Category;
  let testProduct1: Product;
  let testProduct2: Product;
  let testCustomer: Customer;
  let testCustomerLevel: CustomerLevel;

  beforeAll(async () => {
    const module: TestingModule = await createTestModule(
      [
        Permission,
        User,
        Role,
        Category,
        Product,
        Customer,
        CustomerLevel,
        Inventory,
        InventoryLog,
        SalesOrder,
        SalesOrderItem,
      ],
      [SalesOrderService],
    );

    service = module.get<SalesOrderService>(SalesOrderService);
    dataSource = module.get<DataSource>(DataSource);
    productRepository = module.get<Repository<Product>>(getRepositoryToken(Product));
    customerRepository = module.get<Repository<Customer>>(getRepositoryToken(Customer));
    customerLevelRepository = module.get<Repository<CustomerLevel>>(getRepositoryToken(CustomerLevel));
    inventoryRepository = module.get<Repository<Inventory>>(getRepositoryToken(Inventory));
    inventoryLogRepository = module.get<Repository<InventoryLog>>(getRepositoryToken(InventoryLog));
    salesOrderRepository = module.get<Repository<SalesOrder>>(getRepositoryToken(SalesOrder));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    categoryRepository = module.get<Repository<Category>>(getRepositoryToken(Category));
  });

  afterAll(async () => {
    await closeDatabase(dataSource);
  });

  beforeEach(async () => {
    await cleanupDatabase(dataSource);

    testUser = userRepository.create({
      username: 'testuser',
      password: 'password123',
      name: 'Test User',
      email: 'test@example.com',
      status: true,
    });
    await userRepository.save(testUser);

    testCategory = categoryRepository.create({
      name: 'Test Category',
      sort: 1,
    });
    await categoryRepository.save(testCategory);

    testProduct1 = productRepository.create({
      sku: 'SKU001',
      name: 'Test Product 1',
      categoryId: testCategory.id,
      costPrice: 50,
      salePrice: 100,
      status: true,
    });
    await productRepository.save(testProduct1);

    testProduct2 = productRepository.create({
      sku: 'SKU002',
      name: 'Test Product 2',
      categoryId: testCategory.id,
      costPrice: 80,
      salePrice: 150,
      status: true,
    });
    await productRepository.save(testProduct2);

    testCustomerLevel = customerLevelRepository.create({
      name: 'VIP',
      minAmount: 100,
      discountPercent: 10,
      level: 1,
    });
    await customerLevelRepository.save(testCustomerLevel);

    testCustomer = customerRepository.create({
      name: 'Test Customer',
      phone: '13800138000',
      address: 'Test Address',
      levelId: testCustomerLevel.id,
      status: true,
    });
    await customerRepository.save(testCustomer);
  });

  describe('create', () => {
    it('should create sales order with multiple items', async () => {
      const createDto: CreateSalesOrderDto = {
        customerId: testCustomer.id,
        items: [
          { productId: testProduct1.id, quantity: 2, unitPrice: 100 },
          { productId: testProduct2.id, quantity: 3, unitPrice: 150 },
        ],
      };

      const result = await service.create(createDto, testUser.id);

      expect(result).toBeDefined();
      expect(result.orderNo).toMatch(/^SO\d{8}[A-Z0-9]{6}$/);
      expect(result.customerId).toBe(testCustomer.id);
      expect(result.totalAmount).toBe(650);
      expect(result.items).toHaveLength(2);
      expect(result.status).toBe(SalesOrderStatus.DRAFT);
      expect(result.createdById).toBe(testUser.id);
    });

    it('should throw BadRequestException when customer does not exist', async () => {
      const createDto: CreateSalesOrderDto = {
        customerId: 99999,
        items: [{ productId: testProduct1.id, quantity: 1, unitPrice: 100 }],
      };

      await expect(service.create(createDto, testUser.id)).rejects.toThrow(BadRequestException);
      await expect(service.create(createDto, testUser.id)).rejects.toThrow('客户不存在');
    });

    it('should throw BadRequestException when product does not exist', async () => {
      const createDto: CreateSalesOrderDto = {
        customerId: testCustomer.id,
        items: [{ productId: 99999, quantity: 1, unitPrice: 100 }],
      };

      await expect(service.create(createDto, testUser.id)).rejects.toThrow(BadRequestException);
      await expect(service.create(createDto, testUser.id)).rejects.toThrow('商品ID 99999 不存在');
    });

    it('should calculate order amount with item discount correctly', async () => {
      const createDto: CreateSalesOrderDto = {
        customerId: testCustomer.id,
        items: [
          { productId: testProduct1.id, quantity: 2, unitPrice: 100, discountRate: 10 },
        ],
      };

      const result = await service.create(createDto, testUser.id);

      expect(result.totalAmount).toBe(200);
      expect(result.discountAmount).toBe(20);
      expect(result.finalAmount).toBe(180);
      expect(result.items[0].discountAmount).toBe(20);
      expect(result.items[0].amount).toBe(180);
    });

    it('should calculate order amount with customer level discount', async () => {
      const createDto: CreateSalesOrderDto = {
        customerId: testCustomer.id,
        items: [
          { productId: testProduct1.id, quantity: 2, unitPrice: 100 },
        ],
      };

      const result = await service.create(createDto, testUser.id);

      expect(result.totalAmount).toBe(200);
      expect(result.discountAmount).toBe(20);
      expect(result.finalAmount).toBe(180);
    });

    it('should calculate order amount with coupon discount', async () => {
      const customerWithoutLevel = customerRepository.create({
        name: 'Regular Customer',
        phone: '13800138001',
        status: true,
      });
      await customerRepository.save(customerWithoutLevel);

      const createDto: CreateSalesOrderDto = {
        customerId: customerWithoutLevel.id,
        items: [{ productId: testProduct1.id, quantity: 2, unitPrice: 100 }],
        couponDiscount: 30,
      };

      const result = await service.create(createDto, testUser.id);

      expect(result.totalAmount).toBe(200);
      expect(result.discountAmount).toBe(0);
      expect(result.couponDiscount).toBe(30);
      expect(result.finalAmount).toBe(170);
    });

    it('should calculate order amount with all discounts combined', async () => {
      const createDto: CreateSalesOrderDto = {
        customerId: testCustomer.id,
        items: [
          { productId: testProduct1.id, quantity: 2, unitPrice: 100, discountRate: 5 },
        ],
        couponDiscount: 20,
      };

      const result = await service.create(createDto, testUser.id);

      expect(result.totalAmount).toBe(200);
      expect(result.items[0].discountAmount).toBe(10);
      expect(result.discountAmount).toBe(30);
      expect(result.couponDiscount).toBe(20);
      expect(result.finalAmount).toBe(150);
    });

    it('should create order with custom status', async () => {
      const createDto: CreateSalesOrderDto = {
        customerId: testCustomer.id,
        items: [{ productId: testProduct1.id, quantity: 1, unitPrice: 100 }],
        status: SalesOrderStatus.PENDING,
      };

      const result = await service.create(createDto, testUser.id);

      expect(result.status).toBe(SalesOrderStatus.PENDING);
    });
  });

  describe('updateStatus - complete order (transaction test)', () => {
    let inventory1: Inventory;
    let inventory2: Inventory;

    beforeEach(async () => {
      inventory1 = inventoryRepository.create({
        productId: testProduct1.id,
        quantity: 100,
        warningQuantity: 10,
      });
      await inventoryRepository.save(inventory1);

      inventory2 = inventoryRepository.create({
        productId: testProduct2.id,
        quantity: 50,
        warningQuantity: 10,
      });
      await inventoryRepository.save(inventory2);
    });

    it('should complete order and decrement inventory in transaction', async () => {
      const createDto: CreateSalesOrderDto = {
        customerId: testCustomer.id,
        items: [
          { productId: testProduct1.id, quantity: 5, unitPrice: 100 },
          { productId: testProduct2.id, quantity: 3, unitPrice: 150 },
        ],
      };

      const order = await service.create(createDto, testUser.id);
      const statusDto: UpdateSalesOrderStatusDto = { status: SalesOrderStatus.COMPLETED };

      const result = await service.updateStatus(order.id, statusDto, testUser.id);

      expect(result.status).toBe(SalesOrderStatus.COMPLETED);

      const updatedInventory1 = await inventoryRepository.findOne({
        where: { productId: testProduct1.id },
      });
      const updatedInventory2 = await inventoryRepository.findOne({
        where: { productId: testProduct2.id },
      });

      expect(Number(updatedInventory1!.quantity)).toBe(95);
      expect(Number(updatedInventory2!.quantity)).toBe(47);
    });

    it('should throw error when inventory is insufficient', async () => {
      const createDto: CreateSalesOrderDto = {
        customerId: testCustomer.id,
        items: [
          { productId: testProduct1.id, quantity: 200, unitPrice: 100 },
        ],
      };

      const order = await service.create(createDto, testUser.id);
      const statusDto: UpdateSalesOrderStatusDto = { status: SalesOrderStatus.COMPLETED };

      await expect(service.updateStatus(order.id, statusDto, testUser.id)).rejects.toThrow(BadRequestException);
      await expect(service.updateStatus(order.id, statusDto, testUser.id)).rejects.toThrow('库存不足');

      const inventory = await inventoryRepository.findOne({
        where: { productId: testProduct1.id },
      });
      expect(Number(inventory!.quantity)).toBe(100);
    });

    it('should create inventory log when completing order', async () => {
      const createDto: CreateSalesOrderDto = {
        customerId: testCustomer.id,
        items: [
          { productId: testProduct1.id, quantity: 5, unitPrice: 100 },
        ],
      };

      const order = await service.create(createDto, testUser.id);
      const statusDto: UpdateSalesOrderStatusDto = { status: SalesOrderStatus.COMPLETED };

      await service.updateStatus(order.id, statusDto, testUser.id);

      const logs = await inventoryLogRepository.find({
        where: { orderId: order.id },
      });

      expect(logs).toHaveLength(1);
      expect(logs[0].productId).toBe(testProduct1.id);
      expect(logs[0].type).toBe(InventoryLogType.SALES);
      expect(Number(logs[0].quantity)).toBe(5);
      expect(Number(logs[0].beforeQty)).toBe(100);
      expect(Number(logs[0].afterQty)).toBe(95);
      expect(logs[0].createdById).toBe(testUser.id);
    });

    it('should rollback inventory changes on error', async () => {
      const createDto: CreateSalesOrderDto = {
        customerId: testCustomer.id,
        items: [
          { productId: testProduct1.id, quantity: 5, unitPrice: 100 },
          { productId: testProduct2.id, quantity: 100, unitPrice: 150 },
        ],
      };

      const order = await service.create(createDto, testUser.id);
      const statusDto: UpdateSalesOrderStatusDto = { status: SalesOrderStatus.COMPLETED };

      await expect(service.updateStatus(order.id, statusDto, testUser.id)).rejects.toThrow();

      const inv1 = await inventoryRepository.findOne({ where: { productId: testProduct1.id } });
      const inv2 = await inventoryRepository.findOne({ where: { productId: testProduct2.id } });

      expect(Number(inv1!.quantity)).toBe(100);
      expect(Number(inv2!.quantity)).toBe(50);

      const logs = await inventoryLogRepository.find({ where: { orderId: order.id } });
      expect(logs).toHaveLength(0);
    });

    it('should throw error when inventory record does not exist', async () => {
      await inventoryRepository.delete({ productId: testProduct1.id });

      const createDto: CreateSalesOrderDto = {
        customerId: testCustomer.id,
        items: [{ productId: testProduct1.id, quantity: 5, unitPrice: 100 }],
      };

      const order = await service.create(createDto, testUser.id);
      const statusDto: UpdateSalesOrderStatusDto = { status: SalesOrderStatus.COMPLETED };

      await expect(service.updateStatus(order.id, statusDto, testUser.id)).rejects.toThrow(BadRequestException);
    });

    it('should not allow status change for completed order', async () => {
      const createDto: CreateSalesOrderDto = {
        customerId: testCustomer.id,
        items: [{ productId: testProduct1.id, quantity: 1, unitPrice: 100 }],
      };

      const order = await service.create(createDto, testUser.id);
      await service.updateStatus(order.id, { status: SalesOrderStatus.COMPLETED }, testUser.id);

      const statusDto: UpdateSalesOrderStatusDto = { status: SalesOrderStatus.CANCELLED };

      await expect(service.updateStatus(order.id, statusDto, testUser.id)).rejects.toThrow(BadRequestException);
      await expect(service.updateStatus(order.id, statusDto, testUser.id)).rejects.toThrow('订单已完成，无法修改状态');
    });
  });

  describe('updateStatus - cancel order', () => {
    beforeEach(async () => {
      const inventory = inventoryRepository.create({
        productId: testProduct1.id,
        quantity: 100,
        warningQuantity: 10,
      });
      await inventoryRepository.save(inventory);
    });

    it('should cancel draft order successfully', async () => {
      const createDto: CreateSalesOrderDto = {
        customerId: testCustomer.id,
        items: [{ productId: testProduct1.id, quantity: 5, unitPrice: 100 }],
      };

      const order = await service.create(createDto, testUser.id);
      const statusDto: UpdateSalesOrderStatusDto = { status: SalesOrderStatus.CANCELLED };

      const result = await service.updateStatus(order.id, statusDto, testUser.id);

      expect(result.status).toBe(SalesOrderStatus.CANCELLED);
    });

    it('should not allow status change for cancelled order', async () => {
      const createDto: CreateSalesOrderDto = {
        customerId: testCustomer.id,
        items: [{ productId: testProduct1.id, quantity: 1, unitPrice: 100 }],
      };

      const order = await service.create(createDto, testUser.id);
      await service.updateStatus(order.id, { status: SalesOrderStatus.CANCELLED }, testUser.id);

      const statusDto: UpdateSalesOrderStatusDto = { status: SalesOrderStatus.PENDING };

      await expect(service.updateStatus(order.id, statusDto, testUser.id)).rejects.toThrow(BadRequestException);
      await expect(service.updateStatus(order.id, statusDto, testUser.id)).rejects.toThrow('订单已取消，无法修改状态');
    });
  });

  describe('findOne', () => {
    it('should return order with all relations', async () => {
      const createDto: CreateSalesOrderDto = {
        customerId: testCustomer.id,
        items: [{ productId: testProduct1.id, quantity: 2, unitPrice: 100 }],
      };

      const created = await service.create(createDto, testUser.id);
      const result = await service.findOne(created.id);

      expect(result).toBeDefined();
      expect(result.customer).toBeDefined();
      expect(result.customer.level).toBeDefined();
      expect(result.items).toHaveLength(1);
      expect(result.items[0].product).toBeDefined();
      expect(result.createdBy).toBeDefined();
    });

    it('should throw NotFoundException for non-existent order', async () => {
      await expect(service.findOne(99999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(99999)).rejects.toThrow('销售订单不存在');
    });
  });

  describe('remove', () => {
    it('should soft delete order', async () => {
      const createDto: CreateSalesOrderDto = {
        customerId: testCustomer.id,
        items: [{ productId: testProduct1.id, quantity: 1, unitPrice: 100 }],
      };

      const order = await service.create(createDto, testUser.id);
      await service.remove(order.id, testUser.id);

      const deleted = await salesOrderRepository.findOne({
        where: { id: order.id },
        withDeleted: true,
      });

      expect(deleted).toBeDefined();
      expect(deleted!.deletedAt).not.toBeNull();
      expect(deleted!.deletedBy).toBe(testUser.id);
    });

    it('should throw NotFoundException when removing non-existent order', async () => {
      await expect(service.remove(99999, testUser.id)).rejects.toThrow(NotFoundException);
    });
  });
});
