# 销售功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为销售员提供POS界面，支持快速创建销售订单，订单完成时自动扣减库存。

**Architecture:** 新建独立POS页面(/pos)，后端新增订单状态更新接口，状态变为completed时触发库存扣减。复用现有InventoryService的updateStock方法。

**Tech Stack:** NestJS (后端), React + TypeScript + Ant Design (前端), TypeORM, Zustand

---

## 文件结构

```
后端:
  修改: server/src/modules/sales/sales-order.service.ts    # 新增updateStatus方法
  修改: server/src/modules/sales/sales-order.controller.ts # 新增PUT /:id/status接口
  新增: server/src/modules/sales/dto/update-sales-order-status.dto.ts

前端:
  新增: web/src/pages/POS/index.tsx                        # POS页面组件
  修改: web/src/router/index.tsx                           # 新增/pos路由
  修改: web/src/services/api.ts                            # 新增updateStatus API
  修改: web/src/components/Layout/Sidebar.tsx              # 新增POS菜单项
```

---

### Task 1: 后端 - 创建DTO

**Files:**
- Create: `server/src/modules/sales/dto/update-sales-order-status.dto.ts`

- [ ] **Step 1: 创建UpdateSalesOrderStatusDto**

文件: `server/src/modules/sales/dto/update-sales-order-status.dto.ts`

```typescript
import { IsEnum } from 'class-validator';
import { SalesOrderStatus } from '../../../entities/sales-order.entity';

export class UpdateSalesOrderStatusDto {
  @IsEnum(SalesOrderStatus, { message: '状态值不合法' })
  status: SalesOrderStatus;
}
```

- [ ] **Step 2: Commit**

```bash
git add server/src/modules/sales/dto/update-sales-order-status.dto.ts
git commit -m "feat(sales): add UpdateSalesOrderStatusDto"
```

---

### Task 2: 后端 - 扩展SalesOrderService

**Files:**
- Modify: `server/src/modules/sales/sales-order.service.ts`

- [ ] **Step 1: 添加InventoryService依赖注入**

在 `sales-order.service.ts` 顶部添加导入，并在构造函数中注入：

```typescript
// 在文件顶部添加导入
import { InventoryService } from '../inventory/inventory.service';

// 在构造函数中添加（约第27行，在DataSource之后）
constructor(
  // ... existing injections
  private dataSource: DataSource,
  private inventoryService: InventoryService,  // 新增这行
) {}
```

- [ ] **Step 2: 添加updateStatus方法**

在 `sales-order.service.ts` 文件末尾的 `remove` 方法之后添加：

```typescript
async updateStatus(id: number, dto: UpdateSalesOrderStatusDto, userId: number): Promise<SalesOrder> {
  const order = await this.salesOrderRepository.findOne({
    where: { id, deletedAt: IsNull() },
    relations: ['items', 'items.product'],
  });

  if (!order) {
    throw new NotFoundException('销售订单不存在');
  }

  if (order.status === SalesOrderStatus.COMPLETED) {
    throw new BadRequestException('订单已完成，无法修改状态');
  }

  if (order.status === SalesOrderStatus.CANCELLED) {
    throw new BadRequestException('订单已取消，无法修改状态');
  }

  if (dto.status === SalesOrderStatus.COMPLETED) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const item of order.items) {
        const inventory = await queryRunner.manager.findOne(Inventory, {
          where: { productId: item.productId, deletedAt: IsNull() },
        });

        if (!inventory || inventory.quantity < Number(item.quantity)) {
          throw new BadRequestException(
            `商品【${item.product.name}】库存不足，当前库存：${inventory?.quantity || 0}，需要：${item.quantity}`
          );
        }
      }

      for (const item of order.items) {
        await queryRunner.manager.decrement(
          Inventory,
          { productId: item.productId },
          'quantity',
          Number(item.quantity)
        );

        const inventory = await queryRunner.manager.findOne(Inventory, {
          where: { productId: item.productId },
        });

        const log = queryRunner.manager.create(InventoryLog, {
          productId: item.productId,
          type: InventoryLogType.SALES,
          quantity: Number(item.quantity),
          beforeQty: Number(inventory.quantity) + Number(item.quantity),
          afterQty: Number(inventory.quantity),
          orderId: order.id,
          remark: `销售订单 ${order.orderNo}`,
          createdById: userId,
        });
        await queryRunner.manager.save(log);
      }

      order.status = dto.status;
      await queryRunner.manager.save(order);

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  } else {
    order.status = dto.status;
    await this.salesOrderRepository.save(order);
  }

  return this.findOne(id);
}
```

