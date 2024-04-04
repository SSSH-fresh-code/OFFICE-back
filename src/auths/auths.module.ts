import { Module } from '@nestjs/common';
import { AuthsService } from './auths.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from 'src/config/database/database.module';
import { alarmsProviders } from 'src/config/database/alarms.providers';

@Module({
  imports: [DatabaseModule, JwtModule.registerAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => ({
      secret: Buffer.from(configService.get('JWT_SECRET')).toString('base64'),
    }),
  })],
  exports: [AuthsService],
  providers: [AuthsService, ...alarmsProviders],
})
export class AuthsModule { }
