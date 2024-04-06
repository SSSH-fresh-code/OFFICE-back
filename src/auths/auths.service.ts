import { BadRequestException, ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from "@nestjs/jwt";
import { UserEntity } from "src/users/entities/user.entity";
import { TokenPrefixType, TokenType } from "./const/token.const";
import { genSalt, hash } from 'bcrypt';
import { TTokenPayload, TUserRole } from 'types-sssh';
import { ExceptionMessages } from 'src/common/message/exception.message';
import { CreateAlarmsDto } from './dto/create-alarms.dto';
import { Equal, FindOptionsWhere, Or, Repository } from 'typeorm';
import { AlarmsEntity } from './entities/alarms.entity';
import { UpdateAlarmsDto } from './dto/update-alarms.dto';
import { WorkEntity } from 'src/work/entities/work.entity';
import { AlarmsProvider } from './provider/alarms.provider';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CommonService } from 'src/common/common.service';

@Injectable()
export class AuthsService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject('ALARMS_REPOSITORY')
    private readonly alarmsRepository: Repository<AlarmsEntity>,
    @Inject('ALARMS_PROVIDER')
    private readonly alarmsProvider: AlarmsProvider,
    private readonly commonService: CommonService
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
  verifyToken(token: string, type: TokenType) {
    try {
      const payload = this.jwtService.verify<TTokenPayload>(token);
      if (type !== payload.type) throw new Error(ExceptionMessages.INVALID_TOKEN);
      return payload
    } catch (e) {
      if (e instanceof Error && e.message === ExceptionMessages.INVALID_TOKEN)
        throw new BadRequestException(e.message);
      throw new UnauthorizedException(ExceptionMessages.EXPIRED_TOKEN);
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
  checkRole(rRole: TUserRole, role: any, targetId?: string, realId?: string): boolean {
    const requireRole = rRole.trim();
    if (!role) return false;
    if (requireRole === role) return true;

    switch (requireRole) {
      case "MANAGER":
        return role === "ADMIN";
      case "USER":
        return role === "ADMIN" || role === "MANAGER" || targetId === realId;
      case "GUEST":
        return true;
    }

    return false;
  }

  async postAlarms(dto: CreateAlarmsDto) {
    const alarmsEntity = await this.alarmsRepository.create(dto);

    return await this.alarmsRepository.save(alarmsEntity);
  }

  async patchAlarms(dto: UpdateAlarmsDto) {
    const alarm = await this.alarmsRepository.findOne({
      where: {
        id: dto.id
      }
    });

    if (!alarm) throw new BadRequestException(ExceptionMessages.NOT_EXIST_ID)


    return await this.alarmsRepository.save({
      ...alarm,
      ...dto
    });
  }

  async getAlarms(user: TTokenPayload, readOnly: boolean, page: PaginationDto) {
    if (!readOnly) {
      let where: FindOptionsWhere<AlarmsEntity>;

      switch (user.userRole) {
        case 'GUEST':
          where = { userRole: "GUEST" }
          break;
        case 'USER':
          where = { userRole: Or(Equal("GUEST"), Equal("USER")) }
          break;
        case 'MANAGER':
          where = { userRole: Or(Equal("GUEST"), Equal("USER"), Equal("MANAGER")) }
          break;
        case 'ADMIN':
          where = { userRole: Or(Equal("GUEST"), Equal("USER"), Equal("MANAGER"), Equal("ADMIN")) }
          break;
      }

      const alarms = await this.alarmsRepository.find({
        where, order: {
          order: 'ASC'
        }
      });

      const aliveAlarms = [];

      for (const a of alarms) {
        const alive = await this.alarmsProvider.getAlarms(user, a);
        if (alive) aliveAlarms.push(alive);
      }

      return aliveAlarms;
    } else {
      return await this.commonService.paginate(page, this.alarmsRepository);
    }
  }

  async deleteAlarms(id: number) {
    const alarm = await this.alarmsRepository.findOne({
      where: { id: id }
    })

    if (!alarm) throw new BadRequestException(ExceptionMessages.NOT_EXIST_ID)

    return await this.alarmsRepository.delete(id);
  }

  async getAlarm(user: TTokenPayload, id: number) {
    const alarm = await this.alarmsRepository.findOne({
      where: { id: id }
    });

    if (!alarm) throw new BadRequestException(ExceptionMessages.NOT_EXIST_ID);
    else if (!this.checkRole(alarm.userRole, user.userRole)) {
      throw new ForbiddenException(ExceptionMessages.NO_PERMISSION)
    }

    return alarm;
  }
}
