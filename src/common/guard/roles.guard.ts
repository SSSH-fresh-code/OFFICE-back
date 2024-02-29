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

/**
 * 권한 검사를 위한 Guard
 * AccessToken 필요, 없을 경우 UnauthorizedException(401)
 * 옳지 않은 권한 요청인 경우 ForbiddenException(403)
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) { }

  /**
   * reflect-metadata를 이용한 권한 검사 가드
   * 1) 기본적으로 권한이 표시가 없는 경우 최상위 권한인 ADMIN으로 판단됨(기본 private처리)
   * 2) user 토큰이 없는 경우 사용자 정보가 존재하지 않는다는 에러를 뱉어냄
   * 3) this.checkRole 로직을 사용해 권한 검사 
   * @param context 실행 컨텍스트 정보
   * @returns 권한 통과 여부 && 정합성 정상 여부
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    let requireRole = this.reflector.getAllAndOverride<TUserRole, string>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requireRole) requireRole = "ADMIN";


    const { user } = context.switchToHttp().getRequest();

    if (!user) throw new UnauthorizedException('사용자 정보가 존재하지 않습니다.');

    if (!this.checkRole(requireRole, user.role)) {
      throw new ForbiddenException('잘못된 접근입니다.');
    }

    return true;
  }

  /**
   * 유저 권한 체크 로직
   * 1) 현재 권한이 없는 경우 false
   * 2) requireRole이 Guest이거나(public) 현재 권한과 같은 경우 true
   * 3) 매니저, 유저 인 경우 상위 권한은 true 
   * 4) 위 결과에 모두 충족하지 못할 경우(있을 수 없음) false
   * @author sssh
   * @param requireRole 필요 권한
   * @param role 현재 권한
   * @returns 권한 통과 여부
   */
  checkRole(requireRole: TUserRole, role: any): boolean {
    if (!role) return false;
    if (requireRole === "GUEST" || requireRole === role) return true;

    switch (requireRole) {
      case "MANAGER":
        return role === "ADMIN";
      case "USER":
        return role === "ADMIN" || role === "MANAGER";
    }

    return false;
  }
}
