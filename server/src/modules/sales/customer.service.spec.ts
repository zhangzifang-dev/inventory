import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { Customer } from '../../entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { createMockRepository } from '../../common/test/mock-repository';

describe('CustomerService', () => {
  let service: CustomerService;
  let repository: ReturnType<typeof createMockRepository<Customer>>;

  const mockCustomer = {
    id: 1,
    name: 'Test Customer',
    phone: '13800138000',
    address: 'Test Address',
    levelId: 1,
    status: true,
    totalAmount: 1000,
    deletedAt: null,
    deletedBy: null,
    level: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as Customer;

  beforeEach(async () => {
    repository = createMockRepository<Customer>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        {
          provide: 'CustomerRepository',
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<CustomerService>(CustomerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a customer successfully', async () => {
      const dto: CreateCustomerDto = {
        name: 'New Customer',
        phone: '13900139000',
        address: 'New Address',
        levelId: 1,
        status: true,
      };

      repository.create.mockReturnValue(mockCustomer);
      repository.save.mockResolvedValue(mockCustomer);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(mockCustomer);
      expect(result).toEqual(mockCustomer);
    });

    it('should create a customer with minimal data', async () => {
      const dto: CreateCustomerDto = {
        name: 'Minimal Customer',
        phone: '13700137000',
      };

      const minimalCustomer = { ...mockCustomer, name: dto.name, phone: dto.phone };
      repository.create.mockReturnValue(minimalCustomer as Customer);
      repository.save.mockResolvedValue(minimalCustomer as Customer);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(result.name).toBe(dto.name);
      expect(result.phone).toBe(dto.phone);
    });
  });

  describe('findAll', () => {
    it('should return paginated customers', async () => {
      const query: QueryCustomerDto = { page: 1, pageSize: 20 };
      const customers = [mockCustomer];

      repository.findAndCount.mockResolvedValue([customers, 1]);

      const result = await service.findAll(query);

      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: { deletedAt: expect.anything() },
        relations: ['level'],
        skip: 0,
        take: 20,
        order: { id: 'DESC' },
      });
      expect(result.list).toEqual(customers);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('should use default pagination values when not provided', async () => {
      const query: QueryCustomerDto = {};

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
      const query: QueryCustomerDto = { name: 'Test' };

      repository.findAndCount.mockResolvedValue([[mockCustomer], 1]);

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
      const query: QueryCustomerDto = { phone: '138' };

      repository.findAndCount.mockResolvedValue([[mockCustomer], 1]);

      await service.findAll(query);

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            phone: expect.anything(),
          }),
        }),
      );
    });

    it('should filter by levelId', async () => {
      const query: QueryCustomerDto = { levelId: 1 };

      repository.findAndCount.mockResolvedValue([[mockCustomer], 1]);

      await service.findAll(query);

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            levelId: 1,
          }),
        }),
      );
    });

    it('should filter by status', async () => {
      const query: QueryCustomerDto = { status: true };

      repository.findAndCount.mockResolvedValue([[mockCustomer], 1]);

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
      const query: QueryCustomerDto = { status: false };

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
      const query: QueryCustomerDto = {
        name: 'Test',
        phone: '138',
        levelId: 1,
        status: true,
        page: 2,
        pageSize: 10,
      };

      repository.findAndCount.mockResolvedValue([[mockCustomer], 1]);

      await service.findAll(query);

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: expect.anything(),
            phone: expect.anything(),
            levelId: 1,
            status: true,
          }),
          skip: 10,
          take: 10,
        }),
      );
    });

    it('should return empty list when no customers found', async () => {
      const query: QueryCustomerDto = {};

      repository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll(query);

      expect(result.list).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return a customer by id', async () => {
      repository.findOne.mockResolvedValue(mockCustomer);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: expect.anything() },
        relations: ['level'],
      });
      expect(result).toEqual(mockCustomer);
    });

    it('should throw NotFoundException when customer not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('客户不存在');
    });
  });

  describe('update', () => {
    it('should update a customer successfully', async () => {
      const dto: UpdateCustomerDto = { name: 'Updated Customer' };
      const updatedCustomer = { ...mockCustomer, name: 'Updated Customer' };

      repository.findOne.mockResolvedValue(mockCustomer);
      repository.save.mockResolvedValue(updatedCustomer);

      const result = await service.update(1, dto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: expect.anything() },
      });
      expect(repository.save).toHaveBeenCalled();
      expect(result.name).toBe('Updated Customer');
    });

    it('should throw NotFoundException when customer not found', async () => {
      const dto: UpdateCustomerDto = { name: 'Updated Customer' };

      repository.findOne.mockResolvedValue(null);

      await expect(service.update(999, dto)).rejects.toThrow(NotFoundException);
      await expect(service.update(999, dto)).rejects.toThrow('客户不存在');
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should update multiple fields', async () => {
      const dto: UpdateCustomerDto = {
        name: 'Updated Customer',
        phone: '13900139000',
        address: 'Updated Address',
        status: false,
      };

      repository.findOne.mockResolvedValue(mockCustomer);
      repository.save.mockResolvedValue({ ...mockCustomer, ...dto });

      await service.update(1, dto);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Customer',
          phone: '13900139000',
          address: 'Updated Address',
          status: false,
        }),
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a customer successfully', async () => {
      repository.findOne.mockResolvedValue(mockCustomer);
      repository.save.mockResolvedValue({ ...mockCustomer, deletedAt: new Date(), deletedBy: 1 });

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

    it('should throw NotFoundException when customer not found for removal', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
      await expect(service.remove(999, 1)).rejects.toThrow('客户不存在');
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('updateTotalAmount', () => {
    it('should increment total amount', async () => {
      repository.increment.mockResolvedValue({ affected: 1 } as any);

      await service.updateTotalAmount(1, 500);

      expect(repository.increment).toHaveBeenCalledWith({ id: 1 }, 'totalAmount', 500);
    });

    it('should handle negative amount for decrement', async () => {
      repository.increment.mockResolvedValue({ affected: 1 } as any);

      await service.updateTotalAmount(1, -100);

      expect(repository.increment).toHaveBeenCalledWith({ id: 1 }, 'totalAmount', -100);
    });

    it('should handle zero amount', async () => {
      repository.increment.mockResolvedValue({ affected: 1 } as any);

      await service.updateTotalAmount(1, 0);

      expect(repository.increment).toHaveBeenCalledWith({ id: 1 }, 'totalAmount', 0);
    });
  });
});
