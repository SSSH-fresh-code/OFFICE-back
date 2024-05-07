import { Test } from "@nestjs/testing";
import { AppModule } from "src/app.module";
import AuthsEnum from "src/auths/const/auths.enums";
import { TopicsEntity } from "src/blogs/topics/entities/topics.entity";
import { ExceptionMessages } from "src/common/message/exception.message";
import { CreateTopicsDto } from 'src/blogs/topics/dto/create-topics.dto';
import BlogE2ETestUtil from "../blog-e2e-util.class";

describe('TopicsController (e2e)', () => {
  let test: BlogE2ETestUtil<TopicsEntity>;
  let date: Date;

  beforeAll((done) => {
    Test.createTestingModule({
      imports: [AppModule],
    })
      .compile()
      .then(async (moduleFixture) => {

        const app = moduleFixture.createNestApplication();
        await app.init();

        test = new BlogE2ETestUtil(app, moduleFixture.get("TOPICS_REPOSITORY"));
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
    await test.deleteBlogDatas();
    console.log("time(s) : ", (new Date().getTime() - date.getTime()) / 1000);
  });

  describe('/topics/:name (GET)', () => {
    it('토픽 조회', async () => {
      await test.repository.query(test.topicInsertQuery());
      const [{ id }] = await test.repository.query(test.topicSelectQuery());
      await test.repository.query(test.seriesInsertQuery(id));
      await test.repository.query(test.postInsertQuery(id));

      const response = await test.req(
        "get",
        `/topics/${test.topicName}`,
        undefined,
        undefined
      );

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(test.topicName);
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
      await test.repository.query(test.topicInsertQuery());
      await test.repository.query(test.topicInsertQuery("TESTTopic2"));
      const [testTopic] = await test.repository.query(test.topicSelectQuery());
      const [testTopic2] = await test.repository.query(test.topicSelectQuery("TESTTopic2"));
      await test.repository.query(test.seriesInsertQuery(testTopic.id));
      await test.repository.query(test.postInsertQuery(testTopic.id));
      await test.repository.query(test.seriesInsertQuery(testTopic2.id, "TESTSeries2"));
      await test.repository.query(test.postInsertQuery(testTopic2.id, "TESTPost2"));

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
        name: test.topicName
      }
      const response = await test.req("post", "/topics", topicDto, await test.getToken())

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(test.topicName);
    });

    it('[에러케이스] 중복 생성', async () => {
      await test.repository.query(test.topicInsertQuery());
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
      await test.repository.query(test.topicInsertQuery());
      const [{ id }] = await test.repository.query(test.topicSelectQuery());

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