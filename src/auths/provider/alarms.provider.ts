import { Inject, Injectable, InternalServerErrorException } from "@nestjs/common";
import { ExceptionMessages } from "src/common/message/exception.message";
import { UserEntity } from "src/users/entities/user.entity";
import { WorkEntity } from "src/work/entities/work.entity";
import { Repository } from "typeorm";
import { IAlarms, TAlarms, TTokenPayload, TWork } from "types-sssh";

@Injectable()
export class AlarmsProvider {
  constructor(
    @Inject('USER_REPOSITORY')
    private readonly usersRepository: Repository<UserEntity>,
    @Inject('WORK_REPOSITORY')
    private readonly worksRepository: Repository<WorkEntity>,
  ) { }

  public async getAlarms(user: TTokenPayload, alarm: TAlarms) {
    switch (alarm.name) {
      case "CAN_WORK":
        return await this.getAlarms_CAN_WORK(user, alarm);
      case "CERTIFICATION":
        return this.getAlarms_CERTIFICATION(alarm);
    }

    throw new InternalServerErrorException(ExceptionMessages.INTERNAL_SERVER_ERROR);
  }

  private async getAlarms_CAN_WORK(user: TTokenPayload, alarm: TAlarms) {
    const work = await this.worksRepository.find({
      where: {
        userUuid: user.id,
        baseDate: this.getDateStr()
      }
    });

    if (work.length !== 0) return undefined;

    return alarm;
  }

  private async getAlarms_CERTIFICATION(alarm: TAlarms) {
    const unauthorizedUsers = await this.usersRepository.find({
      where: {
        isCertified: false
      }
    });

    if (unauthorizedUsers.length === 0) return undefined;

    return { ...alarm, highlightWord: unauthorizedUsers.length }
  }

  /**
   * @param date Date
   * @returns "YYYY-MM-DD"
   * TODO: work.service.ts에 있는 메서드랑 합칠것
   */
  private getDateStr(date?: Date) {
    const d = date ? date : new Date();
    const month = d.getMonth() < 9 ? `0${d.getMonth() + 1}` : d.getMonth() + 1;
    const day = d.getDate() < 10 ? `0${d.getDate()}` : d.getDate();

    return `${d.getFullYear()}-${month}-${day}`;
  }
}