- [ ] **Step 3: 添加必要的导入**

在文件顶部添加：

```typescript
import { Inventory } from '../../entities/inventory.entity';
import { InventoryLog, InventoryLogType } from '../../entities/inventory-log.entity';
import { UpdateSalesOrderStatusDto } from './dto/update-sales-order-status.dto';
```

- [ ] **Step 4: Commit**

```bash
git add server/src/modules/sales/sales-order.service.ts
git commit -m "feat(sales): add updateStatus method with inventory deduction"
```

---

### Task 3: 后端 - 更新SalesModule依赖

**Files:**
- Modify: `server/src/modules/sales/sales.module.ts`

- [ ] **Step 1: 添加Inventory模块依赖**

读取当前文件内容后，在imports中添加InventoryModule：

```typescript
// 在imports数组中添加 InventoryModule
imports: [
  TypeOrmModule.forFeature([SalesOrder, SalesOrderItem, Product, Customer, CustomerLevel, User]),
  InventoryModule,  // 新增这行
],
```

- [ ] **Step 2: 添加导出**

```typescript
// 在exports数组中添加
exports: [SalesOrderService],
```

- [ ] **Step 3: 添加InventoryModule导入**

在文件顶部添加：

```typescript
import { InventoryModule } from '../inventory/inventory.module';
```

- [ ] **Step 4: Commit**

```bash
git add server/src/modules/sales/sales.module.ts
git commit -m "feat(sales): add InventoryModule dependency"
```

---

### Task 4: 后端 - 扩展Controller

**Files:**
- Modify: `server/src/modules/sales/sales-order.controller.ts`

- [ ] **Step 1: 添加updateStatus接口**

在 `remove` 方法之后添加：

```typescript
@Put(':id/status')
@ApiOperation({ summary: '更新销售订单状态' })
async updateStatus(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: UpdateSalesOrderStatusDto,
  @Request() req: any,
) {
  const order = await this.salesOrderService.findOne(id);
  if (order.createdById !== req.user.id) {
    const user = req.user;
    const isAdmin = user.roles?.some((role: any) => role.code === 'admin');
    if (!isAdmin) {
      throw new BadRequestException('无权限操作此订单');
    }
  }
  return this.salesOrderService.updateStatus(id, dto, req.user.id);
}
```

- [ ] **Step 2: 添加导入**

在文件顶部添加：

```typescript
import { UpdateSalesOrderStatusDto } from './dto/update-sales-order-status.dto';
import { BadRequestException } from '@nestjs/common';
```

- [ ] **Step 3: Commit**

```bash
git add server/src/modules/sales/sales-order.controller.ts
git commit -m "feat(sales): add PUT /:id/status endpoint"
```

---

### Task 5: 前端 - 扩展API服务

**Files:**
- Modify: `web/src/services/api.ts`

- [ ] **Step 1: 添加updateStatus方法**

在 `salesOrderApi` 对象中添加 `updateStatus` 方法：

```typescript
export const salesOrderApi = {
  list: (params?: any) => request.get('/sales-orders', { params }),
  get: (id: number) => request.get(`/sales-orders/${id}`),
  create: (data: any) => request.post('/sales-orders', data),
  update: (id: number, data: any) => request.put(`/sales-orders/${id}`, data),
  delete: (id: number) => request.delete(`/sales-orders/${id}`),
  updateStatus: (id: number, status: string) => request.put(`/sales-orders/${id}/status`, { status }),  // 新增这行
};
```

- [ ] **Step 2: Commit**

```bash
git add web/src/services/api.ts
git commit -m "feat(api): add salesOrderApi.updateStatus"
```

---

### Task 6: 前端 - 创建POS页面

**Files:**
- Create: `web/src/pages/POS/index.tsx`

- [ ] **Step 1: 创建POS页面组件**

