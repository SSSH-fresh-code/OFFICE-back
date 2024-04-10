import { Module } from '@nestjs/common';
import { AuthsService } from './auths.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from 'src/config/database/database.module';
import { AuthsController } from './auths.controller';

@Module({
  imports: [DatabaseModule, JwtModule.registerAsync({
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
  ]
})
export class AuthsModule { }
