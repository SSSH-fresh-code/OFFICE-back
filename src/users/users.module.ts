import { Module, ValidationPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthsModule } from '../auths/auths.module';
import { CommonModule } from 'src/common/common.module';
import { APP_PIPE } from '@nestjs/core';
import { usersProviders } from 'src/config/database/users.providers';
import { DatabaseModule } from 'src/config/database/database.module';

@Module({
  imports: [AuthsModule, CommonModule, DatabaseModule],
  controllers: [UsersController],
  providers: [
    ...usersProviders,
    UsersService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    },],
})
export class UsersModule { }
