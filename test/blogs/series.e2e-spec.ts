import { Test } from "@nestjs/testing";
import { AppModule } from "src/app.module";
import AuthsEnum from "src/auths/const/auths.enums";
import { ExceptionMessages } from "src/common/message/exception.message";
import BlogE2ETestUtil from '../blog-e2e-util.class';
import { SeriesEntity } from "src/blogs/series/entities/series.entity";
import { CreateSeriesDto } from "src/blogs/series/dto/create-series.dto";

describe('SeriesController (e2e)', () => {
  let test: BlogE2ETestUtil<SeriesEntity>;
  let date: Date;

  beforeAll((done) => {
    Test.createTestingModule({
      imports: [AppModule],
    })
      .compile()
      .then(async (moduleFixture) => {

        const app = moduleFixture.createNestApplication();
        await app.init();

        test = new BlogE2ETestUtil(app, moduleFixture.get("SERIES_REPOSITORY"));
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

  describe('/series/:id (GET)', () => {
    it('시리즈 조회', async () => {
      await test.repository.query(test.topicInsertQuery());
      const [topic] = await test.repository.query(test.topicSelectQuery());
      await test.repository.query(test.seriesInsertQuery(topic.id));
      const [{ id, name }] = await test.repository.query(test.seriesSelectQuery());
      await test.repository.query(test.postWithSeriesInsertQuery(topic.id, id));

      const response = await test.req(
        "get",
        `/series/${id}`,
        undefined,
        undefined
      );


      expect(response.status).toBe(200);
      expect(response.body.name).toBe(name);
      expect(response.body.postsCnt).toBe(1);
    });

    it('[에러케이스] 존재하지 않는 시리즈 조회', async () => {
      const response = await test.req(
        "get",
        `/series/0`,
        undefined,
        undefined
      );

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(ExceptionMessages.NOT_EXIST_ID);
    });
  });

  describe('/series (GET)', () => {
    it('시리즈 리스트 조회', async () => {
      await test.repository.query(test.topicInsertQuery());
      const [topic] = await test.repository.query(test.topicSelectQuery());
      await test.repository.query(test.seriesInsertQuery(topic.id));
      await test.repository.query(test.seriesInsertQuery(topic.id, "TESTSeries2"));

      const response = await test.req("get", "/series?page=1", undefined, await test.getToken())

      expect(response.status).toBe(200);
      expect(response.body.info.total).toBeGreaterThanOrEqual(2);
      expect(response.body.info.take).toBe(10);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    })
  });

  describe('/series (POST)', () => {

    it('시리즈 생성', async () => {
      await test.repository.query(test.topicInsertQuery());
      const [topic] = await test.repository.query(test.topicSelectQuery());

      const seriesDto: CreateSeriesDto = {
        name: test.seriseName,
        topicId: topic.id
      }

      const response = await test.req("post", "/series", seriesDto, await test.getToken())

      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
    });

    it('[에러케이스] 중복 생성', async () => {
      await test.repository.query(test.topicInsertQuery());
      const [topic] = await test.repository.query(test.topicSelectQuery());
      await test.repository.query(test.seriesInsertQuery(topic.id));

      const seriesDto: CreateSeriesDto = {
        name: test.seriseName,
        topicId: topic.id
      }

      const response = await test.req("post", "/series", seriesDto, await test.getToken())

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(ExceptionMessages.EXIST_NAME);
    });

    it('[에러케이스] 권한 없이 시리즈생성', async () => {
      await test.deleteAuths();
      await test.insertAuths(undefined, [AuthsEnum.CAN_USE_OFFICE]);

      const response = await test.req("post", "/series", {}, await test.getToken())

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    });
  });

  describe('/series/:id (DELETE)', () => {
    it('시리즈 삭제', async () => {
      await test.repository.query(test.topicInsertQuery());
      const [topic] = await test.repository.query(test.topicSelectQuery());
      await test.repository.query(test.seriesInsertQuery(topic.id));
      const [{ id }] = await test.repository.query(test.seriesSelectQuery());

      const response = await test.req("delete", `/series/${id}`, undefined, await test.getToken())

      expect(response.status).toBe(200);
      expect(response.body.affected).toBe(1);
    });

    it('[에러케이스] 존재하지 않는 시리즈 삭제', async () => {
      const response = await test.req("delete", "/series/0", undefined, await test.getToken())

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(ExceptionMessages.NOT_EXIST_ID);
    });

    it('[에러케이스] 권한 없이 알람 시리즈 삭제', async () => {
      await test.deleteAuths();
      await test.insertAuths(undefined, [AuthsEnum.CAN_USE_OFFICE]);

      const response = await test.req("delete", "/series/1", undefined, await test.getToken())

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    });
  });


  afterAll(() => test.close());
});