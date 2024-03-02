import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { FindOptionsWhere, Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthsService } from '../auths/auths.service';
import { compare } from 'bcrypt';
import { TokenPrefixType, TokenType } from '../auths/const/token.const';
import { TBasicToken } from 'types-sssh';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
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
    await this.duplicateCheckInRegister(userId, userName);

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
   * userId로 유저 조회
   * @param userId 
   * @returns Promise<UserEntity>
   */
  findUserByUserId(userId: string) {
    return this.usersRepository.findOne({ where: { userId } });
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
   * findUserByUserId를 사용하여 존재하는 유저인지 체크
   * 그 후에 찾은 유저 데이터를 반환
   * @param userId 
   * @returns Promise<UserEntity> 
   */
  private async existCheckInLogin(userId: string) {
    const user = await this.findUserByUserId(userId);

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
  private async duplicateCheckInRegister(userId: string, userName: string): Promise<void> {
    if (await this.existsUser({ userId: userId })) {
      throw new BadRequestException("이미 존재하는 ID 입니다.");
    } else if (await this.existsUser({ userName: userName })) {
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
