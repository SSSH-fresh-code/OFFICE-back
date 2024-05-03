import { Length } from 'class-validator';
import { Test } from "@nestjs/testing";
import { AppModule } from "src/app.module";
import E2ETestUtil from "../e2e-util.class";
import AuthsEnum from "src/auths/const/auths.enums";
import { TopicsEntity } from "src/blogs/topics/entities/topics.entity";
import { ExceptionMessages } from "src/common/message/exception.message";
import { CreateTopicsDto } from 'src/blogs/topics/dto/create-topics.dto';

describe('TopicsController (e2e)', () => {
  let test: E2ETestUtil<TopicsEntity>;
  let date: Date;
  const topicName = 'TESTTopic';
  const seriseName = 'TESTSeries';
  const postName = 'TESTPost';

  const insertQuery = (name: string = topicName) => `INSERT INTO topics ("name") values ('${name}');`;
  const selectQuery = (name: string = topicName) => `SELECT * FROM topics WHERE "name" = '${name}'`
  const insertQuery2 = (name: string = seriseName, id: string | number) => `INSERT INTO series ("name", "topicId") values ('${name}', '${id}');`;
  const selectQuery2 = (name: string = seriseName) => `SELECT * FROM series WHERE "name" = '${name}'`
  const insertQuery3 = (name: string = postName, id: string | number) => `INSERT INTO posts ("title", "contents", "topicId", "authorId") values ('${name}', 'TESTCONTENTS', '${id}', '${test.users[0].id}');`;
  const selectQuery3 = (name: string = postName) => `SELECT * FROM series WHERE "name" = '${name}'`

  beforeAll((done) => {
    Test.createTestingModule({
      imports: [AppModule],
    })
      .compile()
      .then(async (moduleFixture) => {

        const app = moduleFixture.createNestApplication();
        await app.init();

        test = new E2ETestUtil(app, moduleFixture.get("TOPICS_REPOSITORY"));
        await test.setBaseUser();

      })
      .finally(() => { done() });
  });

  beforeEach(async () => {
    date = new Date();
    for (const u of test.users) {
      await test.insertAuths(u.id, [AuthsEnum.CAN_USE_OFFICE, AuthsEnum.CAN_USE_BLOG])
    }
  })

  afterEach(async () => {
    await test.deleteAuths();
    await test.repository.query(`delete from posts where "title" like 'TEST%'`);
    await test.repository.query(`delete from series where "name" like 'TEST%'`);
    await test.repository.query(`delete from topics where "name" like 'TEST%'`);
    console.log("time(s) : ", (new Date().getTime() - date.getTime()) / 1000);
  });

  describe('/topics/:name (GET)', () => {
    it('토픽 조회', async () => {
      await test.repository.query(insertQuery());
      const [{ id }] = await test.repository.query(selectQuery());
      await test.repository.query(insertQuery2(undefined, id));
      await test.repository.query(insertQuery3(undefined, id));

      const response = await test.req(
        "get",
        `/topics/${topicName}`,
        undefined,
        undefined
      );

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(topicName);
      expect(response.body.seriesCnt).toBe(1);
      expect(response.body.postsCnt).toBe(1);
    });

    it('[에러케이스] 존재하지 않는 토픽 조회', async () => {
      const response = await test.req(
        "get",
        `/topics/fakeName`,
        undefined,
        undefined
      );

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(ExceptionMessages.NOT_EXIST_NAME);
    });
  });

  describe('/topic (GET)', () => {
    it('토픽 리스트 조회', async () => {
      await test.repository.query(insertQuery());
      await test.repository.query(insertQuery("TESTTopic2"));
      const [testTopic] = await test.repository.query(selectQuery());
      const [testTopic2] = await test.repository.query(selectQuery("TESTTopic2"));
      await test.repository.query(insertQuery2(undefined, testTopic.id));
      await test.repository.query(insertQuery3(undefined, testTopic.id));
      await test.repository.query(insertQuery2("TESTSeries2", testTopic2.id));
      await test.repository.query(insertQuery3("TESTPost2", testTopic2.id));

      const response = await test.req("get", "/topics?page=1", undefined, await test.getToken())

      expect(response.status).toBe(200);
      expect(response.body.info.total).toBeGreaterThanOrEqual(2);
      expect(response.body.info.take).toBe(10);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    })
  });

  describe('/topics (POST)', () => {
    it('토픽 생성', async () => {
      const topicDto: CreateTopicsDto = {
        name: "TESTTopic"
      }
      const response = await test.req("post", "/topics", topicDto, await test.getToken())

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(topicDto.name);
    });

    it('[에러케이스] 중복 생성', async () => {
      await test.repository.query(insertQuery());
      const topicDto: CreateTopicsDto = {
        name: "TESTTopic"
      }

      const response = await test.req("post", "/topics", topicDto, await test.getToken())

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(ExceptionMessages.EXIST_NAME);
    });

    it('[에러케이스] 권한 없이 토픽생성', async () => {
      await test.deleteAuths();
      await test.insertAuths(undefined, [AuthsEnum.CAN_USE_OFFICE]);

      const response = await test.req("post", "/topics", {}, await test.getToken())

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    });
  });

  describe('/topics/:id (DELETE)', () => {
    it('토픽 삭제', async () => {
      await test.repository.query(insertQuery());
      const [{ id }] = await test.repository.query(selectQuery());

      const response = await test.req("delete", `/topics/${id}`, undefined, await test.getToken())

      expect(response.status).toBe(200);
      expect(response.body.affected).toBe(1);
    });

    it('[에러케이스] 존재하지 않는 토픽 삭제', async () => {
      const response = await test.req("delete", "/topics/0", {}, await test.getToken())

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(ExceptionMessages.NOT_EXIST_NAME);
    });

    it('[에러케이스] 권한 없이 알람 토픽 삭제', async () => {
      await test.deleteAuths();
      await test.insertAuths(undefined, [AuthsEnum.CAN_USE_OFFICE]);

      const response = await test.req("delete", "/topics/1", {}, await test.getToken())

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    });
  });


  afterAll(() => test.close());
});