import { UserEntity } from "../entity/user.entity";

export default interface iUser {
  validate(): void;
  encryptPassword(): void;
  comparePassword(plainPassword: string): Promise<boolean>;
  toUserEntity(): UserEntity;
}