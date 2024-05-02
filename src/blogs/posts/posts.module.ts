import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/config/database/database.module';
import { CommonModule } from 'src/common/common.module';
import { blogProvider } from 'src/config/database/blog.providers';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  imports: [DatabaseModule, CommonModule],
  controllers: [PostsController],
  providers: [
    PostsService,
    ...blogProvider
  ],
})
export class PostsModule { }
