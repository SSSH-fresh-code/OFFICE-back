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
import { AuthsService } from 'src/auths/auths.service';

/**
 * 권한 검사를 위한 Guard
 * AccessToken 필요, 없을 경우 UnauthorizedException(401)
 * 옳지 않은 권한 요청인 경우 ForbiddenException(403)
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly authsService: AuthsService) { }

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


    if (requireRole !== "GUEST") {
      const { user } = context.switchToHttp().getRequest();

      if (!user) throw new UnauthorizedException('사용자 정보가 존재하지 않습니다.');

      if (!this.authsService.checkRole(requireRole, user.userRole)) {
        throw new ForbiddenException('잘못된 접근입니다.');
      }
    }

    return true;
  }

}
