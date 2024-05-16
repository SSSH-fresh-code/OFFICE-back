import { FindManyOptions, InsertResult, UpdateResult, DeleteResult } from 'typeorm';

export default interface ISsshRepository<T> {
  insert(dto: any): Promise<InsertResult>;
  select?(option: FindManyOptions<T>): Promise<[T[], number]>;
  update(dto: any): Promise<UpdateResult>;
  delete(pk: string | number): Promise<DeleteResult>;
}
