import { BaseEntity } from 'src/common/entities/base.entity';
import { Page } from "@sssh-fresh-code/types-sssh";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { FindManyOptions } from "typeorm";
import ISsshRepository from "../repository/iSsshRepository";

export default interface iCommonService {
  paginate<T extends BaseEntity>(
    dto: PaginationDto,
    select: ISsshRepository<T>['select'],
    overrideFindOptions?: FindManyOptions<T>
  ): Promise<Page<T>>;
}