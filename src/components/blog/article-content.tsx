interface ArticleContentProps {
  content: string;
}

export function ArticleContent({ content }: ArticleContentProps) {
  return (
    <div
      className="prose max-w-none"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
