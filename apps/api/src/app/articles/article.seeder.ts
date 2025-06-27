import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { ArticleEntity } from './article.entity';

export class ArticleSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const articlesCount = await em.count(ArticleEntity);

    // Skip if there are already articles in the database
    if (articlesCount > 0) {
      console.log(
        `Database already has ${articlesCount} articles, skipping seeding.`
      );
      return;
    }

    try {
      // Read the CSV file
      const csvFilePath = path.resolve(
        process.cwd(),
        'dataset',
        'Articles.csv'
      );
      const csvData = fs.readFileSync(csvFilePath, 'utf8');

      // Parse CSV content
      const records = parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      console.log(`Found ${records.length} articles in CSV file.`);

      // Process and create entities
      for (const record of records) {
        // Handle the CSV columns correctly based on the provided sample
        const article = em.create(ArticleEntity, {
          title: record.Heading || 'Untitled',
          content: record.Article || '',
          createdAt: record.Date ? new Date(record.Date) : new Date(),
          updatedAt: new Date(),
        });

        em.persist(article);
      }

      await em.flush();
      console.log(`Successfully seeded ${records.length} articles.`);
    } catch (error) {
      console.error('Error seeding articles:', error);
    }
  }
}
