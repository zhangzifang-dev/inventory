import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { SalesOrder, SalesOrderStatus } from '../../entities/sales-order.entity';
import { SalesOrderItem } from '../../entities/sales-order-item.entity';
import { PurchaseOrder } from '../../entities/purchase-order.entity';
import { PurchaseOrderItem } from '../../entities/purchase-order-item.entity';
import { ReportQueryDto, GroupByType } from './dto/report-query.dto';

export interface SalesReport {
  totalOrders: number;
  totalAmount: number;
  totalDiscount: number;
  finalAmount: number;
  totalQuantity: number;
  byDate?: { date: string; amount: number; orders: number }[];
}

export interface PurchaseReport {
  totalOrders: number;
  totalAmount: number;
  totalQuantity: number;
  byDate?: { date: string; amount: number; orders: number }[];
}

export interface ProfitReport {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  byDate?: { date: string; revenue: number; cost: number; profit: number }[];
}

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(SalesOrder)
    private salesOrderRepository: Repository<SalesOrder>,
    @InjectRepository(SalesOrderItem)
    private salesOrderItemRepository: Repository<SalesOrderItem>,
    @InjectRepository(PurchaseOrder)
    private purchaseOrderRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private purchaseOrderItemRepository: Repository<PurchaseOrderItem>,
  ) {}

  async getSalesReport(query: ReportQueryDto): Promise<SalesReport> {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);
    endDate.setHours(23, 59, 59, 999);

    const whereCondition: any = {
      createdAt: Between(startDate, endDate),
    };

    if (query.status) {
      const statuses = query.status.split(',').map((s) => s.trim());
      whereCondition.status = In(statuses);
    } else {
      whereCondition.status = SalesOrderStatus.COMPLETED;
    }

    const orders = await this.salesOrderRepository.find({
      where: whereCondition,
    });

    const items = await this.salesOrderItemRepository
      .createQueryBuilder('item')
      .innerJoin('item.order', 'order')
      .where('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('order.status IN (:...statuses)', {
        statuses:
          whereCondition.status instanceof Array
            ? whereCondition.status
            : [whereCondition.status],
      })
      .getMany();

    const totalOrders = orders.length;
    const totalAmount = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const totalDiscount = orders.reduce((sum, o) => sum + Number(o.discountAmount) + Number(o.couponDiscount), 0);
    const finalAmount = orders.reduce((sum, o) => sum + Number(o.finalAmount), 0);
    const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);

    const byDate = this.groupByDate(orders, 'finalAmount', query.groupBy);

    return {
      totalOrders,
      totalAmount,
      totalDiscount,
      finalAmount,
      totalQuantity,
      byDate,
    };
  }

  async getPurchaseReport(query: ReportQueryDto): Promise<PurchaseReport> {
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);
    endDate.setHours(23, 59, 59, 999);

    const whereCondition: any = {
      createdAt: Between(startDate, endDate),
    };

    if (query.status) {
      const statuses = query.status.split(',').map((s) => s.trim());
      whereCondition.status = In(statuses);
    }

    const orders = await this.purchaseOrderRepository.find({
      where: whereCondition,
    });

    const items = await this.purchaseOrderItemRepository
      .createQueryBuilder('item')
      .innerJoin('item.order', 'order')
      .where('order.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getMany();

    const totalOrders = orders.length;
    const totalAmount = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);

    const byDate = this.groupByDate(orders, 'totalAmount', query.groupBy);

    return {
      totalOrders,
      totalAmount,
      totalQuantity,
      byDate,
    };
  }

  async getProfitReport(query: ReportQueryDto): Promise<ProfitReport> {
    const salesReport = await this.getSalesReport(query);
    const purchaseReport = await this.getPurchaseReport(query);

    const totalRevenue = salesReport.finalAmount;
    const totalCost = purchaseReport.totalAmount;
    const totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    const byDate = this.mergeByDate(salesReport.byDate || [], purchaseReport.byDate || []);

    return {
      totalRevenue,
      totalCost,
      totalProfit,
      profitMargin,
      byDate,
    };
  }

  private groupByDate(
    orders: any[],
    amountField: string,
    groupBy?: string,
  ): { date: string; amount: number; orders: number }[] {
    const grouped: { [key: string]: { amount: number; orders: number } } = {};

    for (const order of orders) {
      let dateKey: string;
      if (groupBy === 'month') {
        const date = new Date(order.createdAt);
        dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else {
        dateKey = order.createdAt.toISOString().split('T')[0];
      }

      if (!grouped[dateKey]) {
        grouped[dateKey] = { amount: 0, orders: 0 };
      }
      grouped[dateKey].amount += Number(order[amountField]);
      grouped[dateKey].orders += 1;
    }

    return Object.entries(grouped)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private mergeByDate(
    sales: { date: string; amount: number; orders: number }[],
    purchase: { date: string; amount: number; orders: number }[]
  ): { date: string; revenue: number; cost: number; profit: number }[] {
    const merged: { [key: string]: { revenue: number; cost: number } } = {};

    for (const s of sales) {
      merged[s.date] = { revenue: s.amount, cost: 0 };
    }

    for (const p of purchase) {
      if (!merged[p.date]) {
        merged[p.date] = { revenue: 0, cost: 0 };
      }
      merged[p.date].cost = p.amount;
    }

    return Object.entries(merged)
      .map(([date, data]) => ({
        date,
        revenue: data.revenue,
        cost: data.cost,
        profit: data.revenue - data.cost,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
