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
  { name: '电子产品', sort: 1, children: [
    { name: '手机', sort: 1 },
    { name: '电脑', sort: 2 },
    { name: '平板', sort: 3 },
    { name: '配件', sort: 4 },
  ]},
  { name: '办公用品', sort: 2, children: [
    { name: '文具', sort: 1 },
    { name: '办公设备', sort: 2 },
    { name: '办公家具', sort: 3 },
  ]},
  { name: '日用品', sort: 3, children: [
    { name: '清洁用品', sort: 1 },
    { name: '生活用品', sort: 2 },
    { name: '个人护理', sort: 3 },
  ]},
  { name: '食品饮料', sort: 4, children: [
    { name: '饮料', sort: 1 },
    { name: '零食', sort: 2 },
    { name: '茶叶咖啡', sort: 3 },
  ]},
];

const SUPPLIERS = [
  { name: '深圳科技有限公司', contact: '张经理', phone: '13800138001', address: '深圳市南山区科技园A栋' },
  { name: '广州电子商贸有限公司', contact: '李总', phone: '13800138002', address: '广州市天河区珠江新城' },
  { name: '上海办公用品供应商', contact: '王经理', phone: '13800138003', address: '上海市浦东新区张江高科' },
  { name: '北京日用品批发中心', contact: '赵经理', phone: '13800138004', address: '北京市朝阳区建国路88号' },
  { name: '杭州智能设备公司', contact: '陈经理', phone: '13800138005', address: '杭州市西湖区文三路' },
  { name: '成都数码配件有限公司', contact: '刘经理', phone: '13800138006', address: '成都市高新区天府软件园' },
  { name: '武汉电子元器件供应商', contact: '周经理', phone: '13800138007', address: '武汉市洪山区光谷广场' },
  { name: '南京办公用品批发商', contact: '吴经理', phone: '13800138008', address: '南京市玄武区新街口' },
  { name: '西安数码产品供应商', contact: '郑经理', phone: '13800138009', address: '西安市雁塔区高新路' },
  { name: '重庆日用品贸易公司', contact: '孙经理', phone: '13800138010', address: '重庆市渝中区解放碑' },
];

const CUSTOMER_LEVELS = [
  { name: '普通会员', minAmount: 0, discountPercent: 0, level: 1 },
  { name: '银卡会员', minAmount: 1000, discountPercent: 5, level: 2 },
  { name: '金卡会员', minAmount: 5000, discountPercent: 10, level: 3 },
  { name: '钻石会员', minAmount: 20000, discountPercent: 15, level: 4 },
];

const CUSTOMERS = [
  { name: '张伟', phone: '13900139001', address: '北京市海淀区中关村大街1号', levelIndex: 0, totalAmount: 15000 },
  { name: '李娜', phone: '13900139002', address: '上海市黄浦区南京路100号', levelIndex: 1, totalAmount: 8500 },
  { name: '王芳', phone: '13900139003', address: '广州市越秀区北京路50号', levelIndex: 2, totalAmount: 22000 },
  { name: '刘洋', phone: '13900139004', address: '深圳市福田区华强北路', levelIndex: 3, totalAmount: 35000 },
  { name: '陈明', phone: '13900139005', address: '杭州市西湖区文一路', levelIndex: 0, totalAmount: 500 },
  { name: '杨丽', phone: '13900139006', address: '成都市武侯区人民南路', levelIndex: 1, totalAmount: 3200 },
  { name: '赵强', phone: '13900139007', address: '武汉市江汉区解放大道', levelIndex: 2, totalAmount: 12000 },
  { name: '周敏', phone: '13900139008', address: '南京市鼓楼区中山路', levelIndex: 3, totalAmount: 28000 },
  { name: '吴涛', phone: '13900139009', address: '西安市雁塔区小寨路', levelIndex: 0, totalAmount: 800 },
  { name: '郑洁', phone: '13900139010', address: '重庆市渝中区解放碑', levelIndex: 1, totalAmount: 4500 },
  { name: '孙鹏', phone: '13900139011', address: '天津市和平区滨江道', levelIndex: 2, totalAmount: 18000 },
  { name: '马琳', phone: '13900139012', address: '苏州市姑苏区观前街', levelIndex: 3, totalAmount: 42000 },
  { name: '黄磊', phone: '13900139013', address: '青岛市市南区香港中路', levelIndex: 0, totalAmount: 1200 },
  { name: '胡婷', phone: '13900139014', address: '大连市中山区人民路', levelIndex: 1, totalAmount: 6800 },
  { name: '林峰', phone: '13900139015', address: '厦门市思明区中山路', levelIndex: 2, totalAmount: 15000 },
  { name: '何雪', phone: '13900139016', address: '长沙市岳麓区麓山路', levelIndex: 3, totalAmount: 38000 },
  { name: '罗浩', phone: '13900139017', address: '郑州市金水区花园路', levelIndex: 0, totalAmount: 600 },
  { name: '谢静', phone: '13900139018', address: '沈阳市沈河区中街', levelIndex: 1, totalAmount: 2900 },
  { name: '唐俊', phone: '13900139019', address: '济南市历下区泉城路', levelIndex: 2, totalAmount: 11000 },
  { name: '韩梅', phone: '13900139020', address: '福州市鼓楼区八一七路', levelIndex: 3, totalAmount: 25000 },
];

