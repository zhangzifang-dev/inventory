# Dashboard 图表功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 Dashboard 页面添加采购订单和销售订单金额柱状图，支持按日/按月汇总、自定义日期范围和订单状态筛选。

**Architecture:** 扩展现有报表接口，添加 groupBy 和 status 参数。前端使用 Recharts 库实现柱状图，两张图表并排显示。

**Tech Stack:** NestJS (后端), React + Ant Design + Recharts (前端)

---

## 文件结构

| 文件 | 职责 |
|------|------|
| `server/src/modules/report/dto/report-query.dto.ts` | 报表查询参数定义 |
| `server/src/modules/report/report.service.ts` | 报表业务逻辑 |
| `web/package.json` | 前端依赖管理 |
| `web/src/services/api.ts` | API 调用封装 |
| `web/src/pages/Dashboard/index.tsx` | Dashboard 页面组件 |

---

### Task 1: 修改后端 DTO 添加新参数

**Files:**
- Modify: `server/src/modules/report/dto/report-query.dto.ts`

- [ ] **Step 1: 修改 ReportQueryDto 添加 groupBy 和 status 参数**

```typescript
import { IsOptional, IsDateString, IsEnum, IsString } from 'class-validator';

export enum GroupByType {
  DAY = 'day',
  MONTH = 'month',
}

export class ReportQueryDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsEnum(GroupByType)
  groupBy?: GroupByType;

  @IsOptional()
  @IsString()
  status?: string;
}
```

- [ ] **Step 2: 验证 DTO 编译通过**

Run: `cd /home/zzf/projects/inventory/server && npm run build`
Expected: 编译成功，无错误

- [ ] **Step 3: 提交更改**

```bash
git add server/src/modules/report/dto/report-query.dto.ts
git commit -m "feat: add groupBy and status params to ReportQueryDto"
```

---

### Task 2: 修改 ReportService 支持 groupBy 和 status

**Files:**
- Modify: `server/src/modules/report/report.service.ts`

- [ ] **Step 1: 修改 getSalesReport 方法支持 status 过滤**

在 `getSalesReport` 方法中，修改查询逻辑：

```typescript
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
      statuses: whereCondition.status instanceof Array 
        ? whereCondition.status 
        : [whereCondition.status] 
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
```

- [ ] **Step 2: 修改 getPurchaseReport 方法支持 status 过滤**

```typescript
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
```

- [ ] **Step 3: 修改 groupByDate 方法支持按月分组**

```typescript
private groupByDate(
  orders: any[], 
  amountField: string, 
  groupBy?: string
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
```

- [ ] **Step 4: 添加 In 导入**

在文件顶部添加 `In` 导入：

```typescript
import { Repository, Between, In } from 'typeorm';
```

- [ ] **Step 5: 添加 GroupByType 导入**

```typescript
import { ReportQueryDto, GroupByType } from './dto/report-query.dto';
```

- [ ] **Step 6: 验证后端编译通过**

Run: `cd /home/zzf/projects/inventory/server && npm run build`
Expected: 编译成功，无错误

- [ ] **Step 7: 提交更改**

```bash
git add server/src/modules/report/report.service.ts
git commit -m "feat: support groupBy and status filter in report service"
```

---

### Task 3: 安装前端 Recharts 依赖

**Files:**
- Modify: `web/package.json`

- [ ] **Step 1: 安装 recharts**

Run: `cd /home/zzf/projects/inventory/web && npm install recharts`
Expected: 安装成功，package.json 中添加 recharts 依赖

- [ ] **Step 2: 验证安装**

Run: `cd /home/zzf/projects/inventory/web && npm run build`
Expected: 编译成功

- [ ] **Step 3: 提交更改**

```bash
git add web/package.json web/package-lock.json
git commit -m "chore: add recharts dependency"
```

---

### Task 4: 更新前端 API 调用

**Files:**
- Modify: `web/src/services/api.ts`

- [ ] **Step 1: 更新 reportApi 接口定义**

```typescript
export const reportApi = {
  sales: (params?: { startDate?: string; endDate?: string; groupBy?: 'day' | 'month'; status?: string }) => 
    request.get('/reports/sales', { params }),
  purchase: (params?: { startDate?: string; endDate?: string; groupBy?: 'day' | 'month'; status?: string }) => 
    request.get('/reports/purchase', { params }),
  profit: (params?: any) => request.get('/reports/profit', { params }),
};
```

- [ ] **Step 2: 验证编译通过**

Run: `cd /home/zzf/projects/inventory/web && npm run build`
Expected: 编译成功

- [ ] **Step 3: 提交更改**

```bash
git add web/src/services/api.ts
git commit -m "feat: update reportApi to support groupBy and status params"
```

---

### Task 5: 实现 Dashboard 图表组件

**Files:**
- Modify: `web/src/pages/Dashboard/index.tsx`

- [ ] **Step 1: 添加必要的导入**

在文件顶部添加：

```typescript
import { Radio, DatePicker, Select, Empty } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';
import { reportApi } from '@/services/api';
```

- [ ] **Step 2: 添加状态定义**

在组件内部，添加新的状态：

