import { Test } from "@nestjs/testing";
import { AppModule } from "src/app.module";
import AuthsEnum from "src/auths/const/auths.enums";
import { ExceptionMessages } from "src/common/message/exception.message";
import BlogE2ETestUtil from '../blog-e2e-util.class';
import { PostsEntity } from "src/blogs/posts/entities/posts.entity";
import { CreatePostsDto } from "src/blogs/posts/dto/create-posts.dto";
import { UpdatePostsDto } from 'src/blogs/posts/dto/update-posts.dto';

describe('PostController (e2e)', () => {
  let test: BlogE2ETestUtil<PostsEntity>;
  let date: Date;

  beforeAll((done) => {
    Test.createTestingModule({
      imports: [AppModule],
    })
      .compile()
      .then(async (moduleFixture) => {
        const app = moduleFixture.createNestApplication();
        await app.init();

        test = new BlogE2ETestUtil(app, moduleFixture.get("POSTS_REPOSITORY"));
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

  describe('/posts/:title (GET)', () => {
    it('게시글 조회', async () => {
      const title = "TEST NESTJS 강의 1 - 기본"
      await test.repository.query(test.topicInsertQuery());
      const [{ id }] = await test.repository.query(test.topicSelectQuery());

      const postDto: CreatePostsDto = {
        title,
        contents: "## 내용",
        topicId: id,
      }

      const createPost = await test.req("post", "/posts", postDto, await test.getToken());

      const response = await test.req(
        "get",
        `/posts/${encodeURI(createPost.body.title)}`,
        undefined,
        undefined
      );

      expect(response.status).toBe(200);
      expect(response.body.title).toBe(title);
      expect(response.body.topic).toBeDefined();
      expect(response.body.author).toBeDefined();
    });

    it('[에러케이스] 존재하지 않는 게시글 조회', async () => {
      const response = await test.req(
        "get",
        `/posts/fake-post`,
        undefined,
        undefined
      );

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(ExceptionMessages.NOT_EXIST_POST);
    });
  });

  describe('/posts (GET)', () => {
    it('게시글 리스트 조회', async () => {
      await test.repository.query(test.topicInsertQuery());
      const [{ id }] = await test.repository.query(test.topicSelectQuery());

      await test.repository.query(test.postInsertQuery(id));
      await test.repository.query(test.postInsertQuery(id, "TESTPOST"));

      const response = await test.req("get", "/posts?page=1", undefined, await test.getToken())

      console.log(response.body.data[0]);

      expect(response.status).toBe(200);
      expect(response.body.info.total).toBeGreaterThanOrEqual(2);
      expect(response.body.info.take).toBe(10);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
    })
  });

  describe('/posts (POST)', () => {
    it('게시글 생성', async () => {
      const title = "TEST NESTJS 강의 1 - 기본"
      await test.repository.query(test.topicInsertQuery());
      const [{ id }] = await test.repository.query(test.topicSelectQuery());

      const postDto: CreatePostsDto = {
        title,
        contents: "## 내용",
        topicId: id,
      }

      const response = await test.req("post", "/posts", postDto, await test.getToken());

      expect(response.status).toBe(201);
      expect(response.body.title).toBe(title.replaceAll(" ", "_"));
    });

    it('[에러케이스] 중복 생성', async () => {
      const title = "TEST NESTJS 강의 1 - 기본"
      await test.repository.query(test.topicInsertQuery());
      const [{ id }] = await test.repository.query(test.topicSelectQuery());
      await test.repository.query(test.postInsertQuery(id, title.replaceAll(" ", "_")));

      const postDto: CreatePostsDto = {
        title,
        contents: "## 내용",
        topicId: id,
      }

      const response = await test.req("post", "/posts", postDto, await test.getToken());

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(ExceptionMessages.EXIST_TITLE);
    });

    it('[에러케이스] 권한 없이 게시글 생성', async () => {
      await test.deleteAuths();
      await test.insertAuths(undefined, [AuthsEnum.CAN_USE_OFFICE]);

      const response = await test.req("post", "/posts", {}, await test.getToken())

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    });
  });

  describe('/posts (patch)', () => {
    it('게시글 수정', async () => {
      const title = "TEST NESTJS 강의 1 - 기본"
      const updateTitle = "TEST NESTJS 강의 2 - 응용"
      await test.repository.query(test.topicInsertQuery());
      const [{ id }] = await test.repository.query(test.topicSelectQuery());
      await test.repository.query(test.postInsertQuery(id));
      const [post] = await test.repository.query(test.postSelectQuery());

      const postDto: UpdatePostsDto = {
        ...post,
        title: updateTitle
      }

      const response = await test.req("patch", "/posts", postDto, await test.getToken());

      expect(response.status).toBe(200);
      expect(response.body.title).toBe(updateTitle.replaceAll(" ", "_"));
    });

    it('[에러케이스] 이미 존재하는 타이틀로 수정', async () => {
      const title = "TEST NESTJS 강의 1 - 기본"
      const updateTitle = "TEST NESTJS 강의 2 - 응용"
      await test.repository.query(test.topicInsertQuery());
      const [{ id }] = await test.repository.query(test.topicSelectQuery());
      await test.repository.query(test.postInsertQuery(id, title));
      const [post] = await test.repository.query(test.postSelectQuery(title));
      await test.repository.query(test.postInsertQuery(id, updateTitle.replaceAll(" ", "_")));

      const postDto: UpdatePostsDto = {
        ...post,
        title: updateTitle
      }

      const response = await test.req("patch", "/posts", postDto, await test.getToken());

      expect(response.status).toBe(400);
      expect(response.body.message).toBe(ExceptionMessages.EXIST_TITLE);
    });

    it('[에러케이스] 권한 없이 게시글 생성', async () => {
      await test.deleteAuths();
      await test.insertAuths(undefined, [AuthsEnum.CAN_USE_OFFICE]);

      const response = await test.req("patch", "/posts", {}, await test.getToken());

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    });
  });
  describe('/series/:id (DELETE)', () => {
    it('게시글 삭제', async () => {
      await test.repository.query(test.topicInsertQuery());
      const [topic] = await test.repository.query(test.topicSelectQuery());

      await test.repository.query(test.postInsertQuery(topic.id));
      const [{ id }] = await test.repository.query(test.postSelectQuery());

      const response = await test.req("delete", `/posts/${id}`, undefined, await test.getToken())

      expect(response.status).toBe(200);
      expect(response.body.affected).toBe(1);
    });

    it('[에러케이스] 존재하지 않는 게시글 삭제', async () => {
      const response = await test.req("delete", "/posts/0", undefined, await test.getToken())

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(ExceptionMessages.NOT_EXIST_POST);
    });

    it('[에러케이스] 권한 없이 알람 게시글 삭제', async () => {
      await test.deleteAuths();
      await test.insertAuths(undefined, [AuthsEnum.CAN_USE_OFFICE]);

      const response = await test.req("delete", "/posts/1", undefined, await test.getToken())

      expect(response.status).toBe(403);
      expect(response.body.message).toBe(ExceptionMessages.NO_PERMISSION);
    });
  });


  afterAll(() => test.close());
});