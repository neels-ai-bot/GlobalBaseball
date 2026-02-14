import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, truncate } from "@/lib/utils";

interface ArticleCardProps {
  slug: string;
  title: string;
  excerpt?: string | null;
  type: string;
  publishedAt?: string | null;
  tags?: string[];
}

export function ArticleCard({ slug, title, excerpt, type, publishedAt, tags }: ArticleCardProps) {
  const typeBadgeVariant = (t: string) => {
    switch (t) {
      case "recap": return "success" as const;
      case "preview": return "info" as const;
      case "standings": return "warning" as const;
      default: return "default" as const;
    }
  };

  return (
    <Link href={`/blog/${slug}`}>
      <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
        <CardContent className="pt-6 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant={typeBadgeVariant(type)}>{type}</Badge>
            {publishedAt && (
              <span className="text-xs text-gray-500">{formatDate(publishedAt)}</span>
            )}
          </div>
          <h2 className="text-lg font-semibold mb-2 line-clamp-2">{title}</h2>
          {excerpt && (
            <p className="text-sm text-gray-600 flex-1">{truncate(excerpt, 150)}</p>
          )}
          {tags && tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-xs text-gray-400">#{tag}</span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
