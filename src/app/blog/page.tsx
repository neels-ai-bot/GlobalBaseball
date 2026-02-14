import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, truncate } from "@/lib/utils";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description: "Latest articles, game recaps, previews, and analysis from GlobalBaseball.",
};

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const supabase = await createClient();

  const { data: articles } = await supabase
    .from("articles")
    .select("id, slug, title, excerpt, type, tags, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(50);

  const typeBadgeVariant = (type: string) => {
    switch (type) {
      case "recap": return "success" as const;
      case "preview": return "info" as const;
      case "standings": return "warning" as const;
      case "predictions": return "error" as const;
      default: return "default" as const;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-8">Latest Articles</h1>

      {!articles || articles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <p className="text-lg">No articles published yet.</p>
            <p className="text-sm mt-2">Articles are automatically generated from game data.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Link key={article.id} href={`/blog/${article.slug}`}>
              <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
                <CardContent className="pt-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant={typeBadgeVariant(article.type)}>
                      {article.type}
                    </Badge>
                    {article.published_at && (
                      <span className="text-xs text-gray-500">
                        {formatDate(article.published_at)}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-semibold mb-2 line-clamp-2">
                    {article.title}
                  </h2>
                  {article.excerpt && (
                    <p className="text-sm text-gray-600 flex-1">
                      {truncate(article.excerpt, 150)}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-1">
                    {article.tags?.slice(0, 3).map((tag: string) => (
                      <span key={tag} className="text-xs text-gray-400">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
