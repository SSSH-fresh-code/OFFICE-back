import { AuthsEntity } from "src/auths/entities/auths.entity";
import { DataSource } from "typeorm";

export const authsProviders = [
  {
    provide: 'AUTHS_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(AuthsEntity),
    inject: ['DATA_SOURCE']
  }
];