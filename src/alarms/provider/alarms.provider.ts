import { Inject, Injectable, InternalServerErrorException } from "@nestjs/common";
import { ExceptionMessages } from "src/common/message/exception.message";
import { UserEntity } from "src/users/entities/user.entity";
import { WorkEntity } from "src/work/entities/work.entity";
import { Repository } from "typeorm";
import { IAlarms, TAlarms, TTokenPayload, TWork } from "types-sssh";

@Injectable()
export class AlarmsProvider {
}


