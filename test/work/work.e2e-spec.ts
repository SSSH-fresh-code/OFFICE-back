import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "src/app.module";
import { UserEntity } from "src/users/entities/user.entity";
import { Repository } from "typeorm";
import * as request from 'supertest';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let workRepository: Repository<UserEntity>;

  type TestRoles = { admin: string, manager: string, user: string };

  let testIds: TestRoles = { admin: "", manager: "", user: "" };
  let testAccessToken: TestRoles = { admin: "", manager: "", user: "" };
  let testRefreshToken: TestRoles = { admin: "", manager: "", user: "" };
  let testUserId = "";

  beforeAll((done) => {
    Test.createTestingModule({
      imports: [AppModule],
    })
      .compile()
      .then(async (moduleFixture) => {
        app = moduleFixture.createNestApplication();
        await app.init();

        workRepository = moduleFixture.get("USER_REPOSITORY");
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

        testAccessToken.admin = managerRes.header["set-cookie"][0];
        testRefreshToken.admin = managerRes.body.refreshToken;


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

  describe('/work (POST)', () => {
    it('출근하기', async () => {
      const response = await request(app.getHttpServer())
        .post('/work')
        .set('Cookie', testAccessToken.admin)

      console.log(response.status)
      console.log(response.body)
    })
  })

  afterAll((done) => {
    workRepository
      .query(`delete from users where "userId" in ('testAdmin','testManager','testUser')`)
      .then(() => {
        app.close()
      })
      .finally(() => {
        done();
      });
  })
});