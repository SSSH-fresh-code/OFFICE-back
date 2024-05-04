import E2ETestUtil from './e2e-util.class';

export default class BlogE2ETestUtil<T> extends E2ETestUtil<T> {
  topicName = 'TESTTopic';
  seriseName = 'TESTSeries';
  postName = 'TESTPost';

  topicInsertQuery = (name: string = this.topicName) => `INSERT INTO topics ("name") values ('${name}');`;
  topicSelectQuery = (name: string = this.topicName) => `SELECT * FROM topics WHERE "name" = '${name}'`
  seriesInsertQuery = (id: string | number, name: string = this.seriseName) => `INSERT INTO series ("name", "topicId") values ('${name}', '${id}');`;
  seriesSelectQuery = (name: string = this.seriseName) => `SELECT * FROM series WHERE "name" = '${name}'`
  postInsertQuery = (id: string | number, name: string = this.postName) => `INSERT INTO posts ("title", "contents", "topicId", "authorId") values ('${name}', 'TESTCONTENTS', '${id}', '${this.users[0].id}');`;
  postWithSeriesInsertQuery = (id: string | number, seriesId: number, name: string = this.postName) => `INSERT INTO posts ("title", "contents", "topicId", "authorId", "seriesId") values ('${name}', 'TESTCONTENTS', '${id}', '${this.users[0].id}', '${seriesId}');`;
  postSelectQuery = (title: string = this.postName) => `SELECT * FROM posts WHERE "title" = '${title}'`

  async deleteBlogDatas() {
    await this.repository.query(`delete from posts where "title" like 'TEST%'`);
    await this.repository.query(`delete from series where "name" like 'TEST%'`);
    await this.repository.query(`delete from topics where "name" like 'TEST%'`);
  }

  async close() {
    await this.deleteAuths();
    await this.deleteUsers();
    await this.deleteBlogDatas();
    await this.app.close();
  }
}