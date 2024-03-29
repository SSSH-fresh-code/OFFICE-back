import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let usersRepository: Repository<UserEntity>;

  type TestTokens = { admin: string, manager: string, user: string };
  let testAccessToken: TestTokens = { admin: "", manager: "", user: "" };
  let testRefreshToken: TestTokens = { admin: "", manager: "", user: "" };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    usersRepository = moduleFixture.get(getRepositoryToken(UserEntity));
    await usersRepository.query(`
      INSERT INTO users ("userId", "userPw", "userName", "userRole", "isCertified") values ('testAdmin', '$2b$10$hDUNIEnceL9b7FvKwodya.IAU29zXbVJKykfr/H3nmQ3P.ROt4lyG', 'testAdmin', 'ADMIN', true);
      insert into users ("userId", "userPw", "userName", "userRole", "isCertified") values ('testManger', '$2b$10$hDUNIEnceL9b7FvKwodya.IAU29zXbVJKykfr/H3nmQ3P.ROt4lyG', 'testManager', 'MANAGER', true);
      insert into users ("userId", "userPw", "userName", "userRole", "isCertified") values ('testUser', '$2b$10$hDUNIEnceL9b7FvKwodya.IAU29zXbVJKykfr/H3nmQ3P.ROt4lyG', 'testUser', 'USER', true);
    `);

    const adminToken = await request(app.getHttpServer()).post('/users/login').set('authorization', `Basic ${Buffer.from("testAdmin:testPw").toString('base64')}`);
    const managerToken = await request(app.getHttpServer()).post('/users/login').set('authorization', `Basic ${Buffer.from("testManger:testPw").toString('base64')}`);

    testAccessToken.admin = adminToken.header["set-cookie"][0];
    testRefreshToken.admin = adminToken.body.refreshToken;
    testAccessToken.manager = managerToken.header["set-cookie"][0];
    testRefreshToken.manager = managerToken.body.refreshToken;
  });


  describe('/users (GET)', () => {
    it('Admin Token 조회', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Cookie', testAccessToken.admin)

      expect(response.statusCode).toBe(200);
      expect(response.body.info).toBeDefined();
      expect(response.body.info.total).toBeGreaterThanOrEqual(3);
    });

    it('Manager Token 조회', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Cookie', testAccessToken.manager)

      expect(response.statusCode).toBe(200);
      expect(response.body.info).toBeDefined();
      expect(response.body.info.total).toBeGreaterThanOrEqual(3);
    });

    it('페이징 기능 조회', async () => {
      const response = await request(app.getHttpServer())
        .get('/users?page=1&take=1')
        .set('Cookie', testAccessToken.manager)

      expect(response.statusCode).toBe(200);
      expect(response.body.info.last).toBeGreaterThanOrEqual(3);
    });

    it('[에러케이스] 토큰 없이 조회', async () => {
      const response = await request(app.getHttpServer()).get('/users');

      expect(response.statusCode).toBe(401);
      expect(response.body.message).toBe("사용자 정보가 존재하지 않습니다.");
    });

  })


  afterAll((done) => {
    usersRepository
      .query(`delete from users where "userId" in ('testAdmin','testManger','testUser')`)
      .then(() => {
        app.close();
        done();
      });
  })
});
