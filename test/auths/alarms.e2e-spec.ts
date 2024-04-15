import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "src/app.module";
import { AlarmsEntity } from "src/auths/entities/alarms.entity";
import { ExceptionMessages } from "src/common/message/exception.message";
import * as request from 'supertest';

import { Repository } from "typeorm";
import { TAlarms } from "types-sssh";

describe('AlarmsController (e2e)', () => {
  let app: INestApplication;
  let alarmsRepository: Repository<AlarmsEntity>;

  type TestRoles = { admin: string, manager: string, user: string, user2: string };

  let testIds: TestRoles = { admin: "", manager: "", user: "", user2: "" };
  let testAccessToken: TestRoles = { admin: "", manager: "", user: "", user2: "" };
  let testRefreshToken: TestRoles = { admin: "", manager: "", user: "", user2: "" };

  beforeAll((done) => {
    Test.createTestingModule({
      imports: [AppModule],
    })
      .compile()
      .then(async (moduleFixture) => {
        app = moduleFixture.createNestApplication();
        await app.init();

        alarmsRepository = moduleFixture.get("ALARMS_REPOSITORY");
        await alarmsRepository.query(`
          INSERT INTO users ("userId", "userPw", "userName", "isCertified") values ('testAdmin', '$2b$10$hDUNIEnceL9b7FvKwodya.IAU29zXbVJKykfr/H3nmQ3P.ROt4lyG', 'testAdmin', true);
          insert into users ("userId", "userPw", "userName", "isCertified") values ('testManager', '$2b$10$hDUNIEnceL9b7FvKwodya.IAU29zXbVJKykfr/H3nmQ3P.ROt4lyG', 'testManager',  true);
          insert into users ("userId", "userPw", "userName", "isCertified") values ('testUser', '$2b$10$hDUNIEnceL9b7FvKwodya.IAU29zXbVJKykfr/H3nmQ3P.ROt4lyG', 'testUser',  true);
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

  describe('/alarms?readOnly=true (GET)', () => {
    it('알람 전체 조회', async () => {
      await alarmsRepository.query(`
        INSERT INTO alarms ("name", "icon", "title", "contents", "path", "order") values ('test1', 'test1', 'test1', 'test1', 'path', 999);
        INSERT INTO alarms ("name", "icon", "title", "contents", "path", "order") values ('test2', 'test2', 'test2', 'test2', 'path', 999);
        INSERT INTO alarms ("name", "icon", "title", "contents", "path", "order") values ('test3', 'test3', 'test3', 'test3', 'path', 999);
      `);

      const response = await request(app.getHttpServer())
        .get(`/auths/alarms?readOnly=true`)
        .set('Cookie', testAccessToken.admin);

      await alarmsRepository.query(`delete from alarms where "order" = 999`);

      expect(response.status).toBe(200);
      expect(response.body.info.total).toBeGreaterThanOrEqual(3);
    });

    it('[에러케이스] 권한 테스트 - 현재 운영자만 접근 가능', async () => {
      const response = await request(app.getHttpServer())
        .get(`/auths/alarms?readOnly=true`)
        .set('Cookie', testAccessToken.manager);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    });
  });

  describe('/alarms (POST)', () => {
    it('알람 생성', async () => {
      const alarms: TAlarms = {
        order: 999,
        name: "test1",
        title: "test1",
        contents: "test1",
        icon: "Hello"
      };
      const response = await request(app.getHttpServer())
        .post(`/auths/alarms`)
        .set('Cookie', testAccessToken.admin)
        .send(alarms);

      await alarmsRepository.query(`delete from alarms where "order" = 999`);

      expect(response.status).toBe(201);
      expect(response.body.order).toBe(999);
    })

    it('[에러케이스] 권한 테스트 - 현재 운영자만 접근 가능', async () => {
      const alarms: TAlarms = {
        order: 999,
        name: "test1",
        title: "test1",
        contents: "test1",
        icon: "Hello"
      };
      const response = await request(app.getHttpServer())
        .post(`/auths/alarms`)
        .set('Cookie', testAccessToken.manager)
        .send(alarms);

      await alarmsRepository.query(`delete from alarms where "order" = 999`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);

    });
  });

  describe('/alarms/:id (GET)', () => {
    it('알람 단일 조회', async () => {
      const alarms: TAlarms = {
        order: 999,
        name: "test1",
        title: "test1",
        contents: "test1",
        icon: "Hello"
      };
      const response = await request(app.getHttpServer())
        .post(`/auths/alarms`)
        .set('Cookie', testAccessToken.admin)
        .send(alarms);

      expect(response.status).toBe(201)

      const response2 = await request(app.getHttpServer())
        .get(`/auths/alarms/${response.body.id}`)
        .set('Cookie', testAccessToken.admin);

      await alarmsRepository.query(`delete from alarms where "order" = 999`);

      expect(response2.status).toBe(200);
      expect(response2.body.id).toBe(response.body.id);
    });

    it('[에러케이스] 권한 테스트 - 현재 운영자만 접근 가능', async () => {
      const response = await request(app.getHttpServer())
        .get(`/auths/alarms/2`)
        .set('Cookie', testAccessToken.manager);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    });
  });

  describe('/alarms (PATCH)', () => {
    it('알람 수정', async () => {
      const alarms: TAlarms = {
        order: 999,
        name: "test1",
        title: "test1",
        contents: "test1",
        icon: "Hello"
      };
      const response = await request(app.getHttpServer())
        .post(`/auths/alarms`)
        .set('Cookie', testAccessToken.admin)
        .send(alarms);

      expect(response.status).toBe(201)

      const response2 = await request(app.getHttpServer())
        .patch(`/auths/alarms`)
        .set('Cookie', testAccessToken.admin)
        .send({ ...alarms, contents: "modify", id: response.body.id });

      await alarmsRepository.query(`delete from alarms where "order" = 999`);
      expect(response2.status).toBe(200);
      expect(response2.body.contents).toBe("modify");
    })

    it('[에러케이스] 권한 테스트 - 현재 운영자만 접근 가능', async () => {
      const alarms: TAlarms = {
        order: 999,
        name: "test1",
        title: "test1",
        contents: "test1",
        icon: "Hello"
      };
      const response = await request(app.getHttpServer())
        .patch(`/auths/alarms`)
        .set('Cookie', testAccessToken.manager)
        .send(alarms);

      await alarmsRepository.query(`delete from alarms where "order" = 999`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    });
  });

  describe('/alarms/:id (DELETE)', () => {
    it('알람 단일 조회', async () => {
      const alarms: TAlarms = {
        order: 999,
        name: "test1",
        title: "test1",
        contents: "test1",
        icon: "Hello"
      };
      const response = await request(app.getHttpServer())
        .post(`/auths/alarms`)
        .set('Cookie', testAccessToken.admin)
        .send(alarms);

      expect(response.status).toBe(201)

      const response2 = await request(app.getHttpServer())
        .delete(`/auths/alarms/${response.body.id}`)
        .set('Cookie', testAccessToken.admin);

      expect(response2.status).toBe(200);
      expect(response2.body.affected).toBe(1);
    });

    it('[에러케이스] 권한 테스트 - 현재 운영자만 접근 가능', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/auths/alarms/2`)
        .set('Cookie', testAccessToken.manager);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    });
  });

  afterAll((done) => {
    alarmsRepository
      .query(`delete from users where "userId" in ('testAdmin','testManager','testUser'); `)
      .then(() => {
        app.close()
      })
      .finally(() => {
        done();
      });
  })
});