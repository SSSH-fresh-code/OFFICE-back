import { Injectable } from "@nestjs/common";
import { genSalt, hash } from "bcrypt";

@Injectable()
export class AuthsExternalService {
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
}