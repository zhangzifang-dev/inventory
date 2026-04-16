import { Test, TestingModule } from '@nestjs/testing';
import { ReportService, SalesReport, PurchaseReport, ProfitReport } from './report.service';
import { SalesOrder, SalesOrderStatus } from '../../entities/sales-order.entity';
import { SalesOrderItem } from '../../entities/sales-order-item.entity';
import { PurchaseOrder } from '../../entities/purchase-order.entity';
import { PurchaseOrderItem } from '../../entities/purchase-order-item.entity';
import { GroupByType } from './dto/report-query.dto';
import { createMockRepository } from '../../common/test/mock-repository';

describe('ReportService', () => {
  let service: ReportService;
  let salesOrderRepository: ReturnType<typeof createMockRepository<SalesOrder>>;
  let salesOrderItemRepository: ReturnType<typeof createMockRepository<SalesOrderItem>>;
  let purchaseOrderRepository: ReturnType<typeof createMockRepository<PurchaseOrder>>;
  let purchaseOrderItemRepository: ReturnType<typeof createMockRepository<PurchaseOrderItem>>;

  const createMockQueryBuilder = () => ({
    innerJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  });

  beforeEach(async () => {
    salesOrderRepository = createMockRepository<SalesOrder>();
    salesOrderItemRepository = createMockRepository<SalesOrderItem>();
    purchaseOrderRepository = createMockRepository<PurchaseOrder>();
    purchaseOrderItemRepository = createMockRepository<PurchaseOrderItem>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        { provide: 'SalesOrderRepository', useValue: salesOrderRepository },
        { provide: 'SalesOrderItemRepository', useValue: salesOrderItemRepository },
        { provide: 'PurchaseOrderRepository', useValue: purchaseOrderRepository },
        { provide: 'PurchaseOrderItemRepository', useValue: purchaseOrderItemRepository },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSalesReport', () => {
    const query = {
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    };

    const mockSalesOrders = [
      {
        id: 1,
        totalAmount: 1000,
        discountAmount: 50,
        couponDiscount: 20,
        finalAmount: 930,
        status: SalesOrderStatus.COMPLETED,
        createdAt: new Date('2026-01-15'),
      },
      {
        id: 2,
        totalAmount: 2000,
        discountAmount: 100,
        couponDiscount: 0,
        finalAmount: 1900,
        status: SalesOrderStatus.COMPLETED,
        createdAt: new Date('2026-01-20'),
      },
    ];

    const mockSalesItems = [
      { id: 1, quantity: 5 },
      { id: 2, quantity: 10 },
    ];

    it('should return sales report with completed orders by default', async () => {
      salesOrderRepository.find.mockResolvedValue(mockSalesOrders as SalesOrder[]);
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getMany.mockResolvedValue(mockSalesItems as SalesOrderItem[]);
      salesOrderItemRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getSalesReport(query);

      expect(result.totalOrders).toBe(2);
      expect(result.totalAmount).toBe(3000);
      expect(result.totalDiscount).toBe(170);
      expect(result.finalAmount).toBe(2830);
      expect(result.totalQuantity).toBe(15);
      expect(result.byDate).toBeDefined();
      expect(result.byDate).toHaveLength(2);
    });

    it('should filter by specified status', async () => {
      const queryWithStatus = {
        ...query,
        status: 'pending,completed',
      };

      salesOrderRepository.find.mockResolvedValue(mockSalesOrders as SalesOrder[]);
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getMany.mockResolvedValue(mockSalesItems as SalesOrderItem[]);
      salesOrderItemRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await service.getSalesReport(queryWithStatus);

      const findCall = salesOrderRepository.find.mock.calls[0][0] as any;
      expect(findCall.where.status._value).toEqual(['pending', 'completed']);
      expect(findCall.where.status._type).toBe('in');
    });

    it('should group by month when groupBy is month', async () => {
      const monthQuery = {
        startDate: '2026-01-01',
        endDate: '2026-02-28',
        groupBy: GroupByType.MONTH,
      };

      const ordersByMonth = [
        {
          id: 1,
          totalAmount: 1000,
          discountAmount: 0,
          couponDiscount: 0,
          finalAmount: 1000,
          status: SalesOrderStatus.COMPLETED,
          createdAt: new Date('2026-01-15'),
        },
        {
          id: 2,
          totalAmount: 2000,
          discountAmount: 0,
          couponDiscount: 0,
          finalAmount: 2000,
          status: SalesOrderStatus.COMPLETED,
          createdAt: new Date('2026-02-10'),
        },
        {
          id: 3,
          totalAmount: 500,
          discountAmount: 0,
          couponDiscount: 0,
          finalAmount: 500,
          status: SalesOrderStatus.COMPLETED,
          createdAt: new Date('2026-02-20'),
        },
      ];

      salesOrderRepository.find.mockResolvedValue(ordersByMonth as SalesOrder[]);
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getMany.mockResolvedValue([]);
      salesOrderItemRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getSalesReport(monthQuery);

      expect(result.byDate).toHaveLength(2);
      expect(result.byDate![0].date).toBe('2026-01');
      expect(result.byDate![1].date).toBe('2026-02');
      expect(result.byDate![1].orders).toBe(2);
      expect(result.byDate![1].amount).toBe(2500);
    });

    it('should return empty report when no orders found', async () => {
      salesOrderRepository.find.mockResolvedValue([]);
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getMany.mockResolvedValue([]);
      salesOrderItemRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getSalesReport(query);

      expect(result.totalOrders).toBe(0);
      expect(result.totalAmount).toBe(0);
      expect(result.totalDiscount).toBe(0);
      expect(result.finalAmount).toBe(0);
      expect(result.totalQuantity).toBe(0);
      expect(result.byDate).toEqual([]);
    });

    it('should correctly calculate totals with zero values', async () => {
      const ordersWithZeros = [
        {
          id: 1,
          totalAmount: 0,
          discountAmount: 0,
          couponDiscount: 0,
          finalAmount: 0,
          status: SalesOrderStatus.COMPLETED,
          createdAt: new Date('2026-01-15'),
        },
      ];

      salesOrderRepository.find.mockResolvedValue(ordersWithZeros as SalesOrder[]);
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getMany.mockResolvedValue([]);
      salesOrderItemRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getSalesReport(query);

      expect(result.totalAmount).toBe(0);
      expect(result.finalAmount).toBe(0);
    });

    it('should handle orders on the same day', async () => {
      const sameDayOrders = [
        {
          id: 1,
          totalAmount: 100,
          discountAmount: 0,
          couponDiscount: 0,
          finalAmount: 100,
          status: SalesOrderStatus.COMPLETED,
          createdAt: new Date('2026-01-15T10:00:00'),
        },
        {
          id: 2,
          totalAmount: 200,
          discountAmount: 0,
          couponDiscount: 0,
          finalAmount: 200,
          status: SalesOrderStatus.COMPLETED,
          createdAt: new Date('2026-01-15T15:00:00'),
        },
      ];

      salesOrderRepository.find.mockResolvedValue(sameDayOrders as SalesOrder[]);
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getMany.mockResolvedValue([]);
      salesOrderItemRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getSalesReport(query);

      expect(result.byDate).toHaveLength(1);
      expect(result.byDate![0].orders).toBe(2);
      expect(result.byDate![0].amount).toBe(300);
    });

    it('should use query builder with correct parameters', async () => {
      salesOrderRepository.find.mockResolvedValue(mockSalesOrders as SalesOrder[]);
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getMany.mockResolvedValue(mockSalesItems as SalesOrderItem[]);
      salesOrderItemRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await service.getSalesReport(query);

      expect(salesOrderItemRepository.createQueryBuilder).toHaveBeenCalledWith('item');
      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith('item.order', 'order');
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
    });
  });

  describe('getPurchaseReport', () => {
    const query = {
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    };

    const mockPurchaseOrders = [
      {
        id: 1,
        totalAmount: 5000,
        status: 'completed',
        createdAt: new Date('2026-01-15'),
      },
      {
        id: 2,
        totalAmount: 3000,
        status: 'completed',
        createdAt: new Date('2026-01-20'),
      },
    ];

    const mockPurchaseItems = [
      { id: 1, quantity: 20 },
      { id: 2, quantity: 15 },
    ];

    it('should return purchase report successfully', async () => {
      purchaseOrderRepository.find.mockResolvedValue(mockPurchaseOrders as PurchaseOrder[]);
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getMany.mockResolvedValue(mockPurchaseItems as PurchaseOrderItem[]);
      purchaseOrderItemRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getPurchaseReport(query);

      expect(result.totalOrders).toBe(2);
      expect(result.totalAmount).toBe(8000);
      expect(result.totalQuantity).toBe(35);
      expect(result.byDate).toBeDefined();
      expect(result.byDate).toHaveLength(2);
    });

    it('should filter by specified status', async () => {
      const queryWithStatus = {
        ...query,
        status: 'pending,approved',
      };

      purchaseOrderRepository.find.mockResolvedValue(mockPurchaseOrders as PurchaseOrder[]);
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getMany.mockResolvedValue(mockPurchaseItems as PurchaseOrderItem[]);
      purchaseOrderItemRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await service.getPurchaseReport(queryWithStatus);

      const findCall = purchaseOrderRepository.find.mock.calls[0][0] as any;
      expect(findCall.where.status._value).toEqual(['pending', 'approved']);
      expect(findCall.where.status._type).toBe('in');
    });

    it('should return empty report when no orders found', async () => {
      purchaseOrderRepository.find.mockResolvedValue([]);
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getMany.mockResolvedValue([]);
      purchaseOrderItemRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getPurchaseReport(query);

      expect(result.totalOrders).toBe(0);
      expect(result.totalAmount).toBe(0);
      expect(result.totalQuantity).toBe(0);
      expect(result.byDate).toEqual([]);
    });

    it('should group by month when groupBy is month', async () => {
      const monthQuery = {
        startDate: '2026-01-01',
        endDate: '2026-02-28',
        groupBy: GroupByType.MONTH,
      };

      const ordersByMonth = [
        {
          id: 1,
          totalAmount: 1000,
          status: 'completed',
          createdAt: new Date('2026-01-15'),
        },
        {
          id: 2,
          totalAmount: 2000,
          status: 'completed',
          createdAt: new Date('2026-02-10'),
        },
      ];

      purchaseOrderRepository.find.mockResolvedValue(ordersByMonth as PurchaseOrder[]);
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getMany.mockResolvedValue([]);
      purchaseOrderItemRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      const result = await service.getPurchaseReport(monthQuery);

      expect(result.byDate).toHaveLength(2);
      expect(result.byDate![0].date).toBe('2026-01');
      expect(result.byDate![1].date).toBe('2026-02');
    });

    it('should use query builder with correct parameters', async () => {
      purchaseOrderRepository.find.mockResolvedValue(mockPurchaseOrders as PurchaseOrder[]);
      const mockQueryBuilder = createMockQueryBuilder();
      mockQueryBuilder.getMany.mockResolvedValue(mockPurchaseItems as PurchaseOrderItem[]);
      purchaseOrderItemRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

      await service.getPurchaseReport(query);

      expect(purchaseOrderItemRepository.createQueryBuilder).toHaveBeenCalledWith('item');
      expect(mockQueryBuilder.innerJoin).toHaveBeenCalledWith('item.order', 'order');
      expect(mockQueryBuilder.where).toHaveBeenCalled();
    });
  });

  describe('getProfitReport', () => {
    const query = {
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    };

    it('should return profit report successfully', async () => {
      const mockSalesOrders = [
        {
          id: 1,
          totalAmount: 10000,
          discountAmount: 500,
          couponDiscount: 0,
          finalAmount: 9500,
          status: SalesOrderStatus.COMPLETED,
          createdAt: new Date('2026-01-15'),
        },
      ];

      const mockPurchaseOrders = [
        {
          id: 1,
          totalAmount: 6000,
          status: 'completed',
          createdAt: new Date('2026-01-15'),
        },
      ];

      salesOrderRepository.find.mockResolvedValue(mockSalesOrders as SalesOrder[]);
      purchaseOrderRepository.find.mockResolvedValue(mockPurchaseOrders as PurchaseOrder[]);

      const mockSalesQueryBuilder = createMockQueryBuilder();
      mockSalesQueryBuilder.getMany.mockResolvedValue([]);
      salesOrderItemRepository.createQueryBuilder.mockReturnValue(mockSalesQueryBuilder as any);

      const mockPurchaseQueryBuilder = createMockQueryBuilder();
      mockPurchaseQueryBuilder.getMany.mockResolvedValue([]);
      purchaseOrderItemRepository.createQueryBuilder.mockReturnValue(mockPurchaseQueryBuilder as any);

      const result = await service.getProfitReport(query);

      expect(result.totalRevenue).toBe(9500);
      expect(result.totalCost).toBe(6000);
      expect(result.totalProfit).toBe(3500);
      expect(result.profitMargin).toBeCloseTo(36.84, 1);
    });

    it('should calculate profit margin as 0 when revenue is 0', async () => {
      salesOrderRepository.find.mockResolvedValue([]);
      purchaseOrderRepository.find.mockResolvedValue([]);

      const mockSalesQueryBuilder = createMockQueryBuilder();
      mockSalesQueryBuilder.getMany.mockResolvedValue([]);
      salesOrderItemRepository.createQueryBuilder.mockReturnValue(mockSalesQueryBuilder as any);

      const mockPurchaseQueryBuilder = createMockQueryBuilder();
      mockPurchaseQueryBuilder.getMany.mockResolvedValue([]);
      purchaseOrderItemRepository.createQueryBuilder.mockReturnValue(mockPurchaseQueryBuilder as any);

      const result = await service.getProfitReport(query);

      expect(result.totalRevenue).toBe(0);
      expect(result.profitMargin).toBe(0);
    });

    it('should handle negative profit', async () => {
      const mockSalesOrders = [
        {
          id: 1,
          totalAmount: 3000,
          discountAmount: 0,
          couponDiscount: 0,
          finalAmount: 3000,
          status: SalesOrderStatus.COMPLETED,
          createdAt: new Date('2026-01-15'),
        },
      ];

      const mockPurchaseOrders = [
        {
          id: 1,
          totalAmount: 5000,
          status: 'completed',
          createdAt: new Date('2026-01-15'),
        },
      ];

      salesOrderRepository.find.mockResolvedValue(mockSalesOrders as SalesOrder[]);
      purchaseOrderRepository.find.mockResolvedValue(mockPurchaseOrders as PurchaseOrder[]);

      const mockSalesQueryBuilder = createMockQueryBuilder();
      mockSalesQueryBuilder.getMany.mockResolvedValue([]);
      salesOrderItemRepository.createQueryBuilder.mockReturnValue(mockSalesQueryBuilder as any);

      const mockPurchaseQueryBuilder = createMockQueryBuilder();
      mockPurchaseQueryBuilder.getMany.mockResolvedValue([]);
      purchaseOrderItemRepository.createQueryBuilder.mockReturnValue(mockPurchaseQueryBuilder as any);

      const result = await service.getProfitReport(query);

      expect(result.totalProfit).toBe(-2000);
      expect(result.profitMargin).toBeCloseTo(-66.67, 0);
    });

    it('should merge byDate data correctly', async () => {
      const mockSalesOrders = [
        {
          id: 1,
          totalAmount: 1000,
          discountAmount: 0,
          couponDiscount: 0,
          finalAmount: 1000,
          status: SalesOrderStatus.COMPLETED,
          createdAt: new Date('2026-01-15'),
        },
        {
          id: 2,
          totalAmount: 2000,
          discountAmount: 0,
          couponDiscount: 0,
          finalAmount: 2000,
          status: SalesOrderStatus.COMPLETED,
          createdAt: new Date('2026-01-20'),
        },
      ];

      const mockPurchaseOrders = [
        {
          id: 1,
          totalAmount: 500,
          status: 'completed',
          createdAt: new Date('2026-01-15'),
        },
        {
          id: 2,
          totalAmount: 800,
          status: 'completed',
          createdAt: new Date('2026-01-25'),
        },
      ];

      salesOrderRepository.find.mockResolvedValue(mockSalesOrders as SalesOrder[]);
      purchaseOrderRepository.find.mockResolvedValue(mockPurchaseOrders as PurchaseOrder[]);

      const mockSalesQueryBuilder = createMockQueryBuilder();
      mockSalesQueryBuilder.getMany.mockResolvedValue([]);
      salesOrderItemRepository.createQueryBuilder.mockReturnValue(mockSalesQueryBuilder as any);

      const mockPurchaseQueryBuilder = createMockQueryBuilder();
      mockPurchaseQueryBuilder.getMany.mockResolvedValue([]);
      purchaseOrderItemRepository.createQueryBuilder.mockReturnValue(mockPurchaseQueryBuilder as any);

      const result = await service.getProfitReport(query);

      expect(result.byDate).toBeDefined();
      const jan15 = result.byDate!.find((d) => d.date === '2026-01-15');
      expect(jan15).toBeDefined();
      expect(jan15!.revenue).toBe(1000);
      expect(jan15!.cost).toBe(500);
      expect(jan15!.profit).toBe(500);
    });

    it('should handle dates only in sales but not in purchase', async () => {
      const mockSalesOrders = [
        {
          id: 1,
          totalAmount: 1000,
          discountAmount: 0,
          couponDiscount: 0,
          finalAmount: 1000,
          status: SalesOrderStatus.COMPLETED,
          createdAt: new Date('2026-01-15'),
        },
      ];

      const mockPurchaseOrders: any[] = [];

      salesOrderRepository.find.mockResolvedValue(mockSalesOrders as SalesOrder[]);
      purchaseOrderRepository.find.mockResolvedValue(mockPurchaseOrders as PurchaseOrder[]);

      const mockSalesQueryBuilder = createMockQueryBuilder();
      mockSalesQueryBuilder.getMany.mockResolvedValue([]);
      salesOrderItemRepository.createQueryBuilder.mockReturnValue(mockSalesQueryBuilder as any);

      const mockPurchaseQueryBuilder = createMockQueryBuilder();
      mockPurchaseQueryBuilder.getMany.mockResolvedValue([]);
      purchaseOrderItemRepository.createQueryBuilder.mockReturnValue(mockPurchaseQueryBuilder as any);

      const result = await service.getProfitReport(query);

      const jan15 = result.byDate!.find((d) => d.date === '2026-01-15');
      expect(jan15).toBeDefined();
      expect(jan15!.revenue).toBe(1000);
      expect(jan15!.cost).toBe(0);
      expect(jan15!.profit).toBe(1000);
    });

    it('should handle dates only in purchase but not in sales', async () => {
      const mockSalesOrders: any[] = [];

      const mockPurchaseOrders = [
        {
          id: 1,
          totalAmount: 500,
          status: 'completed',
          createdAt: new Date('2026-01-15'),
        },
      ];

      salesOrderRepository.find.mockResolvedValue(mockSalesOrders as SalesOrder[]);
      purchaseOrderRepository.find.mockResolvedValue(mockPurchaseOrders as PurchaseOrder[]);

      const mockSalesQueryBuilder = createMockQueryBuilder();
      mockSalesQueryBuilder.getMany.mockResolvedValue([]);
      salesOrderItemRepository.createQueryBuilder.mockReturnValue(mockSalesQueryBuilder as any);

      const mockPurchaseQueryBuilder = createMockQueryBuilder();
      mockPurchaseQueryBuilder.getMany.mockResolvedValue([]);
      purchaseOrderItemRepository.createQueryBuilder.mockReturnValue(mockPurchaseQueryBuilder as any);

      const result = await service.getProfitReport(query);

      const jan15 = result.byDate!.find((d) => d.date === '2026-01-15');
      expect(jan15).toBeDefined();
      expect(jan15!.revenue).toBe(0);
      expect(jan15!.cost).toBe(500);
      expect(jan15!.profit).toBe(-500);
    });

    it('should return empty byDate when no sales and no purchases', async () => {
      salesOrderRepository.find.mockResolvedValue([]);
      purchaseOrderRepository.find.mockResolvedValue([]);

      const mockSalesQueryBuilder = createMockQueryBuilder();
      mockSalesQueryBuilder.getMany.mockResolvedValue([]);
      salesOrderItemRepository.createQueryBuilder.mockReturnValue(mockSalesQueryBuilder as any);

      const mockPurchaseQueryBuilder = createMockQueryBuilder();
      mockPurchaseQueryBuilder.getMany.mockResolvedValue([]);
      purchaseOrderItemRepository.createQueryBuilder.mockReturnValue(mockPurchaseQueryBuilder as any);

      const result = await service.getProfitReport(query);

      expect(result.byDate).toEqual([]);
    });
  });

  describe('groupByDate (private method)', () => {
    it('should group orders by day', () => {
      const orders = [
        { createdAt: new Date('2026-01-15'), finalAmount: 100 },
        { createdAt: new Date('2026-01-15'), finalAmount: 200 },
        { createdAt: new Date('2026-01-20'), finalAmount: 300 },
      ];

      const result = service['groupByDate'](orders, 'finalAmount', undefined);

      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2026-01-15');
      expect(result[0].amount).toBe(300);
      expect(result[0].orders).toBe(2);
      expect(result[1].date).toBe('2026-01-20');
      expect(result[1].amount).toBe(300);
      expect(result[1].orders).toBe(1);
    });

    it('should group orders by month', () => {
      const orders = [
        { createdAt: new Date('2026-01-15'), finalAmount: 100 },
        { createdAt: new Date('2026-01-20'), finalAmount: 200 },
        { createdAt: new Date('2026-02-10'), finalAmount: 300 },
      ];

      const result = service['groupByDate'](orders, 'finalAmount', 'month');

      expect(result).toHaveLength(2);
      expect(result[0].date).toBe('2026-01');
      expect(result[0].amount).toBe(300);
      expect(result[0].orders).toBe(2);
      expect(result[1].date).toBe('2026-02');
      expect(result[1].amount).toBe(300);
      expect(result[1].orders).toBe(1);
    });

    it('should return empty array for empty orders', () => {
      const result = service['groupByDate']([], 'finalAmount', undefined);

      expect(result).toEqual([]);
    });

    it('should sort by date ascending', () => {
      const orders = [
        { createdAt: new Date('2026-01-20'), finalAmount: 100 },
        { createdAt: new Date('2026-01-15'), finalAmount: 200 },
        { createdAt: new Date('2026-01-10'), finalAmount: 300 },
      ];

      const result = service['groupByDate'](orders, 'finalAmount', undefined);

      expect(result[0].date).toBe('2026-01-10');
      expect(result[1].date).toBe('2026-01-15');
      expect(result[2].date).toBe('2026-01-20');
    });

    it('should use specified amount field', () => {
      const orders = [
        { createdAt: new Date('2026-01-15'), totalAmount: 500, finalAmount: 400 },
      ];

      const result = service['groupByDate'](orders, 'totalAmount', undefined);

      expect(result[0].amount).toBe(500);
    });
  });

  describe('mergeByDate (private method)', () => {
    it('should merge sales and purchase data', () => {
      const sales = [
        { date: '2026-01-15', amount: 1000, orders: 1 },
        { date: '2026-01-20', amount: 2000, orders: 1 },
      ];

      const purchase = [
        { date: '2026-01-15', amount: 500, orders: 1 },
        { date: '2026-01-25', amount: 800, orders: 1 },
      ];

      const result = service['mergeByDate'](sales, purchase);

      expect(result).toHaveLength(3);
      expect(result.find((d) => d.date === '2026-01-15')).toEqual({
        date: '2026-01-15',
        revenue: 1000,
        cost: 500,
        profit: 500,
      });
      expect(result.find((d) => d.date === '2026-01-20')).toEqual({
        date: '2026-01-20',
        revenue: 2000,
        cost: 0,
        profit: 2000,
      });
      expect(result.find((d) => d.date === '2026-01-25')).toEqual({
        date: '2026-01-25',
        revenue: 0,
        cost: 800,
        profit: -800,
      });
    });

    it('should return empty array when both inputs are empty', () => {
      const result = service['mergeByDate']([], []);

      expect(result).toEqual([]);
    });

    it('should handle only sales data', () => {
      const sales = [
        { date: '2026-01-15', amount: 1000, orders: 1 },
      ];

      const result = service['mergeByDate'](sales, []);

      expect(result).toHaveLength(1);
      expect(result[0].revenue).toBe(1000);
      expect(result[0].cost).toBe(0);
      expect(result[0].profit).toBe(1000);
    });

    it('should handle only purchase data', () => {
      const purchase = [
        { date: '2026-01-15', amount: 500, orders: 1 },
      ];

      const result = service['mergeByDate']([], purchase);

      expect(result).toHaveLength(1);
      expect(result[0].revenue).toBe(0);
      expect(result[0].cost).toBe(500);
      expect(result[0].profit).toBe(-500);
    });

    it('should sort by date ascending', () => {
      const sales = [
        { date: '2026-01-20', amount: 1000, orders: 1 },
        { date: '2026-01-10', amount: 500, orders: 1 },
      ];

      const purchase: any[] = [];

      const result = service['mergeByDate'](sales, purchase);

      expect(result[0].date).toBe('2026-01-10');
      expect(result[1].date).toBe('2026-01-20');
    });
  });
});
