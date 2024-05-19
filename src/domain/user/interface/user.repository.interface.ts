import { UserEntity } from '../entity/user.entity';
import ISsshRepository from '../../common/repository/iSsshRepository';
import User from '../entity/user';

export default interface iUserRepository extends ISsshRepository<UserEntity> {
  findOneById(id: string): Promise<User>;
  existsUserByEmail(email: string): Promise<boolean>;
  existsUserByName(name: string): Promise<boolean>;
}
