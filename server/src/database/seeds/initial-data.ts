import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';
import { Permission } from '../../entities/permission.entity';
import { Category } from '../../entities/category.entity';
import { Product } from '../../entities/product.entity';
import { Supplier } from '../../entities/supplier.entity';
import { Customer } from '../../entities/customer.entity';
import { CustomerLevel } from '../../entities/customer-level.entity';
import { PurchaseOrder, PurchaseOrderStatus } from '../../entities/purchase-order.entity';
import { PurchaseOrderItem } from '../../entities/purchase-order-item.entity';
import { SalesOrder, SalesOrderStatus } from '../../entities/sales-order.entity';
import { SalesOrderItem } from '../../entities/sales-order-item.entity';
import { Inventory } from '../../entities/inventory.entity';
import { Discount, DiscountType, DiscountScope } from '../../entities/discount.entity';
import { Coupon, CouponType } from '../../entities/coupon.entity';

const PERMISSIONS = [
  { code: 'user:view', name: '查看用户', description: '查看用户列表和详情' },
  { code: 'user:create', name: '创建用户', description: '创建新用户' },
  { code: 'user:update', name: '编辑用户', description: '编辑用户信息' },
  { code: 'user:delete', name: '删除用户', description: '删除用户' },
  { code: 'role:view', name: '查看角色', description: '查看角色列表和详情' },
  { code: 'role:create', name: '创建角色', description: '创建新角色' },
  { code: 'role:update', name: '编辑角色', description: '编辑角色信息' },
  { code: 'role:delete', name: '删除角色', description: '删除角色' },
  { code: 'product:view', name: '查看商品', description: '查看商品列表和详情' },
  { code: 'product:create', name: '创建商品', description: '创建新商品' },
  { code: 'product:update', name: '编辑商品', description: '编辑商品信息' },
  { code: 'product:delete', name: '删除商品', description: '删除商品' },
  { code: 'purchase:view', name: '查看采购', description: '查看采购订单' },
  { code: 'purchase:create', name: '创建采购', description: '创建采购订单' },
  { code: 'purchase:update', name: '编辑采购', description: '编辑采购订单' },
  { code: 'purchase:delete', name: '删除采购', description: '删除采购订单' },
  { code: 'purchase:approve', name: '审批采购', description: '审批采购订单' },
  { code: 'sales:view', name: '查看销售', description: '查看销售订单' },
  { code: 'sales:create', name: '创建销售', description: '创建销售订单' },
  { code: 'sales:update', name: '编辑销售', description: '编辑销售订单' },
  { code: 'sales:delete', name: '删除销售', description: '删除销售订单' },
  { code: 'sales:approve', name: '审批销售', description: '审批销售订单' },
  { code: 'inventory:view', name: '查看库存', description: '查看库存信息' },
  { code: 'inventory:adjust', name: '调整库存', description: '调整库存数量' },
  { code: 'inventory:transfer', name: '库存调拨', description: '库存调拨操作' },
  { code: 'report:view', name: '查看报表', description: '查看各类报表' },
  { code: 'report:export', name: '导出报表', description: '导出报表数据' },
];

const ROLES = [
  { code: 'admin', name: '系统管理员', description: '拥有所有权限', permissionCodes: PERMISSIONS.map((p) => p.code) },
  { code: 'purchaser', name: '采购员', description: '负责采购业务', permissionCodes: ['product:view', 'purchase:view', 'purchase:create', 'purchase:update', 'inventory:view'] },
  { code: 'sales', name: '销售员', description: '负责销售业务', permissionCodes: ['product:view', 'sales:view', 'sales:create', 'sales:update', 'inventory:view'] },
  { code: 'warehouse', name: '仓库管理员', description: '负责仓库管理', permissionCodes: ['product:view', 'inventory:view', 'inventory:adjust', 'inventory:transfer'] },
  { code: 'finance', name: '财务人员', description: '负责财务审批', permissionCodes: ['product:view', 'purchase:view', 'purchase:approve', 'sales:view', 'sales:approve', 'report:view', 'report:export'] },
];

