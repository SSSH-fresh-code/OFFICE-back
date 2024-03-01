import { Module } from '@nestjs/common';
import { AuthsService } from './auths.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [JwtModule.register({})],
  exports: [AuthsService],
  providers: [AuthsService],
})
export class AuthsModule { }
