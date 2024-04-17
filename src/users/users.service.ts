import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { Equal, FindOptionsWhere, Or, Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { AuthsService } from '../auths/auths.service';
import { compare } from 'bcrypt';
import { TokenType } from '../auths/const/token.const';
import { TBasicToken, TTokenPayload } from '@sssh-fresh-code/types-sssh';
import { UserPaginationDto } from './dto/user-pagination.dto';
import { CommonService } from 'src/common/common.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ExceptionMessages } from 'src/common/message/exception.message';
import AuthsEnum from 'src/auths/const/auths.enums';
import { UpdateAuthUserDto } from './dto/update-auth-user.dto';
import { User } from 'src/common/decorator/user.decorator';

@Injectable()
export class UsersService {
  constructor(
    @Inject('USER_REPOSITORY')
    private readonly usersRepository: Repository<UserEntity>,
    private readonly commonService: CommonService,
    private readonly authsService: AuthsService
  ) { }

  /**
   * Login 로직, 컨트롤러에서 Basic 토큰을 해석하여 param 가져옴
   * @param user 
   * @returns accessToken, refreshToken
   */
  async login(user: TBasicToken) {
    const existingUser = await this.validationInLogin(user.userId);

    await this.comparePw(user.userPw, existingUser.userPw);

    if (
      !AuthsService.checkAuth(
        AuthsEnum.CAN_USE_OFFICE
        , { type: "ACCESS", ...existingUser, auths: existingUser.auths.map((a) => a.code) }
      )
    ) {
      throw new ForbiddenException(ExceptionMessages.NO_PERMISSION);
    }

    return {
      accessToken: await this.authsService.signToken(existingUser, TokenType.ACCESS),
      refreshToken: await this.authsService.signToken(existingUser, TokenType.REFRESH)
    }
  }

  /**
   * 회원가입
   * 1) id, name 중복검사
   * 2) 비밀번호 암호화
   * 3) 생성된 계정으로 로그인
   * @param createUserDto 
   * @returns ACCESS, REFRESH TOKEN
   */
  async register(createUserDto: CreateUserDto) {
    const { userId, userName } = createUserDto;

    /** id, name 중복검사 */
    await this.duplicateCheck(userId, userName);

    const createUser = await this.createUser(createUserDto);

    const user = await this.usersRepository.save(createUser);

    return user;
  }

  /**
   * where 조건을 넣어 user가 존재하는지 테스트
   * @param  FindOptionsWhere<UserEntity>[] | FindOptionsWhere<UserEntity>): Promise<boolean>
   * @returns Promise<boolean> 존재하는경우 true, 존재하지않는 경우 false
   */
  async existsUser(options: FindOptionsWhere<UserEntity>[] | FindOptionsWhere<UserEntity>): Promise<boolean> {
    return await this.usersRepository.exists({ where: options });
  }

  async logout() {
    return {
      accessToken: "",
      refreshToken: ""
    }
  }

  /**
   * 유저 전체 조회
   * 페이징 적용으로 인한 CommonModule 의존
   * @param page UserPaginationDto
   * @returns Promise<PaginationResult<UserEntity>>
   */
  findUsers(page: UserPaginationDto) {
    return this.commonService.paginate<UserEntity>(page, this.usersRepository);
  }

  /**
   * 유저ID로 유저 조회
   * 1) 관리자인 경우 -> 자신보다 윗 등급의 유저 권한 조회 불가
   * 2) 관리자가 아닌 경우 -> 자신의 계정이 아니면 조회 불가
   * @param user TTokenPayload 
   * @param id string
   * @returns 
   */
  async findUser(user: TTokenPayload, id: string) {
    let u;

    try {
      u = await this.usersRepository.findOne({
        where: { id }
      });
    } catch (e) {
      if (e instanceof Error && e.message.indexOf("invalid input syntax for type uuid") !== -1) {
        throw new BadRequestException(ExceptionMessages.INVALID_UUID);
      }
    }

    if (!u) throw new NotFoundException(ExceptionMessages.NOT_EXIST_USER);

    if (
      !AuthsService.checkAuth(AuthsEnum.READ_ANOTHER_USER, user)
      && !AuthsService.checkOwns(id, user.id)
    ) {
      throw new ForbiddenException(ExceptionMessages.NO_PERMISSION);
    }

    return u;
  }

  /**
   * user 업데이트
   * - 관리자인 경우
   *    1) 자신보다 권한이 높은 유저의 정보 수정 불가능
   *    2) 자신보다 높은 권한으로 정보 수정 불가능
   * - 일반 유저인 경우
   *    1) 자신의 계정만 수정 가능(아이디 체크)
   *    2) 자체적으로 권한 수정 불가능
   * @param user 
   * @param dto 
   * @returns 
   */
  async updateUser(user: TTokenPayload, dto: UpdateUserDto) {
    const u = await this.usersRepository.findOne({
      where: { id: dto.id }
    });

    if (!u) {
      throw new BadRequestException(ExceptionMessages.NOT_EXIST_USER);
    }

    if (
      !AuthsService.checkAuth(AuthsEnum.MODIFY_ANOTHER_USER, user)
      && !AuthsService.checkOwns(u.id, user.id)
    ) {
      throw new ForbiddenException(ExceptionMessages.NO_PERMISSION);
    }

    // userName 중복 체크
    if (u.userName !== dto.userName) { await this.duplicateCheck("", dto.userName) }

    // pw 초기화
    if (dto.isPwReset) {
      u.userPw = await this.authsService.encryptPassword("a12345678")
    }

    return await this.usersRepository.save({ ...u, ...dto });
  }

  /**
   * user 삭제
   * 현재 ADMIN만 삭제가 가능하나 추후 MANAGER 권한 오픈을 염두에 두고 
   * 권한 체크 로직 주석 처리로 남겨놓음
   * @param user TTokenPayload
   * @param id string 
   * @returns 
   */
  async deleteUser(user: TTokenPayload, id: string) {
    const u = await this.usersRepository.findOne({
      where: { id }
    });

    if (!u) {
      throw new BadRequestException(ExceptionMessages.NOT_EXIST_USER);
    }

    if (
      !AuthsService.checkAuth(AuthsEnum.READ_ANOTHER_USER, user)
      && !AuthsService.checkOwns(u.id, user.id)
    ) {
      throw new ForbiddenException(ExceptionMessages.NO_PERMISSION);
    }

    await this.usersRepository.softDelete(u.id);

    return true;
  }

  async certUser(idList: string[]) {
    if (idList.length === 0 || !idList)
      throw new BadRequestException(ExceptionMessages.NO_PARAMETER);

    const users = await this.usersRepository.find({
      where: {
        id: Or(...idList.map(i => Equal(i))),
        isCertified: false
      }
    });

    if (users.length === 0)
      throw new BadRequestException(ExceptionMessages.ALREADY_PRECESSED);

    for (const u of users) {
      await this.usersRepository.save({
        ...u,
        isCertified: true,
        auths: [{ code: AuthsEnum.CAN_USE_OFFICE }]
      })
    }

    return true;
  }

  async refresh(payload: TTokenPayload) {
    // REFRESH TOKEN으로만 가능하게
    if (payload.type !== "REFRESH") throw new UnauthorizedException(ExceptionMessages.INVALID_TOKEN);

    const user = await this.usersRepository.findOne(
      {
        select: ["id", "userPw", "auths", "isCertified"]
        , where: { id: payload.id }
        , relations: { auths: true }
      }
    );

    return {
      accessToken: await this.authsService.signToken(user, TokenType.ACCESS),
      refreshToken: await this.authsService.signToken(user, TokenType.REFRESH)
    }
  }

  async updateAuthUser(dto: UpdateAuthUserDto) {
    const user = await this.usersRepository.findOne({ where: { id: dto.id } });

    if (!user) throw new BadRequestException(ExceptionMessages.NOT_EXIST_ID);

    const saved = await this.usersRepository.save({
      ...user,
      auths: dto.auths.map((a) => ({ code: a }))
    });

    return saved;
  };

  /**
   * - findUserByUserId를 사용하여 존재하는 유저인지 체크
   * - 승인된 유저인지 체크
   * 그 후에 찾은 유저 데이터를 반환
   * @param userId 
   * @returns Promise<UserEntity> 
   */
  private async validationInLogin(userId: string) {
    const user = await this.usersRepository.findOne(
      {
        select: ["id", "userPw", "auths", "isCertified"]
        , where: {
          userId
        }
        , relations: {
          auths: true
        }
      }
    );

    if (!user)
      throw new UnauthorizedException(ExceptionMessages.WRONG_ACCOUNT_INFO);

    return user;
  }

  /**
   * bcrypt compare 기능 이용하여 입력된 비밀번호와
   * 기존 비밀번호가 같은지 검증
   * @param pw 
   * @param encryptPw 
   */
  private async comparePw(pw: string, encryptPw: string): Promise<void> {
    if (!await compare(pw, encryptPw))
      throw new UnauthorizedException(ExceptionMessages.WRONG_ACCOUNT_INFO);
  }



  /**
   * 가입 전 유저 아이디, 닉네임이 존재하는지 체크
   * @param userId 
   * @param userName 
   * @throws BadRequestException
   */
  private async duplicateCheck(userId?: string, userName?: string): Promise<void> {
    if (userId && await this.existsUser({ userId: userId })) {
      throw new BadRequestException(ExceptionMessages.EXIST_ID);
    } else if (userName && await this.existsUser({ userName: userName })) {
      throw new BadRequestException(ExceptionMessages.EXIST_NAME);
    }
  }

  /**
   * save할 Entity 객체 생성
   * @param dto 
   * @returns Promise<UserEntity>
   */
  private async createUser(dto: CreateUserDto) {
    return await this.usersRepository.create({
      ...dto,
      userPw: await this.authsService.encryptPassword(dto.userPw)
    });
  }
}
