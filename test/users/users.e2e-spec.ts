import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/users/entities/user.entity';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';
import { ExceptionMessages } from 'src/common/message/exception.message';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let usersRepository: Repository<UserEntity>;

  type TestRoles = { admin: string, manager: string, user: string };

  let testIds: TestRoles = { admin: "", manager: "", user: "" };
  let testAccessToken: TestRoles = { admin: "", manager: "", user: "" };
  let testRefreshToken: TestRoles = { admin: "", manager: "", user: "" };
  let testUserId = "";

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
          insert into users ("userId", "userPw", "userName", "userRole", "isCertified") values ('testManager', '$2b$10$hDUNIEnceL9b7FvKwodya.IAU29zXbVJKykfr/H3nmQ3P.ROt4lyG', 'testManager', 'MANAGER', true);
          insert into users ("userId", "userPw", "userName", "userRole", "isCertified") values ('testUser', '$2b$10$hDUNIEnceL9b7FvKwodya.IAU29zXbVJKykfr/H3nmQ3P.ROt4lyG', 'testUser', 'USER', true);
        `)
      })
      .finally(() => { done() });
  });

  describe('/users/login (POST)', () => {
    it('Admin 로그인', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/login')
        .set('authorization', `Basic ${Buffer.from("testAdmin:testPw").toString('base64')}`);

      expect(response.status).toBe(201);
      expect(response.headers["set-cookie"][0].indexOf("accessToken=") !== -1).toBeTruthy();
      expect(response.body.refreshToken).toBeDefined();

      if (response.headers["set-cookie"][0] && response.body.refreshToken) {
        testAccessToken.admin = response.header["set-cookie"][0];
        testRefreshToken.admin = response.body.refreshToken;
      }
    });

    it('Manager 로그인', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/login')
        .set('authorization', `Basic ${Buffer.from("testManager:testPw").toString('base64')}`);

      expect(response.status).toBe(201);
      expect(response.headers["set-cookie"][0].indexOf("accessToken=") !== -1).toBeTruthy();
      expect(response.body.refreshToken).toBeDefined();

      if (response.headers["set-cookie"][0] && response.body.refreshToken) {
        testAccessToken.manager = response.header["set-cookie"][0];
        testRefreshToken.manager = response.body.refreshToken;
      }
    })

    it('[에러케이스] USER 계정으로 로그인', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/login')
        .set('authorization', `Basic ${Buffer.from("testUser:testPw").toString('base64')}`);

      expect(response.statusCode).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    })
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
        response.body.data.forEach(element => {
          if (element.userId === "testAdmin") testIds.admin = element.id
          else if (element.userId === "testManager") testIds.manager = element.id
          else if (element.userId === "testUser") testUserId = element.id
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

    it('[에커레이스] AccessToken으로 재발급 시도', async () => {
      // Cookie 에서 token 추출
      const access = testAccessToken.manager;
      const token = access.substring(
        access.indexOf("=", access.indexOf("accessToken")) + 1
        , access.indexOf(";", access.indexOf("accessToken"))
      );

      const response = await request(app.getHttpServer())
        .post('/users/refresh')
        .send({ refreshToken: token });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe(ExceptionMessages.INVALID_TOKEN);
    })
  })

  describe('/users (POST)', () => {
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
      expect(response.body.message).toBe(ExceptionMessages.EXIST_ID);
    })

    it('[에러케이스] 이미 존재하는 이름', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({ ...testUserDto, userId: "testId2" })

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe(ExceptionMessages.EXIST_NAME);
    });

  });

  describe('/users/cert (POST)', () => {
    it('승인 대기 유저 승인 처리후 로그인', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/cert')
        .set('Cookie', testAccessToken.admin)
        .send({ idList: [testIds.user] });

      expect(response.statusCode).toBe(201);

      const response2 = await request(app.getHttpServer())
        .post('/users/login')
        .set('authorization', `Basic ${Buffer.from(testUserDto.userId + ":" + testUserDto.userPw).toString('base64')}`);

      expect(response2.statusCode).toBe(403);
      expect(response2.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    });

    it('[에러케이스] 이미 처리된 유저 처리', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/cert')
        .set('Cookie', testAccessToken.manager)
        .send({ idList: [testIds.user] });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(ExceptionMessages.ALREADY_PRECESSED);
    });

    it('[에러케이스] 처리 값이 없는 경우', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/cert')
        .set('Cookie', testAccessToken.manager)
        .send({ idList: [] });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(ExceptionMessages.NO_PARAMETER);
    });
  });


  describe('/users (PATCH)', () => {
    it('관리자 token으로 userName 수정', async () => {
      const updateUserDto: UpdateUserDto = {
        id: testIds.user,
        userName: "수정",
        userRole: "USER",
        isPwReset: false
      }
      const response = await request(app.getHttpServer())
        .patch('/users')
        .set('Cookie', testAccessToken.admin)
        .send(updateUserDto);

      expect(response.status).toBe(200);
      expect(response.body.userName).toBe(updateUserDto.userName);
    })

    it('Manager token으로 userRole 수정', async () => {
      const updateUserDto: UpdateUserDto = {
        id: testIds.user,
        userName: "수정",
        userRole: "MANAGER",
        isPwReset: false
      }
      const response = await request(app.getHttpServer())
        .patch('/users')
        .set('Cookie', testAccessToken.manager)
        .send(updateUserDto);

      expect(response.status).toBe(200);
      expect(response.body.userRole).toBe(updateUserDto.userRole);
    })

    it('Admin token으로 Manager 계정 userName, userUser 수정', async () => {
      const updateUserDto: UpdateUserDto = {
        id: testIds.user,
        userName: "유저",
        userRole: "USER",
        isPwReset: false
      }
      const response = await request(app.getHttpServer())
        .patch('/users')
        .set('Cookie', testAccessToken.admin)
        .send(updateUserDto);

      expect(response.status).toBe(200);
      expect(response.body.userRole).toBe(updateUserDto.userRole);
      expect(response.body.userName).toBe(updateUserDto.userName);
    })

    it('Admin token으로 Admin 계정 비밀번호 초기화', async () => {
      const updateUserDto: UpdateUserDto = {
        id: testIds.admin,
        userName: "testAdmin",
        userRole: "ADMIN",
        isPwReset: true
      }
      const response = await request(app.getHttpServer())
        .patch('/users')
        .set('Cookie', testAccessToken.admin)
        .send(updateUserDto);

      expect(response.status).toBe(200);

      const response2 = await request(app.getHttpServer())
        .post('/users/login')
        .set('authorization', `Basic ${Buffer.from("testAdmin:a12345678").toString('base64')}`);

      expect(response2.status).toBe(201);
      expect(response2.headers["set-cookie"][0].indexOf("accessToken=") !== -1).toBeTruthy();
      expect(response2.body.refreshToken).toBeDefined();
    });

    it('[에러케이스] 이미 존재하는 유저 이름으로 수정', async () => {
      const updateUserDto: UpdateUserDto = {
        id: testIds.user,
        userName: "testAdmin",
        userRole: "USER",
        isPwReset: false
      }
      const response = await request(app.getHttpServer())
        .patch('/users')
        .set('Cookie', testAccessToken.admin)
        .send(updateUserDto);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(ExceptionMessages.EXIST_NAME);
    });

    it('[에러케이스] Manager token으로 Admin 계정 수정', async () => {
      const updateUserDto: UpdateUserDto = {
        id: testIds.admin,
        userName: "수정안됨",
        userRole: "MANAGER",
        isPwReset: false
      }
      const response = await request(app.getHttpServer())
        .patch('/users')
        .set('Cookie', testAccessToken.manager)
        .send(updateUserDto);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    });

    it('[에러케이스] Manager token으로 Admin 계정 수정', async () => {
      const updateUserDto: UpdateUserDto = {
        id: testIds.admin,
        userName: "수정안됨",
        userRole: "MANAGER",
        isPwReset: false
      }
      const response = await request(app.getHttpServer())
        .patch('/users')
        .set('Cookie', testAccessToken.manager)
        .send(updateUserDto);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    });
  });

  describe('/users/${id} (GET)', () => {
    it('Admin 토큰으로 Admin 유저 조회', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${testIds.admin}`)
        .set('Cookie', testAccessToken.admin)

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(testIds.admin);
    })

    it('Admin 토큰으로 Manager 유저 조회', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${testIds.manager}`)
        .set('Cookie', testAccessToken.admin)

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(testIds.manager);
    })

    it('Manager 토큰으로 유저 조회', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${testIds.user}`)
        .set('Cookie', testAccessToken.manager)

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(testIds.user);
    })

    it('[에러케이스] Manager 토큰으로 Admin 유저 조회', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${testIds.admin}`)
        .set('Cookie', testAccessToken.manager)

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    })

    it('[에러케이스] UUID가 아닌 건으로 조회', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/0107a`)
        .set('Cookie', testAccessToken.manager)

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(ExceptionMessages.INVALID_UUID);
    })

    it('[에러케이스] 존재하지 않는 유저 조회', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/0107a9ec-5ac9-43a1-91d2-a4821491c542`)
        .set('Cookie', testAccessToken.manager)

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(ExceptionMessages.NOT_EXIST_USER);
    })
  });

  describe('/users/exists (GET)', () => {
    it('존재하는 name 검사', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/exists?userName=testAdmin`);

      expect(response.statusCode).toBe(200);
      expect(response.body.isExists).toBeTruthy();
    })

    it('존재하지 않은 name 검사', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/exists?userName=z`);

      expect(response.statusCode).toBe(200);
      expect(response.body.isExists).toBeFalsy();
    })

    it('존재하는 id 검사', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/exists?userId=testAdmin`);

      expect(response.statusCode).toBe(200);
      expect(response.body.isExists).toBeTruthy();
    })

    it('존재하지 않은 name 검사', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/exists?userId=z`);

      expect(response.statusCode).toBe(200);
      expect(response.body.isExists).toBeFalsy();
    })

    it('[에러케이스] 파라미터를 안넘기는 경우', async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/exists`);

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe(ExceptionMessages.NO_PARAMETER);
    })
  });

  describe('/users (DELETE)', () => {
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
      expect(response.body.message).toBe(ExceptionMessages.NOT_EXIST_USER);
    });

    it('[에러케이스] 매니저 계정으로 관리자 계정 삭제 시도', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/users/${testIds.admin}`)
        .set('Cookie', testAccessToken.manager);

      expect(response.statusCode).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    });

  });


  afterAll((done) => {
    usersRepository
      .query(`delete from users where "userId" in ('${testUserDto.userId}', 'testAdmin','testManager','testUser')`)
      .then(() => {
        app.close()
      })
      .finally(() => {
        done();
      });
  })
});
