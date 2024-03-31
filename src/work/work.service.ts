import { ForbiddenException, Inject, Injectable, InternalServerErrorException, NotAcceptableException } from '@nestjs/common';
import { UserEntity } from 'src/users/entities/user.entity';
import { DataSource, Equal, IsNull, Not, Or, QueryFailedError, QueryRunner, Repository } from 'typeorm';
import { WorkEntity } from './entities/work.entity';
import { TTokenPayload } from 'types-sssh';
import { ExceptionMessages } from 'src/common/message/exception.message';
import { AuthsService } from 'src/auths/auths.service';

@Injectable()
export class WorkService {
  constructor(
    @Inject('WORK_REPOSITORY')
    private readonly workRepository: Repository<WorkEntity>,
    @Inject('USER_REPOSITORY')
    private readonly userRepository: Repository<UserEntity>,
    @Inject("DATA_SOURCE")
    private dataSource: DataSource,
    private readonly authsService: AuthsService,
  ) { }

  async goToWork(user: TTokenPayload) {
    const qr = this.dataSource.createQueryRunner();

    await qr.connect();
    await qr.startTransaction();

    try {
      const previousWorks = await this.getOffPreviousWorks(new Date(), qr);

      await qr.manager.insert<WorkEntity>(WorkEntity, {
        user: { id: user.id },
        baseDate: this.getDateStr()
      });

      const result = {
        isSuccess: true,
        updatedWorks: previousWorks
      }

      await qr.commitTransaction();

      return result;
    } catch (e) {
      await qr.rollbackTransaction();

      if (e instanceof QueryFailedError && e.message.indexOf("duplicate") > -1) {
        throw new NotAcceptableException(ExceptionMessages.ALREADY_PRECESSED);
      }

      throw new InternalServerErrorException(ExceptionMessages.INTERNAL_SERVER_ERROR);
    } finally {
      await qr.release();
    }
  }

  async getOffWork(user: TTokenPayload, workDetail?: string) {
    const now = this.getDateStr();

    const work = await this.workRepository.findOne({
      where: {
        userUuid: user.id,
        baseDate: now,
      }
    });

    if (!work) throw new NotAcceptableException(ExceptionMessages.NOT_EXIST_WORK);
    else if (work.offTime) throw new NotAcceptableException(ExceptionMessages.ALREADY_WORK);

    if (workDetail) work.workDetail = workDetail;

    return await this.workRepository.save({
      ...work,
      offTime: new Date()
    });
  }

  async deleteWorks(user: TTokenPayload, id: string, baseDates: string[]) {
    if (user.userRole === "USER" && id !== user.id)
      throw new ForbiddenException(ExceptionMessages.NO_PERMISSION);

    const targetUser = await this.userRepository.findOne({
      where: { id }
    });

    if (!this.authsService.checkRole(targetUser.userRole, user.userRole))
      throw new ForbiddenException(ExceptionMessages.NO_PERMISSION);

    const deleteWorks = await this.workRepository.delete({
      userUuid: id,
      baseDate: Or(...baseDates.map(d => Equal(d)))
    });

    return deleteWorks;
  }

  private async getOffPreviousWorks(today: Date, qr: QueryRunner) {
    const works = await qr.manager.find<WorkEntity>(WorkEntity, {
      where: {
        baseDate: Not(this.getDateStr(today)),
        offTime: IsNull()
      }
    });

    if (works.length === 0) return [];

    works.forEach(async (w) => {
      await qr.manager.save(
        await qr.manager.create(
          WorkEntity
          , { ...w, offTime: new Date(`${w.baseDate} 23:59:59`) }
        )
      );
    });

    return works.map(w => w.baseDate);
  }

  /**
   * @param date Date
   * @returns "YYYY-MM-DD"
   */
  private getDateStr(date?: Date) {
    const d = date ? date : new Date();
    const month = d.getMonth() < 9 ? `0${d.getMonth() + 1}` : d.getMonth() + 1;
    const day = d.getDate() < 10 ? `0${d.getDate()}` : d.getDate();

    return `${d.getFullYear()}-${month}-${day}`;
  }
}