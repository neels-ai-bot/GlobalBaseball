import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface ArticleMetaProps {
  type: string;
  publishedAt?: string | null;
  tags?: string[];
}

export function ArticleMeta({ type, publishedAt, tags }: ArticleMetaProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant={type === "recap" ? "success" : type === "preview" ? "info" : "default"}>
        {type}
      </Badge>
      {publishedAt && (
        <time className="text-sm text-gray-500" dateTime={publishedAt}>
          {formatDate(publishedAt)}
        </time>
      )}
      {tags && tags.length > 0 && (
        <div className="flex gap-1">
          {tags.map((tag) => (
            <span key={tag} className="text-xs text-gray-400">#{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}
