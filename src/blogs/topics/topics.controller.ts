import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorator/roles.decorator';
import AuthsEnum from 'src/auths/const/auths.enums';
import { TopicsService } from './topics.service';
import { TopicsPaginationDto } from './dto/topics-pagination.dto';
import { CreateTopicsDto } from './dto/create-topics.dto';

@ApiTags('topics')
@Controller('topics')
@ApiBearerAuth('access')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) { }

  @Get('/all')
  async getTopicsForSelect() {
    return this.topicsService.getTopicsForSelect();
  }

  @Get('/:name')
  async getTopic(@Param('name') name: string) {
    return this.topicsService.getTopic(name);
  }

  @Get('')
  async getTopics(@Query() query: TopicsPaginationDto) {
    return this.topicsService.getTopics(query);
  }


  @Post('')
  @Roles([AuthsEnum.CAN_USE_BLOG])
  async createTopic(@Body('') topic: CreateTopicsDto) {
    return this.topicsService.createTopic(topic);
  }

  @Delete('/:id')
  @Roles([AuthsEnum.CAN_USE_BLOG])
  async deleteTopic(@Param('id', ParseIntPipe) id: number) {
    return this.topicsService.deleteTopic(id);
  }

}
