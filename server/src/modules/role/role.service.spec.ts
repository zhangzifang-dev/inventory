import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RoleService } from './role.service';
import { Role } from '../../entities/role.entity';
import { Permission } from '../../entities/permission.entity';
import { User } from '../../entities/user.entity';
import { createMockRepository } from '../../common/test/mock-repository';

describe('RoleService', () => {
  let service: RoleService;
  let roleRepository: ReturnType<typeof createMockRepository<Role>>;
  let permissionRepository: ReturnType<typeof createMockRepository<Permission>>;

  const mockPermission: Permission = {
    id: 1,
    code: 'user:read',
    name: 'Read User',
    description: 'Permission to read users',
    createdAt: new Date('2024-01-01'),
    roles: [],
  };

  const mockPermission2: Permission = {
    id: 2,
    code: 'user:write',
    name: 'Write User',
    description: 'Permission to write users',
    createdAt: new Date('2024-01-01'),
    roles: [],
  };

  const mockRole: Role = {
    id: 1,
    code: 'admin',
    name: 'Admin',
    description: 'Administrator role',
    createdAt: new Date('2024-01-01'),
    permissions: [mockPermission],
    users: [],
  };

  const mockUser: User = {
    id: 1,
    username: 'testuser',
    password: 'hashedpassword',
    name: 'Test User',
    email: 'test@example.com',
    phone: '13800138000',
    status: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    roles: [],
  };

  beforeEach(async () => {
    roleRepository = createMockRepository<Role>();
    permissionRepository = createMockRepository<Permission>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        { provide: 'RoleRepository', useValue: roleRepository },
        { provide: 'PermissionRepository', useValue: permissionRepository },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      code: 'admin',
      name: 'Admin',
      description: 'Administrator role',
    };

    it('should successfully create a role without permissions', async () => {
      roleRepository.findOne.mockResolvedValue(null);
      roleRepository.create.mockReturnValue(mockRole);
      roleRepository.save.mockResolvedValue(mockRole);

      const result = await service.create(createDto);

      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { code: createDto.code },
      });
      expect(roleRepository.create).toHaveBeenCalledWith({
        code: createDto.code,
        name: createDto.name,
        description: createDto.description,
      });
      expect(roleRepository.save).toHaveBeenCalledWith(mockRole);
      expect(result).toEqual(mockRole);
    });

    it('should throw BadRequestException if role code already exists', async () => {
      roleRepository.findOne.mockResolvedValue(mockRole);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow('角色编码已存在');
    });

    it('should create role with permissions when permissionIds provided', async () => {
      const createDtoWithPermissions = {
        ...createDto,
        permissionIds: [1, 2],
      };

      roleRepository.findOne.mockResolvedValue(null);
      roleRepository.create.mockReturnValue({ ...mockRole, permissions: [] });
      permissionRepository.findBy.mockResolvedValue([mockPermission, mockPermission2]);
      roleRepository.save.mockResolvedValue({
        ...mockRole,
        permissions: [mockPermission, mockPermission2],
      });

      const result = await service.create(createDtoWithPermissions);

      expect(permissionRepository.findBy).toHaveBeenCalled();
      expect(result.permissions).toHaveLength(2);
    });

    it('should create role with empty permissions when permissionIds is empty array', async () => {
      const createDtoWithEmptyPermissions = {
        ...createDto,
        permissionIds: [],
      };

      roleRepository.findOne.mockResolvedValue(null);
      roleRepository.create.mockReturnValue({ ...mockRole, permissions: [] });
      roleRepository.save.mockResolvedValue({ ...mockRole, permissions: [] });

      const result = await service.create(createDtoWithEmptyPermissions);

      expect(permissionRepository.findBy).not.toHaveBeenCalled();
      expect(result.permissions).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('should return paginated roles without filters', async () => {
      const roles = [mockRole];
      roleRepository.findAndCount.mockResolvedValue([roles, 1]);

      const result = await service.findAll(1, 20);

      expect(roleRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['permissions'],
          select: ['id', 'code', 'name', 'description', 'createdAt'],
          skip: 0,
          take: 20,
          order: { id: 'DESC' },
        }),
      );
      expect(result.list).toEqual(roles);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('should return paginated roles with name filter', async () => {
      const roles = [mockRole];
      roleRepository.findAndCount.mockResolvedValue([roles, 1]);

      const result = await service.findAll(1, 20, 'Admin');

      expect(roleRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: expect.any(Object),
          }),
        }),
      );
      expect(result.list).toEqual(roles);
    });

    it('should return paginated roles with custom pagination', async () => {
      const roles = [mockRole];
      roleRepository.findAndCount.mockResolvedValue([roles, 1]);

      const result = await service.findAll(2, 10);

      expect(roleRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(10);
    });

    it('should return empty list when no roles exist', async () => {
      roleRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll();

      expect(result.list).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should calculate correct skip for page 3', async () => {
      roleRepository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(3, 15);

      expect(roleRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 30,
          take: 15,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a role when found', async () => {
      roleRepository.findOne.mockResolvedValue(mockRole);

      const result = await service.findOne(1);

      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['permissions'],
        select: ['id', 'code', 'name', 'description', 'createdAt'],
      });
      expect(result).toEqual(mockRole);
    });

    it('should throw NotFoundException when role not found', async () => {
      roleRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('角色不存在');
    });
  });

  describe('update', () => {
    const updateDto = { name: 'Updated Role' };

    it('should successfully update a role name', async () => {
      roleRepository.findOne.mockResolvedValue({ ...mockRole, permissions: [] });
      roleRepository.save.mockResolvedValue({ ...mockRole, name: 'Updated Role' });

      const result = await service.update(1, updateDto);

      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['permissions'],
      });
      expect(roleRepository.save).toHaveBeenCalled();
      expect(result.name).toBe('Updated Role');
    });

    it('should successfully update role description', async () => {
      roleRepository.findOne.mockResolvedValue({ ...mockRole, permissions: [] });
      roleRepository.save.mockResolvedValue({
        ...mockRole,
        description: 'Updated description',
      });

      const result = await service.update(1, { description: 'Updated description' });

      expect(result.description).toBe('Updated description');
    });

    it('should throw NotFoundException when role not found', async () => {
      roleRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update(999, updateDto)).rejects.toThrow('角色不存在');
    });

    it('should update role permissions when permissionIds provided', async () => {
      roleRepository.findOne.mockResolvedValue({ ...mockRole, permissions: [] });
      permissionRepository.findBy.mockResolvedValue([mockPermission, mockPermission2]);
      roleRepository.save.mockResolvedValue({
        ...mockRole,
        permissions: [mockPermission, mockPermission2],
      });

      const result = await service.update(1, { permissionIds: [1, 2] });

      expect(permissionRepository.findBy).toHaveBeenCalled();
      expect(result.permissions).toHaveLength(2);
    });

    it('should clear permissions when permissionIds is empty array', async () => {
      roleRepository.findOne.mockResolvedValue({
        ...mockRole,
        permissions: [mockPermission],
      });
      roleRepository.save.mockResolvedValue({ ...mockRole, permissions: [] });

      const result = await service.update(1, { permissionIds: [] });

      expect(result.permissions).toEqual([]);
    });

    it('should not update fields when not provided', async () => {
      const existingRole = { ...mockRole, name: 'Original', description: 'Original desc' };
      roleRepository.findOne.mockResolvedValue(existingRole);
      roleRepository.save.mockResolvedValue(existingRole);

      const result = await service.update(1, {});

      expect(result.name).toBe('Original');
      expect(result.description).toBe('Original desc');
    });

    it('should update both name and description', async () => {
      roleRepository.findOne.mockResolvedValue({ ...mockRole, permissions: [] });
      roleRepository.save.mockResolvedValue({
        ...mockRole,
        name: 'New Name',
        description: 'New Description',
      });

      const result = await service.update(1, {
        name: 'New Name',
        description: 'New Description',
      });

      expect(result.name).toBe('New Name');
      expect(result.description).toBe('New Description');
    });
  });

  describe('remove', () => {
    it('should successfully remove a role without users', async () => {
      roleRepository.findOne.mockResolvedValue({ ...mockRole, users: [] });
      roleRepository.remove.mockResolvedValue(mockRole);

      await service.remove(1);

      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['users'],
      });
      expect(roleRepository.remove).toHaveBeenCalledWith(mockRole);
    });

    it('should throw NotFoundException when role not found', async () => {
      roleRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      await expect(service.remove(999)).rejects.toThrow('角色不存在');
    });

    it('should throw BadRequestException when role has users assigned', async () => {
      roleRepository.findOne.mockResolvedValue({
        ...mockRole,
        users: [mockUser],
      });

      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
      await expect(service.remove(1)).rejects.toThrow(
        '该角色已分配给用户，无法删除',
      );
    });

    it('should throw BadRequestException when role has multiple users assigned', async () => {
      roleRepository.findOne.mockResolvedValue({
        ...mockRole,
        users: [mockUser, { ...mockUser, id: 2 }],
      });

      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
    });

    it('should not call remove when role has users', async () => {
      roleRepository.findOne.mockResolvedValue({
        ...mockRole,
        users: [mockUser],
      });

      await expect(service.remove(1)).rejects.toThrow();
      expect(roleRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('assignPermissions', () => {
    it('should successfully assign permissions to a role', async () => {
      roleRepository.findOne.mockResolvedValue({ ...mockRole, permissions: [] });
      permissionRepository.findBy.mockResolvedValue([mockPermission, mockPermission2]);
      roleRepository.save.mockResolvedValue({
        ...mockRole,
        permissions: [mockPermission, mockPermission2],
      });

      const result = await service.assignPermissions(1, [1, 2]);

      expect(roleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['permissions'],
      });
      expect(permissionRepository.findBy).toHaveBeenCalled();
      expect(result.permissions).toHaveLength(2);
    });

    it('should throw NotFoundException when role not found', async () => {
      roleRepository.findOne.mockResolvedValue(null);

      await expect(service.assignPermissions(999, [1, 2])).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.assignPermissions(999, [1, 2])).rejects.toThrow(
        '角色不存在',
      );
    });

    it('should replace existing permissions with new ones', async () => {
      roleRepository.findOne.mockResolvedValue({
        ...mockRole,
        permissions: [mockPermission],
      });
      permissionRepository.findBy.mockResolvedValue([mockPermission2]);
      roleRepository.save.mockResolvedValue({
        ...mockRole,
        permissions: [mockPermission2],
      });

      const result = await service.assignPermissions(1, [2]);

      expect(result.permissions).toHaveLength(1);
      expect(result.permissions[0].id).toBe(2);
    });

    it('should clear all permissions when empty array provided', async () => {
      roleRepository.findOne.mockResolvedValue({
        ...mockRole,
        permissions: [mockPermission],
      });
      permissionRepository.findBy.mockResolvedValue([]);
      roleRepository.save.mockResolvedValue({ ...mockRole, permissions: [] });

      const result = await service.assignPermissions(1, []);

      expect(result.permissions).toEqual([]);
    });

    it('should handle non-existent permission ids gracefully', async () => {
      roleRepository.findOne.mockResolvedValue({ ...mockRole, permissions: [] });
      permissionRepository.findBy.mockResolvedValue([]);
      roleRepository.save.mockResolvedValue({ ...mockRole, permissions: [] });

      const result = await service.assignPermissions(1, [999, 1000]);

      expect(permissionRepository.findBy).toHaveBeenCalled();
      expect(result.permissions).toEqual([]);
    });
  });
});
