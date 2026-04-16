import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CustomerLevelService } from './customer-level.service';
import { CustomerLevel } from '../../entities/customer-level.entity';
import { CreateCustomerLevelDto } from './dto/create-customer-level.dto';
import { UpdateCustomerLevelDto } from './dto/update-customer-level.dto';
import { createMockRepository } from '../../common/test/mock-repository';

describe('CustomerLevelService', () => {
  let service: CustomerLevelService;
  let repository: ReturnType<typeof createMockRepository<CustomerLevel>>;

  const mockCustomerLevel = {
    id: 1,
    name: 'VIP',
    minAmount: 1000,
    discountPercent: 10,
    level: 1,
    deletedAt: null,
    deletedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as CustomerLevel;

  beforeEach(async () => {
    repository = createMockRepository<CustomerLevel>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerLevelService,
        {
          provide: 'CustomerLevelRepository',
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<CustomerLevelService>(CustomerLevelService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a customer level successfully', async () => {
      const dto: CreateCustomerLevelDto = {
        name: 'VIP',
        minAmount: 1000,
        discountPercent: 10,
        level: 1,
      };

      repository.create.mockReturnValue(mockCustomerLevel);
      repository.save.mockResolvedValue(mockCustomerLevel);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(mockCustomerLevel);
      expect(result).toEqual(mockCustomerLevel);
    });

    it('should create a customer level with default level value', async () => {
      const dto: CreateCustomerLevelDto = {
        name: 'Silver',
        minAmount: 500,
        discountPercent: 5,
      };

      const newLevel = { ...mockCustomerLevel, name: 'Silver', level: 0 };
      repository.create.mockReturnValue(newLevel as CustomerLevel);
      repository.save.mockResolvedValue(newLevel as CustomerLevel);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(result.name).toBe('Silver');
    });
  });

  describe('findAll', () => {
    it('should return all customer levels ordered by level', async () => {
      const levels = [
        { ...mockCustomerLevel, id: 1, level: 1 },
        { ...mockCustomerLevel, id: 2, level: 2 },
      ];

      repository.find.mockResolvedValue(levels as CustomerLevel[]);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        where: { deletedAt: expect.anything() },
        order: { level: 'ASC' },
      });
      expect(result).toEqual(levels);
    });

    it('should return empty array when no levels found', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a customer level by id', async () => {
      repository.findOne.mockResolvedValue(mockCustomerLevel);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: expect.anything() },
      });
      expect(result).toEqual(mockCustomerLevel);
    });

    it('should throw NotFoundException when level not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('客户等级不存在');
    });
  });

  describe('update', () => {
    it('should update a customer level successfully', async () => {
      const dto: UpdateCustomerLevelDto = { name: 'Updated VIP' };
      const updatedLevel = { ...mockCustomerLevel, name: 'Updated VIP' };

      repository.findOne.mockResolvedValue(mockCustomerLevel);
      repository.save.mockResolvedValue(updatedLevel);

      const result = await service.update(1, dto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: expect.anything() },
      });
      expect(repository.save).toHaveBeenCalled();
      expect(result.name).toBe('Updated VIP');
    });

    it('should throw NotFoundException when level not found for update', async () => {
      const dto: UpdateCustomerLevelDto = { name: 'Updated VIP' };

      repository.findOne.mockResolvedValue(null);

      await expect(service.update(999, dto)).rejects.toThrow(NotFoundException);
      await expect(service.update(999, dto)).rejects.toThrow('客户等级不存在');
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('should update multiple fields', async () => {
      const dto: UpdateCustomerLevelDto = {
        name: 'Gold',
        minAmount: 2000,
        discountPercent: 15,
        level: 2,
      };

      repository.findOne.mockResolvedValue(mockCustomerLevel);
      repository.save.mockResolvedValue({ ...mockCustomerLevel, ...dto });

      await service.update(1, dto);

      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Gold',
          minAmount: 2000,
          discountPercent: 15,
          level: 2,
        }),
      );
    });
  });

  describe('remove', () => {
    it('should soft delete a customer level successfully', async () => {
      repository.findOne.mockResolvedValue(mockCustomerLevel);
      repository.update.mockResolvedValue({ affected: 1 } as any);

      await service.remove(1, 1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: expect.anything() },
      });
      expect(repository.update).toHaveBeenCalledWith(1, {
        deletedAt: expect.any(Date),
        deletedBy: 1,
      });
    });

    it('should throw NotFoundException when level not found for removal', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
      await expect(service.remove(999, 1)).rejects.toThrow('客户等级不存在');
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should use correct userId for deletedBy field', async () => {
      repository.findOne.mockResolvedValue(mockCustomerLevel);
      repository.update.mockResolvedValue({ affected: 1 } as any);

      await service.remove(1, 42);

      expect(repository.update).toHaveBeenCalledWith(1, {
        deletedAt: expect.any(Date),
        deletedBy: 42,
      });
    });
  });
});
