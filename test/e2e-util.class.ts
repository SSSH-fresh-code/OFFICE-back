import * as request from 'supertest';
import { INestApplication } from "@nestjs/common";
import AuthsEnum from "src/auths/const/auths.enums";
import { UserEntity } from "src/users/entities/user.entity";
import { Repository } from "typeorm";

export default class E2ETestUtil<T> {
  private app: INestApplication;
  public repository: Repository<T>;

  public users: UserEntity[] = [];

  constructor(app: INestApplication, repository: Repository<T>) {
    this.app = app;
    this.repository = repository;
  }

  async setBaseUser() {
    await this.repository.query(`
        INSERT INTO 
          users ("userId", "userPw", "userName", "isCertified") 
        VALUES 
          ('sample', '$2b$10$hDUNIEnceL9b7FvKwodya.IAU29zXbVJKykfr/H3nmQ3P.ROt4lyG', 'testAcc',  true);
    `)
    await this.repository.query(`
      INSERT INTO 
        users("userId", "userPw", "userName", "isCertified") 
      VALUES
              ('sample2', '$2b$10$hDUNIEnceL9b7FvKwodya.IAU29zXbVJKykfr/H3nmQ3P.ROt4lyG', 'testAcc2', true);
    `)
    const sample: UserEntity = await this.repository.query(`select * from users where "userId" = 'sample'`);
    const sample2: UserEntity = await this.repository.query(`select * from users where "userId" = 'sample2'`);

    this.users.push(...[sample[0], sample2[0]]);
  }

  async insertAuths(id: string, auths: AuthsEnum[]) {
    const authsStr = auths.map(a => `
      INSERT INTO
        users_auths_auths("usersId", "authsCode")
        VALUES
          ('${id}', '${a}');
        `).join('');

    return await this.repository.query(authsStr);
  }

  async req(method: "get" | "post" | "patch" | "delete", url: string, body?: string | object, token?: string) {
    if (method === "get") {
      return await request(this.app.getHttpServer()).get(url).set(token ? 'authorization' : 'a', token ? `Bearer ${token} ` : 'b');
    } else if (method === "post") {
      return await request(this.app.getHttpServer()).post(url).set(token ? 'authorization' : 'a', token ? `Bearer ${token} ` : 'b').send(body ? body : {});
    } else if (method === "patch") {
      return await request(this.app.getHttpServer()).patch(url).set(token ? 'authorization' : 'a', token ? `Bearer ${token} ` : 'b').send(body ? body : {});
    } else if (method === "delete") {
      return await request(this.app.getHttpServer()).delete(url).set(token ? 'authorization' : 'a', token ? `Bearer ${token} ` : 'b');
    }
  }


  async getToken(isRefesh: boolean = false, idPw: string = `${this.users[0].userId}:testPw`) {
    const { body } = await request(this.app.getHttpServer())
      .post('/users/login')
      .set(
        'authorization'
        , `Basic ${Buffer.from(idPw).toString('base64')} `
      );

    return isRefesh ? body.refreshToken : body.accessToken;
  }

  async deleteAuths() {
    const idList = this.users.map(u => `'${u.id}'`).join(',');
    await this.repository.query(`DELETE FROM users_auths_auths WHERE "usersId" in (${idList})`);
  }
  async deleteUsers() {
    const idList = this.users.map(u => `'${u.id}'`).join(',');
    await this.repository.query(`delete from users where "id" in (${idList})`)
  }

  async close() {
    await this.deleteAuths();
    await this.deleteUsers();
    await this.app.close();
  }
}