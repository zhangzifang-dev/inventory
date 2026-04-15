# Dashboard 图表功能设计

## 概述

在 Dashboard 页面添加采购订单和销售订单柱状图，支持按日/按月汇总、自定义日期范围和订单状态筛选。

## 功能需求

### 核心功能
- 显示采购订单和销售订单金额柱状图（两张独立图表并排）
- 汇总方式切换：按日/按月
- 日期范围选择：自定义日期范围
- 订单状态筛选：多选

### 默认值
- 按日汇总：默认最近 30 天
- 按月汇总：默认最近 30 个月
- 订单状态：默认全选

## 技术设计

### 后端改动

#### 修改 ReportQueryDto
文件：`server/src/modules/report/dto/report-query.dto.ts`

新增参数：
```typescript
{
  startDate: string;           // 开始日期 (必填)
  endDate: string;             // 结束日期 (必填)
  groupBy?: 'day' | 'month';   // 汇总方式，默认 'day'
  status?: string;             // 订单状态，多个用逗号分隔，如 "completed,draft"
}
```

#### 修改 ReportService
文件：`server/src/modules/report/report.service.ts`

1. `getSalesReport` 和 `getPurchaseReport` 方法：
   - 支持 `groupBy` 参数，按日或按月分组
   - 支持 `status` 参数过滤订单状态

2. `groupByDate` 方法改造：
   - 按日分组：日期格式 `YYYY-MM-DD`
   - 按月分组：日期格式 `YYYY-MM`

#### 接口响应格式
保持不变，`byDate` 数组：
```typescript
{
  date: string;     // "2026-04-13" 或 "2026-04"
  amount: number;   // 金额合计
  orders: number;   // 订单数量
}
```

### 前端改动

#### 安装依赖
```bash
cd web && npm install recharts
```

#### 修改文件

**Dashboard/index.tsx**
- 添加筛选控件区域（汇总方式、日期范围、状态筛选）
- 添加采购订单柱状图组件
- 添加销售订单柱状图组件
- 调用 `reportApi.sales` 和 `reportApi.purchase` 获取数据

**services/api.ts**
- 更新 `reportApi.sales` 和 `reportApi.purchase` 支持新参数

#### 布局结构
```
┌─────────────────────────────────────────────────────┐
│  统计卡片（现有）                                      │
├─────────────────────────────────────────────────────┤
│  [按日/按月]  [日期范围选择器]  [状态筛选下拉]          │
├──────────────────────────┬──────────────────────────┤
│     采购订单金额柱状图     │     销售订单金额柱状图     │
└──────────────────────────┴──────────────────────────┘
├─────────────────────────────────────────────────────┤
│  订单表格（现有）                                      │
└─────────────────────────────────────────────────────┘
```

#### 筛选控件
- **汇总方式**：Radio.Group，选项：按日/按月
- **日期范围**：DatePicker.RangePicker
- **订单状态**：Select 多选
  - 采购订单：draft, pending, approved, completed, cancelled
  - 销售订单：draft, pending, completed, cancelled

#### 图表组件
使用 Recharts：
- `BarChart` 作为容器
- `Bar` 显示金额柱状图
- `XAxis` 显示日期
- `YAxis` 显示金额
- `Tooltip` 悬停显示详情（日期、金额、订单数）
- `CartesianGrid` 显示网格线

## 实现步骤

1. 后端：修改 DTO 和 Service，添加 groupBy 和 status 支持
2. 前端：安装 recharts 依赖
3. 前端：更新 API 调用
4. 前端：实现图表组件和筛选控件
5. 测试验证

## 文件清单

| 文件 | 操作 |
|------|------|
| server/src/modules/report/dto/report-query.dto.ts | 修改 |
| server/src/modules/report/report.service.ts | 修改 |
| web/package.json | 修改（添加 recharts） |
| web/src/services/api.ts | 修改 |
| web/src/pages/Dashboard/index.tsx | 修改 |
