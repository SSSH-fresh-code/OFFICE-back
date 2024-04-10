import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('auths')
export class AuthsEntity extends BaseEntity {
  @PrimaryColumn({
    type: "char",
    length: "8"
  })
  code: string;

  @Column({ type: "varchar", length: "500", nullable: false })
  description: string;
}