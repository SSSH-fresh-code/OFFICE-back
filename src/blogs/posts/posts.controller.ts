import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorator/roles.decorator';
import AuthsEnum from 'src/auths/const/auths.enums';
import { PostsService } from './posts.service';
import { PostsPaginationDto } from './dto/posts-pagination.dto';
import { CreatePostsDto } from './dto/create-posts.dto';
import { UpdatePostsDto } from './dto/update-posts.dto';

@ApiTags('posts')
@Controller('posts')
@ApiBearerAuth('access')
export class PostsController {
  constructor(private readonly postsService: PostsService) { }

  @Get('/:title')
  async getPost(@Param('title') title: string) {
    return this.postsService.getPost(title);
  }

  @Get('')
  async getPosts(@Query() query: PostsPaginationDto) {
    return this.postsService.getPosts(query);
  }

  @Post('')
  @Roles([AuthsEnum.CAN_USE_BLOG])
  async createPost(@Body('') post: CreatePostsDto) {
    return this.postsService.createPosts(post);
  }

  @Patch('')
  @Roles([AuthsEnum.CAN_USE_BLOG])
  async updatePost(@Body('') post: UpdatePostsDto) {
    return this.postsService.updatePosts(post);
  }
  @Delete('/:id')
  @Roles([AuthsEnum.CAN_USE_BLOG])
  async deletePost(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.deletePosts(id);
  }
}
