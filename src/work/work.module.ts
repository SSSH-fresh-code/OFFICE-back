import { Module } from '@nestjs/common';
import { WorkService } from './work.service';
import { WorkController } from './work.controller';
import { workProviders } from 'src/config/database/work.providers';
import { DatabaseModule } from 'src/config/database/database.module';
import { usersProviders } from 'src/config/database/users.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [WorkController],
  providers: [...workProviders, ...usersProviders, WorkService],
})
export class WorkModule { }
