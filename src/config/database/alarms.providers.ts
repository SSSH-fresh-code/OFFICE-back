import { AuthsEntity } from "src/auths/entities/auths.entity";
import { DataSource } from "typeorm";
import { workProviders } from "./work.providers";
import { usersProviders } from "./users.providers";
import { AlarmsEntity } from "src/alarms/entities/alarms.entity";

export const alarmsProviders = [
  {
    provide: 'ALARMS_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(AlarmsEntity),
    inject: ['DATA_SOURCE'],
  },
  ...workProviders,
  ...usersProviders,
];