import {Controller, Get, Param, Query} from '@nestjs/common';
import {ArticlesService} from './articles.service';
import {ArticleEntity} from './article.entity';
import {SearchArticleDto} from './dtos/search-article.dto';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {
  }

  @Get()
  async findAll(): Promise<Partial<ArticleEntity>[]> {
    return this.articlesService.findAll();
  }

  @Get('count')
  async countArticles() {
    return this.articlesService.count()
  }

  @Get(':id')
  async findById(@Param('id') id: number): Promise<ArticleEntity> {
    return this.articlesService.findById(id);
  }

  @Get('search/basic')
  async search(@Query() searchDto: SearchArticleDto): Promise<ArticleEntity[]> {
    return this.articlesService.search(searchDto.query);
  }

  @Get('search/highlights')
  async searchWithHighlights(
    @Query() searchDto: SearchArticleDto
  ): Promise<any[]> {
    return this.articlesService.searchWithHighlights(searchDto.query);
  }

  @Get('search/dynamic')
  async searchDynamic(@Query() searchDto: SearchArticleDto): Promise<any[]> {
    return this.articlesService.searchDynamic(searchDto.query);
  }
}
