import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
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

  async login(user: TBasicToken) {
    const existingUser = await this.usersRepository.findOne({
      where: { userId: user.userId }
    });

    if (!existingUser) throw new UnauthorizedException("잘못된 아이디, 비밀번호 입니다.");

    const validPw = await compare(
      user.userPw,
      existingUser.userPw
    );

    if (!validPw) throw new UnauthorizedException("잘못된 아이디, 비밀번호 입니다.");

    const userForSignToken = {
      id: existingUser.id,
      userRole: existingUser.userRole
    }

    return {
      accessToken: await this.authsService.signToken(userForSignToken, TokenType.ACCESS),
      refreshToken: await this.authsService.signToken(userForSignToken, TokenType.REFRESH)
    }
  }

  async logout() {
    return {
      accessToken: "",
      refreshToken: ""
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
    if (await this.existsUser({ userId: userId })) {
      throw new BadRequestException("이미 존재하는 ID 입니다.");
    } else if (await this.existsUser({ userName: userName })) {
      throw new BadRequestException("이미 존재하는 닉네임 입니다.");
    }

    const createUser = this.usersRepository.create({
      ...createUserDto,
      userPw: await this.authsService.encryptPassword(userPw) // 비밀번호 암호화
    })

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
   * UserId를 통해 존재하는 유저인지 체크
   * @param userId 
   * @returns Promise<boolean> 존재하는경우 true, 존재하지않는 경우 false
   */
  async existsUser(options: FindOptionsWhere<UserEntity>[] | FindOptionsWhere<UserEntity>): Promise<boolean> {
    return this.usersRepository.exists({ where: options });
  }

  async create(createUserDto: CreateUserDto) {
    const createUser = await this.usersRepository.create(createUserDto);

    createUser.userPw = await this.authsService.encryptPassword(createUser.userPw);

    const user = await this.usersRepository.save(createUser);

    return user;
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
