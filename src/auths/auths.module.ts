import { Module } from '@nestjs/common';
import { AuthsService } from './auths.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from 'src/config/database/database.module';
import { alarmsProviders } from 'src/config/database/alarms.providers';
import { AuthsController } from './auths.controller';
import { usersProviders } from 'src/config/database/users.providers';
import { workProviders } from 'src/config/database/work.providers';
import { AlarmsProvider } from './provider/alarms.provider';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [CommonModule, DatabaseModule, JwtModule.registerAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => ({
      secret: Buffer.from(configService.get('JWT_SECRET')).toString('base64'),
    }),
  })],
  controllers: [AuthsController],
  exports: [AuthsService],
  providers: [
    AuthsService
    , ...alarmsProviders
    , ...usersProviders
    , ...workProviders
    , {
      provide: "ALARMS_PROVIDER",
      useClass: AlarmsProvider
    },
  ],
})
export class AuthsModule { }
