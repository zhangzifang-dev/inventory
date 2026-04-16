import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';
import { createMockRepository } from '../../common/test/mock-repository';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UserService', () => {
  let service: UserService;
  let userRepository: ReturnType<typeof createMockRepository<User>>;
  let roleRepository: ReturnType<typeof createMockRepository<Role>>;

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

  const mockRole: Role = {
    id: 1,
    code: 'admin',
    name: 'Admin',
    description: 'Administrator role',
    createdAt: new Date('2024-01-01'),
    permissions: [],
    users: [],
  };

  beforeEach(async () => {
    userRepository = createMockRepository<User>();
    roleRepository = createMockRepository<Role>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: 'UserRepository', useValue: userRepository },
        { provide: 'RoleRepository', useValue: roleRepository },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      username: 'testuser',
      password: 'password123',
      name: 'Test User',
      email: 'test@example.com',
      phone: '13800138000',
    };

    it('should successfully create a user', async () => {
      userRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);

      const result = await service.create(createDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { username: createDto.username },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(createDto.password, 10);
      expect(userRepository.create).toHaveBeenCalled();
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });

    it('should throw BadRequestException if username already exists', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow('用户名已存在');
    });

    it('should create user with roles when roleIds provided', async () => {
      const createDtoWithRoles = {
        ...createDto,
        roleIds: [1, 2],
      };

      userRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      userRepository.create.mockReturnValue({ ...mockUser, roles: [] });
      roleRepository.findBy.mockResolvedValue([mockRole]);
      userRepository.save.mockResolvedValue({ ...mockUser, roles: [mockRole] });

      const result = await service.create(createDtoWithRoles);

      expect(roleRepository.findBy).toHaveBeenCalled();
      expect(result.roles).toHaveLength(1);
    });
  });

  describe('findAll', () => {
    it('should return paginated users without filters', async () => {
      const users = [mockUser];
      userRepository.findAndCount.mockResolvedValue([users, 1]);

      const result = await service.findAll({});

      expect(userRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          relations: ['roles'],
          skip: 0,
          take: 20,
          order: { id: 'DESC' },
        }),
      );
      expect(result.list).toEqual(users);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('should return paginated users with filters', async () => {
      const users = [mockUser];
      userRepository.findAndCount.mockResolvedValue([users, 1]);

      const result = await service.findAll({
        username: 'test',
        name: 'Test',
        status: true,
      });

      expect(userRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            username: expect.any(Object),
            name: expect.any(Object),
            status: true,
          }),
        }),
      );
      expect(result.list).toEqual(users);
    });

    it('should return paginated users with custom pagination', async () => {
      const users = [mockUser];
      userRepository.findAndCount.mockResolvedValue([users, 1]);

      const result = await service.findAll({ page: 2, pageSize: 10 });

      expect(userRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(10);
    });
  });

  describe('findOne', () => {
    it('should return a user when found', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['roles'],
        select: [
          'id',
          'username',
          'name',
          'email',
          'phone',
          'status',
          'createdAt',
          'updatedAt',
        ],
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow('用户不存在');
    });
  });

  describe('update', () => {
    const updateDto = { name: 'Updated Name' };

    it('should successfully update a user', async () => {
      userRepository.findOne.mockResolvedValueOnce(mockUser);
      userRepository.save.mockResolvedValue({ ...mockUser, ...updateDto });

      const result = await service.update(1, updateDto);

      expect(userRepository.save).toHaveBeenCalled();
      expect(result.name).toBe('Updated Name');
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update(999, updateDto)).rejects.toThrow('用户不存在');
    });

    it('should throw BadRequestException when username already exists', async () => {
      userRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({
          ...mockUser,
          id: 2,
          username: 'newusername',
        });

      await expect(
        service.update(1, { username: 'newusername' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow updating to same username', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);

      const result = await service.update(1, { username: 'testuser' });

      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockUser);
    });

    it('should update user roles when roleIds provided', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUser, roles: [] });
      roleRepository.findBy.mockResolvedValue([mockRole]);
      userRepository.save.mockResolvedValue({
        ...mockUser,
        roles: [mockRole],
      });

      const result = await service.update(1, { roleIds: [1] });

      expect(roleRepository.findBy).toHaveBeenCalled();
      expect(result.roles).toHaveLength(1);
    });

    it('should clear roles when roleIds is empty array', async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUser, roles: [mockRole] });
      userRepository.save.mockResolvedValue({ ...mockUser, roles: [] });

      const result = await service.update(1, { roleIds: [] });

      expect(result.roles).toEqual([]);
    });
  });

  describe('remove', () => {
    it('should successfully remove a user', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.remove.mockResolvedValue(mockUser);

      await service.remove(1);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(userRepository.remove).toHaveBeenCalledWith(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      await expect(service.remove(999)).rejects.toThrow('用户不存在');
    });
  });

  describe('resetPassword', () => {
    it('should successfully reset password', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newhashedpassword');
      userRepository.save.mockResolvedValue({
        ...mockUser,
        password: 'newhashedpassword',
      });

      await service.resetPassword(1, 'newpassword123');

      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.resetPassword(999, 'newpassword')).rejects.toThrow(
        NotFoundException,
      );
      await expect(
        service.resetPassword(999, 'newpassword'),
      ).rejects.toThrow('用户不存在');
    });
  });
});
