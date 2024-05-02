import { ITopic } from '@sssh-fresh-code/types-sssh';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('topics')
export class TopicsEntity extends BaseEntity implements ITopic {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: "varchar", length: "30", nullable: false, unique: true })
  name: string;
}