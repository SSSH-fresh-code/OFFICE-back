import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorator/roles.decorator';
import { TUserRole } from 'types-sssh';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) { }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    let requireRole = this.reflector.getAllAndOverride<TUserRole, string>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requireRole) {
      requireRole = "ADMIN";
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) throw new UnauthorizedException('토큰이 존재하지 않습니다.');

    if (user.role !== requireRole) {
      throw new ForbiddenException('작업을 수행할 권한이 없습니다.');
    }

    return true;
  }

  checkRole(requireRole: TUserRole, role: any): boolean {
    if (!role) return false;
    if (requireRole === role) return true;

    switch (requireRole) {
      case "ADMIN":
        return requireRole === role;
      case "MANAGER"
        return requireRole === role;
    }

    return false;
  }
}
