import { Module } from '@nestjs/common';
import { AlarmsService } from './alarms.service';
import { DatabaseModule } from 'src/config/database/database.module';
import { AlarmsController } from './alarms.controller';
import { CommonModule } from 'src/common/common.module';
import { alarmsProviders } from 'src/config/database/auths.providers';
import { AuthsModule } from 'src/auths/auths.module';

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
