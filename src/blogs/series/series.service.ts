import { BadRequestException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { QueryFailedError, Repository } from 'typeorm';
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
    const series = await this.seriesRepository.createQueryBuilder("series")
      .loadRelationCountAndMap('series.postsCnt', 'series.posts', 'posts')
      .leftJoinAndSelect('series.topic', 'topic')
      .where("series.id = :id", { id })
      .getOne();

    if (!series) throw new NotFoundException(ExceptionMessages.NOT_EXIST_ID);

    return series;
  }

  async getSeriesList(page: seriesPaginationDto) {
    return await this.commonService.paginate<SeriesEntity>(page, this.seriesRepository, {
      select: {
        id: true,
        name: true,
        createdAt: true,
        topic: {
          name: true
        }
      },
      relations: {
        topic: true
      }
    });
  }

  async getSeriesListForSelect() {
    return await this.seriesRepository.find({
      select: {
        id: true,
        name: true
      }
    })
  }
  async createSeries(dto: CreateSeriesDto) {
    const seriesDto = await this.seriesRepository.create({
      ...dto,
      topic: { id: dto.topicId }
    });

    try {
      const { id } = await this.seriesRepository.save(seriesDto);
      return { id };
    } catch (e: any) {
      if (e instanceof QueryFailedError) {
        if (e.driverError.code === "23505") {
          throw new BadRequestException(ExceptionMessages.EXIST_NAME);
        }
      }
    }

    throw new InternalServerErrorException(ExceptionMessages.INTERNAL_SERVER_ERROR);
  }

  async deleteSeries(id: number) {
    const series = await this.seriesRepository.findOne({ where: { id } });

    if (!series) throw new NotFoundException(ExceptionMessages.NOT_EXIST_ID);

    const del = await this.seriesRepository.delete(series.id);

    if (del.affected < 1) throw new InternalServerErrorException(ExceptionMessages.INTERNAL_SERVER_ERROR);

    return del;
  }
}
