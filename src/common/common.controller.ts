import { Controller, Get, Inject, NotFoundException } from '@nestjs/common';
import { CommonService } from './common.service';
import { EntityNotFoundError, Repository } from 'typeorm';
import { TopicsEntity } from 'src/blogs/topics/entities/topics.entity';
import { UserEntity } from 'src/users/entities/user.entity';

@Controller('common')
export class CommonController {
  constructor(
    private readonly commonService: CommonService,
    @Inject('USER_REPOSITORY')
    private readonly usersRepository: Repository<UserEntity>,
  ) { }

  @Get('/')
  public async getCommon() {
    return this.usersRepository.findOneByOrFail({ id: "dd" })
  }
}
