import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub, status: true },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      return null;
    }

    const permissions = this.extractPermissions(user);

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      roles: user.roles.map((r: { id: number; code: string; name: string }) => ({
        id: r.id,
        code: r.code,
        name: r.name,
      })),
      permissions,
    };
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
