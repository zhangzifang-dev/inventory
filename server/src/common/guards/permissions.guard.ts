import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { User } from '../../entities/user.entity';
import { Permission } from '../../entities/permission.entity';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    if (!user) {
      throw new ForbiddenException('用户未登录');
    }

    const userPermissions = this.getUserPermissions(user);
    const hasAllPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException('权限不足');
    }

    return true;
  }

  private getUserPermissions(user: User): string[] {
    if (!user.roles || user.roles.length === 0) {
      return [];
    }

    const permissions = new Set<string>();
    user.roles.forEach((role) => {
      if (role.permissions) {
        role.permissions.forEach((permission: Permission) => {
          permissions.add(permission.code);
        });
      }
    });

    return Array.from(permissions);
  }
}
