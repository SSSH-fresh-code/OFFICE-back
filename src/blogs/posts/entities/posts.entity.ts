import { IPost } from '@sssh-fresh-code/types-sssh';
import { SeriesEntity } from 'src/blogs/series/entities/series.entity';
import { TopicsEntity } from 'src/blogs/topics/entities/topics.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import { UserEntity } from 'src/users/entities/user.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('posts')
export class PostsEntity extends BaseEntity implements IPost {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Index({ unique: true })
  @Column({ type: "varchar", length: "250" })
  title: string;

  @Column({ type: "varchar", length: "3000", nullable: true })
  description: string;

  @Column({ type: "text", nullable: false })
  contents: string;

  @ManyToOne(() => TopicsEntity, (topic) => topic.id)
  @JoinColumn()
  topic: TopicsEntity

  @ManyToOne(() => SeriesEntity, (series) => series.id)
  @JoinColumn()
  series?: SeriesEntity

  @ManyToOne(() => UserEntity, (user) => user.id)
  @JoinColumn()
  author: UserEntity;
}