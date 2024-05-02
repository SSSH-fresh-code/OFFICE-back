import { Body, Controller, DefaultValuePipe, Delete, Get, Param, ParseBoolPipe, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiParam, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorator/roles.decorator';
import AuthsEnum from 'src/auths/const/auths.enums';
import { TopicsService } from './topics.service';
import { TopicsPaginationDto } from './dto/topics-pagination.dto';
import { CreateTopicsDto } from './dto/create-topics.dto';

@ApiTags('topics')
@Controller('topics')
@ApiBearerAuth('access')
@Roles([AuthsEnum.ADMIN_ALARMS])
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) { }

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

  @Delete('/:name')
  @Roles([AuthsEnum.CAN_USE_BLOG])
  async deleteTopic(@Param('name') name: string) {
    return this.topicsService.deleteTopic(name);
  }

}
