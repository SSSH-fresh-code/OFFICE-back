import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/config/database/database.module';
import { CommonModule } from 'src/common/common.module';
import { blogProvider } from 'src/config/database/blog.providers';
import { TopicsController } from './topics/topics.controller';
import { SeriesController } from './series/series.controller';
import { PostsController } from './posts/posts.controller';
import { TopicsService } from './topics/topics.service';
import { SeriesService } from './series/series.service';
import { PostsService } from './posts/posts.service';

@Module({
  imports: [DatabaseModule, CommonModule],
  controllers: [TopicsController, SeriesController, PostsController],
  providers: [
    TopicsService,
    SeriesService,
    PostsService,
    ...blogProvider
  ],
})
export class BlogModule { }
