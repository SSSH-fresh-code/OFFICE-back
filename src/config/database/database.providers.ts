import { registerAs } from "@nestjs/config";
import { readFileSync } from "fs";
import { DataSource, DataSourceOptions } from "typeorm";
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../../../.env') });

function getTypeOrmConfig(): DataSourceOptions {
  const isProduction = process.env.NEST_MODE === "production";

  const isProductionOption = isProduction ? {
    ssl: {
      ca: readFileSync('./dist/global-bundle.pem'),
    },
    extra: {
      ssl: { rejectUnauthorized: false }
    },
    synchronize: false,
  } : {}

  const option: DataSourceOptions = {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER_NAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [
      __dirname + '/../../**/*.entity{.ts,.js}',
    ],
    synchronize: true,
    ...isProductionOption
  }

  return option;
}
export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    useFactory: async () => {
      const dataSource = new DataSource(getTypeOrmConfig());

      return dataSource.initialize();
    },
  },
];

export default registerAs('typeorm', () => getTypeOrmConfig());
export const connectionSource = new DataSource(getTypeOrmConfig() as DataSourceOptions);