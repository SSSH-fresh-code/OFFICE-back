import { UserEntity } from '../entity/user.entity';
import ISsshRepository from '../../common/iSsshRepository';

export default interface IUserRepository extends ISsshRepository<UserEntity> {
  findOneById(id: string): Promise<UserEntity>;
  existsUserByEmail(email: string): Promise<boolean>;
  existsUserByName(name: string): Promise<boolean>;
}
