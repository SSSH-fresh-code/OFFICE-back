import { BadRequestException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PostsEntity } from './entities/posts.entity';
import { ExceptionMessages } from 'src/common/message/exception.message';
import { CommonService } from 'src/common/common.service';
import { PostsPaginationDto } from './dto/posts-pagination.dto';
import { CreatePostsDto } from './dto/create-posts.dto';
import AuthsEnum from 'src/auths/const/auths.enums';
import { UpdatePostsDto } from './dto/update-posts.dto';

@Injectable()
export class PostsService {
  constructor(
    @Inject('POSTS_REPOSITORY')
    private readonly postsRepository: Repository<PostsEntity>,
    private readonly commonService: CommonService,
  ) { }

  async getPost(title: string) {
    const post = await this.postsRepository.findOne({
      select: {
        id: true,
        title: true,
        contents: true,
        author: {
          userName: true
        },
        series: {
          id: true,
          name: true
        },
        topic: {
          id: true,
          name: true
        },
        createdAt: true
      },
      where: {
        title: title.replaceAll(" ", "_")
      },
      relations: {
        "author": true,
        "series": true,
        "topic": true
      }
    });

    return { ...post, title: post.title.replaceAll("_", " ") };
  }

  async getPosts(page: PostsPaginationDto) {
    return await this.commonService.paginate<PostsEntity>(page, this.postsRepository);
  }

  async createPosts(dto: CreatePostsDto) {
    const title = dto.title.replaceAll(" ", "_");

    const post = await this.postsRepository.create({
      title,
      contents: dto.contents,
      topic: { id: dto.topicId },
      series: { id: dto.seriesId },
      author: { id: dto.authorId }
    });

    return await this.postsRepository.save(post);
  }

  async updatePosts(dto: UpdatePostsDto) {
    const title = dto.title.replaceAll(" ", "_");

    const oriPost = await this.postsRepository.findOne({
      where: {
        id: dto.id
      }
    });

    if (!oriPost) throw new BadRequestException(ExceptionMessages.NOT_EXIST_ID);

    const post = await this.postsRepository.create({
      id: dto.id,
      title,
      contents: dto.contents,
      topic: { id: dto.topicId },
      series: { id: dto.seriesId },
      author: { id: dto.authorId }
    });

    return await this.postsRepository.save(post);
  }

  async deletePosts(id: number) {
    const post = await this.postsRepository.findOne({ where: { id } });

    if (!post) throw new BadRequestException(ExceptionMessages.NOT_EXIST_NAME);

    const del = await this.postsRepository.delete(post.id);

    if (del.affected < 1) throw new InternalServerErrorException(ExceptionMessages.INTERNAL_SERVER_ERROR);

    return del;
  }
}
