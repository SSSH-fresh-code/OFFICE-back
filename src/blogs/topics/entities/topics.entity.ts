import { ITopic } from '@sssh-fresh-code/types-sssh';
import { PostsEntity } from 'src/blogs/posts/entities/posts.entity';
import { SeriesEntity } from 'src/blogs/series/entities/series.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('topics')
export class TopicsEntity extends BaseEntity implements ITopic {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Index({ unique: true })
  @Column({ type: "varchar", length: "100", nullable: false })
  name: string;

  @OneToMany(() => SeriesEntity, (series) => series.topic)
  series: SeriesEntity[];

  @OneToMany(() => PostsEntity, (posts) => posts.topic)
  posts: PostsEntity[];
}