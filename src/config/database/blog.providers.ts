import { PostsEntity } from "src/blogs/posts/entities/posts.entity";
import { SeriesEntity } from "src/blogs/series/entities/series.entity";
import { TopicsEntity } from "src/blogs/topics/entities/topics.entity";
import { DataSource } from "typeorm";

export const blogProvider = [
  {
    provide: 'TOPICS_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(TopicsEntity),
    inject: ['DATA_SOURCE']
  },
  {
    provide: 'SERIES_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(SeriesEntity),
    inject: ['DATA_SOURCE']
  },
  {
    provide: 'POSTS_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(PostsEntity),
    inject: ['DATA_SOURCE']
  },
];