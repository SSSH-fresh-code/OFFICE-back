import { BadRequestException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ExceptionMessages } from 'src/common/message/exception.message';
import { CommonService } from 'src/common/common.service';
import { SeriesEntity } from './entities/series.entity';
import { seriesPaginationDto } from './dto/series-pagination.dto';
import { CreateSeriesDto } from './dto/create-series.dto';

@Injectable()
export class SeriesService {
  constructor(
    @Inject('SERIES_REPOSITORY')
    private readonly seriesRepository: Repository<SeriesEntity>,
    private readonly commonService: CommonService,
  ) { }

  async getSeries(id: number) {
    const series = await this.seriesRepository.findOne({ where: { id } });

    /** TODO: series, post 가져오기 */
    return series;
  }

  async getSeriesList(page: seriesPaginationDto) {
    return await this.commonService.paginate<SeriesEntity>(page, this.seriesRepository);
  }

  async createSeries(dto: CreateSeriesDto) {
    const topic = await this.seriesRepository.create(dto);

    return await this.seriesRepository.save(topic);
  }

  async deleteSeries(id: number) {
    const series = await this.seriesRepository.findOne({ where: { id } });

    if (!series) throw new BadRequestException(ExceptionMessages.NOT_EXIST_ID);

    const del = await this.seriesRepository.delete(series.id);

    if (del.affected < 1) throw new InternalServerErrorException(ExceptionMessages.INTERNAL_SERVER_ERROR);

    return del;
  }
}
