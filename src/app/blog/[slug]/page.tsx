import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: article } = await supabase
    .from("articles")
    .select("title, excerpt, meta_title, meta_description, published_at")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!article) return { title: "Article Not Found" };

  return {
    title: article.meta_title || article.title,
    description: article.meta_description || article.excerpt || "",
    openGraph: {
      title: article.meta_title || article.title,
      description: article.meta_description || article.excerpt || "",
      type: "article",
      publishedTime: article.published_at || undefined,
      authors: [siteConfig.name],
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: article } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!article) return notFound();

  // Get related articles
  const { data: related } = await supabase
    .from("articles")
    .select("slug, title, type, published_at")
    .eq("status", "published")
    .eq("league", article.league)
    .neq("id", article.id)
    .order("published_at", { ascending: false })
    .limit(3);

  return (
    <article className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Article Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant={article.type === "recap" ? "success" : article.type === "preview" ? "info" : "default"}>
            {article.type}
          </Badge>
          {article.published_at && (
            <time className="text-sm text-gray-500" dateTime={article.published_at}>
              {formatDate(article.published_at)}
            </time>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {article.title}
        </h1>
        {article.excerpt && (
          <p className="mt-4 text-lg text-gray-600">{article.excerpt}</p>
        )}
      </header>

      {/* Article Content */}
      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {/* Tags */}
      {article.tags && article.tags.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag: string) => (
              <Badge key={tag} variant="default">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Related Articles */}
      {related && related.length > 0 && (
        <section className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {related.map((item) => (
              <Link key={item.slug} href={`/blog/${item.slug}`}>
                <Card className="hover:shadow-md transition-shadow h-full">
                  <CardContent className="pt-4">
                    <Badge variant="default" className="mb-2">{item.type}</Badge>
                    <h3 className="font-medium line-clamp-2">{item.title}</h3>
                    {item.published_at && (
                      <p className="text-xs text-gray-500 mt-2">{formatDate(item.published_at)}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: article.title,
            description: article.excerpt,
            datePublished: article.published_at,
            dateModified: article.updated_at,
            author: {
              "@type": "Organization",
              name: siteConfig.name,
            },
            publisher: {
              "@type": "Organization",
              name: siteConfig.name,
              url: siteConfig.url,
            },
          }),
        }}
      />
    </article>
  );
}
