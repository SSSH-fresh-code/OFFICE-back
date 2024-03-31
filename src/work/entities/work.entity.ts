import { Exclude } from 'class-transformer';
import { BaseEntity } from 'src/common/entities/base.entity';
import { UserEntity } from 'src/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { IWork } from 'types-sssh';

@Entity('work')
export class WorkEntity extends BaseEntity implements IWork {
  @PrimaryColumn()
  userId: string;

  @PrimaryColumn({
    length: 8,
    nullable: false
  })
  baseDate: string;

  @Column({ nullable: true })
  offTime: Date;

  @ManyToOne(() => UserEntity, (user) => user.id)
  @JoinColumn({ name: 'userId' })
  user: UserEntity
}
