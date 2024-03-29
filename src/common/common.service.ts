import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseEntity } from './entities/base.entity';
import { PaginationDto } from './dto/pagination.dto';
import { FindManyOptions, FindOptions, FindOptionsOrder, FindOptionsWhere, Repository } from 'typeorm';
import { FILTER_MAPPER } from './const/filter-mapper.const';
import { PaginationResult } from './dto/pagination-result.dto';

@Injectable()
export class CommonService {
  async paginate<T extends BaseEntity>(
    dto: PaginationDto,
    repo: Repository<T>,
    overrideFindOptions?: FindManyOptions<T>
  ): Promise<PaginationResult<T>> {
    const findOptions = {
      ...this.composeFindOptions<T>(dto),
      ...overrideFindOptions
    }

    const take = findOptions.take;

    const [data, count] = await repo.findAndCount(findOptions);

    const lastPage = Math.ceil(count / take);

    return {
      data,
      info: {
        take: dto.take,
        current: dto.page,
        last: lastPage,
        total: count
      }
    };
  }

  private composeFindOptions<T extends BaseEntity>(
    dto: PaginationDto
  ): FindManyOptions<T> {
    let where: FindOptionsWhere<T> = {};
    let order: FindOptionsOrder<T> = {};

    for (const [key, value] of Object.entries(dto)) {
      /**
       * key -> where__id__less_than
       * value -> 1
       */

      if (key.startsWith('where__')) {
        where = {
          ...where,
          ...this.parseWhereFilter(key, value),
        };
      } else if (key.startsWith('order__')) {
        order = {
          ...order,
          ...this.parseWhereFilter(key, value),
        };
      }
    }

    return {
      where,
      order,
      take: dto.take,
      skip: dto.page ? dto.take * (dto.page - 1) : 0,
    };
  }

  private parseWhereFilter<T extends BaseEntity>(
    key: string,
    value: any,
  ): FindOptionsWhere<T> | FindOptionsOrder<T> {
    const options: FindOptionsWhere<T> = {};

    const split = key.split('__');

    if (split.length !== 2 && split.length !== 3) {
      throw new BadRequestException(
        `where 필터는 '__'로 split 하였을때 길이가 2 또는 3이어야 합니다. - key : ${key}`,
      );
    }
    if (split.length == 2) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      options[split[1]] = value;
    } else {
      // Typeorm 유틸리티 적용이 필요한 경우
      const field = split[1];
      const operator = split[2];

      if (operator === 'i_like') {
        options[field] = FILTER_MAPPER[operator](`%${value}`);
      } else {
        options[field] = FILTER_MAPPER[operator](value);
      }
    }

    return options;
  }
}
