import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { CommonController } from './common.controller';
import { usersProviders } from 'src/config/database/users.providers';
import { DatabaseModule } from 'src/config/database/database.module';

@Module({
  imports: [DatabaseModule],
  exports: [CommonService],
  controllers: [CommonController],
  providers: [CommonService, ...usersProviders],
})
export class CommonModule { }
