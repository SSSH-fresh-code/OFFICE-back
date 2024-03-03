import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { FindManyOptions, FindOptionsWhere, Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthsService } from '../auths/auths.service';
import { compare } from 'bcrypt';
import { TokenPrefixType, TokenType } from '../auths/const/token.const';
import { TBasicToken, TTokenPayload } from 'types-sssh';
import { UserPaginationDto } from './dto/user-pagination.dto';
import { CommonService } from 'src/common/common.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
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
    const existingUser = await this.existCheckInLogin(user.userId);

    await this.comparePw(user.userPw, existingUser.userPw);

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
    const { userId, userName, userPw } = createUserDto;

    /** id, name 중복검사 */
    await this.duplicateCheck(userId, userName);

    const createUser = await this.createUser(createUserDto);

    const user = await this.usersRepository.save(createUser);

    /** 생성된 계정으로 로그인 */
    return await this.login(
      {
        type: TokenPrefixType.BASIC,
        userId: user.userId,
        userPw: userPw
      }
    );
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
    const options: FindManyOptions<UserEntity> = {
      select: ["id", "userId", "userPw", "userRole", "createdAt", "updatedAt"]
    }
    return this.commonService.paginate<UserEntity>(page, this.usersRepository, options);
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
    const u = await this.usersRepository.findOneOrFail({
      where: { id }
    });

    if (["ADMIN", "MANAGER"].includes(user.userRole)) {
      if (!this.authsService.checkRole(u.userRole, user.userRole)) {
        throw new ForbiddenException("조회 권한이 존재하지 않습니다.");
      }
    } else if (user.id !== id) {
      throw new ForbiddenException("조회 권한이 존재하지 않습니다.");
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
    const u = await this.usersRepository.findOneOrFail({
      where: { id: dto.id }
    });

    if (["ADMIN", "MANAGER"].includes(user.userRole)) {
      if (!this.authsService.checkRole(u.userRole, user.userRole)) {
        throw new ForbiddenException("ADMIN 계정은 수정할 수 없습니다.");
      };
      if (dto.userRole && !this.authsService.checkRole(dto.userRole, user.userRole)) {
        throw new ForbiddenException("수정 권한이 존재하지 않습니다.");
      }
    } else if (user.id !== u.id) {
      throw new ForbiddenException("자신의 계정만 수정할 수 있습니다.");
    } else if (dto.userRole) {
      throw new ForbiddenException("권한을 수정할 수 없습니다.");
    }

    // userName 중복 체크
    await this.duplicateCheck("", dto.userName)

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
    const u = await this.usersRepository.findOneOrFail({
      where: { id }
    });

    // if (!this.authsService.checkRole(u.userRole, user.userRole)) {
    //   throw new ForbiddenException("삭제 권한이 없습니다.");
    // }

    await this.usersRepository.delete(u.id);

    return true;
  }
  /**
   * findUserByUserId를 사용하여 존재하는 유저인지 체크
   * 그 후에 찾은 유저 데이터를 반환
   * @param userId 
   * @returns Promise<UserEntity> 
   */
  private async existCheckInLogin(userId: string) {
    const user = await this.usersRepository.findOne({ select: ["id", "userRole", "userPw"], where: { userId } });

    if (!user) throw new UnauthorizedException("존재하지 않는 아이디 입니다.");

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
      throw new UnauthorizedException("잘못된 아이디, 비밀번호 입니다.");
  }



  /**
   * 가입 전 유저 아이디, 닉네임이 존재하는지 체크
   * @param userId 
   * @param userName 
   * @throws BadRequestException
   */
  private async duplicateCheck(userId?: string, userName?: string): Promise<void> {
    if (userId && await this.existsUser({ userId: userId })) {
      throw new BadRequestException("이미 존재하는 ID 입니다.");
    } else if (userName && await this.existsUser({ userName: userName })) {
      throw new BadRequestException("이미 존재하는 닉네임 입니다.");
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
