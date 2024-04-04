import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "src/app.module";
import { UserEntity } from "src/users/entities/user.entity";
import { Repository } from "typeorm";
import * as request from 'supertest';
import { ExceptionMessages } from "src/common/message/exception.message";

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let workRepository: Repository<UserEntity>;

  type TestRoles = { admin: string, manager: string, user: string, user2: string };

  let testIds: TestRoles = { admin: "", manager: "", user: "", user2: "" };
  let testAccessToken: TestRoles = { admin: "", manager: "", user: "", user2: "" };
  let testRefreshToken: TestRoles = { admin: "", manager: "", user: "", user2: "" };
  let testUserId = "";

  beforeAll((done) => {
    Test.createTestingModule({
      imports: [AppModule],
    })
      .compile()
      .then(async (moduleFixture) => {
        app = moduleFixture.createNestApplication();
        await app.init();

        workRepository = moduleFixture.get("WORK_REPOSITORY");
        await workRepository.query(`
          INSERT INTO users ("userId", "userPw", "userName", "userRole", "isCertified") values ('testAdmin', '$2b$10$hDUNIEnceL9b7FvKwodya.IAU29zXbVJKykfr/H3nmQ3P.ROt4lyG', 'testAdmin', 'ADMIN', true);
          insert into users ("userId", "userPw", "userName", "userRole", "isCertified") values ('testManager', '$2b$10$hDUNIEnceL9b7FvKwodya.IAU29zXbVJKykfr/H3nmQ3P.ROt4lyG', 'testManager', 'MANAGER', true);
          insert into users ("userId", "userPw", "userName", "userRole", "isCertified") values ('testUser', '$2b$10$hDUNIEnceL9b7FvKwodya.IAU29zXbVJKykfr/H3nmQ3P.ROt4lyG', 'testUser', 'USER', true);
        `)


        const adminRes = await request(app.getHttpServer())
          .post('/users/login')
          .set('authorization', `Basic ${Buffer.from("testAdmin:testPw").toString('base64')}`);

        testAccessToken.admin = adminRes.header["set-cookie"][0];
        testRefreshToken.admin = adminRes.body.refreshToken;
        const managerRes = await request(app.getHttpServer())
          .post('/users/login')
          .set('authorization', `Basic ${Buffer.from("testManager:testPw").toString('base64')}`);

        testAccessToken.manager = managerRes.header["set-cookie"][0];
        testRefreshToken.manager = managerRes.body.refreshToken;


        const setIdRes = await request(app.getHttpServer())
          .get('/users')
          .set('Cookie', testAccessToken.admin)

        if (setIdRes.body.info.total >= 3) {
          setIdRes.body.data.forEach(element => {
            if (element.userId === "testAdmin") testIds.admin = element.id
            else if (element.userId === "testManager") testIds.manager = element.id
            else if (element.userId === "testUser") testIds.user = element.id
          });
        }
      })
      .finally(() => { done() });
  });

  describe('/work (GET)', () => {
    it('work 리스트 조회하기', async () => {
      await workRepository.query(`
        insert into work ("userUuid", "baseDate") values ('${testIds.admin}', '2024-03-30');
        insert into work ("userUuid", "baseDate") values ('${testIds.admin}', '2024-04-01');
        insert into work ("userUuid", "baseDate") values ('${testIds.admin}', '2024-04-02');
      `);

      const response = await request(app.getHttpServer())
        .get(`/work?id=${testIds.admin}&startDate=2024-03-30&endDate=2024-04-02`)
        .set('Cookie', testAccessToken.admin);

      await workRepository.query(`delete from work where "userUuid" = '${testIds.admin}'`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(3);
    })

    it('work 일부 리스트 조회하기', async () => {
      await workRepository.query(`
        insert into work ("userUuid", "baseDate") values ('${testIds.admin}', '2024-03-30');
        insert into work ("userUuid", "baseDate") values ('${testIds.admin}', '2024-04-01');
        insert into work ("userUuid", "baseDate") values ('${testIds.admin}', '2024-04-02');
      `);

      const response = await request(app.getHttpServer())
        .get(`/work?id=${testIds.admin}&startDate=2024-03-30&endDate=2024-04-01`)
        .set('Cookie', testAccessToken.admin);

      await workRepository.query(`delete from work where "userUuid" = '${testIds.admin}'`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
    })

    it('admin 토큰으로 manager 리스트 조회하기', async () => {
      await workRepository.query(`
        insert into work ("userUuid", "baseDate") values ('${testIds.manager}', '2024-03-30');
        insert into work ("userUuid", "baseDate") values ('${testIds.manager}', '2024-04-01');
      `);

      const response = await request(app.getHttpServer())
        .get(`/work?id=${testIds.manager}&startDate=2024-03-30&endDate=2024-04-02`)
        .set('Cookie', testAccessToken.admin);

      await workRepository.query(`delete from work where "userUuid" = '${testIds.manager}'`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
    })

    it('admin 토큰으로 user 리스트 조회하기', async () => {
      await workRepository.query(`
        insert into work ("userUuid", "baseDate") values ('${testIds.user}', '2024-03-30');
        insert into work ("userUuid", "baseDate") values ('${testIds.user}', '2024-04-01');
      `);

      const response = await request(app.getHttpServer())
        .get(`/work?id=${testIds.user}&startDate=2024-03-30&endDate=2024-04-02`)
        .set('Cookie', testAccessToken.admin);

      await workRepository.query(`delete from work where "userUuid" = '${testIds.user}'`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
    })

    it('manager 토큰으로 user 리스트 조회하기', async () => {
      await workRepository.query(`
        insert into work ("userUuid", "baseDate") values ('${testIds.user}', '2024-03-30');
        insert into work ("userUuid", "baseDate") values ('${testIds.user}', '2024-04-01');
      `);

      const response = await request(app.getHttpServer())
        .get(`/work?id=${testIds.user}&startDate=2024-03-30&endDate=2024-04-02`)
        .set('Cookie', testAccessToken.manager);

      await workRepository.query(`delete from work where "userUuid" = '${testIds.user}'`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
    })

    it('[에러케이스] manager 토큰으로 admin 리스트 조회하기', async () => {
      const response = await request(app.getHttpServer())
        .get(`/work?id=${testIds.admin}&startDate=2024-03-30&endDate=2024-04-02`)
        .set('Cookie', testAccessToken.manager);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    });

    it('[에러케이스] date 없이 요청', async () => {
      const response = await request(app.getHttpServer())
        .get(`/work?id=${testIds.admin}`)
        .set('Cookie', testAccessToken.manager);

      expect(response.status).toBe(400);
      expect(response.body.message.length).toBe(4);
    });
  })

  describe('/work (GET)', () => {
    it('work 리스트 조회하기', async () => {
      const d = new Date();
      const month = d.getMonth() < 9 ? `0${d.getMonth() + 1}` : d.getMonth() + 1;
      const day = d.getDate() < 10 ? `0${d.getDate()}` : d.getDate();

      await workRepository.query(`
        insert into work ("userUuid", "baseDate") values ('${testIds.admin}', '${d.getFullYear()}-${month}-${day}');
        insert into work ("userUuid", "baseDate") values ('${testIds.manager}', '${d.getFullYear()}-${month}-${day}');
        insert into work ("userUuid", "baseDate") values ('${testIds.user}', '${d.getFullYear()}-${month}-${day}');
      `);

      const response = await request(app.getHttpServer())
        .get(`/work/today`)
        .set('Cookie', testAccessToken.admin);

      await workRepository.query(`delete from "work" where "userUuid" in ('${testIds.admin}', '${testIds.manager}', '${testIds.user}')`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThanOrEqual(3);
    });
  })

  describe('/work (POST)', () => {
    it('출근하기', async () => {
      const response = await request(app.getHttpServer())
        .post('/work')
        .set('Cookie', testAccessToken.admin);

      expect(response.status).toBe(201);
      expect(response.body.isSuccess).toBeTruthy();
    });

    it('출근하기 - 퇴근 처리 안된 출근 기록 동시 처리 확인', async () => {
      await workRepository.query(`
        insert into work ("userUuid", "baseDate") values ('${testIds.manager}', '2024-03-30')
      `);

      const response = await request(app.getHttpServer())
        .post('/work')
        .set('Cookie', testAccessToken.manager);

      expect(response.status).toBe(201);
      expect(response.body.isSuccess).toBeTruthy();
      expect(response.body.updatedWorks.length).toBeGreaterThanOrEqual(1);

      await workRepository.query(`delete from work where "userUuid" = '${testIds.manager}'`);
    })

    it('[에러케이스] 중복출근', async () => {
      const response = await request(app.getHttpServer())
        .post('/work')
        .set('Cookie', testAccessToken.admin);

      expect(response.status).toBe(406);
      expect(response.body.message).toBe(ExceptionMessages.ALREADY_PRECESSED);
    });
  });

  describe('/work (PATCH)', () => {
    it('퇴근 전 업무 기록하기', async () => {
      const workDetail = "이런 업무 했습니당.";
      const response = await request(app.getHttpServer())
        .patch('/work')
        .set('Cookie', testAccessToken.admin)
        .send({ workDetail })

      expect(response.status).toBe(200);
      expect(response.body.offTime).toBeNull();
      expect(response.body.workDetail).toBe(workDetail);
    });

    it('퇴근하기', async () => {
      const workDetail = "퇴근했습니당";
      const response = await request(app.getHttpServer())
        .patch('/work?off=true')
        .set('Cookie', testAccessToken.admin)
        .send({ workDetail })

      expect(response.status).toBe(200);
      expect(response.body.offTime !== null).toBeTruthy();
      expect(response.body.workDetail).toBe(workDetail);
    });

    it('[에러케이스] 중복 퇴근하기', async () => {
      const response = await request(app.getHttpServer())
        .patch('/work?off=true')
        .set('Cookie', testAccessToken.admin)
        .send({ workDetail: "" })

      expect(response.status).toBe(406);
      expect(response.body.message).toBe(ExceptionMessages.ALREADY_WORK);
    });

    it('[에러케이스] 출근하기 전 퇴근', async () => {
      const response = await request(app.getHttpServer())
        .patch('/work?off=true')
        .set('Cookie', testAccessToken.manager)

      expect(response.status).toBe(406);
      expect(response.body.message).toBe(ExceptionMessages.NOT_EXIST_WORK);
    })
  });

  describe('/work (DELETE)', () => {
    it('출근 기록 삭제하기 - ADMIN', async () => {
      const d = new Date();
      const month = d.getMonth() < 9 ? `0${d.getMonth() + 1}` : d.getMonth() + 1;
      const day = d.getDate() < 10 ? `0${d.getDate()}` : d.getDate();
      const YYYYMMDD = `${d.getFullYear()}-${month}-${day}`;

      const response = await request(app.getHttpServer())
        .delete(`/work?id=${testIds.admin}&baseDates=${YYYYMMDD}`)
        .set('Cookie', testAccessToken.admin)

      expect(response.status).toBe(200);
      expect(response.body.affected).toBe(1);
    })

    it('출근 기록 삭제하기 - MANAGER', async () => {
      await workRepository.query(`
        insert into work ("userUuid", "baseDate") values ('${testIds.manager}', '2024-03-30');
        insert into work ("userUuid", "baseDate") values ('${testIds.manager}', '2024-03-31');
      `);

      const response = await request(app.getHttpServer())
        .delete(`/work?id=${testIds.manager}&baseDates=2024-03-30&baseDates=2024-03-31`)
        .set('Cookie', testAccessToken.manager)

      expect(response.status).toBe(200);
      expect(response.body.affected).toBe(2);
    })

    it('[에러케이스] MANAGER 토큰으로 ADMIN 출근 기록 지우기', async () => {
      await workRepository.query(`
        insert into work ("userUuid", "baseDate") values ('${testIds.admin}', '2024-03-31');
      `);

      const response = await request(app.getHttpServer())
        .delete(`/work?id=${testIds.admin}&baseDates=2024-03-31`)
        .set('Cookie', testAccessToken.manager)

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);

      await workRepository.query(`
        delete from work where "userUuid" = '${testIds.admin}';
      `);
    })

  })

  afterAll((done) => {
    workRepository
      .query(`delete from users where "userId" in ('testAdmin','testManager','testUser'); `)
      .then(() => {
        app.close()
      })
      .finally(() => {
        done();
      });
  })
});