const CATEGORIES = [
  { name: '电子产品', sort: 1, children: [{ name: '手机', sort: 1 }, { name: '电脑', sort: 2 }, { name: '配件', sort: 3 }] },
  { name: '办公用品', sort: 2, children: [{ name: '文具', sort: 1 }, { name: '办公设备', sort: 2 }] },
  { name: '日用品', sort: 3, children: [{ name: '清洁用品', sort: 1 }, { name: '生活用品', sort: 2 }] },
];

const SUPPLIERS = [
  { name: '深圳科技有限公司', contact: '张经理', phone: '13800138001', address: '深圳市南山区科技园A栋' },
  { name: '广州电子商贸有限公司', contact: '李总', phone: '13800138002', address: '广州市天河区珠江新城' },
  { name: '上海办公用品供应商', contact: '王经理', phone: '13800138003', address: '上海市浦东新区张江高科' },
  { name: '北京日用品批发中心', contact: '赵经理', phone: '13800138004', address: '北京市朝阳区建国路88号' },
  { name: '杭州智能设备公司', contact: '陈经理', phone: '13800138005', address: '杭州市西湖区文三路' },
];

const CUSTOMER_LEVELS = [
  { name: '普通会员', minAmount: 0, discountPercent: 0, level: 1 },
  { name: '银卡会员', minAmount: 1000, discountPercent: 5, level: 2 },
  { name: '金卡会员', minAmount: 5000, discountPercent: 10, level: 3 },
  { name: '钻石会员', minAmount: 20000, discountPercent: 15, level: 4 },
];

const CUSTOMERS = [
  { name: '测试客户A', phone: '13900139001', address: '北京市海淀区中关村大街1号', levelIndex: 0, totalAmount: 15000 },
  { name: '测试客户B', phone: '13900139002', address: '上海市黄浦区南京路100号', levelIndex: 1, totalAmount: 8500 },
  { name: '测试客户C', phone: '13900139003', address: '广州市越秀区北京路50号', levelIndex: 2, totalAmount: 22000 },
  { name: '测试客户D', phone: '13900139004', address: '深圳市福田区华强北路', levelIndex: 3, totalAmount: 35000 },
  { name: '测试客户E', phone: '13900139005', address: '杭州市西湖区文一路', levelIndex: 0, totalAmount: 500 },
  { name: '测试客户F', phone: '13900139006', address: '成都市武侯区人民南路', levelIndex: 1, totalAmount: 3200 },
  { name: '测试客户G', phone: '13900139007', address: '武汉市江汉区解放大道', levelIndex: 2, totalAmount: 12000 },
  { name: '测试客户H', phone: '13900139008', address: '南京市鼓楼区中山路', levelIndex: 3, totalAmount: 28000 },
];

