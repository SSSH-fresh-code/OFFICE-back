import { TopicsEntity } from "src/blogs/topics/entities/topics.entity";
import { DataSource } from "typeorm";

export const blogProvider = [
  {
    provide: 'TOPICS_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(TopicsEntity),
    inject: ['DATA_SOURCE']
  },
];