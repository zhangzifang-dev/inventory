import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<{ accessToken: string; user: any }> {
    const user = await this.userRepository.findOne({
      where: { username: dto.username },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (!user.status) {
      throw new UnauthorizedException('用户已被禁用');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const permissions = this.extractPermissions(user);

    const payload = {
      sub: user.id,
      username: user.username,
      roles: user.roles.map((r: { code: string }) => r.code),
      permissions,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        roles: user.roles.map((r: { id: number; code: string; name: string }) => ({
          id: r.id,
          code: r.code,
          name: r.name,
        })),
        permissions,
      },
    };
  }

  async validateUser(userId: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId, status: true },
      relations: ['roles', 'roles.permissions'],
    });
  }

  private extractPermissions(user: User): string[] {
    const permissions = new Set<string>();
    user.roles?.forEach((role: { permissions?: { code: string }[] }) => {
      role.permissions?.forEach((permission: { code: string }) => {
        permissions.add(permission.code);
      });
    });
    return Array.from(permissions);
  }
}
