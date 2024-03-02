import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { AuthsService } from 'src/auths/auths.service';
import { TokenPrefixType } from 'src/auths/const/token.const';

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

    const rawToken = request.headers['authorization'];

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
      const payload = await this.authsService.verifyAccessToken(token);

      request.user = {
        type: prefix,
        ...payload
      }
    }

    return true;
  }

}
