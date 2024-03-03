import { BaseEntity } from "../entities/base.entity";

export class PaginationResult<T extends BaseEntity> {
  data: T[];
  total: number;
}