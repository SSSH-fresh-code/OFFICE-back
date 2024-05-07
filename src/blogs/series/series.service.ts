import { BadRequestException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { FindManyOptions, QueryFailedError, Repository } from 'typeorm';
import { ExceptionMessages } from 'src/common/message/exception.message';
import { CommonService } from 'src/common/common.service';
import { SeriesEntity } from './entities/series.entity';
import { seriesPaginationDto } from './dto/series-pagination.dto';
import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';

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
    const overrideFindOptions: FindManyOptions<SeriesEntity> = {
      select: {
        id: true,
        name: true,
        createdAt: true,
        topic: {
          name: true
        }
      },
      where: {},
      relations: {
        topic: true
      }
    }

    if (page.where__topicName) {
      overrideFindOptions.where["topic"] = { name: page.where__topicName }
    }

    return await this.commonService.paginate<SeriesEntity>(page, this.seriesRepository, overrideFindOptions);
  }

  async getSeriesListByTopicForSelect(id: number) {
    return await this.seriesRepository.find({
      select: {
        id: true,
        name: true
      },
      where: {
        topic: { id }
      }
    });
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

  async updateSeries(dto: UpdateSeriesDto) {
    const series = await this.seriesRepository.findOne({ where: { id: dto.id } });

    try {
      const seriesDto = await this.seriesRepository.create({
        ...series,
        name: dto.name,
        topic: { id: dto.topicId }
      });

      return await this.seriesRepository.save(seriesDto);
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
