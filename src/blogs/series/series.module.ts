import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/config/database/database.module';
import { CommonModule } from 'src/common/common.module';
import { SeriesService } from './series.service';
import { SeriesController } from './series.controller';
import { blogProvider } from 'src/config/database/blog.providers';

@Module({
  imports: [DatabaseModule, CommonModule],
  controllers: [SeriesController],
  providers: [
    SeriesService,
    ...blogProvider
  ],
})
export class SeriesModule { }
