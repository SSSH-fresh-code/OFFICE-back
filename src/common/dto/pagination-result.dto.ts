import { Page, PageInfo } from "types-sssh";
import { BaseEntity } from "../entities/base.entity";

export class PaginationResult<T extends BaseEntity> implements Page<T> {
  data: T[];
  info: PageInfo;
}