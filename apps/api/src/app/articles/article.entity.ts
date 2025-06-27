import { Entity, PrimaryKey, Property, Index } from '@mikro-orm/core';
import { FullTextType, WeightedFullTextValue } from '@mikro-orm/postgresql';

@Entity({ tableName: 'articles' })
export class ArticleEntity {
  @PrimaryKey({ autoincrement: true })
  id: number;

  @Property({ type: 'text' })
  title!: string;

  @Property({ type: 'text' })
  content!: string;

  @Property({
    type: 'timestamp with time zone',
    defaultRaw: 'CURRENT_TIMESTAMP',
  })
  createdAt: Date = new Date();

  @Property({
    type: 'timestamp with time zone',
    defaultRaw: 'CURRENT_TIMESTAMP',
    onUpdate: () => new Date(),
  })
  updatedAt: Date = new Date();

  @Index({ type: 'fulltext' })
  @Property({
    type: new FullTextType('english'),
    onUpdate: (article: ArticleEntity) => ({
      A: article.title || '',
      B: article.content || '',
    }),
    onCreate: (article) => ({
      A: article.title || '',
      B: article.content || '',
    }),
    name: 'search_vector',
    hidden: true
  })
  searchVector!: WeightedFullTextValue;
}
