import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/users/entities/user.entity';
import { CreateUserDto } from 'src/users/dto/create-user.dto';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let usersRepository: Repository<UserEntity>;

  type TestRoles = { admin: string, manager: string, user: string };

  let testIds: TestRoles = { admin: "", manager: "", user: "" };
  let testAccessToken: TestRoles = { admin: "", manager: "", user: "" };
  let testRefreshToken: TestRoles = { admin: "", manager: "", user: "" };

  const testUserDto: CreateUserDto = {
    userId: "testId",
    userPw: "testPw12",
    userName: "testName"
  }

  beforeAll((done) => {
    Test.createTestingModule({
      imports: [AppModule],
    })
      .compile()
      .then(async (moduleFixture) => {
        app = moduleFixture.createNestApplication();
        await app.init();

        usersRepository = moduleFixture.get("USER_REPOSITORY");
        await usersRepository.query(`
          INSERT INTO users ("userId", "userPw", "userName", "userRole", "isCertified") values ('testAdmin', '$2b$10$hDUNIEnceL9b7FvKwodya.IAU29zXbVJKykfr/H3nmQ3P.ROt4lyG', 'testAdmin', 'ADMIN', true);
          insert into users ("userId", "userPw", "userName", "userRole", "isCertified") values ('testManger', '$2b$10$hDUNIEnceL9b7FvKwodya.IAU29zXbVJKykfr/H3nmQ3P.ROt4lyG', 'testManager', 'MANAGER', true);
          insert into users ("userId", "userPw", "userName", "userRole", "isCertified") values ('testUser', '$2b$10$hDUNIEnceL9b7FvKwodya.IAU29zXbVJKykfr/H3nmQ3P.ROt4lyG', 'testUser', 'USER', true);
        `)

        const adminToken = await request(app.getHttpServer()).post('/users/login').set('authorization', `Basic ${Buffer.from("testAdmin:testPw").toString('base64')}`);
        const managerToken = await request(app.getHttpServer()).post('/users/login').set('authorization', `Basic ${Buffer.from("testManger:testPw").toString('base64')}`);

        testAccessToken.admin = adminToken.header["set-cookie"][0];
        testRefreshToken.admin = adminToken.body.refreshToken;
        testAccessToken.manager = managerToken.header["set-cookie"][0];
        testRefreshToken.manager = managerToken.body.refreshToken;
      })
      .finally(() => { done() });
  });

  describe('/users (GET)', () => {
    it('Admin Token 조회', async () => {
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Cookie', testAccessToken.admin)

      expect(response.statusCode).toBe(200);
      expect(response.body.info).toBeDefined();
      expect(response.body.info.total).toBeGreaterThanOrEqual(3);

      if (response.body.info.total >= 3) {
        response.body.data.array.forEach(element => {
          if (element.userId === "testAdmin") testIds.admin = element.id
          else if (element.userId === "testManager") testIds.manager = element.id
        });
      }
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

  describe('/users/login (POST)', () => {
    it('[에러케이스] USER 계정으로 로그인', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/login')
        .set('authorization', `Basic ${Buffer.from("testUser:testPw").toString('base64')}`);

      expect(response.statusCode).toBe(403);
      expect(response.body.message).toBe("접근 권한이 없는 유저입니다.");
    })
  });

  describe('/users/refresh (POST)', () => {
    it('ADMIN 토큰 재발급', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/refresh')
        .send({ refreshToken: testRefreshToken.admin });

      expect(response.statusCode).toBe(201);
      expect(response.headers["set-cookie"][0].indexOf("accessToken=") !== -1).toBeTruthy()
    })

    it('MANAGER 토큰 재발급', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/refresh')
        .send({ refreshToken: testRefreshToken.manager });

      expect(response.statusCode).toBe(201);
      expect(response.headers["set-cookie"][0].indexOf("accessToken=") !== -1).toBeTruthy()
    })
  })

  describe('/users (POST), /users/cert (POST), /users (DELETE)', () => {
    it('회원가입', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send(testUserDto)

      expect(response.statusCode).toBe(201);
      expect(response.body.userId).toBeDefined();

      if (response.body.userId) {
        testIds.user = response.body.id;
      }
    })

    it('[에러케이스] 이미 존재하는 아이디', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({ ...testUserDto, userName: "testName2" })

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe("이미 존재하는 ID 입니다.");
    })

    it('[에러케이스] 이미 존재하는 이름', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({ ...testUserDto, userId: "testId2" })

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe("이미 존재하는 닉네임 입니다.");
    });

    it('승인 대기 유저 승인 처리', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/cert')
        .send({ ...testUserDto, userId: "testId2" });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe("이미 존재하는 닉네임 입니다.");
    })

    it('생성한 유저 삭제', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/users/${testIds.user}`)
        .set('Cookie', testAccessToken.admin);

      expect(response.statusCode).toBe(200);
    })

    it('[에러케이스] 존재하지 않는 유저 삭제 시도', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/users/${testIds.user}`)
        .set('Cookie', testAccessToken.admin);

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe("존재하지 않는 유저입니다.");
    });

    it('[에러케이스] 매니저 계정으로 관리자 계정 삭제 시도', async () => {

    })
  });




  afterAll((done) => {
    usersRepository
      .query(`delete from users where "userId" in ('testAdmin','testManger','testUser')`)
      .then(() => {
        app.close()
      })
      .finally(() => {
        done();
      });
  })
});
