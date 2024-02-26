import { Module } from '@nestjs/common';
import { AuthsService } from './auths.service';
import { AuthsController } from './auths.controller';
import { AuthsExternalService } from './auths.external';

@Module({
  exports: [AuthsExternalService],
  controllers: [AuthsController],
  providers: [AuthsService, AuthsExternalService],
})
export class AuthsModule { }
