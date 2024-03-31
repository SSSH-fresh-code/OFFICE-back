import { BadRequestException, Inject, Injectable, InternalServerErrorException, NotAcceptableException } from '@nestjs/common';
import { UserEntity } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { WorkEntity } from './entities/work.entity';
import { TTokenPayload } from 'types-sssh';
import { ExceptionMessages } from 'src/common/message/exception.message';

@Injectable()
export class WorkService {
  constructor(
    @Inject('WORK_REPOSITORY')
    private readonly workRepository: Repository<WorkEntity>,
    @Inject('USER_REPOSITORY')
    private readonly userRepository: Repository<UserEntity>,
  ) { }

  async goToWork(user: TTokenPayload) {
    const now = new Date();
    const todayDate = `${now.getFullYear()}${now.getMonth() + 1}${now.getDate()}`;

    try {
      console.log(user.id);
      const workEntity = await this.workRepository.create({
        user: { id: user.id },
        baseDate: todayDate
      });
      console.log(workEntity)

      return await this.workRepository.save(workEntity);
    } catch (e) {
      if (e instanceof Error) {
        console.log(e);
        if (e.message.indexOf("primary") !== -1)
          throw new NotAcceptableException(ExceptionMessages.ALREADY_PRECESSED);
      }

      throw new InternalServerErrorException(ExceptionMessages.INTERNAL_SERVER_ERROR);
    }
  }
}