const PRODUCTS = [
  { sku: 'PHONE001', name: 'iPhone 15 Pro', categoryIndex: 1, spec: '256GB 深空黑', unit: '台', costPrice: 7999, salePrice: 8999, barcode: '6901234567001' },
  { sku: 'PHONE002', name: '华为Mate 60 Pro', categoryIndex: 1, spec: '512GB 雅丹黑', unit: '台', costPrice: 6499, salePrice: 7499, barcode: '6901234567002' },
  { sku: 'PHONE003', name: '小米14 Ultra', categoryIndex: 1, spec: '512GB 白色', unit: '台', costPrice: 5499, salePrice: 6299, barcode: '6901234567003' },
  { sku: 'PC001', name: 'MacBook Pro 14', categoryIndex: 2, spec: 'M3 Pro 18GB 512GB', unit: '台', costPrice: 14999, salePrice: 16999, barcode: '6901234567004' },
  { sku: 'PC002', name: 'ThinkPad X1 Carbon', categoryIndex: 2, spec: 'i7 16GB 512GB', unit: '台', costPrice: 9999, salePrice: 11999, barcode: '6901234567005' },
  { sku: 'PC003', name: '华为MateBook X Pro', categoryIndex: 2, spec: 'i7 16GB 1TB', unit: '台', costPrice: 8999, salePrice: 10499, barcode: '6901234567006' },
  { sku: 'ACC001', name: 'AirPods Pro 2', categoryIndex: 3, spec: 'USB-C', unit: '副', costPrice: 1499, salePrice: 1899, barcode: '6901234567007' },
  { sku: 'ACC002', name: '华为FreeBuds Pro 3', categoryIndex: 3, spec: '星河蓝', unit: '副', costPrice: 999, salePrice: 1299, barcode: '6901234567008' },
  { sku: 'ACC003', name: '小米充电器 67W', categoryIndex: 3, spec: 'Type-C', unit: '个', costPrice: 99, salePrice: 149, barcode: '6901234567009' },
  { sku: 'STATION001', name: '得力A4打印纸', categoryIndex: 4, spec: '500张/包', unit: '包', costPrice: 25, salePrice: 35, barcode: '6901234567010' },
  { sku: 'STATION002', name: '晨光签字笔', categoryIndex: 4, spec: '0.5mm 黑色', unit: '支', costPrice: 2, salePrice: 3, barcode: '6901234567011' },
  { sku: 'STATION003', name: '得力订书机', categoryIndex: 4, spec: '标准型', unit: '个', costPrice: 15, salePrice: 22, barcode: '6901234567012' },
  { sku: 'EQUIP001', name: '惠普激光打印机', categoryIndex: 5, spec: 'M126a 一体机', unit: '台', costPrice: 1599, salePrice: 1999, barcode: '6901234567013' },
  { sku: 'EQUIP002', name: '佳能扫描仪', categoryIndex: 5, spec: 'CanoScan LIDE 400', unit: '台', costPrice: 699, salePrice: 899, barcode: '6901234567014' },
  { sku: 'EQUIP003', name: '得力碎纸机', categoryIndex: 5, spec: 'C-320', unit: '台', costPrice: 299, salePrice: 399, barcode: '6901234567015' },
  { sku: 'CLEAN001', name: '蓝月亮洗衣液', categoryIndex: 6, spec: '3kg', unit: '瓶', costPrice: 45, salePrice: 59, barcode: '6901234567016' },
  { sku: 'CLEAN002', name: '威猛先生清洁剂', categoryIndex: 6, spec: '500ml', unit: '瓶', costPrice: 15, salePrice: 22, barcode: '6901234567017' },
  { sku: 'CLEAN003', name: '维达抽纸', categoryIndex: 6, spec: '100抽*3包', unit: '提', costPrice: 12, salePrice: 18, barcode: '6901234567018' },
  { sku: 'LIFE001', name: '高露洁牙膏', categoryIndex: 7, spec: '140g', unit: '支', costPrice: 12, salePrice: 18, barcode: '6901234567019' },
  { sku: 'LIFE002', name: '海飞丝洗发水', categoryIndex: 7, spec: '750ml', unit: '瓶', costPrice: 45, salePrice: 65, barcode: '6901234567020' },
];

const DISCOUNTS = [
  { name: '新品上市9折', scope: DiscountScope.ORDER, discountType: DiscountType.PERCENT, discountValue: 10, days: 30 },
  { name: '会员专享85折', scope: DiscountScope.ORDER, discountType: DiscountType.PERCENT, discountValue: 15, days: 60 },
  { name: '满1000减100', scope: DiscountScope.ORDER, discountType: DiscountType.FIXED, discountValue: 100, days: 45 },
  { name: '配件专区8折', scope: DiscountScope.ITEM, discountType: DiscountType.PERCENT, discountValue: 20, days: 30 },
  { name: '办公用品满200减30', scope: DiscountScope.ITEM, discountType: DiscountType.FIXED, discountValue: 30, days: 90 },
];

