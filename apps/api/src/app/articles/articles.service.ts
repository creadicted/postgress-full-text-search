import { Injectable } from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { ArticleEntity } from './article.entity';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly articleRepository: EntityRepository<ArticleEntity>,
    private readonly em: EntityManager
  ) {}

  async count() {
    return this.articleRepository.count();
  }

  async findAll(): Promise<Partial<ArticleEntity>[]> {
    return this.articleRepository.findAll({
      fields: ['id', 'title'],
    });
  }

  async findById(id: number): Promise<ArticleEntity | null> {
    return this.articleRepository.findOne({ id });
  }

  async search(query: string): Promise<ArticleEntity[]> {
    // Using the full-text search functionality with entity manager
    return this.articleRepository.find(
      {
        searchVector: { $fulltext: query },
      },
      {
        orderBy: { id: 'DESC' },
        limit: 5,
      }
    );
  }

  async searchWithHighlights(query: string): Promise<any[]> {
    // More advanced search with highlights and rank using raw SQL
    // This mimics your Clojure example with ts_headline
    const conn = this.em.getConnection();

    // Use question mark (?) for parameters instead of $1
    // Also use the correct table name from the entity
    const results = await conn.execute(
      `
        SELECT id,
               ts_headline('english', title, plainto_tsquery('english', ?),
                           'StartSel=<b>, StopSel=</b>')             AS highlighted_title,
               ts_headline('english', content, plainto_tsquery('english', ?),
                           'StartSel=<b>, StopSel=</b>')             AS highlighted_content,
               title,
               content,
               ts_rank(search_vector, plainto_tsquery('english', ?)) AS rank
        FROM articles
        WHERE search_vector @@ plainto_tsquery('english', ?)
        ORDER BY rank DESC
        LIMIT 5
      `,
      [query, query, query, query]
    );

    return results;
  }

  async searchDynamic(query: string): Promise<any[]> {
    // This demonstrates dynamic vector calculation without using the stored column
    const conn = this.em.getConnection();
    const results = await conn.execute(
      `
        SELECT id,
               title,
               content,
               ts_rank(
                 setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
                 setweight(to_tsvector('english', coalesce(content, '')), 'B'),
                 plainto_tsquery('english', ?)
               ) AS rank
        FROM articles
        WHERE setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
              setweight(to_tsvector('english', coalesce(content, '')), 'B') @@ plainto_tsquery('english', ?)
        ORDER BY rank DESC
        LIMIT 5
      `,
      [query, query]
    );

    return results;
  }
}
