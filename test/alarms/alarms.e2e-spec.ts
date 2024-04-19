import { Test } from "@nestjs/testing";
import { AppModule } from "src/app.module";
import { ExceptionMessages } from "src/common/message/exception.message";
import E2ETestUtil from "../e2e-util.class";
import { AlarmsEntity } from "src/alarms/entities/alarms.entity";
import AuthsEnum from "src/auths/const/auths.enums";
import { TAlarms } from "@sssh-fresh-code/types-sssh";

describe('AlarmsController (e2e)', () => {
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

        test = new E2ETestUtil(app, moduleFixture.get("ALARMS_REPOSITORY"));
        await test.setBaseUser();

      })
      .finally(() => { done() });
  });

  beforeEach(async () => {
    date = new Date();
    for (const u of test.users) {
      await test.insertAuths(u.id, [AuthsEnum.CAN_USE_OFFICE])
    }
  })

  afterEach(async () => {
    await test.deleteAuths();
    for (const u of test.users) {
      await test.repository.query(`delete from alarms where "order" = 999`);
    }
    console.log("time(s) : ", (new Date().getTime() - date.getTime()) / 1000);
  });

  describe('/alarms?readOnly=true (GET)', () => {
    it('알람 전체 조회', async () => {
      await test.insertAuths(test.users[0].id, [AuthsEnum.READ_ALARMS])
      await test.repository.query(`
        INSERT INTO alarms ("name", "icon", "title", "contents", "path", "order") values ('test1', 'test1', 'test1', 'test1', 'path', 999);
        INSERT INTO alarms ("name", "icon", "title", "contents", "path", "order") values ('test2', 'test2', 'test2', 'test2', 'path', 999);
        INSERT INTO alarms ("name", "icon", "title", "contents", "path", "order") values ('test3', 'test3', 'test3', 'test3', 'path', 999);
      `);

      const response = await test.req("get", `/alarms?readOnly=true`, undefined, await test.getToken());

      expect(response.status).toBe(200);
      expect(response.body.info.total).toBeGreaterThanOrEqual(3);
    });

    it('[에러케이스] 권한 없이 알람 전체 조회', async () => {
      const response = await test.req("get", `/alarms?readOnly=true`, undefined, await test.getToken());

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    });
  });

  describe('/alarms (POST)', () => {
    it('알람 생성', async () => {
      await test.insertAuths(undefined, [AuthsEnum.POST_ALARMS])

      const alarms: TAlarms = {
        order: 999,
        name: "test1",
        title: "test1",
        contents: "test1",
        icon: "Hello",
        auths: [{ code: AuthsEnum.ADMIN_ALARMS, description: "" }]
      };

      const response = await test.req("post", "/alarms", alarms, await test.getToken())

      expect(response.status).toBe(201);
      expect(response.body.order).toBe(999);
    })

    it('[에러케이스] 권한 없이 알람 생성', async () => {
      const response = await test.req("post", "/alarms", {}, await test.getToken())

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    })
  });

  describe('/alarms/:id (GET)', () => {
    it('알람 단일 조회', async () => {
      await test.insertAuths(undefined, [AuthsEnum.POST_ALARMS, AuthsEnum.READ_ALARMS]);

      const alarms: TAlarms = {
        order: 999,
        name: "test1",
        title: "test1",
        contents: "test1",
        icon: "Hello",
        auths: [{ code: AuthsEnum.ADMIN_ALARMS, description: "" }]
      };

      const response = await test.req("post", "/alarms", alarms, await test.getToken())

      const response2 = await test.req("get", `/alarms/${response.body.id}`, undefined, await test.getToken())

      expect(response2.status).toBe(200);
      expect(response2.body.id).toBe(response.body.id);
    });

    it('[에러케이스] 권한 없이 알람 단일 조회', async () => {
      const response = await test.req("get", `/alarms/1`, undefined, await test.getToken())

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    });
  });

  describe('/alarms (PATCH)', () => {
    it('알람 수정', async () => {
      await test.insertAuths(undefined, [AuthsEnum.POST_ALARMS, AuthsEnum.MODIFY_ALARMS]);

      const alarms: TAlarms = {
        order: 999,
        name: "test1",
        title: "test1",
        contents: "test1",
        icon: "Hello",
        auths: [{ code: AuthsEnum.ADMIN_ALARMS, description: "" }]
      };

      const response = await test.req("post", "/alarms", alarms, await test.getToken());

      expect(response.status).toBe(201)
      const response2 = await test.req("patch", "/alarms", { ...alarms, contents: "modify", id: response.body.id }, await test.getToken());

      expect(response2.status).toBe(200);
      expect(response2.body.contents).toBe("modify");
    })

    it('[에러케이스] 권한 없이 알람 수정', async () => {
      const response = await test.req("patch", "/alarms", {}, await test.getToken());

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    })
  });

  describe('/alarms/:id (DELETE)', () => {
    it('알람 단일 삭제', async () => {
      await test.insertAuths(undefined, [AuthsEnum.POST_ALARMS, AuthsEnum.DELETE_ALARMS]);

      const alarms: TAlarms = {
        order: 999,
        name: "test1",
        title: "test1",
        contents: "test1",
        icon: "Hello",
        auths: [{ code: AuthsEnum.ADMIN_ALARMS, description: "" }]
      };
      const response = await test.req("post", "/alarms", alarms, await test.getToken());

      expect(response.status).toBe(201)

      const response2 = await test.req("delete", `/alarms/${response.body.id}`, undefined, await test.getToken());

      expect(response2.status).toBe(200);
      expect(response2.body.affected).toBe(1);
    });

    it('권한 없이 알람 단일 삭제', async () => {
      const response2 = await test.req("delete", `/alarms/1`, undefined, await test.getToken());

      expect(response2.status).toBe(403);
      expect(response2.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    });
  });

  afterAll(() => test.close());
});