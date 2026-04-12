import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';
import { Permission } from '../../entities/permission.entity';

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
  {
    code: 'admin',
    name: '系统管理员',
    description: '拥有所有权限',
    permissionCodes: PERMISSIONS.map((p) => p.code),
  },
  {
    code: 'purchaser',
    name: '采购员',
    description: '负责采购业务',
    permissionCodes: ['product:view', 'purchase:view', 'purchase:create', 'purchase:update', 'inventory:view'],
  },
  {
    code: 'sales',
    name: '销售员',
    description: '负责销售业务',
    permissionCodes: ['product:view', 'sales:view', 'sales:create', 'sales:update', 'inventory:view'],
  },
  {
    code: 'warehouse',
    name: '仓库管理员',
    description: '负责仓库管理',
    permissionCodes: ['product:view', 'inventory:view', 'inventory:adjust', 'inventory:transfer'],
  },
  {
    code: 'finance',
    name: '财务人员',
    description: '负责财务审批',
    permissionCodes: [
      'product:view',
      'purchase:view',
      'purchase:approve',
      'sales:view',
      'sales:approve',
      'report:view',
      'report:export',
    ],
  },
];

export async function seedInitialData(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);
  const roleRepository = dataSource.getRepository(Role);
  const permissionRepository = dataSource.getRepository(Permission);

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
    const role = roleRepository.create({
      code: roleData.code,
      name: roleData.name,
      description: roleData.description,
      permissions,
    });
    const saved = await roleRepository.save(role);
    roleEntities[roleData.code] = saved;
  }
  console.log(`Created ${ROLES.length} roles`);

  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = userRepository.create({
    username: 'admin',
    password: hashedPassword,
    name: '系统管理员',
    email: 'admin@example.com',
    status: true,
    roles: [roleEntities['admin']],
  });
  await userRepository.save(admin);
  console.log('Created admin user (username: admin, password: admin123)');

  console.log('Seed data completed!');
}
