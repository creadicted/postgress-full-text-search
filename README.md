This project is a TypeScript/NestJS implementation of the [postgres-full-text-search-example](https://github.com/andfadeev/postgres-full-text-search-example) repository, demonstrating PostgreSQL's powerful full-text search capabilities in a Node.js environment.

## Features

This project showcases two primary approaches to PostgreSQL full-text search:

- **Pre-calculated search vectors** stored in the database
- **Dynamically built search vectors** created at query time

## Technology Stack

- **Framework**: NestJS 11.0.0
- **ORM**: MikroORM 6.4.16 with PostgreSQL driver
- **Build Tools**: Nx 21.2.1 (monorepo support)

## Dataset

This project uses the News Articles dataset downloaded from [Kaggle](https://www.kaggle.com/datasets/asad1m9a9h6mood/news-articles?resource=download).

To set up the dataset:

1. Download the dataset from the link above
2. Place the `Articles.csv` file in the `.dataset` folder at the project root

## Getting Started

### Prerequisites

- Node.js and npm
- PostgreSQL database

### Installation

1. Clone the repository:

```sh
   git clone <repository-url>
   cd postgres-full-text-search
```

1. Install dependencies:

```sh
   npm install
```

1. Start the PostgreSQL database (using Docker Compose):

```sh
   docker-compose up -d
```

1. Run the application:

```sh
   npx nx serve api
```

## API Endpoints

The application provides several endpoints to demonstrate full-text search capabilities:

### Articles

- `GET /articles` - List all articles (basic info)
- `GET /articles/count` - Count all articles
- `GET /articles/:id` - Get a specific article by ID

### Search

- `GET /articles/search/basic` - Basic search using pre-calculated vectors

```
  /articles/search/basic?query=your search terms
```

- `GET /articles/search/highlights` - Search with highlighted matching text

```
  /articles/search/highlights?query=your search terms
```

- `GET /articles/search/dynamic` - Search using dynamically built vectors

```
  /articles/search/dynamic?query=your search terms
```

## Implementation Details

### Article Entity

The project uses MikroORM with a PostgreSQL-specific to manage the search vectors: `FullTextType`

```typescript
@Entity({ tableName: 'articles' })
export class ArticleEntity {
  @PrimaryKey({ autoincrement: true })
  id: number;

  @Property({ type: 'text' })
  title!: string;

  @Property({ type: 'text' })
  content!: string;

  // Pre-calculated search vector with different weights
  @Index({ type: 'fulltext' })
  @Property({
    type: new FullTextType('english'),
    onUpdate: (article: ArticleEntity) => ({
      A: article.title || '', // Weight A (highest)
      B: article.content || '', // Weight B (medium)
    }),
    name: 'search_vector',
    hidden: true,
  })
  searchVector!: WeightedFullTextValue;
}
```

### Search Implementation

#### Basic Search

Uses MikroORM's built-in support for full-text search operators:

```typescript
async search(query: string): Promise<ArticleEntity[]> {
  return this.articleRepository.find(
    {
      searchVector: {$fulltext: query},
    },
    {
      orderBy: {id: 'DESC'},
      limit: 5
    }
  );
}
```

#### Search with Highlights

Uses raw SQL with PostgreSQL's function to highlight matching terms: `ts_headline`

```typescript
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
```

#### Dynamic Search

Builds the search vector on-the-fly instead of using the pre-calculated column:

```typescript
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
```

## When to Use Each Approach

- **Pre-calculated vectors**: Ideal for better performance on large datasets with infrequent updates
- **Dynamic vectors**: Useful when:
  - You need to search across columns not included in the pre-calculated vector
  - You want to use different weights for different search contexts
  - The search vector definition needs to change frequently
 
## Metrics
- **Total Article count in dataset**: 2692 
Searching for the "gardening" keyword:
- **Pre-calculated vectors**: 
    - **Basic**: 4-6ms
    - **Highlight**: 4-6ms 
- **Dynamic vectors**: 700ms
