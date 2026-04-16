import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductService } from './product.service';
import { Product } from '../../entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { createMockRepository } from '../../common/test/mock-repository';

describe('ProductService', () => {
  let service: ProductService;
  let repository: ReturnType<typeof createMockRepository<Product>>;

  const mockProduct: Product = {
    id: 1,
    sku: 'SKU001',
    name: 'Test Product',
    categoryId: 1,
    spec: 'spec1',
    unit: 'unit1',
    costPrice: 100,
    salePrice: 150,
    barcode: '1234567890',
    description: 'test description',
    status: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    deletedBy: null as any,
    category: null as any,
  };

  beforeEach(async () => {
    repository = createMockRepository<Product>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: 'ProductRepository',
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateProductDto = {
      sku: 'SKU001',
      name: 'Test Product',
      categoryId: 1,
      unit: '个',
      costPrice: 100,
      salePrice: 150,
    };

    it('should create a product successfully', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockProduct);
      repository.save.mockResolvedValue(mockProduct);

      const result = await service.create(createDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { sku: createDto.sku, deletedAt: expect.anything() },
      });
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(mockProduct);
      expect(result).toEqual(mockProduct);
    });

    it('should throw BadRequestException when SKU already exists', async () => {
      repository.findOne.mockResolvedValue(mockProduct);

      await expect(service.create(createDto)).rejects.toMatchObject({
        message: 'SKU已存在',
      });
    });
  });

  describe('findAll', () => {
    const products = [mockProduct];
    const total = 1;

    it('should return paginated products without filters', async () => {
      const query: QueryProductDto = {};
      repository.findAndCount.mockResolvedValue([products, total]);

      const result = await service.findAll(query);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { deletedAt: expect.anything() },
        relations: ['category'],
        skip: 0,
        take: 20,
        order: { id: 'DESC' },
      });
      expect(result.list).toEqual(products);
      expect(result.total).toBe(total);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('should return paginated products with filters', async () => {
      const query: QueryProductDto = {
        sku: 'SKU',
        name: 'Test',
        categoryId: 1,
        status: true,
        page: 2,
        pageSize: 10,
      };
      repository.findAndCount.mockResolvedValue([products, total]);

      const result = await service.findAll(query);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: expect.objectContaining({
          deletedAt: expect.anything(),
        }),
        relations: ['category'],
        skip: 10,
        take: 10,
        order: { id: 'DESC' },
      });
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(10);
    });

    it('should use default pagination values when not provided', async () => {
      const query: QueryProductDto = { page: undefined, pageSize: undefined };
      repository.findAndCount.mockResolvedValue([products, total]);

      const result = await service.findAll(query);

      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });
  });

  describe('findOne', () => {
    it('should return a product when found', async () => {
      repository.findOne.mockResolvedValue(mockProduct);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: expect.anything() },
        relations: ['category'],
      });
      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when product not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toMatchObject({
        message: '商品不存在',
      });
    });
  });

  describe('update', () => {
    const updateDto: UpdateProductDto = {
      name: 'Updated Product',
    };

    it('should update a product successfully', async () => {
      repository.findOne.mockResolvedValueOnce(mockProduct);
      repository.save.mockResolvedValue({ ...mockProduct, ...updateDto });

      const result = await service.update(1, updateDto);

      expect(result.name).toBe('Updated Product');
    });

    it('should throw NotFoundException when product not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toMatchObject({
        message: '商品不存在',
      });
    });

    it('should throw BadRequestException when updating to existing SKU', async () => {
      const dtoWithSku: UpdateProductDto = { sku: 'SKU002' };
      const productWithDifferentSku = { ...mockProduct, sku: 'SKU001' };
      const existingProduct = { ...mockProduct, id: 2, sku: 'SKU002' };

      repository.findOne
        .mockResolvedValueOnce(productWithDifferentSku)
        .mockResolvedValueOnce(existingProduct);

      await expect(service.update(1, dtoWithSku)).rejects.toMatchObject({
        message: 'SKU已存在',
      });
    });

    it('should allow updating with same SKU', async () => {
      const dtoWithSameSku: UpdateProductDto = { sku: 'SKU001', name: 'Updated' };
      repository.findOne.mockResolvedValue(mockProduct);
      repository.save.mockResolvedValue({ ...mockProduct, name: 'Updated' });

      const result = await service.update(1, dtoWithSameSku);

      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(result.name).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('should soft delete a product successfully', async () => {
      repository.findOne.mockResolvedValue(mockProduct);
      repository.update.mockResolvedValue({ affected: 1 } as any);

      await service.remove(1, 1);

      expect(repository.update).toHaveBeenCalledWith(1, {
        deletedAt: expect.any(Date),
        deletedBy: 1,
      });
    });

    it('should throw NotFoundException when product not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(999, 1)).rejects.toMatchObject({
        message: '商品不存在',
      });
    });
  });
});
