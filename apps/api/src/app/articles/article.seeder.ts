import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { ArticleEntity } from './article.entity';

/**
 * ArticleSeeder is responsible for populating the database with sample
 * article data by reading and processing a provided CSV file.
 */
export class ArticleSeeder extends Seeder {
  private readonly CSV_PATH = path.resolve(
    process.cwd(),
    'dataset',
    'Articles.csv'
  );

  async run(em: EntityManager): Promise<void> {
    if (await this.shouldSkipSeeding(em)) {
      return;
    }

    try {
      const records = await this.loadArticlesFromCsv();
      await this.createArticleEntities(em, records);
      console.log(`Successfully seeded ${records.length} articles.`);
    } catch (error) {
      console.error('Error seeding articles:', error);
    }
  }

  private async shouldSkipSeeding(em: EntityManager): Promise<boolean> {
    const articlesCount = await em.count(ArticleEntity);
    if (articlesCount > 0) {
      console.log(
        `Database already has ${articlesCount} articles, skipping seeding.`
      );
      return true;
    }
    return false;
  }

  private async loadArticlesFromCsv(): Promise<any[]> {
    const csvData = fs.readFileSync(this.CSV_PATH, 'utf8');
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    console.log(`Found ${records.length} articles in CSV file.`);
    return records;
  }

  private async createArticleEntities(
    em: EntityManager,
    records: any[]
  ): Promise<void> {
    for (const record of records) {
      const article = em.create(ArticleEntity, {
        title: record.Heading || 'Untitled',
        content: record.Article || '',
        createdAt: record.Date ? new Date(record.Date) : new Date(),
        updatedAt: new Date(),
      });
      em.persist(article);
    }
    await em.flush();
  }
}
