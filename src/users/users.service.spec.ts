import { Test, TestingModule, MockFactory } from '@nestjs/testing';
import { UsersService } from './users.service';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthsService } from 'src/auths/auths.service';
import { genSalt, hash } from 'bcrypt';
import { randomUUID } from 'crypto';
import { TBasicToken, TTokenPayload } from 'types-sssh';
import { TokenPrefixType } from 'src/auths/const/token.const';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { CommonModule } from 'src/common/common.module';

describe('UsersService', () => {
  let service: UsersService;
  let authsService: AuthsService;
  let repo: Repository<UserEntity>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CommonModule],
      providers: [UsersService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: {
            findOne: jest.fn().mockResolvedValue({
              id: randomUUID(),
              userId: "test",
              userPw: await hash("test", await genSalt(Number(10), "b")),
              userName: "test",
              userRole: "ADMIN",
              createdAt: new Date(),
              updatedAt: new Date()
            }),
            exists: jest.fn(),
            create: jest.fn().mockResolvedValue({
              userId: "test",
              userPw: await hash("test", await genSalt(Number(10), "b")),
              userName: "test",
            }),
            save: jest.fn().mockResolvedValue({
              id: randomUUID(),
              userId: "test",
              userPw: await hash("test", await genSalt(Number(10), "b")),
              userName: "test",
              userRole: "ADMIN",
              createdAt: new Date(),
              updatedAt: new Date()
            }),
          }
        }, {
          provide: AuthsService,
          useValue: {
            signToken: jest.fn().mockReturnValue(""),
            encryptPassword: jest.fn().mockResolvedValue("")
          }
        }],
    }).compile();

    service = module.get<UsersService>(UsersService);
    authsService = module.get<AuthsService>(AuthsService);
    repo = module.get<Repository<UserEntity>>(getRepositoryToken(UserEntity));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('existsUser - 유저 체크', () => {
    it('[정상케이스] userId 존재하는 경우', async () => {
      jest
        .spyOn(repo, 'exists')
        .mockImplementation(
          async (y) => !!y["where"]["userId"] && true
        );

      const isExist = await service.existsUser({ userId: "test" });

      expect(isExist).toBeTruthy();
    });
    it('[정상케이스] userName 존재하는 경우', async () => {
      jest
        .spyOn(repo, 'exists')
        .mockImplementation(
          async (y) => !!y["where"]["userName"] && true
        );

      const isExist = await service.existsUser({ userName: "test" });

      expect(isExist).toBeTruthy();
    });
  });


  /**
   * TODO : 추후 refresh 토큰 redis 도입 되면 작성
   */
  describe('logout - 유저 로그아웃', () => {
    it('[정상케이스]', async () => {
      const res = await service.logout();

      expect(res).toBeDefined();
    });
  });

  describe('login - 유저 로그인', () => {
    const user: TBasicToken = {
      type: TokenPrefixType.BASIC,
      userId: "test",
      userPw: "test"
    }

    it('[정상케이스]', async () => {
      const res = await service.login(user);

      expect(res).toBeDefined();
    });

    it('[에러케이스] 존재하지 않는 아이디인 경우', async () => {
      jest.spyOn(repo, 'findOne').mockResolvedValue(undefined);

      try {
        await service.login(user);
        expect(true).toBeFalsy();
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error).toHaveProperty('message', '존재하지 않는 아이디 입니다.');
      }
    });

    it('[에러케이스] 비밀번호가 일치하지 않는 경우(comparePw)', async () => {
      try {
        await service.login({ ...user, userPw: "test2" });
        expect(true).toBeFalsy();
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error).toHaveProperty('message', '잘못된 아이디, 비밀번호 입니다.');
      }
    });
  });

  describe('register - 유저 가입', () => {
    const userDto: CreateUserDto = {
      userId: "test",
      userPw: "test",
      userName: "test"
    }

    it('[정상케이스]', async () => {
      jest
        .spyOn(repo, 'exists')
        .mockResolvedValue(false)

      const res = await service.register(userDto);

      expect(res).toBeDefined();
    });

    it('[에러케이스] 이미 존재하는 ID인 경우', async () => {
      jest
        .spyOn(repo, 'exists')
        .mockImplementation(
          async (y) => !!y["where"]["userId"] && true
        );

      try {
        await service.register(userDto);
        expect(true).toBeFalsy();
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error).toHaveProperty('message', '이미 존재하는 ID 입니다.');
      }
    });

    it('[에러케이스] 이미 존재하는 닉네임인 경우', async () => {
      jest
        .spyOn(repo, 'exists')
        .mockImplementation(
          async (y) => !!y["where"]["userName"] && true
        );

      try {
        await service.register(userDto);
        expect(true).toBeFalsy();
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error).toHaveProperty('message', '이미 존재하는 닉네임 입니다.');
      }
    });
  });
});
