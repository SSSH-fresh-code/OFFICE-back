import { Repository, FindManyOptions, InsertResult, UpdateResult, DeleteResult } from 'typeorm';
import { UserEntity } from '../entity/user.entity';
import { Inject, Injectable } from '@nestjs/common';
import iUserRepository from '../interface/user.repository.interface';
import User from '../entity/user';

@Injectable()
export class UserRepository implements iUserRepository {
  constructor(
    @Inject('USER_REPOSITORY')
    private readonly userRepository: Repository<UserEntity>,
  ) { }

  insert(user: User): Promise<InsertResult> {
    return this.userRepository.insert(user.toUserEntity());
  }

  select(option: FindManyOptions<UserEntity>): Promise<[UserEntity[], number]> {
    return this.userRepository.findAndCount(option);
  }

  update(entity: UserEntity): Promise<UpdateResult> {
    return this.userRepository.update(entity.id, entity);
  }

  delete(pk: string): Promise<DeleteResult> {
    return this.userRepository.delete(pk);
  }

  async findOneById(id: string): Promise<User> {
    const entity = await this.userRepository.findOneOrFail({ where: { id } });

    return new User(entity);
  }

  existsUserByEmail(email: string): Promise<boolean> {
    return this.userRepository.exists({ where: { email } })
  }

  existsUserByName(name: string): Promise<boolean> {
    return this.userRepository.exists({ where: { name } })
  }
}