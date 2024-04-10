import { BadRequestException, ForbiddenException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { TAlarms, TTokenPayload } from 'types-sssh';
import { ExceptionMessages } from 'src/common/message/exception.message';
import { CreateAlarmsDto } from './dto/create-alarms.dto';
import { Equal, FindOptionsWhere, Or, Repository } from 'typeorm';
import { AlarmsEntity } from './entities/alarms.entity';
import { UpdateAlarmsDto } from './dto/update-alarms.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CommonService } from 'src/common/common.service';
import { UserEntity } from 'src/users/entities/user.entity';
import { WorkEntity } from 'src/work/entities/work.entity';
import { AuthsService } from 'src/auths/auths.service';

@Injectable()
export class AlarmsService {
  constructor(
    @Inject('ALARMS_REPOSITORY')
    private readonly alarmsRepository: Repository<AlarmsEntity>,
    private readonly commonService: CommonService,
    private readonly authsService: AuthsService,
    @Inject('USER_REPOSITORY')
    private readonly usersRepository: Repository<UserEntity>,
    @Inject('WORK_REPOSITORY')
    private readonly worksRepository: Repository<WorkEntity>,
  ) { }
  async postAlarms(dto: CreateAlarmsDto) {
    const alarmsEntity = await this.alarmsRepository.create(dto);

    return await this.alarmsRepository.save(alarmsEntity);
  }

  async patchAlarms(dto: UpdateAlarmsDto) {
    const alarm = await this.alarmsRepository.findOne({
      where: {
        id: dto.id
      }
    });

    if (!alarm) throw new BadRequestException(ExceptionMessages.NOT_EXIST_ID)


    return await this.alarmsRepository.save({
      ...alarm,
      ...dto
    });
  }

  async getAlarms(user: TTokenPayload, readOnly: boolean, page: PaginationDto) {
    if (!readOnly) {
      const alarms = await this.alarmsRepository.find({
        where: {
          auths: Or(...user.auths.map(s => Equal({ code: s })))
        }, order: {
          order: 'ASC'
        }
      });

      const aliveAlarms = [];

      for (const a of alarms) {
        const alive = await this.getAlarmsFromName(user, a);
        if (alive) aliveAlarms.push(alive);
      }

      return aliveAlarms;
    } else {
      return await this.commonService.paginate(page, this.alarmsRepository);
    }
  }

  async deleteAlarms(id: number) {
    const alarm = await this.alarmsRepository.findOne({
      where: { id: id }
    })

    if (!alarm) throw new BadRequestException(ExceptionMessages.NOT_EXIST_ID)

    return await this.alarmsRepository.delete(id);
  }

  async getAlarm(user: TTokenPayload, id: number) {
    const alarm = await this.alarmsRepository.findOne({
      where: { id: id }
    });

    if (!alarm) throw new BadRequestException(ExceptionMessages.NOT_EXIST_ID);

    return alarm;
  }

  public async getAlarmsFromName(user: TTokenPayload, alarm: TAlarms) {
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
