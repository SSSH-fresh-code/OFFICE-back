import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorator/roles.decorator';
import AuthsEnum from 'src/auths/const/auths.enums';
import { SeriesService } from './series.service';
import { seriesPaginationDto } from './dto/series-pagination.dto';
import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';

@ApiTags('series')
@Controller('series')
@ApiBearerAuth('access')
export class SeriesController {
  constructor(private readonly seriesService: SeriesService) { }

  @Get('/all')
  async getSeriesListByTopicForSelect(@Query('id', ParseIntPipe) id: number) {
    return this.seriesService.getSeriesListByTopicForSelect(id);
  }

  @Get('/:id')
  async getSeries(@Param('id', ParseIntPipe) id: number) {
    return this.seriesService.getSeries(id);
  }

  @Get('')
  async getSeriesList(@Query() query: seriesPaginationDto) {
    return this.seriesService.getSeriesList(query);
  }


  @Post('')
  @Roles([AuthsEnum.CAN_USE_BLOG])
  async createSeries(@Body('') series: CreateSeriesDto) {
    return this.seriesService.createSeries(series);
  }

  @Patch('')
  @Roles([AuthsEnum.CAN_USE_BLOG])
  async updateSeries(@Body('') series: UpdateSeriesDto) {
    return this.seriesService.updateSeries(series);
  }

  @Delete('/:id')
  @Roles([AuthsEnum.CAN_USE_BLOG])
  async deleteSeries(@Param('id', ParseIntPipe) id: number) {
    return this.seriesService.deleteSeries(id);
  }

}