```tsx
import { useEffect, useState, useRef } from 'react';
import { Card, Row, Col, Select, Input, Table, Button, InputNumber, message, Space, Tag } from 'antd';
import { ScanOutlined, PlusOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { productApi, customerApi, salesOrderApi } from '@/services/api';

interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  stock: number;
}

export default function POS() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<any>(null);

  useEffect(() => {
    loadCustomers();
    loadProducts();
    inputRef.current?.focus();
  }, []);

  const loadCustomers = async () => {
    const res = await customerApi.list({ pageSize: 1000 });
    setCustomers(res.data?.list || []);
  };

  const loadProducts = async () => {
    const res = await productApi.list({ pageSize: 1000, status: true });
    setProducts(res.data?.list || []);
  };

  const filteredProducts = products.filter((p: any) =>
    p.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    (p.barcode && p.barcode.includes(searchKeyword))
  );

  const handleScanOrSearch = (value: string) => {
    if (!value.trim()) return;
    
    const matchedProduct = products.find((p: any) =>
      p.barcode === value || p.sku === value || p.name.toLowerCase().includes(value.toLowerCase())
    );

    if (matchedProduct) {
      addToOrder(matchedProduct);
      setSearchKeyword('');
      message.success(`已添加: ${matchedProduct.name}`);
    } else {
      message.warning('未找到匹配商品');
    }
  };

  const addToOrder = (product: any) => {
    setOrderItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: Number(product.salePrice),
          stock: product.inventory?.quantity || 0,
        },
      ];
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromOrder(productId);
      return;
    }
    setOrderItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromOrder = (productId: number) => {
    setOrderItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const totalAmount = orderItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const handleSubmit = async (isDraft: boolean) => {
    if (!selectedCustomerId) {
      message.error('请选择客户');
      return;
    }
    if (orderItems.length === 0) {
      message.error('请添加商品');
      return;
    }

    setLoading(true);
    try {
      const data = {
        customerId: selectedCustomerId,
        status: isDraft ? 'draft' : 'pending',
        items: orderItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };
      const res = await salesOrderApi.create(data);
      message.success(isDraft ? '订单已保存为草稿' : '订单提交成功');
      setOrderItems([]);
      setSelectedCustomerId(null);
      window.open(`/sales-orders`, '_self');
    } catch (err: any) {
      message.error(err.response?.data?.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const productColumns = [
    { title: '商品名称', dataIndex: 'name', key: 'name', width: 150, ellipsis: true },
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 80 },
    { title: '售价', dataIndex: 'salePrice', key: 'salePrice', width: 80, render: (v: number) => `¥${Number(v).toFixed(2)}` },
    { 
      title: '库存', 
      key: 'stock', 
      width: 70, 
      render: (_: any, record: any) => {
        const qty = record.inventory?.quantity || 0;
        return <Tag color={qty <= 10 ? 'red' : 'green'}>{qty}</Tag>;
      }
    },
    { 
      title: '操作', 
      key: 'action', 
      width: 60, 
      render: (_: any, record: any) => (
        <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => addToOrder(record)} />
      )
    },
  ];

  const orderColumns = [
    { title: '商品', dataIndex: 'productName', key: 'productName' },
    { 
      title: '数量', 
      key: 'quantity', 
      width: 120, 
      render: (_: any, record: OrderItem) => (
        <InputNumber
          min={1}
          max={record.stock}
          value={record.quantity}
          onChange={(v) => updateQuantity(record.productId, v || 1)}
          size="small"
        />
      )
    },
    { title: '单价', dataIndex: 'unitPrice', key: 'unitPrice', width: 80, render: (v: number) => `¥${v.toFixed(2)}` },
    { title: '小计', key: 'subtotal', width: 100, render: (_: any, record: OrderItem) => `¥${(record.quantity * record.unitPrice).toFixed(2)}` },
    { 
      title: '', 
      key: 'action', 
      width: 50, 
      render: (_: any, record: OrderItem) => (
        <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => removeFromOrder(record.productId)} />
      )
    },
  ];

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      <Card size="small" style={{ marginBottom: 8 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Space>
              <span>客户:</span>
              <Select
                style={{ width: 200 }}
                placeholder="选择客户"
                showSearch
                optionFilterProp="label"
                options={customers.map((c) => ({ label: c.name, value: c.id }))}
                value={selectedCustomerId}
                onChange={setSelectedCustomerId}
              />
            </Space>
          </Col>
          <Col flex="auto">
            <Input
              ref={inputRef}
              placeholder="扫码或输入商品名称/SKU/条码"
              prefix={<ScanOutlined />}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onPressEnter={() => handleScanOrSearch(searchKeyword)}
              style={{ width: 300 }}
            />
          </Col>
        </Row>
      </Card>

      <div style={{ flex: 1, display: 'flex', gap: 8, overflow: 'hidden' }}>
        <Card title="商品列表" size="small" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: 8 }}>
            <Input
              placeholder="搜索商品"
              prefix={<SearchOutlined />}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              allowClear
            />
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <Table
              columns={productColumns}
              dataSource={filteredProducts}
              rowKey="id"
              size="small"
              pagination={false}
            />
          </div>
        </Card>

        <Card title="当前订单" size="small" style={{ width: 400, display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, overflow: 'auto' }}>
            <Table
              columns={orderColumns}
              dataSource={orderItems}
              rowKey="productId"
              size="small"
              pagination={false}
              locale={{ emptyText: '暂无商品' }}
            />
          </div>
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
            <Row justify="space-between" style={{ marginBottom: 8 }}>
              <Col>小计:</Col>
              <Col>¥{totalAmount.toFixed(2)}</Col>
            </Row>
            <Row justify="space-between" style={{ marginBottom: 16 }}>
              <Col><strong>应付:</strong></Col>
              <Col><strong style={{ fontSize: 18, color: '#f5222d' }}>¥{totalAmount.toFixed(2)}</strong></Col>
            </Row>
            <Space style={{ width: '100%' }} direction="vertical">
              <Button block onClick={() => handleSubmit(true)} disabled={orderItems.length === 0}>
                保存草稿
              </Button>
              <Button type="primary" block onClick={() => handleSubmit(false)} loading={loading} disabled={orderItems.length === 0}>
                提交订单
              </Button>
            </Space>
          </div>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/pages/POS/index.tsx
git commit -m "feat(pos): add POS page component"
```

