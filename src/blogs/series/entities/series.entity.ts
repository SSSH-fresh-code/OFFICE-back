import { ISeries, ITopic } from '@sssh-fresh-code/types-sssh';
import { PostsEntity } from 'src/blogs/posts/entities/posts.entity';
import { TopicsEntity } from 'src/blogs/topics/entities/topics.entity';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('topics')
export class SeriesEntity extends BaseEntity implements ISeries {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: "varchar", length: "100", nullable: false, unique: true })
  name: string;

  @ManyToOne(() => TopicsEntity, (topic) => topic.id)
  @JoinColumn()
  topic: TopicsEntity

  @OneToMany(() => PostsEntity, (posts) => posts.series)
  posts: PostsEntity[];
}