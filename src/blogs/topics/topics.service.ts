import { BadRequestException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateTopicsDto } from './dto/create-topics.dto';
import { Repository } from 'typeorm';
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
    const menu = await this.topicsRepository.findOne({ where: { name } });

    /** TODO: series, post 가져오기 */

    return menu;
  }

  async getTopics(page: TopicsPaginationDto,) {
    return await this.commonService.paginate<TopicsEntity>(page, this.topicsRepository);
  }

  async createTopic(dto: CreateTopicsDto) {
    const topic = await this.topicsRepository.create(dto);

    return await this.topicsRepository.save(topic);
  }

  async deleteTopic(name: string) {
    const topic = await this.topicsRepository.findOne({ where: { name } });

    if (!topic) throw new BadRequestException(ExceptionMessages.NOT_EXIST_NAME);

    const del = await this.topicsRepository.delete(topic.id);

    if (del.affected < 1) throw new InternalServerErrorException(ExceptionMessages.INTERNAL_SERVER_ERROR);

    return del;
  }
}