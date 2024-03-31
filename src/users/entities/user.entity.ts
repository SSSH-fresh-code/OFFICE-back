import { Exclude } from 'class-transformer';
import { BaseEntity } from 'src/common/entities/base.entity';
import { WorkEntity } from 'src/work/entities/work.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TUsers, TUserRole } from 'types-sssh';

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

  @Column({ default: 'GUEST' })
  userRole: TUserRole;


  @OneToMany(() => WorkEntity, (work) => work.user)
  works: WorkEntity[];
}
