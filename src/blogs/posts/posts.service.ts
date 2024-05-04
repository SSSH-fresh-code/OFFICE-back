import { BadRequestException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { QueryFailedError, Repository } from 'typeorm';
import { PostsEntity } from './entities/posts.entity';
import { ExceptionMessages } from 'src/common/message/exception.message';
import { CommonService } from 'src/common/common.service';
import { PostsPaginationDto } from './dto/posts-pagination.dto';
import { CreatePostsDto } from './dto/create-posts.dto';
import { UpdatePostsDto } from './dto/update-posts.dto';
import { TTokenPayload } from '@sssh-fresh-code/types-sssh';

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
        title: title
      },
      relations: {
        "author": true,
        "series": true,
        "topic": true
      }
    });

    if (!post) throw new NotFoundException(ExceptionMessages.NOT_EXIST_POST)

    return { ...post, title: post.title.replaceAll("_", " ") };
  }

  async getPosts(page: PostsPaginationDto) {
    return await this.commonService.paginate<PostsEntity>(page, this.postsRepository, {
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
      relations: {
        author: true,
        series: true,
        topic: true
      }
    });
  }

  async createPosts(dto: CreatePostsDto, user: TTokenPayload) {
    const title = dto.title.replaceAll(" ", "_");
    try {
      const post = await this.postsRepository.create({
        title,
        contents: dto.contents,
        topic: { id: dto.topicId },
        series: { id: dto.seriesId },
        author: { id: user.id }
      });
      return await this.postsRepository.save(post);
    } catch (e: any) {
      if (e instanceof QueryFailedError) {
        if (e.driverError.code === "23505") {
          throw new BadRequestException(ExceptionMessages.EXIST_TITLE);
        }
      }
    }

    throw new InternalServerErrorException(ExceptionMessages.INTERNAL_SERVER_ERROR);
  }

  async updatePosts(dto: UpdatePostsDto) {
    const title = dto.title.replaceAll(" ", "_");

    const oriPost = await this.postsRepository.findOne({
      where: {
        id: dto.id
      },
      relations: {
        author: true,
        series: true,
        topic: true
      }
    });

    if (!oriPost) throw new BadRequestException(ExceptionMessages.NOT_EXIST_ID);

    try {
      const post = await this.postsRepository.create({
        id: dto.id,
        title,
        contents: dto.contents,
        topic: { id: dto.topicId },
        series: { id: dto.seriesId },
        author: { id: oriPost.author.id }
      });
      return await this.postsRepository.save(post);
    } catch (e: any) {
      if (e instanceof QueryFailedError) {
        if (e.driverError.code === "23505") {
          throw new BadRequestException(ExceptionMessages.EXIST_TITLE);
        }
      }
    }

    throw new InternalServerErrorException(ExceptionMessages.INTERNAL_SERVER_ERROR);
  }

  async deletePosts(id: number) {
    const post = await this.postsRepository.findOne({ where: { id } });

    if (!post) throw new NotFoundException(ExceptionMessages.NOT_EXIST_POST);

    const del = await this.postsRepository.delete(post.id);

    if (del.affected < 1) throw new InternalServerErrorException(ExceptionMessages.INTERNAL_SERVER_ERROR);

    return del;
  }
}
