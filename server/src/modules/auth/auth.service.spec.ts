import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { User } from '../../entities/user.entity';
import { createMockRepository } from '../../common/test/mock-repository';
import { createMockJwtService } from '../../common/test/mock-services';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

const mockedBcrypt = jest.requireMock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: ReturnType<typeof createMockRepository<User>>;
  let jwtService: ReturnType<typeof createMockJwtService>;

  const mockUser: User = {
    id: 1,
    username: 'testuser',
    password: 'hashedpassword',
    name: 'Test User',
    email: 'test@example.com',
    phone: '1234567890',
    status: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    roles: [
      {
        id: 1,
        code: 'admin',
        name: 'Administrator',
        permissions: [
          { id: 1, code: 'user:read', name: 'Read User' },
          { id: 2, code: 'user:write', name: 'Write User' },
        ],
      },
      {
        id: 2,
        code: 'manager',
        name: 'Manager',
        permissions: [
          { id: 3, code: 'inventory:read', name: 'Read Inventory' },
        ],
      },
    ],
  } as User;

  beforeEach(async () => {
    userRepository = createMockRepository<User>();
    jwtService = createMockJwtService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: 'UserRepository',
          useValue: userRepository,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto = {
      username: 'testuser',
      password: 'password123',
    };

    it('should return access token and user info on successful login', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true);
      jwtService.sign.mockReturnValue('mock-access-token');

      const result = await service.login(loginDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { username: loginDto.username },
        relations: ['roles', 'roles.permissions'],
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        username: mockUser.username,
        roles: ['admin', 'manager'],
        permissions: ['user:read', 'user:write', 'inventory:read'],
      });
      expect(result).toEqual({
        accessToken: 'mock-access-token',
        user: {
          id: mockUser.id,
          username: mockUser.username,
          name: mockUser.name,
          roles: [
            { id: 1, code: 'admin', name: 'Administrator' },
            { id: 2, code: 'manager', name: 'Manager' },
          ],
          permissions: ['user:read', 'user:write', 'inventory:read'],
        },
      });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('用户名或密码错误'),
      );

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { username: loginDto.username },
        relations: ['roles', 'roles.permissions'],
      });
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user is disabled', async () => {
      const disabledUser = { ...mockUser, status: false };
      userRepository.findOne.mockResolvedValue(disabledUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('用户已被禁用'),
      );

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { username: loginDto.username },
        relations: ['roles', 'roles.permissions'],
      });
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('用户名或密码错误'),
      );

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { username: loginDto.username },
        relations: ['roles', 'roles.permissions'],
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should handle user with no roles', async () => {
      const userWithoutRoles = { ...mockUser, roles: [] };
      userRepository.findOne.mockResolvedValue(userWithoutRoles);
      mockedBcrypt.compare.mockResolvedValue(true);
      jwtService.sign.mockReturnValue('mock-access-token');

      const result = await service.login(loginDto);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        username: mockUser.username,
        roles: [],
        permissions: [],
      });
      expect(result.user.permissions).toEqual([]);
    });

    it('should handle user with roles but no permissions', async () => {
      const userWithRolesNoPermissions = {
        ...mockUser,
        roles: [
          {
            id: 1,
            code: 'viewer',
            name: 'Viewer',
            permissions: [],
          },
        ],
      } as any;
      userRepository.findOne.mockResolvedValue(userWithRolesNoPermissions);
      mockedBcrypt.compare.mockResolvedValue(true);
      jwtService.sign.mockReturnValue('mock-access-token');

      const result = await service.login(loginDto);

      expect(result.user.permissions).toEqual([]);
    });

    it('should deduplicate permissions across roles', async () => {
      const userWithDuplicatePermissions = {
        ...mockUser,
        roles: [
          {
            id: 1,
            code: 'admin',
            name: 'Admin',
            permissions: [
              { id: 1, code: 'user:read', name: 'Read User' },
              { id: 2, code: 'user:write', name: 'Write User' },
            ],
          },
          {
            id: 2,
            code: 'moderator',
            name: 'Moderator',
            permissions: [
              { id: 1, code: 'user:read', name: 'Read User' },
              { id: 3, code: 'content:moderate', name: 'Moderate Content' },
            ],
          },
        ],
      } as any;
      userRepository.findOne.mockResolvedValue(userWithDuplicatePermissions);
      mockedBcrypt.compare.mockResolvedValue(true);
      jwtService.sign.mockReturnValue('mock-access-token');

      const result = await service.login(loginDto);

      const expectedPermissions = [
        'user:read',
        'user:write',
        'content:moderate',
      ];
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          permissions: expect.arrayContaining(expectedPermissions),
        }),
      );
      expect(result.user.permissions).toHaveLength(3);
    });
  });

  describe('validateUser', () => {
    it('should return user when found and active', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.validateUser(1);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, status: true },
        relations: ['roles', 'roles.permissions'],
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser(999);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999, status: true },
        relations: ['roles', 'roles.permissions'],
      });
      expect(result).toBeNull();
    });

    it('should return null when user is disabled (status false)', async () => {
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.validateUser(1);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, status: true },
        relations: ['roles', 'roles.permissions'],
      });
      expect(result).toBeNull();
    });
  });

  describe('extractPermissions (indirect test via login)', () => {
    it('should extract unique permissions from user roles', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true);
      jwtService.sign.mockReturnValue('token');

      await service.login({ username: 'test', password: 'pass' });

      const signCall = jwtService.sign.mock.calls[0][0] as any;
      expect(signCall.permissions).toContain('user:read');
      expect(signCall.permissions).toContain('user:write');
      expect(signCall.permissions).toContain('inventory:read');
      expect(signCall.permissions).toHaveLength(3);
    });

    it('should handle roles without permissions property', async () => {
      const userWithMissingPermissions = {
        ...mockUser,
        roles: [
          {
            id: 1,
            code: 'empty',
            name: 'Empty Role',
          },
        ],
      } as any;
      userRepository.findOne.mockResolvedValue(userWithMissingPermissions);
      mockedBcrypt.compare.mockResolvedValue(true);
      jwtService.sign.mockReturnValue('token');

      await service.login({ username: 'test', password: 'pass' });

      const signCall = jwtService.sign.mock.calls[0][0] as any;
      expect(signCall.permissions).toEqual([]);
    });
  });
});
