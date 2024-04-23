import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorator/roles.decorator';
import { AuthsService } from 'src/auths/auths.service';
import { ExceptionMessages } from '../message/exception.message';
import AuthsEnum from 'src/auths/const/auths.enums';
import { TTokenPayload } from '@sssh-fresh-code/types-sssh';

/**
 * 권한 검사를 위한 Guard
 * AccessToken 필요, 없을 경우 UnauthorizedException(401)
 * 옳지 않은 권한 요청인 경우 ForbiddenException(403)
 */
@Injectable()
export class AuthsGuard implements CanActivate {
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
    let requireAuths = this.reflector.getAllAndOverride<AuthsEnum[], string>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requireAuths) return true;

    const req = context.switchToHttp().getRequest();

    if (req.user) {
      const user = req.user as TTokenPayload;

      if (req.url === "/refresh") {
        if (user.type !== "REFRESH") throw new UnauthorizedException(ExceptionMessages.INVALID_TOKEN);
      } else {
        if (user.type !== "ACCESS") throw new UnauthorizedException(ExceptionMessages.INVALID_TOKEN);
      }

      if (!AuthsService.checkAuth(requireAuths, user)) {
        throw new ForbiddenException(ExceptionMessages.NO_PERMISSION);
      }

      return true;
    } else {
      throw new UnauthorizedException(ExceptionMessages.INVALID_TOKEN)
    }
  }
}
