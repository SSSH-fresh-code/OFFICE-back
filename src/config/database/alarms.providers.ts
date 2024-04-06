import { AlarmsEntity } from "src/auths/entities/alarms.entity";
import { DataSource } from "typeorm";

export const alarmsProviders = [
  {
    provide: 'ALARMS_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(AlarmsEntity),
    inject: ['DATA_SOURCE'],
  },
];