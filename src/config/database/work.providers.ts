import { WorkEntity } from "src/work/entities/work.entity";
import { DataSource } from "typeorm";

export const workProviders = [
  {
    provide: 'WORK_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(WorkEntity),
    inject: ['DATA_SOURCE'],
  },
];