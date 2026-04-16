import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ProductService } from '../src/modules/product/product.service';
import { Product } from '../src/entities/product.entity';
import { Category } from '../src/entities/category.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { createTestModule, cleanupDatabase, closeDatabase } from './test-utils';

describe('ProductService (e2e)', () => {
  let service: ProductService;
  let productRepository: Repository<Product>;
  let categoryRepository: Repository<Category>;
  let dataSource: DataSource;
  let module: TestingModule;

  beforeAll(async () => {
    module = await createTestModule([Product, Category], [ProductService]);

    service = module.get<ProductService>(ProductService);
    productRepository = module.get<Repository<Product>>(getRepositoryToken(Product));
    categoryRepository = module.get<Repository<Category>>(getRepositoryToken(Category));
    dataSource = module.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await closeDatabase(dataSource);
  });

  beforeEach(async () => {
    await cleanupDatabase(dataSource);
  });

  describe('create', () => {
    it('should create a product successfully', async () => {
      const category = categoryRepository.create({ name: '电子产品' });
      await categoryRepository.save(category);

      const dto = {
        sku: 'PHONE001',
        name: 'iPhone 15 Pro',
        categoryId: category.id,
        unit: '台',
        costPrice: 7999.00,
        salePrice: 8999.00,
      };

      const result = await service.create(dto);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.sku).toBe(dto.sku);
      expect(result.name).toBe(dto.name);
      expect(result.categoryId).toBe(category.id);
      expect(result.costPrice).toBe(dto.costPrice);
      expect(result.salePrice).toBe(dto.salePrice);
      expect(result.status).toBe(true);
      expect(result.deletedAt).toBeNull();
    });

    it('should throw BadRequestException when SKU already exists', async () => {
      const category = categoryRepository.create({ name: '电子产品' });
      await categoryRepository.save(category);

      const dto = {
        sku: 'PHONE001',
        name: 'iPhone 15 Pro',
        categoryId: category.id,
        unit: '台',
        costPrice: 7999.00,
        salePrice: 8999.00,
      };

      await service.create(dto);

      const dto2 = {
        sku: 'PHONE001',
        name: 'iPhone 15',
        categoryId: category.id,
        unit: '台',
        costPrice: 6999.00,
        salePrice: 7999.00,
      };

      await expect(service.create(dto2)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return products with category relation', async () => {
      const category = categoryRepository.create({ name: '电子产品' });
      await categoryRepository.save(category);

      const product1 = productRepository.create({
        sku: 'PHONE001',
        name: 'iPhone 15 Pro',
        categoryId: category.id,
        unit: '台',
        costPrice: 7999.00,
        salePrice: 8999.00,
      });
      const product2 = productRepository.create({
        sku: 'PHONE002',
        name: 'iPhone 15',
        categoryId: category.id,
        unit: '台',
        costPrice: 6999.00,
        salePrice: 7999.00,
      });
      await productRepository.save([product1, product2]);

      const result = await service.findAll({});

      expect(result.list).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.list[0].category).toBeDefined();
      expect(result.list[0].category.name).toBe('电子产品');
    });
  });

  describe('findOne', () => {
    it('should return a product with category relation', async () => {
      const category = categoryRepository.create({ name: '电子产品' });
      await categoryRepository.save(category);

      const product = productRepository.create({
        sku: 'PHONE001',
        name: 'iPhone 15 Pro',
        categoryId: category.id,
        unit: '台',
        costPrice: 7999.00,
        salePrice: 8999.00,
      });
      await productRepository.save(product);

      const result = await service.findOne(product.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(product.id);
      expect(result.category).toBeDefined();
      expect(result.category.name).toBe('电子产品');
    });

    it('should throw NotFoundException when product does not exist', async () => {
      await expect(service.findOne(99999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a product successfully', async () => {
      const category = categoryRepository.create({ name: '电子产品' });
      await categoryRepository.save(category);

      const product = productRepository.create({
        sku: 'PHONE001',
        name: 'iPhone 15 Pro',
        categoryId: category.id,
        unit: '台',
        costPrice: 7999.00,
        salePrice: 8999.00,
      });
      await productRepository.save(product);

      const dto = {
        name: 'iPhone 15 Pro Max',
        salePrice: 9999.00,
      };

      const result = await service.update(product.id, dto);

      expect(result.name).toBe('iPhone 15 Pro Max');
      expect(result.salePrice).toBe(9999.00);
    });

    it('should throw NotFoundException when updating non-existent product', async () => {
      await expect(service.update(99999, { name: 'test' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove (soft delete)', () => {
    it('should soft delete a product', async () => {
      const category = categoryRepository.create({ name: '电子产品' });
      await categoryRepository.save(category);

      const product = productRepository.create({
        sku: 'PHONE001',
        name: 'iPhone 15 Pro',
        categoryId: category.id,
        unit: '台',
        costPrice: 7999.00,
        salePrice: 8999.00,
      });
      await productRepository.save(product);

      await service.remove(product.id, 1);

      const deleted = await productRepository.findOne({
        where: { id: product.id },
        withDeleted: true,
      });

      expect(deleted).toBeDefined();
      expect(deleted!.deletedAt).not.toBeNull();
      expect(deleted!.deletedBy).toBe(1);
    });

    it('should not find deleted product', async () => {
      const category = categoryRepository.create({ name: '电子产品' });
      await categoryRepository.save(category);

      const product = productRepository.create({
        sku: 'PHONE001',
        name: 'iPhone 15 Pro',
        categoryId: category.id,
        unit: '台',
        costPrice: 7999.00,
        salePrice: 8999.00,
      });
      await productRepository.save(product);

      await service.remove(product.id, 1);

      await expect(service.findOne(product.id)).rejects.toThrow(NotFoundException);
    });

    it('should not include deleted products in list', async () => {
      const category = categoryRepository.create({ name: '电子产品' });
      await categoryRepository.save(category);

      const product1 = productRepository.create({
        sku: 'PHONE001',
        name: 'iPhone 15 Pro',
        categoryId: category.id,
        unit: '台',
        costPrice: 7999.00,
        salePrice: 8999.00,
      });
      const product2 = productRepository.create({
        sku: 'PHONE002',
        name: 'iPhone 15',
        categoryId: category.id,
        unit: '台',
        costPrice: 6999.00,
        salePrice: 7999.00,
      });
      await productRepository.save([product1, product2]);

      await service.remove(product1.id, 1);

      const result = await service.findAll({});

      expect(result.list).toHaveLength(1);
      expect(result.list[0].sku).toBe('PHONE002');
    });
  });
});