const PRODUCTS = [
  { sku: 'PHONE001', name: 'iPhone 15 Pro', categoryIndex: 1, spec: '256GB 深空黑', unit: '台', costPrice: 7999, salePrice: 8999, barcode: '6901234567001' },
  { sku: 'PHONE002', name: '华为Mate 60 Pro', categoryIndex: 1, spec: '512GB 雅丹黑', unit: '台', costPrice: 6499, salePrice: 7499, barcode: '6901234567002' },
  { sku: 'PHONE003', name: '小米14 Ultra', categoryIndex: 1, spec: '512GB 白色', unit: '台', costPrice: 5499, salePrice: 6299, barcode: '6901234567003' },
  { sku: 'PHONE004', name: 'OPPO Find X7', categoryIndex: 1, spec: '256GB 海阔天空', unit: '台', costPrice: 3999, salePrice: 4599, barcode: '6901234567004' },
  { sku: 'PHONE005', name: 'vivo X100 Pro', categoryIndex: 1, spec: '512GB 落日橙', unit: '台', costPrice: 4999, salePrice: 5799, barcode: '6901234567005' },
  { sku: 'PC001', name: 'MacBook Pro 14', categoryIndex: 2, spec: 'M3 Pro 18GB 512GB', unit: '台', costPrice: 14999, salePrice: 16999, barcode: '6901234567006' },
  { sku: 'PC002', name: 'ThinkPad X1 Carbon', categoryIndex: 2, spec: 'i7 16GB 512GB', unit: '台', costPrice: 9999, salePrice: 11999, barcode: '6901234567007' },
  { sku: 'PC003', name: '华为MateBook X Pro', categoryIndex: 2, spec: 'i7 16GB 1TB', unit: '台', costPrice: 8999, salePrice: 10499, barcode: '6901234567008' },
  { sku: 'PC004', name: '戴尔XPS 15', categoryIndex: 2, spec: 'i7 32GB 1TB', unit: '台', costPrice: 12999, salePrice: 14999, barcode: '6901234567009' },
  { sku: 'PC005', name: '华硕ROG幻16', categoryIndex: 2, spec: 'i9 32GB 2TB RTX4070', unit: '台', costPrice: 15999, salePrice: 18999, barcode: '6901234567010' },
  { sku: 'TABLET001', name: 'iPad Pro 12.9', categoryIndex: 3, spec: 'M2 256GB WiFi', unit: '台', costPrice: 8499, salePrice: 9499, barcode: '6901234567011' },
  { sku: 'TABLET002', name: '华为MatePad Pro', categoryIndex: 3, spec: '12.6英寸 256GB', unit: '台', costPrice: 4999, salePrice: 5799, barcode: '6901234567012' },
  { sku: 'TABLET003', name: '小米平板6 Pro', categoryIndex: 3, spec: '11英寸 256GB', unit: '台', costPrice: 2499, salePrice: 2999, barcode: '6901234567013' },
  { sku: 'ACC001', name: 'AirPods Pro 2', categoryIndex: 4, spec: 'USB-C', unit: '副', costPrice: 1499, salePrice: 1899, barcode: '6901234567014' },
  { sku: 'ACC002', name: '华为FreeBuds Pro 3', categoryIndex: 4, spec: '星河蓝', unit: '副', costPrice: 999, salePrice: 1299, barcode: '6901234567015' },
  { sku: 'ACC003', name: '小米充电器 67W', categoryIndex: 4, spec: 'Type-C', unit: '个', costPrice: 99, salePrice: 149, barcode: '6901234567016' },
  { sku: 'ACC004', name: 'Apple Watch Ultra 2', categoryIndex: 4, spec: '49mm 钛金属', unit: '块', costPrice: 5999, salePrice: 6999, barcode: '6901234567017' },
  { sku: 'ACC005', name: '华为WATCH GT 4', categoryIndex: 4, spec: '46mm 棕色皮表带', unit: '块', costPrice: 1488, salePrice: 1788, barcode: '6901234567018' },
  { sku: 'STATION001', name: '得力A4打印纸', categoryIndex: 5, spec: '500张/包', unit: '包', costPrice: 25, salePrice: 35, barcode: '6901234567019' },
  { sku: 'STATION002', name: '晨光签字笔', categoryIndex: 5, spec: '0.5mm 黑色', unit: '支', costPrice: 2, salePrice: 3, barcode: '6901234567020' },
  { sku: 'STATION003', name: '得力订书机', categoryIndex: 5, spec: '标准型', unit: '个', costPrice: 15, salePrice: 22, barcode: '6901234567021' },
  { sku: 'STATION004', name: '齐心文件夹', categoryIndex: 5, spec: 'A4 双夹', unit: '个', costPrice: 8, salePrice: 12, barcode: '6901234567022' },
  { sku: 'STATION005', name: '得力计算器', categoryIndex: 5, spec: '12位语音型', unit: '个', costPrice: 45, salePrice: 68, barcode: '6901234567023' },
  { sku: 'EQUIP001', name: '惠普激光打印机', categoryIndex: 6, spec: 'M126a 一体机', unit: '台', costPrice: 1599, salePrice: 1999, barcode: '6901234567024' },
  { sku: 'EQUIP002', name: '佳能扫描仪', categoryIndex: 6, spec: 'CanoScan LIDE 400', unit: '台', costPrice: 699, salePrice: 899, barcode: '6901234567025' },
  { sku: 'EQUIP003', name: '得力碎纸机', categoryIndex: 6, spec: 'C-320', unit: '台', costPrice: 299, salePrice: 399, barcode: '6901234567026' },
  { sku: 'EQUIP004', name: '兄弟传真机', categoryIndex: 6, spec: 'FAX-2890', unit: '台', costPrice: 1899, salePrice: 2299, barcode: '6901234567027' },
  { sku: 'FURN001', name: '办公转椅', categoryIndex: 7, spec: '黑色网布', unit: '把', costPrice: 399, salePrice: 599, barcode: '6901234567028' },
  { sku: 'FURN002', name: '办公桌', categoryIndex: 7, spec: '1.4m 实木', unit: '张', costPrice: 899, salePrice: 1299, barcode: '6901234567029' },
  { sku: 'FURN003', name: '文件柜', categoryIndex: 7, spec: '三层铁皮柜', unit: '个', costPrice: 499, salePrice: 699, barcode: '6901234567030' },
  { sku: 'CLEAN001', name: '蓝月亮洗衣液', categoryIndex: 8, spec: '3kg', unit: '瓶', costPrice: 45, salePrice: 59, barcode: '6901234567031' },
  { sku: 'CLEAN002', name: '威猛先生清洁剂', categoryIndex: 8, spec: '500ml', unit: '瓶', costPrice: 15, salePrice: 22, barcode: '6901234567032' },
  { sku: 'CLEAN003', name: '维达抽纸', categoryIndex: 8, spec: '100抽*3包', unit: '提', costPrice: 12, salePrice: 18, barcode: '6901234567033' },
  { sku: 'CLEAN004', name: '立白洗洁精', categoryIndex: 8, spec: '1kg', unit: '瓶', costPrice: 12, salePrice: 18, barcode: '6901234567034' },
  { sku: 'LIFE001', name: '高露洁牙膏', categoryIndex: 9, spec: '140g', unit: '支', costPrice: 12, salePrice: 18, barcode: '6901234567035' },
  { sku: 'LIFE002', name: '海飞丝洗发水', categoryIndex: 9, spec: '750ml', unit: '瓶', costPrice: 45, salePrice: 65, barcode: '6901234567036' },
  { sku: 'LIFE003', name: '舒肤佳香皂', categoryIndex: 9, spec: '125g*3块', unit: '盒', costPrice: 15, salePrice: 22, barcode: '6901234567037' },
  { sku: 'LIFE004', name: '清风卷纸', categoryIndex: 9, spec: '10卷装', unit: '提', costPrice: 25, salePrice: 35, barcode: '6901234567038' },
  { sku: 'CARE001', name: '妮维雅面霜', categoryIndex: 10, spec: '50ml', unit: '瓶', costPrice: 55, salePrice: 78, barcode: '6901234567039' },
  { sku: 'CARE002', name: '曼秀雷敦润唇膏', categoryIndex: 10, spec: '薄荷味', unit: '支', costPrice: 25, salePrice: 35, barcode: '6901234567040' },
  { sku: 'DRINK001', name: '农夫山泉矿泉水', categoryIndex: 11, spec: '550ml*24瓶', unit: '箱', costPrice: 32, salePrice: 45, barcode: '6901234567041' },
  { sku: 'DRINK002', name: '可口可乐', categoryIndex: 11, spec: '330ml*24罐', unit: '箱', costPrice: 55, salePrice: 75, barcode: '6901234567042' },
  { sku: 'DRINK003', name: '红牛功能饮料', categoryIndex: 11, spec: '250ml*24罐', unit: '箱', costPrice: 115, salePrice: 145, barcode: '6901234567043' },
  { sku: 'SNACK001', name: '奥利奥饼干', categoryIndex: 12, spec: '116g', unit: '盒', costPrice: 8, salePrice: 12, barcode: '6901234567044' },
  { sku: 'SNACK002', name: '乐事薯片', categoryIndex: 12, spec: '145g', unit: '袋', costPrice: 10, salePrice: 15, barcode: '6901234567045' },
  { sku: 'SNACK003', name: '德芙巧克力', categoryIndex: 12, spec: '80g', unit: '盒', costPrice: 18, salePrice: 25, barcode: '6901234567046' },
  { sku: 'TEA001', name: '立顿红茶', categoryIndex: 13, spec: '2g*100袋', unit: '盒', costPrice: 35, salePrice: 48, barcode: '6901234567047' },
  { sku: 'TEA002', name: '雀巢咖啡', categoryIndex: 13, spec: '1.8g*48条', unit: '盒', costPrice: 45, salePrice: 65, barcode: '6901234567048' },
];

