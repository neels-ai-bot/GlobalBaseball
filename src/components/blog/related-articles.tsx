import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface RelatedArticle {
  slug: string;
  title: string;
  type: string;
  published_at: string | null;
}

interface RelatedArticlesProps {
  articles: RelatedArticle[];
}

export function RelatedArticles({ articles }: RelatedArticlesProps) {
  if (articles.length === 0) return null;

  return (
    <section className="mt-12 pt-8 border-t border-gray-200">
      <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {articles.map((article) => (
          <Link key={article.slug} href={`/blog/${article.slug}`}>
            <Card className="hover:shadow-md transition-shadow h-full">
              <CardContent className="pt-4">
                <Badge variant="default" className="mb-2">{article.type}</Badge>
                <h3 className="font-medium line-clamp-2">{article.title}</h3>
                {article.published_at && (
                  <p className="text-xs text-gray-500 mt-2">{formatDate(article.published_at)}</p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
