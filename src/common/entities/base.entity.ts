import { CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Column } from 'typeorm';
const isProductionOrDevelopment = process.env.NEST_MODE === 'production' || process.env.NEST_MODE === 'development';

export abstract class BaseEntity {
  @CreateDateColumn({ type: isProductionOrDevelopment ? 'timestamptz' : 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: isProductionOrDevelopment ? 'timestamptz' : 'datetime' })
  updatedAt: Date;
}
