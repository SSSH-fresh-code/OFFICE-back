import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { TUsers, TUserRole } from 'types-sssh';

@Entity()
export class UserEntity extends BaseEntity implements TUsers {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    nullable: false,
  })
  userId: string;

  @Column({
    nullable: false,
  })
  userPw: string;

  @Column({
    nullable: false,
  })
  userName: string;

  @Column({ default: 'USER' })
  userRole: TUserRole;
}
