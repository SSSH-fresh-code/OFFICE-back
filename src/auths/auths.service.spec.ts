import { Test, TestingModule } from '@nestjs/testing';
import { AuthsService } from './auths.service';
import { randomUUID } from 'crypto';
import { UserEntity } from 'src/users/entities/user.entity';
import { TokenType } from './const/token.const';
import { JwtModule, JwtService } from '@nestjs/jwt';

describe('AuthsService', () => {
  let service: AuthsService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: "test" })],
      providers: [AuthsService],
    }).compile();

    service = module.get<AuthsService>(AuthsService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(jwtService).toBeDefined();
  });

  describe('encryptPassword - 패스워드 암호화', () => {
    const password = "test";

    it('암호화가 문제없이 수행되는가?', async () => {
      const encryptPassword = await service.encryptPassword(password);
      expect(!!encryptPassword).toBeTruthy();
    })

    it('입력 패스워드와 암호화된 패스워드가 다른가?', async () => {
      const encryptPassword = await service.encryptPassword(password);
      expect(encryptPassword === password).toBeFalsy();
    });
  });

  describe('signToken - 토큰 생성', () => {
    const user: Pick<UserEntity, "id" | "userRole"> = {
      id: randomUUID(),
      userRole: "ADMIN"
    }

    it('ACCESS 토큰 생성이 문제없이 수행되는가?', async () => {
      const token = await service.signToken(user, TokenType.ACCESS);

      expect(token).toBeDefined();
    });

    it('REFRESH 토큰 생성이 문제없이 수행되는가?', async () => {
      const token = await service.signToken(user, TokenType.REFRESH);

      expect(token).toBeDefined();
    });

    it('유효한 토큰이 생성되는가?', async () => {
      const token = await service.signToken(user, TokenType.REFRESH);

      expect(await jwtService.verify(token)).toBeDefined();
    });
  });
});
