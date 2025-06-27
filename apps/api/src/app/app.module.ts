import { Module } from '@nestjs/common';
import { ArticlesModule } from './articles/articles.module';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [DatabaseModule, ArticlesModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
