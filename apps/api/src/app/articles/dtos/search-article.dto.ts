import { ApiProperty } from '@nestjs/swagger';

export class SearchArticleDto {
  @ApiProperty()
  query: string;
}
