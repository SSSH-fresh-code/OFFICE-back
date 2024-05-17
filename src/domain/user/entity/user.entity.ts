import { IsEmail } from 'class-validator';
import { AuthsEntity } from 'src/auths/entities/auths.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import { WorkEntity } from 'src/work/entities/work.entity';
import { Column, DeleteDateColumn, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user')
export class UserEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    nullable: false,
    unique: true,
  })
  @IsEmail()
  email: string;

  @Column({
    select: false,
    nullable: false,
  })
  password: string;

  @Column({
    nullable: false,
    unique: true,
  })
  name: string;

  // @OneToMany(() => WorkEntity, (work) => work.user)
  // works: WorkEntity[];

  // @ManyToMany(() => AuthsEntity, (auths) => auths.code, { nullable: true })
  // @JoinTable()
  // auths: AuthsEntity[];

  @DeleteDateColumn()
  deletedAt: Date | null;
}
