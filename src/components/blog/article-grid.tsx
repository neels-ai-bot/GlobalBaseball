import { ArticleCard } from "./article-card";

interface Article {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  type: string;
  published_at: string | null;
  tags: string[];
}

interface ArticleGridProps {
  articles: Article[];
}

export function ArticleGrid({ articles }: ArticleGridProps) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No articles found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => (
        <ArticleCard
          key={article.id}
          slug={article.slug}
          title={article.title}
          excerpt={article.excerpt}
          type={article.type}
          publishedAt={article.published_at}
          tags={article.tags}
        />
      ))}
    </div>
  );
}
