import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DiscountService } from './discount.service';
import { Discount, DiscountType, DiscountScope } from '../../entities/discount.entity';
import { createMockRepository } from '../../common/test/mock-repository';

describe('DiscountService', () => {
  let service: DiscountService;
  let discountRepository: ReturnType<typeof createMockRepository<Discount>>;

  const mockDiscount: Discount = {
    id: 1,
    name: 'Summer Sale',
    scope: DiscountScope.ORDER,
    discountType: DiscountType.PERCENT,
    discountValue: 10,
    startTime: new Date('2024-06-01'),
    endTime: new Date('2024-08-31'),
    status: true,
    createdAt: new Date('2024-01-01'),
    deletedAt: null,
    deletedBy: null as any,
  };

  beforeEach(async () => {
    discountRepository = createMockRepository<Discount>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscountService,
        { provide: 'DiscountRepository', useValue: discountRepository },
      ],
    }).compile();

    service = module.get<DiscountService>(DiscountService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      name: 'Summer Sale',
      scope: DiscountScope.ORDER,
      discountType: DiscountType.PERCENT,
      discountValue: 10,
      startTime: new Date('2024-06-01'),
      endTime: new Date('2024-08-31'),
      status: true,
    };

    it('should successfully create a discount', async () => {
      discountRepository.create.mockReturnValue(mockDiscount);
      discountRepository.save.mockResolvedValue(mockDiscount);

      const result = await service.create(createDto);

      expect(discountRepository.create).toHaveBeenCalledWith(createDto);
      expect(discountRepository.save).toHaveBeenCalledWith(mockDiscount);
      expect(result).toEqual(mockDiscount);
    });

    it('should create a discount with fixed type', async () => {
      const fixedDiscount = {
        ...mockDiscount,
        discountType: DiscountType.FIXED,
        discountValue: 50,
      };
      discountRepository.create.mockReturnValue(fixedDiscount);
      discountRepository.save.mockResolvedValue(fixedDiscount);

      const result = await service.create({
        ...createDto,
        discountType: DiscountType.FIXED,
        discountValue: 50,
      });

      expect(result.discountType).toBe(DiscountType.FIXED);
      expect(result.discountValue).toBe(50);
    });

    it('should create a discount with item scope', async () => {
      const itemDiscount = {
        ...mockDiscount,
        scope: DiscountScope.ITEM,
      };
      discountRepository.create.mockReturnValue(itemDiscount);
      discountRepository.save.mockResolvedValue(itemDiscount);

      const result = await service.create({
        ...createDto,
        scope: DiscountScope.ITEM,
      });

      expect(result.scope).toBe(DiscountScope.ITEM);
    });
  });

  describe('findAll', () => {
    it('should return paginated discounts without filters', async () => {
      const discounts = [mockDiscount];
      discountRepository.findAndCount.mockResolvedValue([discounts, 1]);

      const result = await service.findAll({});

      expect(discountRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
          order: { id: 'DESC' },
        }),
      );
      expect(result.list).toEqual(discounts);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('should return paginated discounts with name filter', async () => {
      const discounts = [mockDiscount];
      discountRepository.findAndCount.mockResolvedValue([discounts, 1]);

      const result = await service.findAll({ name: 'Summer' });

      expect(discountRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: expect.any(Object),
          }),
        }),
      );
      expect(result.list).toEqual(discounts);
    });

    it('should return paginated discounts with status filter', async () => {
      const discounts = [mockDiscount];
      discountRepository.findAndCount.mockResolvedValue([discounts, 1]);

      const result = await service.findAll({ status: true });

      expect(discountRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: true,
          }),
        }),
      );
      expect(result.list).toEqual(discounts);
    });

    it('should return paginated discounts with both filters', async () => {
      const discounts = [mockDiscount];
      discountRepository.findAndCount.mockResolvedValue([discounts, 1]);

      const result = await service.findAll({ name: 'Sale', status: true });

      expect(discountRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: expect.any(Object),
            status: true,
          }),
        }),
      );
      expect(result.list).toEqual(discounts);
    });

    it('should return paginated discounts with custom pagination', async () => {
      const discounts = [mockDiscount];
      discountRepository.findAndCount.mockResolvedValue([discounts, 1]);

      const result = await service.findAll({ page: 2, pageSize: 10 });

      expect(discountRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(10);
    });

    it('should use default values when page and pageSize are undefined', async () => {
      const discounts = [mockDiscount];
      discountRepository.findAndCount.mockResolvedValue([discounts, 1]);

      const result = await service.findAll({ page: undefined, pageSize: undefined });

      expect(discountRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        }),
      );
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('should return empty list when no discounts found', async () => {
      discountRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll({});

      expect(result.list).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return a discount when found', async () => {
      discountRepository.findOne.mockResolvedValue(mockDiscount);

      const result = await service.findOne(1);

      expect(discountRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: expect.anything() },
      });
      expect(result).toEqual(mockDiscount);
    });

    it('should throw NotFoundException when discount not found', async () => {
      discountRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('折扣活动不存在');
    });
  });

  describe('update', () => {
    const updateDto = { name: 'Updated Sale', discountValue: 20 };

    it('should successfully update a discount', async () => {
      discountRepository.findOne.mockResolvedValue(mockDiscount);
      discountRepository.save.mockResolvedValue({ ...mockDiscount, ...updateDto });

      const result = await service.update(1, updateDto);

      expect(discountRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: expect.anything() },
      });
      expect(discountRepository.save).toHaveBeenCalled();
      expect(result.name).toBe('Updated Sale');
      expect(result.discountValue).toBe(20);
    });

    it('should throw NotFoundException when discount not found', async () => {
      discountRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update(999, updateDto)).rejects.toThrow('折扣活动不存在');
    });

    it('should update status to false', async () => {
      discountRepository.findOne.mockResolvedValue(mockDiscount);
      discountRepository.save.mockResolvedValue({ ...mockDiscount, status: false });

      const result = await service.update(1, { status: false });

      expect(result.status).toBe(false);
    });

    it('should update discount type', async () => {
      discountRepository.findOne.mockResolvedValue(mockDiscount);
      discountRepository.save.mockResolvedValue({
        ...mockDiscount,
        discountType: DiscountType.FIXED,
      });

      const result = await service.update(1, {
        discountType: DiscountType.FIXED,
      });

      expect(result.discountType).toBe(DiscountType.FIXED);
    });

    it('should update dates', async () => {
      const newStartTime = new Date('2024-07-01');
      const newEndTime = new Date('2024-09-30');
      discountRepository.findOne.mockResolvedValue(mockDiscount);
      discountRepository.save.mockResolvedValue({
        ...mockDiscount,
        startTime: newStartTime,
        endTime: newEndTime,
      });

      const result = await service.update(1, {
        startTime: newStartTime,
        endTime: newEndTime,
      });

      expect(result.startTime).toEqual(newStartTime);
      expect(result.endTime).toEqual(newEndTime);
    });
  });

  describe('remove', () => {
    const userId = 1;

    it('should successfully remove a discount', async () => {
      discountRepository.findOne.mockResolvedValue(mockDiscount);
      discountRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.remove(1, userId);

      expect(discountRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: expect.anything() },
      });
      expect(discountRepository.update).toHaveBeenCalledWith(1, {
        deletedAt: expect.any(Date),
        deletedBy: userId,
      });
    });

    it('should throw NotFoundException when discount not found', async () => {
      discountRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999, userId)).rejects.toThrow(NotFoundException);
      await expect(service.remove(999, userId)).rejects.toThrow('折扣活动不存在');
    });

    it('should set deletedAt and deletedBy on remove', async () => {
      discountRepository.findOne.mockResolvedValue(mockDiscount);
      discountRepository.update.mockResolvedValue({ affected: 1 } as any);

      await service.remove(1, userId);

      expect(discountRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          deletedBy: userId,
        }),
      );
      expect(discountRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          deletedAt: expect.any(Date),
        }),
      );
    });
  });

  describe('getActiveDiscounts', () => {
    it('should return active discounts', async () => {
      const activeDiscounts = [
        mockDiscount,
        { ...mockDiscount, id: 2, name: 'Winter Sale' },
      ];
      discountRepository.find.mockResolvedValue(activeDiscounts);

      const result = await service.getActiveDiscounts();

      expect(discountRepository.find).toHaveBeenCalledWith({
        where: {
          status: true,
          deletedAt: expect.anything(),
        },
      });
      expect(result).toEqual(activeDiscounts);
    });

    it('should return empty array when no active discounts', async () => {
      discountRepository.find.mockResolvedValue([]);

      const result = await service.getActiveDiscounts();

      expect(result).toEqual([]);
    });

    it('should only return discounts with status true', async () => {
      discountRepository.find.mockResolvedValue([mockDiscount]);

      await service.getActiveDiscounts();

      expect(discountRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: true,
          }),
        }),
      );
    });
  });
});
