import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from "@nestjs/jwt";
import { UserEntity } from "src/users/entities/user.entity";
import { TokenPrefixType, TokenType } from "./const/token.const";
import { compare, genSalt, hash } from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { TTokenPayload, TUserRole } from 'types-sssh';

@Injectable()
export class AuthsService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) { }

  async encryptPassword(password: string) {
    try {
      const salt = await genSalt(Number(process.env.SALT_ROUNDS), "b");
      const encryptPw = await hash(password, salt);
      return encryptPw;
    } catch (error) {
      console.error('비밀번호 해싱 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 토큰 생성
   * @param user Pick<UerEntity, "id" | "userRole"> 유저 정보
   * @param tokenType ACCESS, REFRESH
   * @returns 토큰 string
   */
  signToken(user: Pick<UserEntity, "id" | "userRole">, tokenType: TokenType) {
    const payload: TTokenPayload = {
      id: user.id,
      userRole: user.userRole,
      type: tokenType,
      iat: new Date().getTime()
    }

    let expiresIn = TokenType.REFRESH ? 3600000 : 300000;

    if (process.env.NEST_MODE === "development") {
      expiresIn = 999999999;
    }

    return this.jwtService.sign(payload, {
      expiresIn: expiresIn
    });
  }

  /**
   * Reuqest Header 내 Authorization 토큰 내용 추출
   * @param authorizationInHeader 
   * @returns string Token Prefix를 제외한 토큰 내용
   */
  extractTokenFromHeader(authorizationInHeader: string) {
    const splitToken = authorizationInHeader.trim().split(' ');

    if (splitToken.length !== 2) {
      throw new UnauthorizedException('잘못된 유형의 토큰입니다.');
    }

    let tokenPrefix = TokenPrefixType.BASIC;

    switch (splitToken[0]) {
      case TokenPrefixType.BASIC:
        break;
      case TokenPrefixType.BEARER:
        tokenPrefix = TokenPrefixType.BEARER
        break;
      default:
        throw new UnauthorizedException('잘못된 유형의 토큰입니다.');
    }

    return {
      prefix: tokenPrefix, token: splitToken[1]
    }
  }

  /**
   * Basic Token 해석
   * @param token 
   * @returns userId: string, userPw: string
   */
  decodeBasicToken(token: string) {
    const decoded = Buffer.from(token, 'base64').toString('utf8');

    const splitStr = decoded.split(':');

    if (splitStr.length !== 2) {
      throw new UnauthorizedException('잘못된 유형의 Basic 토큰입니다.');
    }

    const userId = splitStr[0];
    const userPw = splitStr[1];

    return { userId, userPw };
  }

  /**
   * token 검증 및 변환
   * @param token 
   * @returns TTokenPayload 토큰 내 payload
   */
  verifyToken(token: string, type: TokenType) {
    try {
      const payload = this.jwtService.verify<TTokenPayload>(token);
      if (type !== payload.type) throw new Error("잘못된 유형의 토큰입니다.");
      return payload
    } catch (e) {
      if (e instanceof Error && e.message === "잘못된 유형의 토큰입니다.")
        throw new BadRequestException(e.message);
      throw new UnauthorizedException('만료된 토큰입니다.');
    }
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
    if (requireRole === role) return true;

    switch (requireRole) {
      case "MANAGER":
        return role === "ADMIN";
      case "USER":
        return role === "ADMIN" || role === "MANAGER";
    }

    return false;
  }
}
