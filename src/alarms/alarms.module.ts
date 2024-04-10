import { Module } from '@nestjs/common';
import { AlarmsService } from './alarms.service';
import { DatabaseModule } from 'src/config/database/database.module';
import { AlarmsController } from './alarms.controller';
import { CommonModule } from 'src/common/common.module';
import { AuthsModule } from 'src/auths/auths.module';
import { alarmsProviders } from 'src/config/database/alarms.providers';

@Module({
  imports: [CommonModule, DatabaseModule, AuthsModule],
  controllers: [AlarmsController],
  exports: [AlarmsService],
  providers: [
    AlarmsService
    , ...alarmsProviders
  ],
})
export class AlarmsModule { }
