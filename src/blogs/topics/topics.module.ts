import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/config/database/database.module';
import { CommonModule } from 'src/common/common.module';
import { TopicsService } from './topics.service';
import { TopicsController } from './topics.controller';
import { blogProvider } from 'src/config/database/blog.providers';

@Module({
  imports: [DatabaseModule, CommonModule],
  controllers: [TopicsController],
  providers: [
    TopicsService,
    ...blogProvider
  ],
})
export class TopicsModule { }
