import { MikroORM } from '@mikro-orm/core';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { DatabaseSeeder } from './database.seeder';

@Module({
  imports: [
    MikroOrmModule.forRoot({
      dbName: 'postgres_fts',
      host: 'localhost',
      port: 4433,
      user: 'postgres',
      password: 'postgres',
      driver: PostgreSqlDriver,
      autoLoadEntities: true,
      migrations: {
        path: './dist/apps/api/migrations',
        pathTs: './apps/api/migrations',
        tableName: 'mikro_orm_migrations',
        glob: '!(*.d).{js,ts}',
        transactional: true,
        allOrNothing: true,
        dropTables: false,
        safe: false,
        snapshot: false,
      },
      seeder: {
        path: './dist/apps/api/src/app/database',
        pathTs: './apps/api/src/app/database', // Path to your TS seeders (for dev)
        defaultSeeder: 'DatabaseSeeder',
        glob: '!(*.d).{js,ts}',
        emit: 'ts',
        fileName: (className: string) => className.toLowerCase(),
      },
    }),
  ],
})
export class DatabaseModule implements OnModuleInit {
  private readonly logger = new Logger(DatabaseModule.name);

  constructor(private readonly orm: MikroORM) {}

  async onModuleInit() {
    await this.orm.getSchemaGenerator().refreshDatabase();
    await this.seedDatabase();
    this.logger.log(`Database is up to date`);
  }

  private async seedDatabase(): Promise<void> {
    this.logger.log(`Seeding database`);
    await this.orm.getSeeder().seed(DatabaseSeeder);
  }
}
