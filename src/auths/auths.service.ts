import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from "@nestjs/jwt";
import { UserEntity } from "src/users/entities/user.entity";
import { TokenPrefixType, TokenType } from "./const/token.const";
import { compare, genSalt, hash } from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { TTokenPayload } from 'types-sssh';

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
    const splitToken = authorizationInHeader.split(' ');

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
   * AccessToken 검증 및 변환
   * @param token 
   * @returns TTokenPayload 토큰 내 payload
   */
  verifyAccessToken(token: string) {
    try {
      return this.jwtService.verify<TTokenPayload>(token);
    } catch (e) {
      console.log(e);
      throw new UnauthorizedException('만료된 토큰이거나 잘못된 토큰입니다.');
    }
  }
}
