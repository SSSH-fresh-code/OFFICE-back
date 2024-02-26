import { Inject, Injectable, InternalServerErrorException, UseFilters } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { ContextUtils } from '@nestjs/core/helpers/context-utils';
import { Console } from 'console';
import { AuthsExternalService } from 'src/auths/auths.external';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly authService: AuthsExternalService
  ) { }

  async create(createUserDto: CreateUserDto) {
    const createUser = await this.userRepository.create(createUserDto);

    createUser.userPw = await this.authService.encryptPassword(createUser.userPw);

    const user = await this.userRepository.save(createUser);

    return user;
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