```typescript
const [groupBy, setGroupBy] = useState<'day' | 'month'>('day');
const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
  dayjs().subtract(29, 'day'),
  dayjs(),
]);
const [purchaseStatus, setPurchaseStatus] = useState<string[]>([]);
const [salesStatus, setSalesStatus] = useState<string[]>([]);
const [purchaseChartData, setPurchaseChartData] = useState<any[]>([]);
const [salesChartData, setSalesChartData] = useState<any[]>([]);
const [chartLoading, setChartLoading] = useState(false);
```

- [ ] **Step 3: 添加图表数据加载函数**

```typescript
const loadChartData = async () => {
  setChartLoading(true);
  try {
    const params = {
      startDate: dateRange[0].format('YYYY-MM-DD'),
      endDate: dateRange[1].format('YYYY-MM-DD'),
      groupBy,
      status: purchaseStatus.length > 0 ? purchaseStatus.join(',') : undefined,
    };
    const salesParams = {
      startDate: dateRange[0].format('YYYY-MM-DD'),
      endDate: dateRange[1].format('YYYY-MM-DD'),
      groupBy,
      status: salesStatus.length > 0 ? salesStatus.join(',') : undefined,
    };

    const [purchaseRes, salesRes] = await Promise.all([
      reportApi.purchase(params),
      reportApi.sales(salesParams),
    ]);

    setPurchaseChartData(purchaseRes.data?.byDate || []);
    setSalesChartData(salesRes.data?.byDate || []);
  } catch (error) {
    console.error('Failed to load chart data:', error);
  } finally {
    setChartLoading(false);
  }
};
```

- [ ] **Step 4: 添加 useEffect 监听筛选条件变化**

```typescript
useEffect(() => {
  if (dateRange[0] && dateRange[1]) {
    loadChartData();
  }
}, [groupBy, dateRange, purchaseStatus, salesStatus]);
```

- [ ] **Step 5: 添加日期范围处理函数**

```typescript
const handleGroupByChange = (value: 'day' | 'month') => {
  setGroupBy(value);
  if (value === 'day') {
    setDateRange([dayjs().subtract(29, 'day'), dayjs()]);
  } else {
    setDateRange([dayjs().subtract(29, 'month'), dayjs()]);
  }
};
```

- [ ] **Step 6: 添加筛选控件 UI**

在统计卡片 Row 之后、订单表格 Row 之前添加：

```tsx
<Card style={{ marginBottom: 24 }}>
  <Row gutter={16} align="middle">
    <Col>
      <Radio.Group value={groupBy} onChange={(e) => handleGroupByChange(e.target.value)}>
        <Radio.Button value="day">按日</Radio.Button>
        <Radio.Button value="month">按月</Radio.Button>
      </Radio.Group>
    </Col>
    <Col>
      <DatePicker.RangePicker
        value={dateRange}
        onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
        picker={groupBy === 'month' ? 'month' : 'date'}
      />
    </Col>
    <Col>
      <span style={{ marginRight: 8 }}>采购状态:</span>
      <Select
        mode="multiple"
        allowClear
        style={{ width: 200 }}
        placeholder="全部状态"
        value={purchaseStatus}
        onChange={setPurchaseStatus}
        options={[
          { label: '草稿', value: 'draft' },
          { label: '待审批', value: 'pending' },
          { label: '已审批', value: 'approved' },
          { label: '已完成', value: 'completed' },
          { label: '已取消', value: 'cancelled' },
        ]}
      />
    </Col>
    <Col>
      <span style={{ marginRight: 8 }}>销售状态:</span>
      <Select
        mode="multiple"
        allowClear
        style={{ width: 200 }}
        placeholder="全部状态"
        value={salesStatus}
        onChange={setSalesStatus}
        options={[
          { label: '草稿', value: 'draft' },
          { label: '待审批', value: 'pending' },
          { label: '已完成', value: 'completed' },
          { label: '已取消', value: 'cancelled' },
        ]}
      />
    </Col>
  </Row>
</Card>
```

- [ ] **Step 7: 添加图表 UI**

在筛选控件之后添加：

```tsx
<Row gutter={16} style={{ marginBottom: 24 }}>
  <Col span={12}>
    <Card title="采购订单金额" loading={chartLoading}>
      {purchaseChartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={purchaseChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
            <Bar dataKey="amount" fill="#1890ff" name="金额" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Empty description="暂无数据" style={{ height: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center' }} />
      )}
    </Card>
  </Col>
  <Col span={12}>
    <Card title="销售订单金额" loading={chartLoading}>
      {salesChartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={salesChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value: number) => `¥${value.toLocaleString()}`} />
            <Bar dataKey="amount" fill="#52c41a" name="金额" />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <Empty description="暂无数据" style={{ height: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center' }} />
      )}
    </Card>
  </Col>
</Row>
```

- [ ] **Step 8: 验证前端编译通过**

Run: `cd /home/zzf/projects/inventory/web && npm run build`
Expected: 编译成功

- [ ] **Step 9: 提交更改**

```bash
git add web/src/pages/Dashboard/index.tsx
git commit -m "feat: add purchase and sales charts to Dashboard"
```

---

## 验证清单

- [ ] 后端服务启动正常
- [ ] 前端服务启动正常
- [ ] Dashboard 页面显示图表
- [ ] 按日/按月切换功能正常
- [ ] 日期范围选择功能正常
- [ ] 订单状态筛选功能正常
- [ ] 图表数据正确显示
