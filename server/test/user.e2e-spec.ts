import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserService } from '../src/modules/user/user.service';
import { User } from '../src/entities/user.entity';
import { Role } from '../src/entities/role.entity';
import { Permission } from '../src/entities/permission.entity';
import { createTestModule, cleanupDatabase, closeDatabase } from './test-utils';

describe('UserService (e2e)', () => {
  let module: TestingModule;
  let service: UserService;
  let dataSource: DataSource;
  let userRepository: Repository<User>;
  let roleRepository: Repository<Role>;

  beforeAll(async () => {
    module = await createTestModule([User, Role, Permission], [UserService]);

    dataSource = module.get<DataSource>(DataSource);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    roleRepository = module.get<Repository<Role>>(getRepositoryToken(Role));
    service = module.get<UserService>(UserService);
  });

  afterAll(async () => {
    await closeDatabase(dataSource);
  });

  afterEach(async () => {
    await cleanupDatabase(dataSource);
  });

  describe('create', () => {
    it('should create user and hash password correctly', async () => {
      const createDto = {
        username: 'testuser',
        password: 'password123',
        name: 'Test User',
        email: 'test@example.com',
      };

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.username).toBe(createDto.username);
      expect(result.name).toBe(createDto.name);
      expect(result.email).toBe(createDto.email);

      const userInDb = await userRepository.findOne({
        where: { id: result.id },
        select: ['id', 'password'],
      });
      expect(userInDb).toBeDefined();
      expect(userInDb!.password).not.toBe(createDto.password);
      expect(await bcrypt.compare(createDto.password, userInDb!.password)).toBe(true);
    });

    it('should create user with roles', async () => {
      const role = roleRepository.create({
        code: 'admin',
        name: 'Admin',
        description: 'Administrator role',
      });
      await roleRepository.save(role);

      const createDto = {
        username: 'adminuser',
        password: 'password123',
        name: 'Admin User',
        roleIds: [role.id],
      };

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(result.roles).toBeDefined();
      expect(result.roles).toHaveLength(1);
      expect(result.roles[0].code).toBe('admin');
    });
  });

  describe('findAll', () => {
    beforeEach(async () => {
      const users = [
        { username: 'user1', password: 'pass1', name: 'User One' },
        { username: 'user2', password: 'pass2', name: 'User Two' },
        { username: 'admin', password: 'pass3', name: 'Admin User' },
      ];

      for (const userData of users) {
        await service.create(userData);
      }
    });

    it('should return paginated users', async () => {
      const result = await service.findAll({ page: 1, pageSize: 2 });

      expect(result.list).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(2);
    });

    it('should return users filtered by username', async () => {
      const result = await service.findAll({ username: 'user' });

      expect(result.list).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should return users filtered by name', async () => {
      const result = await service.findAll({ name: 'Admin' });

      expect(result.list).toHaveLength(1);
      expect(result.list[0].name).toBe('Admin User');
    });

    it('should return correct page', async () => {
      const page1 = await service.findAll({ page: 1, pageSize: 2 });
      const page2 = await service.findAll({ page: 2, pageSize: 2 });

      expect(page1.list).toHaveLength(2);
      expect(page2.list).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return user by id', async () => {
      const created = await service.create({
        username: 'finduser',
        password: 'password123',
        name: 'Find User',
      });

      const result = await service.findOne(created.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(created.id);
      expect(result.username).toBe('finduser');
      expect(result.password).toBeUndefined();
    });

    it('should throw NotFoundException for non-existent user', async () => {
      await expect(service.findOne(99999)).rejects.toThrow('用户不存在');
    });
  });

  describe('update', () => {
    let testUser: User;

    beforeEach(async () => {
      testUser = await service.create({
        username: 'updateuser',
        password: 'password123',
        name: 'Update User',
      });
    });

    it('should update user info', async () => {
      const updateDto = {
        name: 'Updated Name',
        email: 'updated@example.com',
        phone: '13900139000',
      };

      const result = await service.update(testUser.id, updateDto);

      expect(result.name).toBe(updateDto.name);
      expect(result.email).toBe(updateDto.email);
      expect(result.phone).toBe(updateDto.phone);
    });

    it('should update user roles', async () => {
      const role = roleRepository.create({
        code: 'editor',
        name: 'Editor',
      });
      await roleRepository.save(role);

      const result = await service.update(testUser.id, { roleIds: [role.id] });

      expect(result.roles).toHaveLength(1);
      expect(result.roles[0].code).toBe('editor');
    });

    it('should clear user roles', async () => {
      const role = roleRepository.create({
        code: 'temp',
        name: 'Temp',
      });
      await roleRepository.save(role);

      await service.update(testUser.id, { roleIds: [role.id] });
      const result = await service.update(testUser.id, { roleIds: [] });

      expect(result.roles).toHaveLength(0);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      await expect(
        service.update(99999, { name: 'New Name' }),
      ).rejects.toThrow('用户不存在');
    });
  });

  describe('remove', () => {
    it('should delete user', async () => {
      const user = await service.create({
        username: 'deleteuser',
        password: 'password123',
        name: 'Delete User',
      });

      await service.remove(user.id);

      await expect(service.findOne(user.id)).rejects.toThrow('用户不存在');
    });

    it('should throw NotFoundException for non-existent user', async () => {
      await expect(service.remove(99999)).rejects.toThrow('用户不存在');
    });
  });

  describe('resetPassword', () => {
    let testUser: User;

    beforeEach(async () => {
      testUser = await service.create({
        username: 'resetuser',
        password: 'oldpassword',
        name: 'Reset User',
      });
    });

    it('should reset password and hash it', async () => {
      const newPassword = 'newpassword123';

      await service.resetPassword(testUser.id, newPassword);

      const userInDb = await userRepository.findOne({
        where: { id: testUser.id },
        select: ['id', 'password'],
      });

      expect(userInDb!.password).not.toBe(newPassword);
      expect(await bcrypt.compare(newPassword, userInDb!.password)).toBe(true);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      await expect(
        service.resetPassword(99999, 'newpassword'),
      ).rejects.toThrow('用户不存在');
    });
  });
});
