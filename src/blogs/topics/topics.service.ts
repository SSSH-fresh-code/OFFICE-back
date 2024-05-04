import { BadRequestException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateTopicsDto } from './dto/create-topics.dto';
import { QueryFailedError, Repository } from 'typeorm';
import { TopicsEntity } from './entities/topics.entity';
import { ExceptionMessages } from 'src/common/message/exception.message';
import { TopicsPaginationDto } from './dto/topics-pagination.dto';
import { CommonService } from 'src/common/common.service';

@Injectable()
export class TopicsService {
  constructor(
    @Inject('TOPICS_REPOSITORY')
    private readonly topicsRepository: Repository<TopicsEntity>,
    private readonly commonService: CommonService,
  ) { }

  async getTopic(name: string) {
    const topic = await this.topicsRepository.createQueryBuilder("topics")
      .loadRelationCountAndMap('topics.seriesCnt', 'topics.series', 'series')
      .loadRelationCountAndMap('topics.postsCnt', 'topics.posts', 'posts')
      .where("topics.name = :name", { name })
      .getOne();

    if (!topic) throw new NotFoundException(ExceptionMessages.NOT_EXIST_NAME);

    return topic;
  }

  async getTopics(page: TopicsPaginationDto) {
    return await this.commonService.paginate<TopicsEntity>(page, this.topicsRepository);
  }

  async createTopic(dto: CreateTopicsDto) {
    const topicDto = await this.topicsRepository.create(dto);

    try {
      const topic = await this.topicsRepository.save(topicDto);
      return topic;
    } catch (e: any) {
      if (e instanceof QueryFailedError) {
        if (e.driverError.code === "23505") {
          throw new BadRequestException(ExceptionMessages.EXIST_NAME);
        }
      }
    }

    throw new InternalServerErrorException(ExceptionMessages.INTERNAL_SERVER_ERROR);
  }

  async deleteTopic(id: number) {
    const topic = await this.topicsRepository.findOne({ where: { id } });

    if (!topic) throw new NotFoundException(ExceptionMessages.NOT_EXIST_NAME);

    const del = await this.topicsRepository.delete(topic.id);

    if (del.affected < 1) throw new InternalServerErrorException(ExceptionMessages.INTERNAL_SERVER_ERROR);

    return del;
  }
}
