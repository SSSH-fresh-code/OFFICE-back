import { PaginationDto } from "src/common/dto/pagination.dto";
import { BaseEntity } from "src/common/entities/base.entity";
import ISsshRepository from "../repository/iSsshRepository";
import { FindManyOptions, FindOptions, FindOptionsWhere } from "typeorm";
import { Page } from "@sssh-fresh-code/types-sssh";
import { FILTER_MAPPER } from "src/common/const/filter-mapper.const";
import iCommonService from "../interface/common.service.interface";

export default class CommonService implements iCommonService {
  constructor() { }

  async paginate<T extends BaseEntity>(dto, select, overrideFindOptions?): Promise<Page<T>> {
    const findOptions: FindManyOptions<T> = {
      ...this.composeFindOptions<T>(dto),
      ...overrideFindOptions
    }

    const take = findOptions.take;

    const [data, count] = await select(findOptions);

    return {
      data,
      info: {
        take: take,
        current: dto.page,
        last: Math.ceil(count / take),
        total: count
      }
    };
  }

  private composeFindOptions<T extends BaseEntity>(
    dto: PaginationDto
  ): FindManyOptions<T> {
    let where: FindManyOptions<T>['where'] = {};
    let order: FindManyOptions<T>['order'] = {};

    const entries = Object.entries(dto);
    const entriesLength = entries.length;

    for (let i = 0; i < entriesLength; i++) {
      const [key, value] = entries[i];

      if (key.startsWith('where__')) {
        where = {
          ...where,
          ...this.parseFilter(key, value),
        };
      } else if (key.startsWith('order__')) {
        order = {
          ...order,
          ...this.parseFilter(key, value),
        };
      }
    }

    return {
      where,
      order,
      take: dto.take,
      skip: dto.page ? dto.take * (dto.page - 1) : 0,
    }
  }

  private parseFilter<T extends BaseEntity>(key: string, value: string) {
    const options: FindOptionsWhere<T> = {};

    const split = key.split('__');

    if (split.length === 2) {
      options[split[1]] = value;
    } else {
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