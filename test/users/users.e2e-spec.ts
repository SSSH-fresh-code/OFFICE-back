import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/users/entities/user.entity';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import AuthsEnum from 'src/auths/const/auths.enums';
import { ExceptionMessages } from 'src/common/message/exception.message';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let repository: Repository<UserEntity>;

  let date = new Date();

  let user: UserEntity;
  let user2: UserEntity;

  const testUserDto: CreateUserDto = {
    userId: "testId",
    userPw: "testPw12",
    userName: "testName"
  }

  const insertAuths = async (id: string, auths: AuthsEnum[]) => {
    const authsStr = auths.map(a => `
      INSERT INTO
          users_auths_auths ("usersId", "authsCode")
        VALUES 
          ('${id}', '${a}');
    `).join('');


    return await repository.query(authsStr);
  }

  const deleteAuths = async (id: string) => await repository.query(`
    DELETE FROM
      users_auths_auths
    WHERE
      "usersId" = '${id}';
  `);

  const getToken = async (isRefesh: boolean = false, idPw: string = "sample:testPw") => {
    const { body } = await request(app.getHttpServer())
      .post('/users/login')
      .set(
        'authorization'
        , `Basic ${Buffer.from(idPw).toString('base64')}`
      );

    return isRefesh ? body.refreshToken : body.accessToken;
  }

  const req = async (method: "get" | "post" | "patch" | "delete", url: string, body?: string | object, token?: string) => {
    if (method === "get") {
      return await request(app.getHttpServer()).get(url).set(token ? 'authorization' : 'a', token ? `Bearer ${token}` : 'b');
    } else if (method === "post") {
      return await request(app.getHttpServer()).post(url).set(token ? 'authorization' : 'a', token ? `Bearer ${token}` : 'b').send(body ? body : {});
    } else if (method === "patch") {
      return await request(app.getHttpServer()).patch(url).set(token ? 'authorization' : 'a', token ? `Bearer ${token}` : 'b').send(body ? body : {});
    } else if (method === "delete") {
      return await request(app.getHttpServer()).delete(url).set(token ? 'authorization' : 'a', token ? `Bearer ${token}` : 'b');
    }
  }

  beforeAll((done) => {
    Test.createTestingModule({
      imports: [AppModule],
    })
      .compile()
      .then(async (moduleFixture) => {
        app = moduleFixture.createNestApplication();
        await app.init();

        repository = moduleFixture.get("USER_REPOSITORY");
        await repository.query(`
          INSERT INTO 
            users ("userId", "userPw", "userName", "isCertified") 
          VALUES 
            ('sample', '$2b$10$hDUNIEnceL9b7FvKwodya.IAU29zXbVJKykfr/H3nmQ3P.ROt4lyG', 'testAcc',  true);
        `);
        await repository.query(`
          INSERT INTO 
            users ("userId", "userPw", "userName", "isCertified") 
          VALUES 
            ('sample2', '$2b$10$hDUNIEnceL9b7FvKwodya.IAU29zXbVJKykfr/H3nmQ3P.ROt4lyG', 'testAcc2',  true);
        `);

        user = await repository.findOne({
          where: {
            userId: "sample"
          }
        })
        user2 = await repository.findOne({
          where: {
            userId: "sample2"
          }
        })
      }).finally(() => done());
  });

  beforeEach(async () => {
    date = new Date();
    await insertAuths(user.id, [AuthsEnum.CAN_USE_OFFICE]);
  })
  afterEach(async () => {
    await deleteAuths(user.id);
    console.log("time(s) : ", (new Date().getTime() - date.getTime()) / 1000);
  });

  describe('/users/login (POST)', () => {
    it('로그인 권한이 있을 때', async () => {
      // when
      const response = await request(app.getHttpServer())
        .post('/users/login')
        .set(
          'authorization'
          , `Basic ${Buffer.from("sample:testPw").toString('base64')}`
        );

      // then
      expect(response.status).toBe(201);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
    });

    it('[에러케이스] 로그인 실패 - 비밀번호가 틀린 경우', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/login')
        .set(
          'authorization'
          , `Basic ${Buffer.from("sample:wrongPw").toString('base64')}`
        );

      expect(response.statusCode).toBe(401);
      expect(response.body.message).toBe(ExceptionMessages.WRONG_ACCOUNT_INFO);
    })

    it('[에러케이스] 로그인 실패 - 아이디가 틀린 경우', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/login')
        .set(
          'authorization'
          , `Basic ${Buffer.from("smpale:testPw").toString('base64')}`
        );

      expect(response.statusCode).toBe(401);
      expect(response.body.message).toBe(ExceptionMessages.WRONG_ACCOUNT_INFO);
    })

    it('[에러케이스] 로그인 실패 - 권한이 없는 경우', async () => {
      await deleteAuths(user.id); // 권한 삭제

      const response = await request(app.getHttpServer())
        .post('/users/login')
        .set(
          'authorization'
          , `Basic ${Buffer.from("sample:testPw").toString('base64')}`
        );

      expect(response.statusCode).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    })
  });

  describe('/users (GET)', () => {
    it('[슈퍼권한] 유저 조회', async () => {
      await insertAuths(user.id, [AuthsEnum.SUPER_USER]);

      const response = await req("get", "/users", undefined, await getToken());

      expect(response.statusCode).toBe(200);
      expect(response.body.info).toBeDefined();
      expect(response.body.info.total).toBeGreaterThanOrEqual(1);
    });

    it('유저 조회', async () => {
      await insertAuths(user.id, [AuthsEnum.READ_ANOTHER_USER]);

      const response = await req("get", "/users", undefined, await getToken());

      expect(response.statusCode).toBe(200);
      expect(response.body.info).toBeDefined();
      expect(response.body.info.total).toBeGreaterThanOrEqual(1);

    });

    it('페이징 테스트', async () => {
      await repository.query(`
          INSERT INTO 
            users ("userId", "userPw", "userName", "isCertified") 
          VALUES 
            ('forPaging', '$2b$10$hDUNIEnceL9b7FvKwodya.IAU29zXbVJKykfr/H3nmQ3P.ROt4lyG', '페이지테스트',  true);
        `);
      await insertAuths(user.id, [AuthsEnum.READ_ANOTHER_USER]);

      const response = await req("get", '/users?page=2&take=1', undefined, await getToken());

      expect(response.statusCode).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.info.take).toBe(1);
      expect(response.body.info.current).toBe(2);

      await repository.query(`delete from users where "userId" = 'forPaging'`)
    });

    it('[에러케이스] 권한 없이 조회', async () => {
      const response = await req("get", "/users", undefined, await getToken());

      expect(response.statusCode).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    });
  })

  describe('/users/refresh (POST)', () => {
    it('ADMIN 토큰 재발급', async () => {
      const response = await req("post", "/users/refresh", undefined, await getToken(true));

      expect(response.statusCode).toBe(201);
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.accessToken).toBeDefined();
    })

    it('[에러케이스] Access Token으로 재발급 시도', async () => {
      const response = await req("post", "/users/refresh", undefined, await getToken());

      expect(response.statusCode).toBe(401);
      expect(response.body.message).toBe(ExceptionMessages.INVALID_TOKEN);
    })
  })

  describe('/users (POST)', () => {
    it('회원가입', async () => {
      const response = await req("post", "/users", testUserDto);

      expect(response.statusCode).toBe(201);
      expect(response.body.userId).toBeDefined();

      await repository.query(`delete from users where "userId" = '${testUserDto.userId}'`)
    })

    it('[에러케이스] 이미 존재하는 아이디', async () => {
      const response = await req("post", "/users", { ...testUserDto, userId: "sample" });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe(ExceptionMessages.EXIST_ID);
    })

    it('[에러케이스] 이미 존재하는 이름', async () => {
      const response = await req("post", "/users", { ...testUserDto, userName: "testAcc" });

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe(ExceptionMessages.EXIST_NAME);
    });
  });

  describe('/users/cert (POST)', () => {
    it('승인 대기 유저 승인 처리후 로그인', async () => {
      await insertAuths(user.id, [AuthsEnum.MODIFY_ANOTHER_USER]);

      const { body: { id } } = await req("post", "/users", testUserDto);

      const response = await req("post", "/users/cert", { idList: [id] }, await getToken());

      expect(response.statusCode).toBe(201);


      const response2 = await request(app.getHttpServer())
        .post('/users/login')
        .set('authorization', `Basic ${Buffer.from(testUserDto.userId + ":" + testUserDto.userPw).toString('base64')}`);

      expect(response2.statusCode).toBe(201);

      await repository.query(`delete from users where "userId" = '${testUserDto.userId}'`)
    });

    it('[에러케이스] 이미 처리된 유저 처리', async () => {
      await insertAuths(user.id, [AuthsEnum.MODIFY_ANOTHER_USER]);

      const response = await req("post", "/users/cert", { idList: [user.id] }, await getToken());

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(ExceptionMessages.ALREADY_PRECESSED);
    });

    it('[에러케이스] 처리 값이 없는 경우', async () => {
      await insertAuths(user.id, [AuthsEnum.MODIFY_ANOTHER_USER]);

      const response = await req("post", "/users/cert", { idList: [] }, await getToken());

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(ExceptionMessages.NO_PARAMETER);
    });
  });


  describe('/users (PATCH)', () => {
    it('userName 수정', async () => {
      const updateUserDto: UpdateUserDto = {
        id: user.id,
        userName: "수정한이름",
        isPwReset: false
      }

      const response = await req("patch", "/users", updateUserDto, await getToken());

      expect(response.status).toBe(200);
      expect(response.body.userName).toBe(updateUserDto.userName);


      await repository.query(`UPDATE "users" SET "userName" = 'testAcc', "userPw" = '$2b$10$hDUNIEnceL9b7FvKwodya.IAU29zXbVJKykfr/H3nmQ3P.ROt4lyG' WHERE "userId" = 'sample';`)
    })


    it('다른 계정 userName 수정', async () => {
      await insertAuths(user.id, [AuthsEnum.MODIFY_ANOTHER_USER]);

      const updateUserDto: UpdateUserDto = {
        id: user2.id,
        userName: "수정한이름2",
        isPwReset: false
      }

      const response = await req("patch", "/users", updateUserDto, await getToken());

      expect(response.status).toBe(200);
      expect(response.body.userName).toBe(updateUserDto.userName);

      await repository.query(`UPDATE "users" SET "userName" = 'testAcc2', "userPw" = '$2b$10$hDUNIEnceL9b7FvKwodya.IAU29zXbVJKykfr/H3nmQ3P.ROt4lyG' WHERE "userId" = 'sample2';`)
    })

    it('비밀번호 초기화', async () => {
      const updateUserDto: UpdateUserDto = {
        id: user.id,
        userName: user.userName,
        isPwReset: true
      }

      const response = await req("patch", "/users", updateUserDto, await getToken());

      expect(response.status).toBe(200);

      const response2 = await request(app.getHttpServer())
        .post('/users/login')
        .set('authorization', `Basic ${Buffer.from(`${user.userId}:a12345678`).toString('base64')}`);

      expect(response2.status).toBe(201);
      expect(response2.body.accessToken).toBeDefined();
      expect(response2.body.refreshToken).toBeDefined();
      await repository.query(`UPDATE "users" SET "userName" = 'testAcc', "userPw" = '$2b$10$hDUNIEnceL9b7FvKwodya.IAU29zXbVJKykfr/H3nmQ3P.ROt4lyG' WHERE "userId" = 'sample';`)
    });

    it('다른 계정 비밀번호 초기화', async () => {
      await insertAuths(user.id, [AuthsEnum.MODIFY_ANOTHER_USER]);
      await insertAuths(user2.id, [AuthsEnum.CAN_USE_OFFICE]);

      const updateUserDto: UpdateUserDto = {
        id: user2.id,
        userName: "testAcc2",
        isPwReset: true
      }

      const response = await req("patch", "/users", updateUserDto, await getToken());

      expect(response.status).toBe(200);

      const response2 = await request(app.getHttpServer())
        .post('/users/login')
        .set('authorization', `Basic ${Buffer.from(`${user2.userId}:a12345678`).toString('base64')}`);

      expect(response2.status).toBe(201);
      expect(response2.body.accessToken).toBeDefined();
      expect(response2.body.refreshToken).toBeDefined();
      await repository.query(`UPDATE "users" SET "userName" = 'testAcc2', "userPw" = '$2b$10$hDUNIEnceL9b7FvKwodya.IAU29zXbVJKykfr/H3nmQ3P.ROt4lyG' WHERE "userId" = 'sample2';`)
    })

    it('[에러케이스] 이미 존재하는 유저 이름으로 수정', async () => {

      const updateUserDto: UpdateUserDto = {
        id: user.id,
        userName: user2.userName,
        isPwReset: false
      }

      const response = await req("patch", "/users", updateUserDto, await getToken());

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(ExceptionMessages.EXIST_NAME);
      await repository.query(`UPDATE "users" SET "userName" = 'testAcc', "userPw" = '$2b$10$hDUNIEnceL9b7FvKwodya.IAU29zXbVJKykfr/H3nmQ3P.ROt4lyG' WHERE "userId" = 'sample';`)
    });

    it('[에러케이스] 권한 없이 다른 유저 계정 수정', async () => {
      const updateUserDto: UpdateUserDto = {
        id: user2.id,
        userName: "testAcc2",
        isPwReset: true
      }

      const response = await req("patch", "/users", updateUserDto, await getToken());

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);

      await repository.query(`UPDATE "users" SET "userName" = 'testAcc2', "userPw" = '$2b$10$hDUNIEnceL9b7FvKwodya.IAU29zXbVJKykfr/H3nmQ3P.ROt4lyG' WHERE "userId" = 'sample2';`)
    });
  });

  describe('/users/${id} (GET)', () => {
    it('자신의 유저 정보 조회', async () => {
      const response = await req("get", `/users/${user.id}`, undefined, await getToken());

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(user.id);
    })

    it('[슈퍼권한] 다른 유저 정보 조회', async () => {
      await insertAuths(user.id, [AuthsEnum.SUPER_USER]);
      const response = await req("get", `/users/${user2.id}`, undefined, await getToken());

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(user2.id);
    })

    it('다른 유저 정보 조회', async () => {
      await insertAuths(user.id, [AuthsEnum.READ_ANOTHER_USER]);
      const response = await req("get", `/users/${user2.id}`, undefined, await getToken());

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(user2.id);
    })

    it('[에러케이스] 권한 없이 다른 유저 정보 조회', async () => {
      const response = await req("get", `/users/${user2.id}`, undefined, await getToken());

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    })

    it('[에러케이스] UUID가 아닌 건으로 조회', async () => {
      const response = await req("get", `/users/0108a`, undefined, await getToken());

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(ExceptionMessages.INVALID_UUID);
    })

    it('[에러케이스] 존재하지 않는 유저 조회', async () => {
      const response = await req("get", `/users/0107a9ec-5ac9-43a1-91d2-a4821491c542`, undefined, await getToken());

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(ExceptionMessages.NOT_EXIST_USER);
    })
  });

  describe('/users/exists (GET)', () => {
    it('존재하는 name 검사', async () => {
      const response = await req("get", `/users/exists?userName=testAcc`)

      expect(response.statusCode).toBe(200);
      expect(response.body.isExists).toBeTruthy();
    })

    it('존재하지 않은 name 검사', async () => {
      const response = await req("get", `/users/exists?userName=z`)

      expect(response.statusCode).toBe(200);
      expect(response.body.isExists).toBeFalsy();
    })

    it('존재하는 id 검사', async () => {
      const response = await req("get", `/users/exists?userId=sample`)

      expect(response.statusCode).toBe(200);
      expect(response.body.isExists).toBeTruthy();
    })

    it('존재하지 않은 name 검사', async () => {
      const response = await req("get", `/users/exists?userId=z`)

      expect(response.statusCode).toBe(200);
      expect(response.body.isExists).toBeFalsy();
    })

    it('[에러케이스] 파라미터를 안넘기는 경우', async () => {
      const response = await req("get", `/users/exists`)

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe(ExceptionMessages.NO_PARAMETER);
    })
  });

  describe('/users (DELETE)', () => {
    it('[에러케이스] 권한 없이 타인 아이디 탈퇴 시도', async () => {
      const response = await req("delete", `/users/${user2.id}`, undefined, await getToken())

      expect(response.statusCode).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    })

    it('다른 유저 회원 탈퇴', async () => {
      await insertAuths(user.id, [AuthsEnum.DELETE_ANOTHER_USER]);

      const response = await req("delete", `/users/${user2.id}`, undefined, await getToken())

      expect(response.statusCode).toBe(200);
    })

    it('[에러케이스] 존재하지 않는 유저 삭제 시도', async () => {
      const response = await req("delete", `/users/${user2.id}`, undefined, await getToken())

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe(ExceptionMessages.NOT_EXIST_USER);
    });

    it('스스로 회원 탈퇴', async () => {
      const response = await req("delete", `/users/${user.id}`, undefined, await getToken())

      expect(response.statusCode).toBe(200);
    })
  });


  afterAll(async () => {
    await repository
      .query(`delete from users where "userId" = 'sample' or "userId" = 'sample2'`)
  });
});
