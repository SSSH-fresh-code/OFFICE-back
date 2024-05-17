import { Repository, FindManyOptions, InsertResult, UpdateResult, DeleteResult } from 'typeorm';
import { UserEntity } from '../entity/user.entity';
import { Inject, Injectable } from '@nestjs/common';
import IUserRepository from './IUserRepository';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @Inject('USER_REPOSITORY')
    private readonly userRepository: Repository<UserEntity>,
  ) { }

  insert(dto: CreateUserDto): Promise<InsertResult> {
    return this.userRepository.insert(dto);
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

  findOneById(id: string): Promise<UserEntity> {
    return this.userRepository.findOneOrFail({ where: { id } });
  }

  existsUserByEmail(email: string): Promise<boolean> {
    return this.userRepository.exists({ where: { email } })
  }

  existsUserByName(name: string): Promise<boolean> {
    return this.userRepository.exists({ where: { name } })
  }
}