const DISCOUNTS = [
  { name: '新品上市9折', scope: DiscountScope.ORDER, discountType: DiscountType.PERCENT, discountValue: 10, days: 30 },
  { name: '会员专享85折', scope: DiscountScope.ORDER, discountType: DiscountType.PERCENT, discountValue: 15, days: 60 },
  { name: '满1000减100', scope: DiscountScope.ORDER, discountType: DiscountType.FIXED, discountValue: 100, days: 45 },
  { name: '配件专区8折', scope: DiscountScope.ITEM, discountType: DiscountType.PERCENT, discountValue: 20, days: 30 },
  { name: '办公用品满200减30', scope: DiscountScope.ITEM, discountType: DiscountType.FIXED, discountValue: 30, days: 90 },
  { name: '电子产品满5000减300', scope: DiscountScope.ORDER, discountType: DiscountType.FIXED, discountValue: 300, days: 60 },
  { name: '清仓特惠7折', scope: DiscountScope.ORDER, discountType: DiscountType.PERCENT, discountValue: 30, days: 15 },
  { name: '新客户首单9折', scope: DiscountScope.ORDER, discountType: DiscountType.PERCENT, discountValue: 10, days: 180 },
  { name: '手机配件满500减50', scope: DiscountScope.ITEM, discountType: DiscountType.FIXED, discountValue: 50, days: 45 },
  { name: '日用品专区满100减15', scope: DiscountScope.ITEM, discountType: DiscountType.FIXED, discountValue: 15, days: 90 },
];

