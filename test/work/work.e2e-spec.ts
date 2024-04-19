import { Test } from "@nestjs/testing";
import { AppModule } from "src/app.module";
import { WorkEntity } from "src/work/entities/work.entity";
import E2ETestUtil from "../e2e-util.class";
import AuthsEnum from "src/auths/const/auths.enums";
import { ExceptionMessages } from "src/common/message/exception.message";
import { query } from "express";

describe('WorksController (e2e)', () => {
  let test: E2ETestUtil<WorkEntity>;
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

        test = new E2ETestUtil(app, moduleFixture.get("WORK_REPOSITORY"));
        await test.setBaseUser();

        sample2IdPw = `${test.users[1].userId}:testPw`;
      })
      .finally(() => { done() });
  });

  beforeEach(async () => {
    date = new Date();
    for (const u of test.users) {
      await test.insertAuths(u.id, [AuthsEnum.CAN_USE_OFFICE, AuthsEnum.CAN_USE_WORK])
    }
  })
  afterEach(async () => {
    await test.deleteAuths();
    for (const u of test.users) {
      await test.repository.query(`delete from work where "userUuid" = '${u.id}'`);
    }
    console.log("time(s) : ", (new Date().getTime() - date.getTime()) / 1000);
  });

  describe('/work (GET)', () => {
    it('자기 자신 work 리스트 조회하기', async () => {
      const id = test.users[0].id;

      await test.repository.query(`
        insert into work ("userUuid", "baseDate") values ('${id}', '2024-03-30');
        insert into work ("userUuid", "baseDate") values ('${id}', '2024-04-01');
        insert into work ("userUuid", "baseDate") values ('${id}', '2024-04-02');
      `);

      const response
        = await test.req(
          "get"
          , `/work?id=${id}&startDate=2024-03-30&endDate=2024-04-02`
          , undefined
          , await test.getToken()
        );

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(3);
    });

    it('work 일부 조회하기', async () => {
      const id = test.users[0].id;

      await test.repository.query(`
        insert into work ("userUuid", "baseDate") values ('${id}', '2024-03-30');
        insert into work ("userUuid", "baseDate") values ('${id}', '2024-04-01');
        insert into work ("userUuid", "baseDate") values ('${id}', '2024-04-02');
      `);

      const response
        = await test.req(
          "get"
          , `/work?id=${id}&startDate=2024-03-30&endDate=2024-04-01`
          , undefined
          , await test.getToken()
        );

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
    });

    it('다른 유저 work 리스트 조회하기', async () => {
      const id = test.users[0].id;
      const id2 = test.users[1].id;
      await test.insertAuths(id, [AuthsEnum.READ_ANOTHER_WORK]);

      await test.repository.query(`
        insert into work ("userUuid", "baseDate") values ('${id2}', '2024-03-30');
        insert into work ("userUuid", "baseDate") values ('${id2}', '2024-04-01');
        insert into work ("userUuid", "baseDate") values ('${id2}', '2024-04-02');
      `);

      const response
        = await test.req(
          "get"
          , `/work?id=${id2}&startDate=2024-03-30&endDate=2024-04-02`
          , undefined
          , await test.getToken()
        );

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(3);
    });

    it('다른 유저 work 일부 조회하기', async () => {
      const id = test.users[0].id;
      const id2 = test.users[1].id;
      await test.insertAuths(id, [AuthsEnum.READ_ANOTHER_WORK]);

      await test.repository.query(`
        insert into work ("userUuid", "baseDate") values ('${id2}', '2024-03-30');
        insert into work ("userUuid", "baseDate") values ('${id2}', '2024-04-01');
        insert into work ("userUuid", "baseDate") values ('${id2}', '2024-04-02');
      `);

      const response
        = await test.req(
          "get"
          , `/work?id=${id2}&startDate=2024-03-30&endDate=2024-04-01`
          , undefined
          , await test.getToken()
        );

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
    });

    it('[에러케이스] 권한 없이 다른 유저 work 조회', async () => {
      const id2 = test.users[1].id;

      const response
        = await test.req(
          "get"
          , `/work?id=${id2}&startDate=2024-03-30&endDate=2024-04-01`
          , undefined
          , await test.getToken()
        );

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    });
  });

  describe('/work/today (GET)', () => {
    it('오늘 근무한 직원 조회', async () => {
      await test.insertAuths(undefined, [AuthsEnum.READ_ANOTHER_WORK]);

      const d = new Date();
      const month = d.getMonth() < 9 ? `0${d.getMonth() + 1}` : d.getMonth() + 1;
      const day = d.getDate() < 10 ? `0${d.getDate()}` : d.getDate();

      await test.repository.query(`
        insert into work ("userUuid", "baseDate") values ('${test.users[0].id}', '${d.getFullYear()}-${month}-${day}');
        insert into work ("userUuid", "baseDate") values ('${test.users[1].id}', '${d.getFullYear()}-${month}-${day}');
      `);

      const response = await test.req("get", "/work/today", undefined, await test.getToken());

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });
  })

  describe('/work (POST)', () => {
    it('출근하기', async () => {
      const response = await test.req("post", "/work", undefined, await test.getToken());

      expect(response.status).toBe(201);
      expect(response.body.isSuccess).toBeTruthy();
    });

    it('출근하기 - 퇴근 처리 안된 출근 기록 동시 처리 확인', async () => {
      const id = test.users[0].id;

      await test.repository.query(`
        insert into work ("userUuid", "baseDate") values ('${id}', '2024-03-30')
      `);

      const response = await test.req("post", "/work", undefined, await test.getToken());

      expect(response.status).toBe(201);
      expect(response.body.isSuccess).toBeTruthy();
      expect(response.body.updatedWorks.length).toBeGreaterThanOrEqual(1);
    })

    it('[에러케이스] 중복출근', async () => {
      await test.req("post", "/work", undefined, await test.getToken());
      const response = await test.req("post", "/work", undefined, await test.getToken());

      expect(response.status).toBe(406);
      expect(response.body.message).toBe(ExceptionMessages.ALREADY_PRECESSED);
    });
  });

  describe('/work (PATCH)', () => {
    it('퇴근 전 업무 기록하기', async () => {
      // 출근
      await test.req("post", "/work", undefined, await test.getToken(false, sample2IdPw));

      const workDetail = "이런 업무 했습니당.";
      const response = await test.req("patch", "/work", { workDetail }, await test.getToken(false, sample2IdPw));

      expect(response.status).toBe(200);
      expect(response.body.offTime).toBeNull();
      expect(response.body.workDetail).toBe(workDetail);

      await query
    });

    it('퇴근하기', async () => {
      // 출근
      await test.req("post", "/work", undefined, await test.getToken(false, sample2IdPw));

      const workDetail = "퇴근했습니당";
      const response = await test.req("patch", "/work?off=true", { workDetail }, await test.getToken(false, sample2IdPw));

      expect(response.status).toBe(200);
      expect(response.body.offTime !== null).toBeTruthy();
      expect(response.body.workDetail).toBe(workDetail);
    });

    it('[에러케이스] 중복 퇴근하기', async () => {
      const workDetail = "퇴근했습니당";
      await test.req("post", "/work", undefined, await test.getToken(false, sample2IdPw));
      await test.req("patch", "/work?off=true", { workDetail }, await test.getToken(false, sample2IdPw));

      const response = await test.req("patch", "/work?off=true", { workDetail: "" }, await test.getToken(false, sample2IdPw));

      expect(response.status).toBe(406);
      expect(response.body.message).toBe(ExceptionMessages.ALREADY_WORK);
    });

    it('[에러케이스] 출근하기 전 퇴근', async () => {
      const response = await test.req("patch", "/work?off=true", { workDetail: "" }, await test.getToken(false, sample2IdPw));

      expect(response.status).toBe(406);
      expect(response.body.message).toBe(ExceptionMessages.NOT_EXIST_WORK);
    })
  });

  describe('/work (DELETE)', () => {
    it('자기 자신 출근 기록 삭제하기', async () => {
      const d = new Date();
      const month = d.getMonth() < 9 ? `0${d.getMonth() + 1}` : d.getMonth() + 1;
      const day = d.getDate() < 10 ? `0${d.getDate()}` : d.getDate();
      const YYYYMMDD = `${d.getFullYear()}-${month}-${day}`;
      await test.req("post", "/work", undefined, await test.getToken(false, sample2IdPw));

      const response = await test.req("delete", `/work?id=${test.users[1].id}&baseDates=${YYYYMMDD}`, undefined, await test.getToken(false, sample2IdPw));

      expect(response.status).toBe(200);
      expect(response.body.affected).toBe(1);
    })

    it('타인의 출근 기록 삭제하기', async () => {
      await test.insertAuths(undefined, [AuthsEnum.DELETE_ANOTHER_WORK]);

      const d = new Date();
      const month = d.getMonth() < 9 ? `0${d.getMonth() + 1}` : d.getMonth() + 1;
      const day = d.getDate() < 10 ? `0${d.getDate()}` : d.getDate();
      const YYYYMMDD = `${d.getFullYear()}-${month}-${day}`;
      await test.req("post", "/work", undefined, await test.getToken(false, sample2IdPw));

      const response = await test.req("delete", `/work?id=${test.users[1].id}&baseDates=${YYYYMMDD}`, undefined, await test.getToken());

      expect(response.status).toBe(200);
      expect(response.body.affected).toBe(1);
    })

    it('[에러케이스] 권한 없이 타인의 출근 기록 삭제 시도', async () => {
      const d = new Date();
      const month = d.getMonth() < 9 ? `0${d.getMonth() + 1}` : d.getMonth() + 1;
      const day = d.getDate() < 10 ? `0${d.getDate()}` : d.getDate();
      const YYYYMMDD = `${d.getFullYear()}-${month}-${day}`;
      await test.req("post", "/work", undefined, await test.getToken(false, sample2IdPw));

      const response = await test.req("delete", `/work?id=${test.users[1].id}&baseDates=${YYYYMMDD}`, undefined, await test.getToken());

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    })
  })

  afterAll(() => {
    test.close();
  })
});