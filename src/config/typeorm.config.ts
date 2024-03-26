import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { readFileSync } from "fs";
import { UserEntity } from "src/users/entities/user.entity";

export default function getTypeOrmConfig(): TypeOrmModuleOptions {
  const isProduction = process.env.NEST_MODE === "production";

  const isProductionOption = isProduction ? {
    ssl: {
      ca: readFileSync('./dist/global-bundle.pem'),
    },
    extra: {
      ssl: { rejectUnauthorized: false }
    }
  } : {}

  const option: TypeOrmModuleOptions = {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER_NAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [UserEntity],
    synchronize: true,
    ...isProductionOption
  }


  return option;
}