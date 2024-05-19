import { BadRequestException } from "@nestjs/common";
import { CreateUserDto } from "../dto/create-user.dto";
import User from "./user";
import { UserEntity } from "./user.entity";

describe("User", () => {
  const createUserDto: CreateUserDto = {
    email: "test@example.com",
    password: "password123",
    name: "John Doe",
  };

  describe("new User() 생성자 테스트", () => {
    it("생성자 테스트", () => {
      const user = new User(createUserDto);

      expect(user).toBeInstanceOf(User);
    });

    it("생성자 테스트 - UserEntity", () => {
      const userEntity = new User(createUserDto).toUserEntity();

      expect(userEntity).toBeInstanceOf(UserEntity);
    })
  });

  describe("user.validate() 정합성 테스트", () => {
    it("정합성 검사", () => {
      const user = new User(createUserDto);

      expect(() => user.validate()).not.toThrow();
    });

    it("올바르지 않은 name", () => {
      const u = new User({ ...createUserDto, name: "a" });

      expect(() => u.validate()).toThrow(BadRequestException);
    });

    it("올바르지 않은 password", () => {
      const u = new User({ ...createUserDto, password: "a" });

      expect(() => u.validate()).toThrow(BadRequestException);
    });

    it("올바르지 않은 email", () => {
      const u = new User({ ...createUserDto, email: "a" });

      expect(() => u.validate()).toThrow(BadRequestException);
    });
  })

  describe("user password 암호화/검증 테스트", () => {
    it("패스워드 암호화 및 컴페어 확인", async () => {
      const user = new User(createUserDto);

      await user.encryptPassword();
      expect(await user.comparePassword(createUserDto.password)).toBeTruthy();
    });

    it("일치하지 않는 password", async () => {
      const user = new User(createUserDto);

      await user.encryptPassword();
      expect(await user.comparePassword("wrongPasswrod")).toBeFalsy();
    });
  })

  describe("user.toUserEntity() 변환 테스트", () => {
    it("정상 케이스", () => {
      const user = new User(createUserDto);

      expect(user.toUserEntity()).toBeInstanceOf(UserEntity);
    });
  })
});
