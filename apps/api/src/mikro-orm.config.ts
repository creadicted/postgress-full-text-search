import { defineConfig, PostgreSqlDriver } from '@mikro-orm/postgresql';
import 'dotenv/config';
import 'reflect-metadata';
import { Migrator } from '@mikro-orm/migrations';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { SeedManager } from '@mikro-orm/seeder';
import { ArticleEntity } from './app/articles/article.entity';

export default defineConfig({
  driver: PostgreSqlDriver,
  entities: [ArticleEntity],
  dbName: 'postgres_fts',
  host: 'localhost',
  port: 4433,
  user: 'postgres',
  password: 'postgres',
  debug: true,
  extensions: [Migrator, EntityGenerator, SeedManager],
  migrations: {
    path: 'apps/api/src/migrations',
    pathTs: 'apps/api/src/migrations',
    tableName: 'mikro_orm_migrations',
    glob: '!(*.d).{js,ts}',
    transactional: true,
    allOrNothing: true,
    dropTables: false,
    safe: false,
    snapshot: false,
  },
});
