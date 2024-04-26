import { IMenu } from '@sssh-fresh-code/types-sssh';
import { AuthsEntity } from 'src/auths/entities/auths.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('menus')
export class MenusEntity extends BaseEntity implements IMenu {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: "smallint", nullable: false })
  order: number;

  @Column({ type: "varchar", length: "30", nullable: false, unique: true })
  name: string;

  @Column({ type: "smallint", nullable: true })
  icon?: number;

  @Column({ type: "varchar", length: "100", nullable: true })
  link?: string;

  @ManyToMany(() => AuthsEntity)
  @JoinTable()
  auths: AuthsEntity[];

  @ManyToOne((type) => MenusEntity, (menus) => menus.childMenus)
  parentMenus?: MenusEntity;

  @OneToMany((type) => MenusEntity, (menus) => menus.parentMenus)
  childMenus: MenusEntity[];
}