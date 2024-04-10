import { AuthsEntity } from "src/auths/entities/auths.entity";
import { DataSource } from "typeorm";
import { workProviders } from "./work.providers";
import { usersProviders } from "./users.providers";
import { AlarmsProvider } from "src/auths/provider/alarms.provider";
import { AlarmsEntity } from "src/alarms/entities/alarms.entity";

export const alarmsProviders = [
  {
    provide: 'AUTHS_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(AuthsEntity),
    inject: ['DATA_SOURCE']
  },
  {
    provide: 'ALARMS_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(AlarmsEntity),
    inject: ['DATA_SOURCE'],
  },
  ...workProviders,
  ...usersProviders,
];