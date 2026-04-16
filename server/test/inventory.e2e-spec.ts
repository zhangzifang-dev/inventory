import { DataSource, Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InventoryService } from '../src/modules/inventory/inventory.service';
import { Inventory } from '../src/entities/inventory.entity';
import { InventoryLog, InventoryLogType } from '../src/entities/inventory-log.entity';
import { Product } from '../src/entities/product.entity';
import { Category } from '../src/entities/category.entity';
import { User } from '../src/entities/user.entity';
import { Role } from '../src/entities/role.entity';
import { Permission } from '../src/entities/permission.entity';

jest.setTimeout(30000);

describe('InventoryService (e2e)', () => {
  let service: InventoryService;
  let dataSource: DataSource;
  let module: TestingModule;
  let userRepository: Repository<User>;
  let categoryRepository: Repository<Category>;
  let productRepository: Repository<Product>;
  let inventoryRepository: Repository<Inventory>;

  let testUser: User;
  let testCategory: Category;
  let testProduct: Product;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Category, Product, Inventory, InventoryLog, User, Role, Permission],
          synchronize: true,
          dropSchema: true,
        }),
        TypeOrmModule.forFeature([Category, Product, Inventory, InventoryLog, User, Role, Permission]),
      ],
      providers: [InventoryService],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    dataSource = module.get<DataSource>(DataSource);
    userRepository = dataSource.getRepository(User);
    categoryRepository = dataSource.getRepository(Category);
    productRepository = dataSource.getRepository(Product);
    inventoryRepository = dataSource.getRepository(Inventory);
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });

  beforeEach(async () => {
    await dataSource.query('DELETE FROM inventory_logs');
    await dataSource.query('DELETE FROM inventory');
    await dataSource.query('DELETE FROM products');
    await dataSource.query('DELETE FROM categories');
    await dataSource.query('DELETE FROM users');

    testUser = userRepository.create({
      username: 'testuser',
      password: 'hashedpassword',
      name: 'Test User',
    });
    await userRepository.save(testUser);

    testCategory = categoryRepository.create({
      name: 'Test Category',
    });
    await categoryRepository.save(testCategory);

    testProduct = productRepository.create({
      sku: 'TEST-SKU-001',
      name: 'Test Product',
      categoryId: testCategory.id,
      costPrice: 100,
      salePrice: 150,
    });
    await productRepository.save(testProduct);
  });

  describe('创建商品时自动创建库存记录', () => {
    it('首次查询库存时自动创建记录', async () => {
      const inventory = await service.getOrCreateInventory(testProduct.id);

      expect(inventory).toBeDefined();
      expect(inventory.productId).toBe(testProduct.id);
      expect(inventory.quantity).toBe(0);
      expect(inventory.warningQuantity).toBe(10);
    });

    it('再次查询返回已存在的库存记录', async () => {
      const first = await service.getOrCreateInventory(testProduct.id);
      const second = await service.getOrCreateInventory(testProduct.id);

      expect(second.id).toBe(first.id);
      expect(second.quantity).toBe(first.quantity);
    });
  });

  describe('入库操作（PURCHASE）增加库存', () => {
    it('首次入库应创建库存记录并增加数量', async () => {
      const result = await service.updateStock(
        {
          productId: testProduct.id,
          quantity: 50,
          type: InventoryLogType.PURCHASE,
          remark: '首次入库',
        },
        testUser.id,
      );

      expect(result.quantity).toBe(50);
      expect(result.productId).toBe(testProduct.id);
    });

    it('多次入库应累加库存数量', async () => {
      await service.updateStock(
        {
          productId: testProduct.id,
          quantity: 30,
          type: InventoryLogType.PURCHASE,
        },
        testUser.id,
      );

      const result = await service.updateStock(
        {
          productId: testProduct.id,
          quantity: 20,
          type: InventoryLogType.PURCHASE,
        },
        testUser.id,
      );

      expect(result.quantity).toBe(50);
    });

    it('入库操作应创建日志记录', async () => {
      await service.updateStock(
        {
          productId: testProduct.id,
          quantity: 100,
          type: InventoryLogType.PURCHASE,
          remark: '采购入库',
        },
        testUser.id,
      );

      const logsResult = await service.getLogs({ productId: testProduct.id });
      expect(logsResult.total).toBe(1);
      expect(logsResult.list[0].type).toBe(InventoryLogType.PURCHASE);
      expect(logsResult.list[0].quantity).toBe(100);
      expect(logsResult.list[0].beforeQty).toBe(0);
      expect(logsResult.list[0].afterQty).toBe(100);
      expect(logsResult.list[0].remark).toBe('采购入库');
    });
  });

  describe('出库操作（SALES）减少库存', () => {
    beforeEach(async () => {
      await service.updateStock(
        {
          productId: testProduct.id,
          quantity: 100,
          type: InventoryLogType.PURCHASE,
        },
        testUser.id,
      );
    });

    it('出库应减少库存数量', async () => {
      const result = await service.updateStock(
        {
          productId: testProduct.id,
          quantity: 30,
          type: InventoryLogType.SALES,
          remark: '销售出库',
        },
        testUser.id,
      );

      expect(result.quantity).toBe(70);
    });

    it('出库操作应创建日志记录', async () => {
      await service.updateStock(
        {
          productId: testProduct.id,
          quantity: 25,
          type: InventoryLogType.SALES,
        },
        testUser.id,
      );

      const logsResult = await service.getLogs({ 
        productId: testProduct.id,
        type: InventoryLogType.SALES,
      });
      
      expect(logsResult.total).toBe(1);
      expect(logsResult.list[0].type).toBe(InventoryLogType.SALES);
      expect(logsResult.list[0].quantity).toBe(25);
      expect(logsResult.list[0].beforeQty).toBe(100);
      expect(logsResult.list[0].afterQty).toBe(75);
    });

    it('全部出库应将库存归零', async () => {
      const result = await service.updateStock(
        {
          productId: testProduct.id,
          quantity: 100,
          type: InventoryLogType.SALES,
        },
        testUser.id,
      );

      expect(result.quantity).toBe(0);
    });
  });

  describe('库存不足时抛出异常', () => {
    it('库存不足时应抛出 BadRequestException', async () => {
      await service.updateStock(
        {
          productId: testProduct.id,
          quantity: 10,
          type: InventoryLogType.PURCHASE,
        },
        testUser.id,
      );

      await expect(
        service.updateStock(
          {
            productId: testProduct.id,
            quantity: 20,
            type: InventoryLogType.SALES,
          },
          testUser.id,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('库存不足时应抛出正确的错误信息', async () => {
      await service.updateStock(
        {
          productId: testProduct.id,
          quantity: 5,
          type: InventoryLogType.PURCHASE,
        },
        testUser.id,
      );

      await expect(
        service.updateStock(
          {
            productId: testProduct.id,
            quantity: 10,
            type: InventoryLogType.SALES,
          },
          testUser.id,
        ),
      ).rejects.toThrow('库存不足');
    });

    it('库存为零时应无法出库', async () => {
      await expect(
        service.updateStock(
          {
            productId: testProduct.id,
            quantity: 1,
            type: InventoryLogType.SALES,
          },
          testUser.id,
        ),
      ).rejects.toThrow('库存不足');
    });

    it('库存不足时不应修改库存记录', async () => {
      await service.updateStock(
        {
          productId: testProduct.id,
          quantity: 10,
          type: InventoryLogType.PURCHASE,
        },
        testUser.id,
      );

      await expect(
        service.updateStock(
          {
            productId: testProduct.id,
            quantity: 50,
            type: InventoryLogType.SALES,
          },
          testUser.id,
        ),
      ).rejects.toThrow();

      const inventory = await service.findOne(testProduct.id);
      expect(inventory.quantity).toBe(10);
    });
  });

  describe('库存调整（ADJUSTMENT）', () => {
    beforeEach(async () => {
      await service.updateStock(
        {
          productId: testProduct.id,
          quantity: 100,
          type: InventoryLogType.PURCHASE,
        },
        testUser.id,
      );
    });

    it('调整应将库存设置为指定值', async () => {
      const result = await service.updateStock(
        {
          productId: testProduct.id,
          quantity: 80,
          type: InventoryLogType.ADJUSTMENT,
          remark: '盘点调整',
        },
        testUser.id,
      );

      expect(result.quantity).toBe(80);
    });

    it('调整操作应创建日志记录', async () => {
      await service.updateStock(
        {
          productId: testProduct.id,
          quantity: 50,
          type: InventoryLogType.ADJUSTMENT,
        },
        testUser.id,
      );

      const logsResult = await service.getLogs({ 
        productId: testProduct.id,
        type: InventoryLogType.ADJUSTMENT,
      });
      
      expect(logsResult.total).toBe(1);
      expect(logsResult.list[0].type).toBe(InventoryLogType.ADJUSTMENT);
      expect(logsResult.list[0].beforeQty).toBe(100);
      expect(logsResult.list[0].afterQty).toBe(50);
    });

    it('调整可以增加库存', async () => {
      const result = await service.updateStock(
        {
          productId: testProduct.id,
          quantity: 150,
          type: InventoryLogType.ADJUSTMENT,
        },
        testUser.id,
      );

      expect(result.quantity).toBe(150);
    });

    it('调整可以减少库存', async () => {
      const result = await service.updateStock(
        {
          productId: testProduct.id,
          quantity: 30,
          type: InventoryLogType.ADJUSTMENT,
        },
        testUser.id,
      );

      expect(result.quantity).toBe(30);
    });

    it('调整可以将库存设置为零', async () => {
      const result = await service.updateStock(
        {
          productId: testProduct.id,
          quantity: 0,
          type: InventoryLogType.ADJUSTMENT,
        },
        testUser.id,
      );

      expect(result.quantity).toBe(0);
    });
  });

  describe('查询库存日志', () => {
    beforeEach(async () => {
      await service.updateStock(
        {
          productId: testProduct.id,
          quantity: 100,
          type: InventoryLogType.PURCHASE,
          remark: '采购',
        },
        testUser.id,
      );
      await service.updateStock(
        {
          productId: testProduct.id,
          quantity: 30,
          type: InventoryLogType.SALES,
          remark: '销售',
        },
        testUser.id,
      );
      await service.updateStock(
        {
          productId: testProduct.id,
          quantity: 50,
          type: InventoryLogType.ADJUSTMENT,
          remark: '调整',
        },
        testUser.id,
      );
    });

    it('应返回所有日志记录', async () => {
      const result = await service.getLogs({ productId: testProduct.id });
      expect(result.total).toBe(3);
    });

    it('应按时间倒序排列', async () => {
      const result = await service.getLogs({ productId: testProduct.id });
      expect(result.list[0].type).toBe(InventoryLogType.ADJUSTMENT);
      expect(result.list[1].type).toBe(InventoryLogType.SALES);
      expect(result.list[2].type).toBe(InventoryLogType.PURCHASE);
    });

    it('应能按类型筛选', async () => {
      const result = await service.getLogs({ 
        productId: testProduct.id,
        type: InventoryLogType.PURCHASE,
      });
      expect(result.total).toBe(1);
      expect(result.list[0].type).toBe(InventoryLogType.PURCHASE);
    });

    it('应支持分页', async () => {
      const page1 = await service.getLogs({ 
        productId: testProduct.id,
        page: 1,
        pageSize: 2,
      });
      expect(page1.list.length).toBe(2);
      expect(page1.total).toBe(3);

      const page2 = await service.getLogs({ 
        productId: testProduct.id,
        page: 2,
        pageSize: 2,
      });
      expect(page2.list.length).toBe(1);
    });

    it('应包含关联数据', async () => {
      const result = await service.getLogs({ productId: testProduct.id });
      expect(result.list[0].product).toBeDefined();
      expect(result.list[0].product).not.toBeNull();
      expect(result.list[0].product.name).toBe('Test Product');
    });
  });

  describe('查询低库存商品', () => {
    let lowStockProduct: Product;
    let normalProduct: Product;

    beforeEach(async () => {
      lowStockProduct = productRepository.create({
        sku: 'LOW-STOCK-001',
        name: 'Low Stock Product',
        categoryId: testCategory.id,
        costPrice: 50,
        salePrice: 80,
      });
      await productRepository.save(lowStockProduct);

      normalProduct = productRepository.create({
        sku: 'NORMAL-STOCK-001',
        name: 'Normal Stock Product',
        categoryId: testCategory.id,
        costPrice: 60,
        salePrice: 90,
      });
      await productRepository.save(normalProduct);

      await service.updateStock(
        {
          productId: lowStockProduct.id,
          quantity: 5,
          type: InventoryLogType.PURCHASE,
        },
        testUser.id,
      );

      await service.updateStock(
        {
          productId: normalProduct.id,
          quantity: 50,
          type: InventoryLogType.PURCHASE,
        },
        testUser.id,
      );
    });

    it('应返回库存低于预警值的商品', async () => {
      const result = await service.getLowStockProducts();
      expect(result.length).toBe(1);
      expect(result[0].productId).toBe(lowStockProduct.id);
      expect(result[0].quantity).toBe(5);
    });

    it('应包含商品信息', async () => {
      const result = await service.getLowStockProducts();
      expect(result[0].product).toBeDefined();
      expect(result[0].product.name).toBe('Low Stock Product');
    });

    it('库存等于预警值时应包含在结果中', async () => {
      const inventory = await inventoryRepository.findOne({
        where: { productId: lowStockProduct.id },
      });
      if (inventory) {
        inventory.quantity = 10;
        inventory.warningQuantity = 10;
        await inventoryRepository.save(inventory);
      }

      const result = await service.getLowStockProducts();
      const found = result.find((i) => i.productId === lowStockProduct.id);
      expect(found).toBeDefined();
    });
  });

  describe('不存在的商品', () => {
    it('操作不存在的商品应抛出 NotFoundException', async () => {
      await expect(
        service.updateStock(
          {
            productId: 99999,
            quantity: 10,
            type: InventoryLogType.PURCHASE,
          },
          testUser.id,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('查询不存在的库存应抛出 NotFoundException', async () => {
      await expect(service.findOne(99999)).rejects.toThrow(NotFoundException);
    });
  });
});
