import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { DatabaseModule } from 'src/config/database/database.module';
import { usersProviders } from 'src/config/database/users.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [],
  providers: [
    ...usersProviders,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    },],
})
export class UserModule { }
