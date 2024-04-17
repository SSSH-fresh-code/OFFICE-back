import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from "@nestjs/jwt";
import { UserEntity } from "src/users/entities/user.entity";
import { TokenPrefixType, TokenType } from "./const/token.const";
import { genSalt, hash } from 'bcrypt';
import { TTokenPayload } from '@sssh-fresh-code/types-sssh';
import { ExceptionMessages } from 'src/common/message/exception.message';
import AuthsEnum from './const/auths.enums';
import { Repository } from 'typeorm';
import { AuthsEntity } from './entities/auths.entity';
import { CreateAuthDto } from './dto/create-auth.dto';
import { AuthsPaginationDto } from './dto/auths-pagination.dto';
import { CommonService } from 'src/common/common.service';
import { AlarmsEntity } from 'src/alarms/entities/alarms.entity';

@Injectable()
export class AuthsService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject('AUTHS_REPOSITORY')
    private readonly authsRepository: Repository<AuthsEntity>,
    @Inject('USER_REPOSITORY')
    private readonly usersRepository: Repository<UserEntity>,
    @Inject('ALARMS_REPOSITORY')
    private readonly alarmsRepository: Repository<AlarmsEntity>,
    private readonly commonService: CommonService,
  ) { }

  async encryptPassword(password: string) {
    try {
      const salt = await genSalt(Number(process.env.SALT_ROUNDS), "b");
      const encryptPw = await hash(password, salt);
      return encryptPw;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 토큰 생성
   * @param user Pick<UerEntity, "id" | "auths"> 유저 정보
   * @param tokenType ACCESS, REFRESH
   * @returns 토큰 string
   */
  signToken(user: Pick<UserEntity, "id" | "auths">, tokenType: TokenType) {
    const payload: TTokenPayload = {
      id: user.id,
      auths: tokenType === TokenType.REFRESH ? [] : user.auths.map((a) => a.code),
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
      throw new UnauthorizedException(ExceptionMessages.INVALID_TOKEN);
    }

    let tokenPrefix = TokenPrefixType.BASIC;

    switch (splitToken[0]) {
      case TokenPrefixType.BASIC:
        break;
      case TokenPrefixType.BEARER:
        tokenPrefix = TokenPrefixType.BEARER
        break;
      default:
        throw new UnauthorizedException(ExceptionMessages.INVALID_TOKEN);
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
      throw new UnauthorizedException(ExceptionMessages.INVALID_TOKEN);
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
  verifyToken(token: string) {
    try {
      return this.jwtService.verify<TTokenPayload>(token);
    } catch (e) {
      if (e instanceof Error && e.message === ExceptionMessages.INVALID_TOKEN)
        throw new BadRequestException(e.message);
      throw new UnauthorizedException(ExceptionMessages.EXPIRED_TOKEN);
    }
  }

  /**
   * 유저 권한 체크 로직
   * 1) SUEPR001의 슈퍼권한이 있는 경우 패스
   * 2) 아닌 경우 보유 권한을 검사 
   * @author sssh
   * @param requireRole 필요 권한
   * @param role 현재 권한
   * @returns 권한 통과 여부
   */
  static checkAuth(rAuth: string | string[], user: TTokenPayload): boolean {
    const role = user.auths;

    if (role.includes(AuthsEnum.SUPER_USER)) return true;
    if (!role.includes(AuthsEnum.CAN_USE_OFFICE)) return false;

    if (typeof rAuth === "string") {
      return role.indexOf(rAuth) > -1;
    } else if (rAuth.length > 0) {
      let result = false;

      for (const a of rAuth) {
        if (role.includes(a)) {
          result = true;
          break;
        }
      }
      return result;
    }

    return false;
  }

  static checkOwns(targerId: string, id: string): boolean {
    return targerId === id;
  }

  async getAuths(page: AuthsPaginationDto) {
    return await this.commonService.paginate(page, this.authsRepository);
  }

  async getAllAuths() {
    return await this.authsRepository.find({ order: { description: 'ASC' } });
  }

  async getAuthsByUser(id: string) {
    const { auths } = await this.usersRepository.findOne({
      select: ["id"],
      where: { id },
      loadRelationIds: { relations: ["auths"] }
    });

    return auths;
  }

  async getAuthsByAlarm(id: number) {
    const { auths } = await this.alarmsRepository.findOne({
      select: ["id"],
      where: { id },
      loadRelationIds: { relations: ["auths"] }
    });

    return auths;
  }

  async postAuths(dto: CreateAuthDto) {
    return await this.authsRepository.save(
      await this.authsRepository.create(dto)
    );
  }

  async deleteAuths(code: string) {
    const auth = await this.authsRepository.findOne({ where: { code } });

    if (!auth) throw new BadRequestException(ExceptionMessages.NOT_EXIST_CODE);

    return await this.authsRepository.delete(auth);
  }
}
