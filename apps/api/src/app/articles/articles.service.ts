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

  /**
   * Searches for articles based on the provided query using full-text search.
   **/
  async search(query: string): Promise<ArticleEntity[]> {
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

  /**
   * Performs a search query on articles and returns results with highlighted matches and ranking.
   */
  async searchWithHighlights(query: string): Promise<any[]> {
    return await this.em.getConnection().execute(
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
  }

  /**
   * Executes a dynamic search query on the articles database table based on a given input string.
   */
  async searchDynamic(query: string): Promise<any[]> {
    return await this.em.getConnection().execute(
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
  }
}
