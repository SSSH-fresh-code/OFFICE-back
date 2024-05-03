import { Test } from "@nestjs/testing";
import { AppModule } from "src/app.module";
import { ExceptionMessages } from "src/common/message/exception.message";
import E2ETestUtil from "../e2e-util.class";
import AuthsEnum from "src/auths/const/auths.enums";
import { MenusEntity } from "src/menus/entities/menus.entity";
import { CreateMenusDto } from "src/menus/dto/create-menus.dto";
import { UpdateMenusDto } from "src/menus/dto/update-menus.dto";

describe('MenusController (e2e)', () => {
  let test: E2ETestUtil<MenusEntity>;
  let date: Date;

  beforeAll((done) => {
    Test.createTestingModule({
      imports: [AppModule],
    })
      .compile()
      .then(async (moduleFixture) => {

        const app = moduleFixture.createNestApplication();
        await app.init();

        test = new E2ETestUtil(app, moduleFixture.get("MENUS_REPOSITORY"));
        await test.setBaseUser();

      })
      .finally(() => { done() });
  });

  beforeEach(async () => {
    date = new Date();
    for (const u of test.users) {
      await test.insertAuths(u.id, [AuthsEnum.CAN_USE_OFFICE, AuthsEnum.CAN_USE_MENU])
    }
  })

  afterEach(async () => {
    await test.deleteAuths();
    await test.repository.query(`delete from menus where "order" >= 999`);
    await test.repository.query(`delete from auths where code like 'TEST%';`);
    console.log("time(s) : ", (new Date().getTime() - date.getTime()) / 1000);
  });

  describe('/menus/auths (GET)', () => {
    it('권한에 따른 메뉴 조회 1', async () => {
      await test.repository.query(`INSERT INTO menus ("name", "icon", "order") values ('test1', 0, 999);`);
      const [{ id }] = await test.repository.query(`SELECT * FROM menus WHERE "name" = 'test1'`);
      await test.repository.query(`
        INSERT INTO menus ("name", "link", "parentMenusId", "order") values ('test1-2', '/test', ${id}, 1001);
        INSERT INTO menus ("name", "link", "parentMenusId", "order") values ('test1-1', '/test', ${id}, 1000);
        INSERT INTO menus ("name", "link", "parentMenusId", "order") values ('test1-3', '/test', ${id}, 1002);
      `);
      const menus = await test.repository.query(`SELECT * FROM menus WHERE "order" > 999`);
      const length = menus.length;

      const testCode = "TEST0001";
      await test.repository.query(`insert into auths ("code", "description") values ('${testCode}', 'TEST_AUTH');`)
      await test.repository.query(`insert into users_auths_auths ("authsCode", "usersId") values ('${testCode}', '${test.users[0].id}');`)

      for (let i = 0; i < length; i++) {
        const menu = menus[i];
        await test.repository.query(`insert into menus_auths_auths ("authsCode", "menusId") values ('${testCode}', '${menu.id}');`)
      }

      const response = await test.req("get", `/menus/auths`, undefined, await test.getToken());

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0].childMenus.length).toBe(3);
      expect(response.body[0].childMenus[0].name).toBe('test1-1');
      expect(response.body[0].childMenus[1].name).toBe('test1-2');
      expect(response.body[0].childMenus[2].name).toBe('test1-3');
    });

    it('권한에 따른 메뉴 조회 2', async () => {
      await test.repository.query(`INSERT INTO menus ("name", "icon", "order") values ('test1', 0, 1000);`);
      await test.repository.query(`INSERT INTO menus ("name", "icon", "order") values ('test2', 0, 999);`);
      const test1 = await test.repository.query(`SELECT * FROM menus WHERE "name" = 'test1'`);
      const test2 = await test.repository.query(`SELECT * FROM menus WHERE "name" = 'test2'`);
      await test.repository.query(`
        INSERT INTO menus ("name", "link", "parentMenusId", "order") values ('test1-2', '/test', ${test1[0].id}, 1002);
        INSERT INTO menus ("name", "link", "parentMenusId", "order") values ('test1-1', '/test', ${test1[0].id}, 1001);
        INSERT INTO menus ("name", "link", "parentMenusId", "order") values ('test1-3', '/test', ${test1[0].id}, 1003);

        INSERT INTO menus ("name", "link", "parentMenusId", "order") values ('test2-2', '/test', ${test2[0].id}, 1002);
        INSERT INTO menus ("name", "link", "parentMenusId", "order") values ('test2-1', '/test', ${test2[0].id}, 1001);
      `);
      const menus = await test.repository.query(`SELECT * FROM menus WHERE "order" > 1000`);
      const length = menus.length;

      const testCode = "TEST0001";
      await test.repository.query(`insert into auths ("code", "description") values ('${testCode}', 'TEST_AUTH');`)
      await test.repository.query(`insert into users_auths_auths ("authsCode", "usersId") values ('${testCode}', '${test.users[0].id}');`)

      for (let i = 0; i < length; i++) {
        const menu = menus[i];
        await test.repository.query(`insert into menus_auths_auths ("authsCode", "menusId") values ('${testCode}', '${menu.id}');`)
      }

      const response = await test.req("get", `/menus/auths`, undefined, await test.getToken());


      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[1].childMenus.length).toBe(3);
      expect(response.body[1].childMenus[0].name).toBe('test1-1');
      expect(response.body[1].childMenus[1].name).toBe('test1-2');
      expect(response.body[1].childMenus[2].name).toBe('test1-3');
      expect(response.body[0].childMenus.length).toBe(2);
      expect(response.body[0].childMenus[0].name).toBe('test2-1');
      expect(response.body[0].childMenus[1].name).toBe('test2-2');
    });
  });

  describe('/menus/all (GET)', () => {
    it('부모 메뉴 전체 조회', async () => {
      await test.repository.query(`INSERT INTO menus ("name", "icon", "order") values ('test1', 0, 1000);`);
      await test.repository.query(`INSERT INTO menus ("name", "icon", "order") values ('test2', 0, 999);`);

      const response = await test.req("get", "/menus/all", undefined, await test.getToken())

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    })

    it('[에러케이스] 권한 없이 부모 메뉴 전체 조회', async () => {
      await test.deleteAuths();
      await test.insertAuths(undefined, [AuthsEnum.CAN_USE_OFFICE]);
      const response = await test.req("get", "/menus/all", {}, await test.getToken())

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    })
  });

  describe('/menus/:id (GET)', () => {
    it('메뉴 단일 조회', async () => {
      await test.repository.query(`INSERT INTO menus ("name", "icon", "order") values ('test1', 'test1', 999);`);
      const [{ id }] = await test.repository.query(`SELECT * FROM menus WHERE "name" = 'test1'`);

      const response = await test.req("get", `/menus/${id}`, undefined, await test.getToken())

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('test1');
    });

    it('[에러케이스] 권한 없이 알람 단일 조회', async () => {
      await test.deleteAuths();
      await test.insertAuths(undefined, [AuthsEnum.CAN_USE_OFFICE]);

      const response = await test.req("get", `/menus/2`, undefined, await test.getToken())

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    });
  });

  describe('/menus (POST)', () => {
    it('부모 메뉴 생성', async () => {
      const dto: CreateMenusDto = {
        order: 999,
        name: "test1",
        icon: 0
      }

      const response = await test.req("post", "/menus", dto, await test.getToken());

      expect(response.status).toBe(201)
      expect(response.body.order).toBe(dto.order)
      expect(response.body.name).toBe(dto.name)
      expect(response.body.icon).toBe(dto.icon)
    })

    it('자식 메뉴 생성', async () => {
      await test.repository.query(`INSERT INTO menus ("name", "icon", "order") values ('test1', 0, 999);`);
      const [{ id }] = await test.repository.query(`SELECT * FROM menus WHERE "name" = 'test1'`);

      const dto: CreateMenusDto = {
        order: 1000,
        name: "test1-1",
        link: "test",
        parentId: id
      }

      const response = await test.req("post", "/menus", dto, await test.getToken());

      expect(response.status).toBe(201)
      expect(response.body.order).toBe(dto.order)
      expect(response.body.name).toBe(dto.name)
      expect(response.body.link).toBe(dto.link)
    })
    it('[에러케이스] 권한 없이 메뉴 생성', async () => {
      await test.deleteAuths();
      await test.insertAuths(undefined, [AuthsEnum.CAN_USE_OFFICE]);
      const response = await test.req("post", "/menus", {}, await test.getToken());

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    })
  });

  describe('/menus (PATCH)', () => {

    it('부모 메뉴 수정', async () => {
      await test.repository.query(`INSERT INTO menus ("name", "icon", "order") values ('test1', 0, 999);`);
      const [{ id }] = await test.repository.query(`SELECT * FROM menus WHERE "name" = 'test1'`);

      const dto: UpdateMenusDto = {
        id,
        name: "test2",
        icon: 0
      }

      const response = await test.req("patch", "/menus", dto, await test.getToken());

      expect(response.status).toBe(200)
      expect(response.body.id).toBe(id)
      expect(response.body.name).toBe(dto.name)
      expect(response.body.icon).toBe(dto.icon)
    })

    it('자식 메뉴 수정', async () => {
      await test.repository.query(`INSERT INTO menus ("name", "icon", "order") values ('test1', 0, 999);`);
      const [{ id }] = await test.repository.query(`SELECT * FROM menus WHERE "name" = 'test1'`);
      await test.repository.query(`
        INSERT INTO menus ("name", "link", "parentMenusId", "order") values ('test1-2', '/test', ${id}, 1001);
        INSERT INTO menus ("name", "link", "parentMenusId", "order") values ('test1-1', '/test', ${id}, 1000);
        INSERT INTO menus ("name", "link", "parentMenusId", "order") values ('test1-3', '/test', ${id}, 1002);
      `);

      const childMenus = await test.repository.query(`SELECT * FROM menus WHERE "name" = 'test1-2'`);

      const dto: UpdateMenusDto = {
        id: id,
        childMenus: [
          {
            id: childMenus[0].id,
            name: "test2-2"
          }
        ]
      }

      const response = await test.req("patch", "/menus", dto, await test.getToken());

      expect(response.status).toBe(200)

      const response2 = await test.req("get", `/menus/${id}`, undefined, await test.getToken())

      expect(response2.status).toBe(200)
      expect(response2.body.childMenus[1].name).toBe(dto.childMenus[0].name)
    });

    it('부모 자식 메뉴 동시 수정', async () => {
      await test.repository.query(`INSERT INTO menus ("name", "icon", "order") values ('test1', 0, 999);`);
      const [{ id }] = await test.repository.query(`SELECT * FROM menus WHERE "name" = 'test1'`);
      await test.repository.query(`
        INSERT INTO menus ("name", "link", "parentMenusId", "order") values ('test1-2', '/test', ${id}, 1001);
        INSERT INTO menus ("name", "link", "parentMenusId", "order") values ('test1-1', '/test', ${id}, 1000);
        INSERT INTO menus ("name", "link", "parentMenusId", "order") values ('test1-3', '/test', ${id}, 1002);
      `);

      const childMenus = await test.repository.query(`SELECT * FROM menus WHERE "name" = 'test1-2'`);

      const dto: UpdateMenusDto = {
        id: id,
        name: "test2",
        order: 1004,
        childMenus: [
          {
            id: childMenus[0].id,
            name: "test2-2"
          }
        ]
      }

      const response = await test.req("patch", "/menus", dto, await test.getToken());

      expect(response.status).toBe(200)

      const response2 = await test.req("get", `/menus/${id}`, undefined, await test.getToken())

      expect(response2.status).toBe(200)
      expect(response2.body.name).toBe(dto.name)
      expect(response2.body.order).toBe(dto.order)
      expect(response2.body.childMenus[1].name).toBe(dto.childMenus[0].name)
    });

    it('[에러케이스] 권한 없이 메뉴 수정', async () => {
      await test.deleteAuths();
      await test.insertAuths(undefined, [AuthsEnum.CAN_USE_OFFICE]);

      const response = await test.req("patch", "/menus", {}, await test.getToken());

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    })
  });

  describe('/alarms/:id (DELETE)', () => {
    it('부모 자식 메뉴 전체 삭제', async () => {
      await test.repository.query(`INSERT INTO menus ("name", "icon", "order") values ('test1', 'test1', 999);`);
      const [{ id }] = await test.repository.query(`SELECT * FROM menus WHERE "name" = 'test1'`);
      await test.repository.query(`
        INSERT INTO menus ("name", "link", "parentMenusId", "order") values ('test1-2', '/test', ${id}, 1001);
        INSERT INTO menus ("name", "link", "parentMenusId", "order") values ('test1-1', '/test', ${id}, 1000);
        INSERT INTO menus ("name", "link", "parentMenusId", "order") values ('test1-3', '/test', ${id}, 1002);
      `);

      const response = await test.req("delete", `/menus/${id}?all=true`, undefined, await test.getToken());

      expect(response.status).toBe(200);
      expect(response.body.affected).toBe(4);
    });
    it('부모 메뉴 단일 삭제', async () => {
      await test.repository.query(`INSERT INTO menus ("name", "icon", "order") values ('test1', 0, 999);`);
      const [{ id }] = await test.repository.query(`SELECT * FROM menus WHERE "name" = 'test1'`);

      const response = await test.req("delete", `/menus/${id}`, undefined, await test.getToken());

      expect(response.status).toBe(200);
      expect(response.body.affected).toBe(1);
    });
    it('자식 메뉴 단일 삭제', async () => {
      await test.repository.query(`INSERT INTO menus ("name", "icon", "order") values ('test1', 0, 999);`);
      const [{ id }] = await test.repository.query(`SELECT * FROM menus WHERE "name" = 'test1'`);
      await test.repository.query(`
        INSERT INTO menus ("name", "link", "parentMenusId", "order") values ('test1-2', '/test', ${id}, 1001);
        INSERT INTO menus ("name", "link", "parentMenusId", "order") values ('test1-1', '/test', ${id}, 1000);
        INSERT INTO menus ("name", "link", "parentMenusId", "order") values ('test1-3', '/test', ${id}, 1002);
      `);
      const childMenus = await test.repository.query(`SELECT * FROM menus WHERE "name" = 'test1-2'`);

      const response = await test.req("delete", `/menus/${childMenus[0].id}`, undefined, await test.getToken());

      expect(response.status).toBe(200);
      expect(response.body.affected).toBe(1);
    });

    it('[에러케이스] 자식메뉴가 있지만 부모만 삭제하려는 경우', async () => {
      await test.repository.query(`INSERT INTO menus ("name", "icon", "order") values ('test1', 0, 999);`);
      const [{ id }] = await test.repository.query(`SELECT * FROM menus WHERE "name" = 'test1'`);
      await test.repository.query(`
        INSERT INTO menus ("name", "link", "parentMenusId", "order") values ('test1-2', '/test', ${id}, 1001);
        INSERT INTO menus ("name", "link", "parentMenusId", "order") values ('test1-1', '/test', ${id}, 1000);
        INSERT INTO menus ("name", "link", "parentMenusId", "order") values ('test1-3', '/test', ${id}, 1002);
      `);

      const response2 = await test.req("delete", `/menus/${id}`, undefined, await test.getToken());

      expect(response2.status).toBe(400);
      expect(response2.body.message).toBe(ExceptionMessages.HAS_CHILD_MENUS);
    });

    it('[에러케이스] 없는 id로 메뉴 삭제', async () => {
      const response2 = await test.req("delete", `/menus/1999`, undefined, await test.getToken());

      expect(response2.status).toBe(400);
      expect(response2.body.message).toBe(ExceptionMessages.NOT_EXIST_ID);
    });

    it('[에러케이스] 권한 없이 메뉴 단일 삭제', async () => {
      await test.deleteAuths();
      await test.insertAuths(undefined, [AuthsEnum.CAN_USE_OFFICE]);

      const response2 = await test.req("delete", `/menus/1999`, undefined, await test.getToken());

      expect(response2.status).toBe(403);
      expect(response2.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    });
  });

  afterAll(() => test.close());
});