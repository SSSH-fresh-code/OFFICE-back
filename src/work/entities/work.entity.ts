import { Exclude } from 'class-transformer';
import { BaseEntity } from 'src/common/entities/base.entity';
import { UserEntity } from 'src/users/entities/user.entity';
import { Column, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { IWork } from 'types-sssh';

@Entity('work')
export class WorkEntity extends BaseEntity implements IWork {
  @PrimaryColumn()
  userUuid: string;

  @PrimaryColumn({
    length: 10,
    nullable: false
  })
  baseDate: string;

  @Column({ type: "varchar", length: "10000", nullable: true })
  workDetail: string;

  @Column({ nullable: true })
  offTime: Date;

  @ManyToOne(() => UserEntity, (user) => user.id)
  @JoinColumn({ name: 'userUuid' })
  user: UserEntity
}