const COUPONS = [
  { code: 'NEW2024', name: '新用户专享券', type: CouponType.FULL_REDUCTION, minAmount: 100, discountValue: 20, totalCount: 1000, days: 90 },
  { code: 'VIP500', name: 'VIP会员券', type: CouponType.FULL_REDUCTION, minAmount: 500, discountValue: 50, totalCount: 500, days: 60 },
  { code: 'SPRING88', name: '春季促销券', type: CouponType.DISCOUNT, minAmount: 200, discountValue: 8.8, totalCount: 2000, days: 30 },
  { code: 'CASH50', name: '现金券50元', type: CouponType.CASH, minAmount: 0, discountValue: 50, totalCount: 300, days: 120 },
  { code: 'BIG1000', name: '大额满减券', type: CouponType.FULL_REDUCTION, minAmount: 2000, discountValue: 200, totalCount: 200, days: 45 },
];

export async function seedInitialData(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);
  const roleRepository = dataSource.getRepository(Role);
  const permissionRepository = dataSource.getRepository(Permission);
  const categoryRepository = dataSource.getRepository(Category);
  const productRepository = dataSource.getRepository(Product);
  const supplierRepository = dataSource.getRepository(Supplier);
  const customerRepository = dataSource.getRepository(Customer);
  const customerLevelRepository = dataSource.getRepository(CustomerLevel);
  const purchaseOrderRepository = dataSource.getRepository(PurchaseOrder);
  const purchaseOrderItemRepository = dataSource.getRepository(PurchaseOrderItem);
  const salesOrderRepository = dataSource.getRepository(SalesOrder);
  const salesOrderItemRepository = dataSource.getRepository(SalesOrderItem);
  const inventoryRepository = dataSource.getRepository(Inventory);
  const discountRepository = dataSource.getRepository(Discount);
  const couponRepository = dataSource.getRepository(Coupon);

  const adminUser = await userRepository.findOne({ where: { username: 'admin' } });
  if (adminUser) {
    console.log('Seed data already exists, skipping...');
    return;
  }

  console.log('Seeding initial data...');

  const permissionEntities: { [code: string]: Permission } = {};
  for (const permData of PERMISSIONS) {
    const permission = permissionRepository.create(permData);
    const saved = await permissionRepository.save(permission);
    permissionEntities[permData.code] = saved;
  }
  console.log(`Created ${PERMISSIONS.length} permissions`);

  const roleEntities: { [code: string]: Role } = {};
  for (const roleData of ROLES) {
    const permissions = roleData.permissionCodes.map((code) => permissionEntities[code]);
    const role = roleRepository.create({ code: roleData.code, name: roleData.name, description: roleData.description, permissions });
    const saved = await roleRepository.save(role);
    roleEntities[roleData.code] = saved;
  }
  console.log(`Created ${ROLES.length} roles`);

  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = userRepository.create({ username: 'admin', password: hashedPassword, name: '系统管理员', email: 'admin@example.com', status: true, roles: [roleEntities['admin']] });
  await userRepository.save(admin);
  console.log('Created admin user (username: admin, password: admin123)');

  const testUsers = [
    { username: 'purchaser1', name: '采购员张三', role: 'purchaser' },
    { username: 'purchaser2', name: '采购员李四', role: 'purchaser' },
    { username: 'sales1', name: '销售员王五', role: 'sales' },
    { username: 'sales2', name: '销售员赵六', role: 'sales' },
    { username: 'warehouse1', name: '仓管员孙七', role: 'warehouse' },
    { username: 'finance1', name: '财务周八', role: 'finance' },
  ];

  const userEntities: { [username: string]: User } = { admin };
  for (const userData of testUsers) {
    const user = userRepository.create({ username: userData.username, password: hashedPassword, name: userData.name, email: `${userData.username}@example.com`, status: true, roles: [roleEntities[userData.role]] });
    const saved = await userRepository.save(user);
    userEntities[userData.username] = saved;
  }
  console.log(`Created ${testUsers.length} test users (password: admin123)`);

  const categoryEntities: Category[] = [];
  for (const catData of CATEGORIES) {
    const category = categoryRepository.create({ name: catData.name, sort: catData.sort });
    const savedParent = await categoryRepository.save(category);
    categoryEntities.push(savedParent);
    if (catData.children) {
      for (const childData of catData.children) {
        const child = categoryRepository.create({ name: childData.name, sort: childData.sort, parentId: savedParent.id });
        const savedChild = await categoryRepository.save(child);
        categoryEntities.push(savedChild);
      }
    }
  }
  console.log(`Created ${categoryEntities.length} categories`);

  const productEntities: Product[] = [];
  for (const prodData of PRODUCTS) {
    const product = productRepository.create({ sku: prodData.sku, name: prodData.name, categoryId: categoryEntities[prodData.categoryIndex].id, spec: prodData.spec, unit: prodData.unit, costPrice: prodData.costPrice, salePrice: prodData.salePrice, barcode: prodData.barcode, status: true });
    const saved = await productRepository.save(product);
    productEntities.push(saved);
  }
  console.log(`Created ${productEntities.length} products`);

  const supplierEntities: Supplier[] = [];
  for (const supData of SUPPLIERS) {
    const supplier = supplierRepository.create(supData);
    const saved = await supplierRepository.save(supplier);
    supplierEntities.push(saved);
  }
  console.log(`Created ${supplierEntities.length} suppliers`);

  const customerLevelEntities: CustomerLevel[] = [];
  for (const levelData of CUSTOMER_LEVELS) {
    const level = customerLevelRepository.create(levelData);
    const saved = await customerLevelRepository.save(level);
    customerLevelEntities.push(saved);
  }
  console.log(`Created ${customerLevelEntities.length} customer levels`);

  const customerEntities: Customer[] = [];
  for (const custData of CUSTOMERS) {
    const customer = customerRepository.create({ name: custData.name, phone: custData.phone, address: custData.address, levelId: customerLevelEntities[custData.levelIndex].id, totalAmount: custData.totalAmount, status: true });
    const saved = await customerRepository.save(customer);
    customerEntities.push(saved);
  }
  console.log(`Created ${customerEntities.length} customers`);

  for (const product of productEntities) {
    const quantity = Math.floor(Math.random() * 500) + 50;
    const inventory = inventoryRepository.create({ productId: product.id, quantity: quantity, warningQuantity: 20 });
    await inventoryRepository.save(inventory);
  }
  console.log(`Created ${productEntities.length} inventory records`);

  const now = new Date();
  for (const discData of DISCOUNTS) {
    const startTime = new Date(now);
    const endTime = new Date(now);
    endTime.setDate(endTime.getDate() + discData.days);
    const discount = discountRepository.create({ name: discData.name, scope: discData.scope, discountType: discData.discountType, discountValue: discData.discountValue, startTime, endTime, status: true });
    await discountRepository.save(discount);
  }
  console.log(`Created ${DISCOUNTS.length} discounts`);

  for (const couponData of COUPONS) {
    const startTime = new Date(now);
    const endTime = new Date(now);
    endTime.setDate(endTime.getDate() + couponData.days);
    const coupon = couponRepository.create({ code: couponData.code, name: couponData.name, type: couponData.type, minAmount: couponData.minAmount, discountValue: couponData.discountValue, totalCount: couponData.totalCount, usedCount: 0, startTime, endTime, status: true });
    await couponRepository.save(coupon);
  }
  console.log(`Created ${COUPONS.length} coupons`);

  const purchaseOrders = [
    { supplierIndex: 0, items: [{ productIndex: 0, quantity: 50 }, { productIndex: 1, quantity: 30 }] },
    { supplierIndex: 1, items: [{ productIndex: 3, quantity: 20 }, { productIndex: 4, quantity: 15 }] },
    { supplierIndex: 2, items: [{ productIndex: 9, quantity: 100 }, { productIndex: 10, quantity: 200 }] },
    { supplierIndex: 0, items: [{ productIndex: 6, quantity: 100 }, { productIndex: 7, quantity: 80 }] },
    { supplierIndex: 3, items: [{ productIndex: 15, quantity: 200 }, { productIndex: 16, quantity: 150 }] },
  ];

  for (let i = 0; i < purchaseOrders.length; i++) {
    const po = purchaseOrders[i];
    const supplier = supplierEntities[po.supplierIndex];
    let totalAmount = 0;
    const orderItems: { productId: number; quantity: number; unitPrice: number; amount: number }[] = [];
    for (const item of po.items) {
      const product = productEntities[item.productIndex];
      const unitPrice = product.costPrice;
      const amount = Number(unitPrice) * item.quantity;
      totalAmount += amount;
      orderItems.push({ productId: product.id, quantity: item.quantity, unitPrice: Number(unitPrice), amount });
    }
    const orderNo = `PO${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(i + 1).padStart(4, '0')}`;
    const statuses = [PurchaseOrderStatus.DRAFT, PurchaseOrderStatus.PENDING, PurchaseOrderStatus.APPROVED, PurchaseOrderStatus.COMPLETED];
    const status = statuses[i % statuses.length];
    const purchaseOrder = purchaseOrderRepository.create({ orderNo, supplierId: supplier.id, totalAmount, status, createdById: userEntities['purchaser1'].id });
    const savedOrder = await purchaseOrderRepository.save(purchaseOrder);
    for (const itemData of orderItems) {
      const item = purchaseOrderItemRepository.create({ orderId: savedOrder.id, ...itemData });
      await purchaseOrderItemRepository.save(item);
    }
  }
  console.log(`Created ${purchaseOrders.length} purchase orders`);

  const salesOrders = [
    { customerIndex: 0, items: [{ productIndex: 0, quantity: 2 }, { productIndex: 6, quantity: 1 }] },
    { customerIndex: 1, items: [{ productIndex: 3, quantity: 1 }, { productIndex: 9, quantity: 10 }] },
    { customerIndex: 2, items: [{ productIndex: 1, quantity: 3 }, { productIndex: 7, quantity: 2 }] },
    { customerIndex: 3, items: [{ productIndex: 4, quantity: 2 }, { productIndex: 12, quantity: 1 }] },
    { customerIndex: 4, items: [{ productIndex: 10, quantity: 50 }, { productIndex: 11, quantity: 30 }] },
    { customerIndex: 5, items: [{ productIndex: 15, quantity: 20 }, { productIndex: 17, quantity: 10 }] },
    { customerIndex: 6, items: [{ productIndex: 2, quantity: 1 }, { productIndex: 8, quantity: 5 }] },
    { customerIndex: 7, items: [{ productIndex: 5, quantity: 3 }, { productIndex: 13, quantity: 2 }] },
  ];

  for (let i = 0; i < salesOrders.length; i++) {
    const so = salesOrders[i];
    const customer = customerEntities[so.customerIndex];
    let totalAmount = 0;
    const orderItems: { productId: number; quantity: number; unitPrice: number; discountRate: number; discountAmount: number; amount: number }[] = [];
    for (const item of so.items) {
      const product = productEntities[item.productIndex];
      const unitPrice = product.salePrice;
      const discountRate = i % 3 === 0 ? 10 : 0;
      const discountAmount = Number(unitPrice) * item.quantity * discountRate / 100;
      const amount = Number(unitPrice) * item.quantity - discountAmount;
      totalAmount += amount;
      orderItems.push({ productId: product.id, quantity: item.quantity, unitPrice: Number(unitPrice), discountRate, discountAmount, amount });
    }
    const orderNo = `SO${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(i + 1).padStart(4, '0')}`;
    const statuses = [SalesOrderStatus.DRAFT, SalesOrderStatus.PENDING, SalesOrderStatus.COMPLETED];
    const status = statuses[i % statuses.length];
    const discountAmount = i % 2 === 0 ? Math.floor(totalAmount * 0.05) : 0;
    const finalAmount = totalAmount - discountAmount;
    const salesOrder = salesOrderRepository.create({ orderNo, customerId: customer.id, totalAmount, discountAmount, couponDiscount: 0, finalAmount, status, createdById: userEntities['sales1'].id });
    const savedOrder = await salesOrderRepository.save(salesOrder);
    for (const itemData of orderItems) {
      const item = salesOrderItemRepository.create({ orderId: savedOrder.id, ...itemData });
      await salesOrderItemRepository.save(item);
    }
  }
  console.log(`Created ${salesOrders.length} sales orders`);

  console.log('Seed data completed!');
}
