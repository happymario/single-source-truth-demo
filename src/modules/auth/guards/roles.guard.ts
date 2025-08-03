import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserDocument } from '../../../models/user.model';

/**
 * Request interface with user property
 */
interface RequestWithUser {
  user?: UserDocument;
}

/**
 * 사용자 역할 enum
 */
export enum Role {
  USER = 'user',
  ADMIN = 'admin',
}

/**
 * Roles 데코레이터
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => {
  return (
    target: object,
    propertyName?: string,
    descriptor?: PropertyDescriptor,
  ) => {
    Reflect.defineMetadata(ROLES_KEY, roles, descriptor?.value ?? target);
  };
};

/**
 * 역할 기반 접근 제어 가드
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || !Array.isArray(requiredRoles)) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      return false;
    }

    return requiredRoles.some((role) => user.role === role);
  }
}
