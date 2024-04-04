import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TUserRole, TAlarms } from 'types-sssh';

@Entity('alarms')
export class AlarmsEntity extends BaseEntity implements TAlarms {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: "smallint", nullable: false })
  order: number;

  @Column({ type: "varchar", length: "30", nullable: false })
  name: string;

  @Column({ type: "varchar", length: "30", nullable: false })
  icon: string;

  @Column({ type: "varchar", length: "100", nullable: false })
  title: string;

  @Column({ type: "varchar", length: "200", nullable: false })
  contents: string;

  @Column({ type: "varchar", length: "50", nullable: true })
  path: string;

  @Column({ type: "char", length: "10", default: 'ADMIN' })
  userRole: TUserRole;
}
