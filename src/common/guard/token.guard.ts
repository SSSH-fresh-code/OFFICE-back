import {
  CanActivate,
  ConsoleLogger,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { AuthsService } from 'src/auths/auths.service';
import { TokenPrefixType, TokenType } from 'src/auths/const/token.const';

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

    // authorization 토큰이 있다면 우선 설정(로그인, Basic 토큰 사용)
    const t: string = request.headers['authorization'];
    // Basic 토큰이 아닌경우 Cookie에서 가져옴
    let rawToken = t ? t : this.getTokenInCookie(request.headers.cookie, "accessToken");

    if (!rawToken) return true;

    const { prefix, token } = this.authsService.extractTokenFromHeader(rawToken);

    if (prefix === TokenPrefixType.BASIC) {
      const { userId, userPw } = this.authsService.decodeBasicToken(token);

      request.user = {
        type: prefix,
        userId: userId,
        userPw: userPw
      };
    } else {
      const payload = await this.authsService.verifyToken(token, TokenType.ACCESS);
      request.user = {
        type: prefix,
        ...payload
      }
    }

    return true;
  }

  getTokenInCookie(cookie: string, key: string) {
    if (cookie) {
      const cookies = cookie.split(";").filter(c => c.indexOf("accessToken=") !== -1);

      const c = cookies[0];

      if (c) {
        const value = c.split("=")[1];

        return `Bearer ${value}`
      }
    }
    return false;
  }
}
