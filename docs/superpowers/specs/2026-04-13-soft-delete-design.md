# 软删除功能设计

## 概述

为所有业务实体添加软删除功能，记录删除时间和执行删除的用户。

## 目标实体

- 商品 (Product)
- 分类 (Category)
- 供应商 (Supplier)
- 客户 (Customer)
- 采购订单 (PurchaseOrder)
- 销售订单 (SalesOrder)
- 库存 (Inventory)
- 库存日志 (InventoryLog)
- 优惠券 (Coupon)
- 折扣 (Discount)
- 客户等级 (CustomerLevel)

## 设计方案

### 1. 数据库字段

在每个实体中添加以下字段：

```typescript
@Column({ name: 'deleted_at', type: 'datetime', nullable: true })
deletedAt: Date | null;

@Column({ name: 'deleted_by', nullable: true })
deletedBy: number;
```

### 2. 查询过滤

使用 TypeORM 的 `@DeleteDateColumn` 配合 `softDelete: true` 选项。

### 3. 删除接口修改

将物理删除改为软删除，传递当前用户ID：

```typescript
async remove(id: number, userId: number): Promise<void> {
  await this.repository.update(id, {
    deletedAt: new Date(),
    deletedBy: userId,
  });
}
```

### 4. 恢复功能（可选）

添加恢复已删除记录的功能。

## 实现步骤

1. 修改所有业务实体的 Entity，添加 deletedAt 和 deletedBy 字段
2. 修改 Service 层的删除方法，获取当前用户ID
3. 修改 Controller，从 JWT 获取当前用户ID并传递给 Service
4. 更新查询方法，使用 `withDeleted: true` 可查询已删除记录

## 影响范围

- 需要修改所有业务实体的 Entity
- 需要修改所有业务模块的 Service 和 Controller
- 前端无需修改（软删除对用户透明）
