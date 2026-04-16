import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UpdateResult } from 'typeorm';
import { CouponService } from './coupon.service';
import { Coupon, CouponType } from '../../entities/coupon.entity';
import { createMockRepository } from '../../common/test/mock-repository';

describe('CouponService', () => {
  let service: CouponService;
  let couponRepository: ReturnType<typeof createMockRepository<Coupon>>;

  const mockCoupon: Coupon = {
    id: 1,
    code: 'TEST2024',
    name: 'Test Coupon',
    type: CouponType.FULL_REDUCTION,
    minAmount: 100,
    discountValue: 20,
    totalCount: 100,
    usedCount: 10,
    startTime: new Date('2025-01-01'),
    endTime: new Date('2027-12-31'),
    status: true,
    createdAt: new Date('2024-01-01'),
    deletedAt: null,
    deletedBy: null as any,
  };

  beforeEach(async () => {
    couponRepository = createMockRepository<Coupon>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponService,
        { provide: 'CouponRepository', useValue: couponRepository },
      ],
    }).compile();

    service = module.get<CouponService>(CouponService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      code: 'NEWCODE2024',
      name: 'New Coupon',
      type: CouponType.FULL_REDUCTION,
      minAmount: 50,
      discountValue: 10,
      totalCount: 50,
      startTime: new Date('2024-01-01'),
      endTime: new Date('2024-12-31'),
    };

    it('should successfully create a coupon', async () => {
      couponRepository.findOne.mockResolvedValue(null);
      couponRepository.create.mockReturnValue(mockCoupon);
      couponRepository.save.mockResolvedValue(mockCoupon);

      const result = await service.create(createDto);

      expect(couponRepository.findOne).toHaveBeenCalledWith({
        where: { code: createDto.code },
      });
      expect(couponRepository.create).toHaveBeenCalledWith(createDto);
      expect(couponRepository.save).toHaveBeenCalledWith(mockCoupon);
      expect(result).toEqual(mockCoupon);
    });

    it('should throw BadRequestException if coupon code already exists', async () => {
      couponRepository.findOne.mockResolvedValue(mockCoupon);

      await expect(service.create(createDto)).rejects.toThrow(BadRequestException);
      await expect(service.create(createDto)).rejects.toThrow('优惠券码已存在');
    });
  });

  describe('findAll', () => {
    it('should return paginated coupons without filters', async () => {
      const coupons = [mockCoupon];
      couponRepository.findAndCount.mockResolvedValue([coupons, 1]);

      const result = await service.findAll({});

      expect(couponRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
          order: { id: 'DESC' },
        }),
      );
      expect(result.list).toEqual(coupons);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('should return paginated coupons with code filter', async () => {
      const coupons = [mockCoupon];
      couponRepository.findAndCount.mockResolvedValue([coupons, 1]);

      const result = await service.findAll({ code: 'TEST' });

      expect(couponRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            code: expect.any(Object),
          }),
        }),
      );
      expect(result.list).toEqual(coupons);
    });

    it('should return paginated coupons with name filter', async () => {
      const coupons = [mockCoupon];
      couponRepository.findAndCount.mockResolvedValue([coupons, 1]);

      const result = await service.findAll({ name: 'Test' });

      expect(couponRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: expect.any(Object),
          }),
        }),
      );
      expect(result.list).toEqual(coupons);
    });

    it('should return paginated coupons with status filter', async () => {
      const coupons = [mockCoupon];
      couponRepository.findAndCount.mockResolvedValue([coupons, 1]);

      const result = await service.findAll({ status: true });

      expect(couponRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: true,
          }),
        }),
      );
      expect(result.list).toEqual(coupons);
    });

    it('should return paginated coupons with all filters', async () => {
      const coupons = [mockCoupon];
      couponRepository.findAndCount.mockResolvedValue([coupons, 1]);

      const result = await service.findAll({
        code: 'TEST',
        name: 'Test',
        status: true,
      });

      expect(couponRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            code: expect.any(Object),
            name: expect.any(Object),
            status: true,
          }),
        }),
      );
      expect(result.list).toEqual(coupons);
    });

    it('should return paginated coupons with custom pagination', async () => {
      const coupons = [mockCoupon];
      couponRepository.findAndCount.mockResolvedValue([coupons, 1]);

      const result = await service.findAll({ page: 2, pageSize: 10 });

      expect(couponRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(10);
    });

    it('should use default page and pageSize when not provided', async () => {
      const coupons = [mockCoupon];
      couponRepository.findAndCount.mockResolvedValue([coupons, 1]);

      const result = await service.findAll({});

      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });
  });

  describe('findOne', () => {
    it('should return a coupon when found', async () => {
      couponRepository.findOne.mockResolvedValue(mockCoupon);

      const result = await service.findOne(1);

      expect(couponRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: expect.anything() },
      });
      expect(result).toEqual(mockCoupon);
    });

    it('should throw NotFoundException when coupon not found', async () => {
      couponRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('优惠券不存在');
    });
  });

  describe('update', () => {
    const updateDto = { name: 'Updated Coupon' };

    it('should successfully update a coupon', async () => {
      couponRepository.findOne.mockResolvedValue(mockCoupon);
      couponRepository.save.mockResolvedValue({ ...mockCoupon, ...updateDto });

      const result = await service.update(1, updateDto);

      expect(couponRepository.save).toHaveBeenCalled();
      expect(result.name).toBe('Updated Coupon');
    });

    it('should throw NotFoundException when coupon not found', async () => {
      couponRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(NotFoundException);
      await expect(service.update(999, updateDto)).rejects.toThrow('优惠券不存在');
    });

    it('should throw BadRequestException when code already exists', async () => {
      const anotherCoupon = { ...mockCoupon, id: 2, code: 'EXISTINGCODE' };
      couponRepository.findOne
        .mockResolvedValueOnce(mockCoupon)
        .mockResolvedValueOnce(anotherCoupon);

      const promise = service.update(1, { code: 'EXISTINGCODE' });
      await expect(promise).rejects.toThrow(BadRequestException);
      await expect(promise).rejects.toThrow('优惠券码已存在');
    });

    it('should allow updating to same code', async () => {
      couponRepository.findOne.mockResolvedValue(mockCoupon);
      couponRepository.save.mockResolvedValue(mockCoupon);

      const result = await service.update(1, { code: 'TEST2024' });

      expect(couponRepository.findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCoupon);
    });

    it('should update code to a new unique code', async () => {
      couponRepository.findOne.mockResolvedValueOnce(mockCoupon);
      couponRepository.findOne.mockResolvedValueOnce(null);
      couponRepository.save.mockResolvedValue({ ...mockCoupon, code: 'NEWCODE' });

      const result = await service.update(1, { code: 'NEWCODE' });

      expect(couponRepository.findOne).toHaveBeenCalledTimes(2);
      expect(result.code).toBe('NEWCODE');
    });
  });

  describe('remove', () => {
    it('should successfully remove a coupon', async () => {
      couponRepository.findOne.mockResolvedValue(mockCoupon);
      couponRepository.update.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] } as UpdateResult);

      await service.remove(1, 1);

      expect(couponRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: expect.anything() },
      });
      expect(couponRepository.update).toHaveBeenCalledWith(1, {
        deletedAt: expect.any(Date),
        deletedBy: 1,
      });
    });

    it('should throw NotFoundException when coupon not found', async () => {
      couponRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
      await expect(service.remove(999, 1)).rejects.toThrow('优惠券不存在');
    });
  });

  describe('validateCoupon', () => {
    const validateDto = {
      code: 'TEST2024',
      orderAmount: 200,
    };

    it('should return invalid when coupon not found', async () => {
      couponRepository.findOne.mockResolvedValue(null);

      const result = await service.validateCoupon(validateDto);

      expect(result).toEqual({
        valid: false,
        discountAmount: 0,
        message: '优惠券不存在',
      });
    });

    it('should return invalid when coupon is disabled', async () => {
      couponRepository.findOne.mockResolvedValue({ ...mockCoupon, status: false });

      const result = await service.validateCoupon(validateDto);

      expect(result).toEqual({
        valid: false,
        discountAmount: 0,
        message: '优惠券已禁用',
      });
    });

    it('should return invalid when coupon has not started', async () => {
      const futureCoupon = {
        ...mockCoupon,
        startTime: new Date(Date.now() + 86400000),
        endTime: new Date(Date.now() + 86400000 * 2),
      };
      couponRepository.findOne.mockResolvedValue(futureCoupon);

      const result = await service.validateCoupon(validateDto);

      expect(result).toEqual({
        valid: false,
        discountAmount: 0,
        message: '优惠券尚未生效',
      });
    });

    it('should return invalid when coupon is expired', async () => {
      const expiredCoupon = {
        ...mockCoupon,
        startTime: new Date('2023-01-01'),
        endTime: new Date('2023-12-31'),
      };
      couponRepository.findOne.mockResolvedValue(expiredCoupon);

      const result = await service.validateCoupon(validateDto);

      expect(result).toEqual({
        valid: false,
        discountAmount: 0,
        message: '优惠券已过期',
      });
    });

    it('should return invalid when coupon is used up', async () => {
      couponRepository.findOne.mockResolvedValue({ ...mockCoupon, totalCount: 10, usedCount: 10 });

      const result = await service.validateCoupon(validateDto);

      expect(result).toEqual({
        valid: false,
        discountAmount: 0,
        message: '优惠券已用完',
      });
    });

    it('should return invalid when order amount is less than min amount', async () => {
      couponRepository.findOne.mockResolvedValue(mockCoupon);

      const result = await service.validateCoupon({
        code: 'TEST2024',
        orderAmount: 50,
      });

      expect(result).toEqual({
        valid: false,
        discountAmount: 0,
        message: '订单金额需满100元',
      });
    });

    it('should return valid for FULL_REDUCTION coupon type', async () => {
      couponRepository.findOne.mockResolvedValue(mockCoupon);

      const result = await service.validateCoupon(validateDto);

      expect(result.valid).toBe(true);
      expect(result.discountAmount).toBe(20);
      expect(result.message).toBe('优惠券可用');
      expect(result.coupon).toEqual(mockCoupon);
    });

    it('should return valid for CASH coupon type', async () => {
      couponRepository.findOne.mockResolvedValue({
        ...mockCoupon,
        type: CouponType.CASH,
        discountValue: 30,
      });

      const result = await service.validateCoupon(validateDto);

      expect(result.valid).toBe(true);
      expect(result.discountAmount).toBe(30);
    });

    it('should calculate discount correctly for DISCOUNT coupon type', async () => {
      couponRepository.findOne.mockResolvedValue({
        ...mockCoupon,
        type: CouponType.DISCOUNT,
        discountValue: 80,
      });

      const result = await service.validateCoupon({
        code: 'TEST2024',
        orderAmount: 100,
      });

      expect(result.valid).toBe(true);
      expect(result.discountAmount).toBeCloseTo(20);
    });

    it('should return valid when totalCount is 0 (unlimited)', async () => {
      couponRepository.findOne.mockResolvedValue({ ...mockCoupon, totalCount: 0, usedCount: 100 });

      const result = await service.validateCoupon(validateDto);

      expect(result.valid).toBe(true);
    });

    it('should return valid when order amount equals min amount', async () => {
      couponRepository.findOne.mockResolvedValue(mockCoupon);

      const result = await service.validateCoupon({
        code: 'TEST2024',
        orderAmount: 100,
      });

      expect(result.valid).toBe(true);
    });
  });

  describe('useCoupon', () => {
    it('should increment used count', async () => {
      couponRepository.increment.mockResolvedValue({ affected: 1, raw: {}, generatedMaps: [] } as UpdateResult);

      await service.useCoupon(1);

      expect(couponRepository.increment).toHaveBeenCalledWith({ id: 1 }, 'usedCount', 1);
    });
  });
});
