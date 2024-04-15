import { Module } from '@nestjs/common';
import { AuthsService } from './auths.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from 'src/config/database/database.module';
import { AuthsController } from './auths.controller';
import { authsProviders } from 'src/config/database/auths.providers';
import { usersProviders } from 'src/config/database/users.providers';
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
    AuthsService,
    ...authsProviders,
    ...usersProviders
  ]
})
export class AuthsModule { }
