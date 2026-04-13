# 软删除功能实现计划

**Goal:** 为所有业务实体添加软删除功能，记录删除时间和执行删除的用户

**Architecture:** 手动软删除方案 - 在每个实体添加 deletedAt 和 deletedBy 字段，查询时自动过滤已删除记录

**Tech Stack:** NestJS + TypeORM + MySQL

---

### Task 1: 修改 Product 实体添加软删除字段

**Files:**
- Modify: `server/src/entities/product.entity.ts`

- [ ] **Step 1: 添加 deletedAt 和 deletedBy 字段**

在 `updatedAt` 字段后添加：

```typescript
@Column({ name: 'deleted_at', type: 'datetime', nullable: true })
deletedAt: Date | null;

@Column({ name: 'deleted_by', nullable: true })
deletedBy: number;
```

- [ ] **Step 2: 更新 ProductService 的查询方法**

修改 `server/src/modules/product/product.service.ts`:
- 在 `findAll` 方法的 where 条件中添加 `deletedAt: IsNull()`
- 在 `findOne` 方法中添加相同条件

```typescript
import { IsNull } from 'typeorm';

// findAll 方法的 where 添加：
where.deletedAt = IsNull();

// findOne 方法同样添加
```

- [ ] **Step 3: 修改 remove 方法为软删除**

```typescript
async remove(id: number, userId: number): Promise<void> {
  const product = await this.productRepository.findOne({
    where: { id, deletedAt: IsNull() },
  });

  if (!product) {
    throw new NotFoundException('商品不存在');
  }

  await this.productRepository.update(id, {
    deletedAt: new Date(),
    deletedBy: userId,
  });
}
```

- [ ] **Step 4: 修改 ProductController 传递 userId**

修改 `server/src/modules/product/product.controller.ts`:

```typescript
@Delete(':id')
async remove(
  @Param('id', ParseIntPipe) id: number,
  @Request() req: any,
): Promise<void> {
  return this.productService.remove(id, req.user.id);
}
```

---

### Task 2: 修改 Category 实体添加软删除字段

**Files:**
- Modify: `server/src/entities/category.entity.ts`
- Modify: `server/src/modules/product/category.service.ts`
- Modify: `server/src/modules/product/category.controller.ts`

按照 Task 1 的相同模式修改。

---

### Task 3: 修改 Supplier 实体添加软删除字段

**Files:**
- Modify: `server/src/entities/supplier.entity.ts`
- Modify: `server/src/modules/purchase/supplier.service.ts`
- Modify: `server/src/modules/purchase/supplier.controller.ts`

---

### Task 4: 修改 Customer 实体添加软删除字段

**Files:**
- Modify: `server/src/entities/customer.entity.ts`
- Modify: `server/src/modules/sales/customer.service.ts`
- Modify: `server/src/modules/sales/customer.controller.ts`

---

### Task 5: 修改 CustomerLevel 实体添加软删除字段

**Files:**
- Modify: `server/src/entities/customer-level.entity.ts`
- Modify: `server/src/modules/sales/customer-level.service.ts`
- Modify: `server/src/modules/sales/customer-level.controller.ts`

---

### Task 6: 修改 PurchaseOrder 实体添加软删除字段

**Files:**
- Modify: `server/src/entities/purchase-order.entity.ts`
- Modify: `server/src/entities/purchase-order-item.entity.ts`
- Modify: `server/src/modules/purchase/purchase-order.service.ts`
- Modify: `server/src/modules/purchase/purchase-order.controller.ts`

---

### Task 7: 修改 SalesOrder 实体添加软删除字段

**Files:**
- Modify: `server/src/entities/sales-order.entity.ts`
- Modify: `server/src/entities/sales-order-item.entity.ts`
- Modify: `server/src/modules/sales/sales-order.service.ts`
- Modify: `server/src/modules/sales/sales-order.controller.ts`

---

### Task 8: 修改 Inventory 和 InventoryLog 实体添加软删除字段

**Files:**
- Modify: `server/src/entities/inventory.entity.ts`
- Modify: `server/src/entities/inventory-log.entity.ts`
- Modify: `server/src/modules/inventory/inventory.service.ts`
- Modify: `server/src/modules/inventory/inventory.controller.ts`

---

### Task 9: 修改 Coupon 和 Discount 实体添加软删除字段

**Files:**
- Modify: `server/src/entities/coupon.entity.ts`
- Modify: `server/src/entities/discount.entity.ts`
- Modify: `server/src/modules/discount/coupon.service.ts`
- Modify: `server/src/modules/discount/coupon.controller.ts`
- Modify: `server/src/modules/discount/discount.service.ts`
- Modify: `server/src/modules/discount/discount.controller.ts`

---

### Task 10: 测试验证

**Files:**
- Test: 手动测试各实体的增删改查功能

- [ ] **Step 1: 测试商品删除**

```bash
# 登录获取 token
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 删除商品
curl -X DELETE http://localhost:3001/api/v1/products/1 \
  -H "Authorization: Bearer <token>"

# 验证查询不到已删除的商品
curl http://localhost:3001/api/v1/products/1 \
  -H "Authorization: Bearer <token>"
```

- [ ] **Step 2: 验证 deletedAt 和 deletedBy 字段**

检查数据库确认字段正确写入。

- [ ] **Step 3: 测试其他实体**

重复上述步骤测试分类、供应商、客户等实体。