const COUPONS = [
  { code: 'NEW2024', name: '新用户专享券', type: CouponType.FULL_REDUCTION, minAmount: 100, discountValue: 20, totalCount: 1000, days: 90 },
  { code: 'VIP500', name: 'VIP会员券', type: CouponType.FULL_REDUCTION, minAmount: 500, discountValue: 50, totalCount: 500, days: 60 },
  { code: 'SPRING88', name: '春季促销券', type: CouponType.DISCOUNT, minAmount: 200, discountValue: 8.8, totalCount: 2000, days: 30 },
  { code: 'CASH50', name: '现金券50元', type: CouponType.CASH, minAmount: 0, discountValue: 50, totalCount: 300, days: 120 },
  { code: 'BIG1000', name: '大额满减券', type: CouponType.FULL_REDUCTION, minAmount: 2000, discountValue: 200, totalCount: 200, days: 45 },
  { code: 'SUMMER20', name: '夏季清凉券', type: CouponType.FULL_REDUCTION, minAmount: 300, discountValue: 30, totalCount: 800, days: 60 },
  { code: 'AUTUMN99', name: '金秋优惠券', type: CouponType.DISCOUNT, minAmount: 500, discountValue: 9.5, totalCount: 1500, days: 45 },
  { code: 'WINTER50', name: '冬季暖心券', type: CouponType.FULL_REDUCTION, minAmount: 400, discountValue: 40, totalCount: 600, days: 90 },
  { code: 'ANNI100', name: '周年庆优惠券', type: CouponType.FULL_REDUCTION, minAmount: 1000, discountValue: 100, totalCount: 400, days: 30 },
  { code: 'VIP888', name: 'VIP专属8折券', type: CouponType.DISCOUNT, minAmount: 800, discountValue: 8, totalCount: 200, days: 60 },
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
    { username: 'purchaser3', name: '采购员王刚', role: 'purchaser' },
    { username: 'sales1', name: '销售员王五', role: 'sales' },
    { username: 'sales2', name: '销售员赵六', role: 'sales' },
    { username: 'sales3', name: '销售员孙红', role: 'sales' },
    { username: 'warehouse1', name: '仓管员孙七', role: 'warehouse' },
    { username: 'warehouse2', name: '仓管员吴强', role: 'warehouse' },
    { username: 'finance1', name: '财务周八', role: 'finance' },
    { username: 'finance2', name: '财务钱九', role: 'finance' },
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

  const statuses = [PurchaseOrderStatus.DRAFT, PurchaseOrderStatus.PENDING, PurchaseOrderStatus.APPROVED, PurchaseOrderStatus.COMPLETED, PurchaseOrderStatus.CANCELLED];
  const purchaserUsers = Object.keys(userEntities).filter(u => u.startsWith('purchaser'));
  let purchaseOrderIndex = 0;

  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const ordersPerDay = Math.floor(Math.random() * 4) + 3;
    for (let j = 0; j < ordersPerDay; j++) {
        const supplierIndex = Math.floor(Math.random() * supplierEntities.length);
        const supplier = supplierEntities[supplierIndex];
        const itemCount = Math.floor(Math.random() * 3) + 1;
        let totalAmount = 0;
        const orderItems: { productId: number; quantity: number; unitPrice: number; amount: number }[] = [];
        
        for (let k = 0; k < itemCount; k++) {
          const productIndex = Math.floor(Math.random() * productEntities.length);
          const product = productEntities[productIndex];
          const quantity = Math.floor(Math.random() * 50) + 5;
          const unitPrice = product.costPrice;
          const amount = Number(unitPrice) * quantity;
          totalAmount += amount;
          orderItems.push({ productId: product.id, quantity, unitPrice: Number(unitPrice), amount });
        }
        
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - dayOffset);
        createdAt.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);
        
        const orderNo = `PO${createdAt.getFullYear()}${String(createdAt.getMonth() + 1).padStart(2, '0')}${String(purchaseOrderIndex + 1).padStart(4, '0')}`;
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const creatorUsername = purchaserUsers[Math.floor(Math.random() * purchaserUsers.length)];
        
        const purchaseOrder = purchaseOrderRepository.create({ 
          orderNo, 
          supplierId: supplier.id, 
          totalAmount, 
          status, 
          createdById: userEntities[creatorUsername].id,
          createdAt,
        });
        const savedOrder = await purchaseOrderRepository.save(purchaseOrder);
        
        for (const itemData of orderItems) {
          const item = purchaseOrderItemRepository.create({ orderId: savedOrder.id, ...itemData });
          await purchaseOrderItemRepository.save(item);
        }
        purchaseOrderIndex++;
      }
  }
  console.log(`Created ${purchaseOrderIndex} purchase orders`);

  const salesStatuses = [SalesOrderStatus.DRAFT, SalesOrderStatus.PENDING, SalesOrderStatus.COMPLETED, SalesOrderStatus.CANCELLED];
  const salesUsers = Object.keys(userEntities).filter(u => u.startsWith('sales'));
  let salesOrderIndex = 0;

  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const ordersPerDay = Math.floor(Math.random() * 5) + 4;
    for (let j = 0; j < ordersPerDay; j++) {
        const customerIndex = Math.floor(Math.random() * customerEntities.length);
        const customer = customerEntities[customerIndex];
        const itemCount = Math.floor(Math.random() * 4) + 1;
        let totalAmount = 0;
        const orderItems: { productId: number; quantity: number; unitPrice: number; discountRate: number; discountAmount: number; amount: number }[] = [];
        
        for (let k = 0; k < itemCount; k++) {
          const productIndex = Math.floor(Math.random() * productEntities.length);
          const product = productEntities[productIndex];
          const quantity = Math.floor(Math.random() * 10) + 1;
          const unitPrice = product.salePrice;
          const discountRate = Math.random() > 0.7 ? Math.floor(Math.random() * 15) + 5 : 0;
          const discountAmount = Number(unitPrice) * quantity * discountRate / 100;
          const amount = Number(unitPrice) * quantity - discountAmount;
          totalAmount += amount;
          orderItems.push({ productId: product.id, quantity, unitPrice: Number(unitPrice), discountRate, discountAmount, amount });
        }
        
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - dayOffset);
        createdAt.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);
        
        const orderNo = `SO${createdAt.getFullYear()}${String(createdAt.getMonth() + 1).padStart(2, '0')}${String(salesOrderIndex + 1).padStart(4, '0')}`;
        const status = salesStatuses[Math.floor(Math.random() * salesStatuses.length)];
        const orderDiscountAmount = Math.random() > 0.6 ? Math.floor(totalAmount * 0.05) : 0;
        const couponDiscount = Math.random() > 0.8 ? Math.floor(Math.random() * 100) + 20 : 0;
        const finalAmount = totalAmount - orderDiscountAmount - couponDiscount;
        const creatorUsername = salesUsers[Math.floor(Math.random() * salesUsers.length)];
        
        const salesOrder = salesOrderRepository.create({ 
          orderNo, 
          customerId: customer.id, 
          totalAmount, 
          discountAmount: orderDiscountAmount, 
          couponDiscount, 
          finalAmount, 
          status, 
          createdById: userEntities[creatorUsername].id,
          createdAt,
        });
        const savedOrder = await salesOrderRepository.save(salesOrder);
        
        for (const itemData of orderItems) {
          const item = salesOrderItemRepository.create({ orderId: savedOrder.id, ...itemData });
          await salesOrderItemRepository.save(item);
        }
        salesOrderIndex++;
      }
  }
  console.log(`Created ${salesOrderIndex} sales orders`);

  console.log('Seed data completed!');
}
