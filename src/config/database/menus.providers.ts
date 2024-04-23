import { AuthsEntity } from "src/auths/entities/auths.entity";
import { MenusEntity } from "src/menus/entities/menus.entity";
import { DataSource } from "typeorm";

export const menusProviders = [
  {
    provide: 'MENUS_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(MenusEntity),
    inject: ['DATA_SOURCE']
  },
  {
    provide: 'AUTHS_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(AuthsEntity),
    inject: ['DATA_SOURCE'],
  },
];