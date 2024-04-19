import { Test } from "@nestjs/testing";
import { AppModule } from "src/app.module";
import { ExceptionMessages } from "src/common/message/exception.message";
import E2ETestUtil from "../e2e-util.class";
import { AlarmsEntity } from "src/alarms/entities/alarms.entity";
import AuthsEnum from "src/auths/const/auths.enums";
import { UpdateAuthUserDto } from "src/auths/dto/update-auth-user.dto";
import { UpdateAuthAlarmsDto } from "src/auths/dto/update-auth-alarms.dto";
import { CreateAuthDto } from "src/auths/dto/create-auth.dto";

describe('AuthsController (e2e)', () => {
  let test: E2ETestUtil<AlarmsEntity>;
  let date: Date;
  let sample2IdPw;

  beforeAll((done) => {
    Test.createTestingModule({
      imports: [AppModule],
    })
      .compile()
      .then(async (moduleFixture) => {

        const app = moduleFixture.createNestApplication();
        await app.init();

        test = new E2ETestUtil(app, moduleFixture.get("AUTHS_REPOSITORY"));
        await test.setBaseUser();

      })
      .finally(() => { done() });
  });

  beforeEach(async () => {
    date = new Date();
    for (const u of test.users) {
      await test.insertAuths(u.id, [AuthsEnum.CAN_USE_OFFICE, AuthsEnum.CAN_USE_AUTH]);
    }
  })

  afterEach(async () => {
    await test.deleteAuths();
    for (const u of test.users) {
      await test.repository.query(`delete from auths where code like 'TEST%';`);
    }
    console.log("time(s) : ", (new Date().getTime() - date.getTime()) / 1000);
  });

  describe('/auths (GET)', () => {
    it('권한 조회', async () => {
      await test.repository.query(`insert into auths ("code", "description") values ('TEST0001', 'TEST_AUTH');`)

      const response = await test.req("get", `/auths`, undefined, await test.getToken());

      expect(response.status).toBe(200);
      expect(response.body.info.total).toBeGreaterThanOrEqual(1);
    });

    it('권한 조회 페이징', async () => {
      await test.repository.query(`insert into auths ("code", "description") values ('TEST0001', 'TEST_AUTH');`)
      await test.repository.query(`insert into auths ("code", "description") values ('TEST0002', 'TEST_AUTH');`)

      const response = await test.req("get", `/auths?take=1&page=2`, undefined, await test.getToken());

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.info.take).toBe(1);
      expect(response.body.info.current).toBe(2);
    });

    it('[에러케이스] 권한 없이 알람 전체 조회', async () => {
      await test.deleteAuths();
      await test.insertAuths(undefined, [AuthsEnum.CAN_USE_OFFICE]);

      const response = await test.req("get", `/auths`, undefined, await test.getToken());

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    });
  });


  describe('/auths/all (GET)', () => {
    it('권한 전체 조회', async () => {
      const [{ count }] = await test.repository.query(`select count(*) from auths`);

      const response = await test.req("get", `/auths/all`, undefined, await test.getToken());

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(+count);
    });

    it('[에러케이스] 권한 없이 알람 전체 조회', async () => {
      await test.deleteAuths();
      await test.insertAuths(undefined, [AuthsEnum.CAN_USE_OFFICE]);

      const response = await test.req("get", `/auths/all`, undefined, await test.getToken());

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    });
  });

  describe('/auths/users/:id (GET)', () => {
    it('해당 유저가 가진 권한 리스트 조회', async () => {
      const testCode = "TEST0001";
      await test.repository.query(`insert into auths ("code", "description") values ('${testCode}', 'TEST_AUTH');`)
      await test.repository.query(`insert into users_auths_auths ("authsCode", "usersId") values ('${testCode}', '${test.users[0].id}');`)

      const response = await test.req("get", `/auths/users/${test.users[0].id}`, undefined, await test.getToken());

      expect(response.status).toBe(200);
      expect(response.body.includes(testCode)).toBeTruthy();
    });

    it('[에러케이스] 권한 없이 해당 유저가 가진 권한 리스트 조회 시도', async () => {
      await test.deleteAuths();
      await test.insertAuths(undefined, [AuthsEnum.CAN_USE_OFFICE]);

      const response = await test.req("get", `/auths/users/${test.users[0].id}`, undefined, await test.getToken());

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    });
  });

  describe('/auths/users (PATCH)', () => {
    it('해당 유저 권한 수정', async () => {
      const testCode = "TEST0001";
      const updateAuthUserDto: UpdateAuthUserDto = {
        id: test.users[0].id,
        auths: [testCode]
      }
      await test.repository.query(`insert into auths ("code", "description") values ('${testCode}', 'TEST_AUTH');`)

      const response = await test.req("patch", `/auths/users`, updateAuthUserDto, await test.getToken());

      expect(response.status).toBe(200);
      expect(response.body.auths.length).toBe(1);
    });

    it('[에러케이스] 권한 없이 해당 유저 권한 수정', async () => {
      await test.deleteAuths();
      await test.insertAuths(undefined, [AuthsEnum.CAN_USE_OFFICE]);

      const response = await test.req("patch", `/auths/users`, {}, await test.getToken());

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    });
  });

  describe('/auths/alarms/:id (GET)', () => {
    it('해당 알람이 가진 권한 리스트 조회', async () => {
      const testCode = "TEST0001";
      await test.repository.query(`INSERT INTO alarms ("name", "icon", "title", "contents", "path", "order") values ('test1', 'test1', 'test1', 'test1', 'path', 999);`);
      const [{ id }] = await test.repository.query(`SELECT * FROM alarms WHERE "name" = 'test1'`);


      await test.repository.query(`insert into auths ("code", "description") values ('${testCode}', 'TEST_AUTH');`)
      await test.repository.query(`insert into alarms_auths_auths ("authsCode", "alarmsId") values ('${testCode}', '${id}');`)

      const response = await test.req("get", `/auths/alarms/${id}`, undefined, await test.getToken());

      expect(response.status).toBe(200);
      expect(response.body.includes(testCode)).toBeTruthy();

      await test.repository.query(`delete from alarms where "order" = 999`);
    });

    it('[에러케이스] 권한 없이 해당 유저가 가진 권한 리스트 조회 시도', async () => {
      await test.deleteAuths();
      await test.insertAuths(undefined, [AuthsEnum.CAN_USE_OFFICE]);

      const response = await test.req("get", `/auths/alarms/2`, undefined, await test.getToken());

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    });
  });

  describe('/auths/alarms (PATCH)', () => {
    it('해당 알람 권한 수정', async () => {
      const testCode = "TEST0001";

      await test.repository.query(`INSERT INTO alarms ("name", "icon", "title", "contents", "path", "order") values ('test1', 'test1', 'test1', 'test1', 'path', 999);`);
      const [{ id }] = await test.repository.query(`SELECT * FROM alarms WHERE "name" = 'test1'`);
      await test.repository.query(`insert into auths ("code", "description") values ('${testCode}', 'TEST_AUTH');`)

      const updateAuthAlarmsDto: UpdateAuthAlarmsDto = {
        id: +id,
        auths: [testCode]
      }

      const response = await test.req("patch", `/auths/alarms`, updateAuthAlarmsDto, await test.getToken());

      expect(response.status).toBe(200);
      expect(response.body.auths.length).toBe(1);

      await test.repository.query(`delete from alarms where "order" = 999`);
    });

    it('[에러케이스] 권한 없이 해당 알람 권한 수정', async () => {
      await test.deleteAuths();
      await test.insertAuths(undefined, [AuthsEnum.CAN_USE_OFFICE]);

      const response = await test.req("patch", `/auths/alarms`, {}, await test.getToken());

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    });
  });

  describe('/auths (POST)', () => {
    it('알람 생성', async () => {
      const createAuthDto: CreateAuthDto = {
        code: "TEST0001",
        description: "TEST_AUTH"
      }

      const response = await test.req("post", `/auths`, createAuthDto, await test.getToken());

      expect(response.status).toBe(201);
      expect(response.body.code).toBe(createAuthDto.code);
      expect(response.body.description).toBe(createAuthDto.description);
    });

    it('[에러케이스] 권한 없이 알람 생성', async () => {
      await test.deleteAuths();
      await test.insertAuths(undefined, [AuthsEnum.CAN_USE_OFFICE]);

      const response = await test.req("post", `/auths`, {}, await test.getToken());

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    });
  });

  describe('/auths (DELETE)', () => {
    it('알람 삭제', async () => {
      const testCode = "TEST0001";

      await test.repository.query(`insert into auths ("code", "description") values ('${testCode}', 'TEST_AUTH');`)

      const response = await test.req("delete", `/auths/${testCode}`, undefined, await test.getToken());

      expect(response.status).toBe(200);
      expect(response.body.affected).toBe(1);
    });

    it('[에러케이스] 권한 없이 알람 삭제', async () => {
      await test.deleteAuths();
      await test.insertAuths(undefined, [AuthsEnum.CAN_USE_OFFICE]);

      const response = await test.req("delete", `/auths/TEST0001`, undefined, await test.getToken());

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    });
  });

  afterAll(() => test.close());
});