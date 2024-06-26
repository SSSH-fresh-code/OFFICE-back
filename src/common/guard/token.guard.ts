import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { AuthsService } from 'src/auths/auths.service';
import { TokenPrefixType, TokenType } from 'src/auths/const/token.const';
import { TTokenPayload } from '@sssh-fresh-code/types-sssh';

/**
 * Token이 존재하는 경우 request 객체 내 user 멤버 객체 생성
 * Token이 없는 경우 패스
 */
@Injectable()
export class TokenGuard implements CanActivate {
  constructor(private readonly authsService: AuthsService) { }
  /**
   * Token이 있는 경우
   * 1) Token 검증
   * 2) Token 값 추출 후 request 객체 내 user 멤버 객체로 추가
   * @param context 실행 컨텍스트 정보
   * @returns true
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const t: string = request.headers['authorization'];

    if (!t) return true;

    const { prefix, token } = this.authsService.extractTokenFromHeader(t);

    if (prefix === TokenPrefixType.BASIC) {
      const { userId, userPw } = this.authsService.decodeBasicToken(token);

      request.user = {
        type: prefix,
        userId: userId,
        userPw: userPw
      };
    } else {
      let payload: TTokenPayload = await this.authsService.verifyToken(token);

      request.user = {
        type: prefix,
        ...payload
      }
    }

    return true;
  }

  getTokenInCookie(cookie: string, key: string) {
    if (cookie) {
      const cookies = cookie.split(";").filter(c => c.indexOf(`${key}=`) !== -1);

      const c = cookies[0];

      if (c) {
        const value = c.split("=")[1];

        return `Bearer ${value}`
      }
    }
    return false;
  }
}
