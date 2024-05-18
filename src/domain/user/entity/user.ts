import { compare, genSalt, hash } from "bcrypt";
import { CreateUserDto } from "../dto/create-user.dto";
import iUser from "../interface/user.interface";
import { UserEntity } from "./user.entity";
import { BadRequestException } from "@nestjs/common";
import { ExceptionMessages } from "src/domain/common/message/exception.message";

export default class User implements iUser {
  static idRegex = new RegExp(/^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/, "i");
  static emailRegex = new RegExp(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);

  private id: string = "";
  private email: string;
  private password: string;
  private name: string;
  private deletedAt: Date | null;
  private createdAt: Date;
  private updatedAt: Date;

  constructor(user: CreateUserDto)
  constructor(user: UserEntity) {
    this.id = user.id;
    this.email = user.email;
    this.password = user.password;
    this.name = user.name;
    this.deletedAt = user.deletedAt ? new Date(user.deletedAt) : null;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }

  validate(): void {
    if (this.id && !User.idRegex.test(this.id)) {
      throw new BadRequestException(ExceptionMessages.INVALID_UUID);
    } else if (!User.emailRegex.test(this.email)) {
      throw new BadRequestException(ExceptionMessages.INVALID_EMAIL);
    } else if (this.password && this.password.length < 6) {
      throw new BadRequestException(ExceptionMessages.INVALID_PASSWORD);
    } else if (this.name.length < 2 || this.name.length > 19) {
      throw new BadRequestException(ExceptionMessages.INVALID_NAME);
    }
  }

  async encryptPassword(): Promise<void> {
    try {
      const salt = await genSalt(Number(process.env.SALT_ROUNDS));

      const encryptPw = await hash(this.password, salt);

      this.password = encryptPw;
    } catch (error) {
      throw error;
    }
  }

  async comparePassword(plainPassword: string): Promise<boolean> {
    return await compare(plainPassword, this.password);
  }

  toUserEntity(): UserEntity {
    const user = new UserEntity();

    user.id = this.id;
    user.email = this.email;
    user.password = this.password;
    user.name = this.name;
    user.deletedAt = this.deletedAt;
    user.createdAt = this.createdAt;
    user.updatedAt = this.updatedAt;
    return user;
  }



}