import { Injectable } from '@nestjs/common';
import { JwtService } from "@nestjs/jwt";
import { UserEntity } from "src/users/entities/user.entity";
import { TokenType } from "./const/token.const";
import { genSalt, hash } from 'bcrypt';

@Injectable()
export class AuthsService {
  constructor(private readonly jwtService: JwtService) { }

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
    const payload = {
      id: user.id,
      userRole: user.userRole,
      type: tokenType,
      iat: new Date().getTime()
    }

    let expiresIn = TokenType.REFRESH ? 3600000 : 300000;

    if (process.env.NEST_MODE === "development") {
      expiresIn = 999999999;
    }

    return this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: expiresIn
    });
  }
}
