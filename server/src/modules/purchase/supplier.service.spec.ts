import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { Supplier } from '../../entities/supplier.entity';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { QuerySupplierDto } from './dto/query-supplier.dto';
import { createMockRepository } from '../../common/test/mock-repository';

describe('SupplierService', () => {
  let service: SupplierService;
  let repository: ReturnType<typeof createMockRepository<Supplier>>;

  const mockSupplier = {
    id: 1,
    name: 'Test Supplier',
    contact: '张经理',
    phone: '13800138000',
    address: '深圳市南山区科技园',
    status: true,
    deletedAt: null,
    deletedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as Supplier;

  beforeEach(async () => {
    repository = createMockRepository<Supplier>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupplierService,
        {
          provide: 'SupplierRepository',
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<SupplierService>(SupplierService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a supplier successfully', async () => {
      const dto: CreateSupplierDto = {
        name: 'New Supplier',
        contact: '李经理',
        phone: '13900139000',
        address: '广州市天河区',
        status: true,
      };

      repository.create.mockReturnValue(mockSupplier);
      repository.save.mockResolvedValue(mockSupplier);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(mockSupplier);
      expect(result).toEqual(mockSupplier);
    });

    it('should create a supplier with minimal data', async () => {
      const dto: CreateSupplierDto = {
        name: 'Minimal Supplier',
      };

      const minimalSupplier = { ...mockSupplier, name: dto.name };
      repository.create.mockReturnValue(minimalSupplier as Supplier);
      repository.save.mockResolvedValue(minimalSupplier as Supplier);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(result.name).toBe(dto.name);
    });

    it('should create a supplier with contact only', async () => {
      const dto: CreateSupplierDto = {
        name: 'Supplier with contact',
        contact: '王经理',
      };

      const supplierWithContact = { ...mockSupplier, name: dto.name, contact: dto.contact };
      repository.create.mockReturnValue(supplierWithContact as Supplier);
      repository.save.mockResolvedValue(supplierWithContact as Supplier);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(result.contact).toBe(dto.contact);
    });
  });

  describe('findAll', () => {
    it('should return paginated suppliers', async () => {
      const query: QuerySupplierDto = { page: 1, pageSize: 20 };
      const suppliers = [mockSupplier];

      repository.findAndCount.mockResolvedValue([suppliers, 1]);

      const result = await service.findAll(query);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { deletedAt: expect.anything() },
        skip: 0,
        take: 20,
        order: { id: 'DESC' },
      });
      expect(result.list).toEqual(suppliers);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('should use default pagination values when not provided', async () => {
      const query: QuerySupplierDto = {};

      repository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(query);

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        }),
      );
    });

    it('should filter by name', async () => {
      const query: QuerySupplierDto = { name: 'Test' };

      repository.findAndCount.mockResolvedValue([[mockSupplier], 1]);

      await service.findAll(query);

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: expect.anything(),
          }),
        }),
      );
    });

    it('should filter by phone', async () => {
      const query: QuerySupplierDto = { phone: '138' };

      repository.findAndCount.mockResolvedValue([[mockSupplier], 1]);

      await service.findAll(query);

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            phone: expect.anything(),
          }),
        }),
      );
    });

    it('should filter by status=true', async () => {
      const query: QuerySupplierDto = { status: true };

      repository.findAndCount.mockResolvedValue([[mockSupplier], 1]);

      await service.findAll(query);

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: true,
          }),
        }),
      );
    });

    it('should filter by status=false', async () => {
      const query: QuerySupplierDto = { status: false };

      repository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(query);

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: false,
          }),
        }),
      );
    });

    it('should apply multiple filters together', async () => {
      const query: QuerySupplierDto = {
        name: 'Test',
        phone: '138',
        status: true,
        page: 2,
        pageSize: 10,
      };

      repository.findAndCount.mockResolvedValue([[mockSupplier], 1]);

      await service.findAll(query);

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: expect.anything(),
            phone: expect.anything(),
            status: true,
          }),
          skip: 10,
          take: 10,
        }),
      );
    });

    it('should return empty list when no suppliers found', async () => {
      const query: QuerySupplierDto = {};

      repository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll(query);

      expect(result.list).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should calculate correct skip for page 3 with pageSize 15', async () => {
      const query: QuerySupplierDto = { page: 3, pageSize: 15 };

      repository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(query);

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 30,
          take: 15,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a supplier by id', async () => {
      repository.findOne.mockResolvedValue(mockSupplier);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: expect.anything() },
      });
      expect(result).toEqual(mockSupplier);
    });

    it('should throw NotFoundException when supplier not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('供应商不存在');
    });

    it('should not return soft deleted supplier', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a supplier successfully', async () => {
      const dto: UpdateSupplierDto = { name: 'Updated Supplier' };
      const updatedSupplier = { ...mockSupplier, name: 'Updated Supplier' };

      repository.findOne.mockResolvedValue(mockSupplier);
      repository.save.mockResolvedValue(updatedSupplier);

      const result = await service.update(1, dto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: expect.anything() },
      });
      expect(repository.save).toHaveBeenCalled();
      expect(result.name).toBe('Updated Supplier');
    });

    it('should throw NotFoundException when supplier not found', async () => {
      const dto: UpdateSupplierDto = { name: 'Updated Supplier' };

      repository.findOne.mockResolvedValue(null);

      await expect(service.update(999, dto)).rejects.toThrow(NotFoundException);
      await expect(service.update(999, dto)).rejects.toThrow('供应商不存在');
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should update multiple fields', async () => {
      const dto: UpdateSupplierDto = {
        name: 'Updated Supplier',
        contact: '新联系人',
        phone: '13900139000',
        address: '新地址',
        status: false,
      };

      repository.findOne.mockResolvedValue(mockSupplier);
      repository.save.mockResolvedValue({ ...mockSupplier, ...dto });

      await service.update(1, dto);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Supplier',
          contact: '新联系人',
          phone: '13900139000',
          address: '新地址',
          status: false,
        }),
      );
    });

    it('should update only contact field', async () => {
      const dto: UpdateSupplierDto = { contact: '新联系人' };

      repository.findOne.mockResolvedValue(mockSupplier);
      repository.save.mockResolvedValue({ ...mockSupplier, contact: '新联系人' });

      const result = await service.update(1, dto);

      expect(result.contact).toBe('新联系人');
    });

    it('should update only status field', async () => {
      const dto: UpdateSupplierDto = { status: false };

      repository.findOne.mockResolvedValue(mockSupplier);
      repository.save.mockResolvedValue({ ...mockSupplier, status: false });

      const result = await service.update(1, dto);

      expect(result.status).toBe(false);
    });
  });

  describe('remove', () => {
    it('should soft delete a supplier successfully', async () => {
      repository.findOne.mockResolvedValue(mockSupplier);
      repository.save.mockResolvedValue({ ...mockSupplier, deletedAt: new Date(), deletedBy: 1 });

      await service.remove(1, 1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: expect.anything() },
      });
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          deletedAt: expect.any(Date),
          deletedBy: 1,
        }),
      );
    });

    it('should throw NotFoundException when supplier not found for removal', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
      await expect(service.remove(999, 1)).rejects.toThrow('供应商不存在');
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should set deletedBy to the provided userId', async () => {
      const userId = 42;
      repository.findOne.mockResolvedValue(mockSupplier);
      repository.save.mockResolvedValue({ ...mockSupplier, deletedAt: new Date(), deletedBy: userId });

      await service.remove(1, userId);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          deletedBy: userId,
        }),
      );
    });

    it('should set deletedAt to current date', async () => {
      repository.findOne.mockResolvedValue(mockSupplier);
      repository.save.mockResolvedValue({ ...mockSupplier, deletedAt: new Date(), deletedBy: 1 });

      await service.remove(1, 1);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          deletedAt: expect.any(Date),
        }),
      );
    });
  });
});
