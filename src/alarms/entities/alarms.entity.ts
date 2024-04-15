import { AuthsEntity } from 'src/auths/entities/auths.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { IAlarms } from '@sssh-fresh-code/types-sssh';

@Entity('alarms')
export class AlarmsEntity extends BaseEntity implements IAlarms {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: "smallint", nullable: false })
  order: number;

  @Column({ type: "varchar", length: "30", nullable: false, unique: true })
  name: string;

  @Column({ type: "varchar", length: "30", nullable: false })
  icon: string;

  @Column({ type: "varchar", length: "100", nullable: false })
  title: string;

  @Column({ type: "varchar", length: "200", nullable: false })
  contents: string;

  @Column({ type: "varchar", length: "50", nullable: true })
  path: string;

  @ManyToMany(() => AuthsEntity)
  @JoinTable()
  auths: AuthsEntity[];

}