---

### Task 7: 前端 - 添加路由

**Files:**
- Modify: `web/src/router/index.tsx`

- [ ] **Step 1: 添加POS路由**

在 `SalesOrders` 懒加载之后添加：

```typescript
const POS = lazy(() => import('@/pages/POS'));
```

在 `sales-orders` 路由之后添加：

```tsx
<Route path="pos" element={<POS />} />
```

- [ ] **Step 2: Commit**

```bash
git add web/src/router/index.tsx
git commit -m "feat(router): add /pos route"
```

---

### Task 8: 前端 - 添加侧边栏菜单

**Files:**
- Modify: `web/src/components/Layout/Sidebar.tsx`

- [ ] **Step 1: 添加图标导入**

在图标导入中添加 `ShoppingOutlined`（如已存在则跳过）：

```typescript
import {
  HomeOutlined,
  ShoppingOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  InboxOutlined,
  TeamOutlined,
  UserOutlined,
  AppstoreOutlined,
  UserSwitchOutlined,
  DollarOutlined,  // 新增这行
} from '@ant-design/icons';
```

- [ ] **Step 2: 添加菜单项**

在 `menuItems` 数组中，在 `sales-orders` 之前添加：

```typescript
{ key: '/pos', icon: <DollarOutlined />, label: '销售' },
```

- [ ] **Step 3: Commit**

```bash
git add web/src/components/Layout/Sidebar.tsx
git commit -m "feat(sidebar): add POS menu item"
```

---

### Task 9: 前端 - 更新销售订单页面支持状态变更

**Files:**
- Modify: `web/src/pages/SalesOrders/index.tsx`

- [ ] **Step 1: 添加完成订单按钮**

在 columns 的操作列中，添加完成订单按钮。找到 `handleView` 函数后添加：

```typescript
const handleComplete = async (id: number) => {
  try {
    await salesOrderApi.updateStatus(id, 'completed');
    message.success('订单已完成');
    loadData(pagination.current, pagination.pageSize, filterForm.getFieldsValue());
  } catch (err: any) {
    message.error(err.response?.data?.message || '操作失败');
  }
};
```

修改 columns 的 action 列：

```typescript
{
  title: '操作',
  key: 'action',
  width: 160,
  render: (_: any, record: any) => (
    <Space>
      <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record.id)}>查看</Button>
      {(record.status === 'draft' || record.status === 'pending') && (
        <Popconfirm title="确定完成订单？库存将自动扣减。" onConfirm={() => handleComplete(record.id)}>
          <Button type="link" size="small">完成</Button>
        </Popconfirm>
      )}
    </Space>
  ),
},
```

- [ ] **Step 2: 添加必要导入**

确保文件顶部有：

```typescript
import { message, Popconfirm, Space } from 'antd';
```

- [ ] **Step 3: Commit**

```bash
git add web/src/pages/SalesOrders/index.tsx
git commit -m "feat(sales-orders): add complete order button"
```

---

### Task 10: 验证

- [ ] **Step 1: 启动后端服务**

```bash
cd server && npm run start:dev
```

- [ ] **Step 2: 启动前端服务**

```bash
cd web && npm run dev
```

- [ ] **Step 3: 测试POS功能**

1. 访问 `/pos` 页面
2. 选择客户
3. 搜索或扫码添加商品
4. 修改商品数量
5. 提交订单
6. 在 `/sales-orders` 查看订单
7. 点击"完成"按钮
8. 验证库存是否正确扣减

- [ ] **Step 4: Commit (如果需要修复)**

```bash
git add -A
git commit -m "fix: resolve issues found during testing"
```
