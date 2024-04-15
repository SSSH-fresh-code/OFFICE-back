import { AuthsEntity } from 'src/auths/entities/auths.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import { WorkEntity } from 'src/work/entities/work.entity';
import { Column, DeleteDateColumn, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TUsers } from '@sssh-fresh-code/types-sssh';

@Entity('users')
export class UserEntity extends BaseEntity implements TUsers {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    nullable: false,
    unique: true,
  })
  userId: string;

  @Column({
    select: false,
    nullable: false,
  })
  userPw: string;

  @Column({
    nullable: false,
    unique: true,
  })
  userName: string;

  @Column({
    type: "boolean",
    default: false
  })
  isCertified: boolean;

  @DeleteDateColumn()
  isDelete: Date | null;

  @OneToMany(() => WorkEntity, (work) => work.user)
  works: WorkEntity[];

  @ManyToMany(() => AuthsEntity, (auths) => auths.code, { nullable: true })
  @JoinTable()
  auths: AuthsEntity[];
}
