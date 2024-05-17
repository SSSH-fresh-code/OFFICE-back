import { Module } from "@nestjs/common";
import { DataSource } from "typeorm";

const testDatabase = {
  provide: 'DATA_SOURCE',
  useFactory: async () => {
    const dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
      synchronize: true,
    });

    return dataSource.initialize();
  },
}

@Module({
  providers: [testDatabase],
  exports: [testDatabase],
})
export class testModule { }