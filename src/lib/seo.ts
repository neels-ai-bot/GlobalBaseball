import { Metadata } from "next";
import { siteConfig } from "@/config/site";

interface SeoProps {
  title: string;
  description: string;
  path?: string;
  type?: "website" | "article";
  publishedTime?: string;
  image?: string;
}

export function generateSeoMetadata({
  title,
  description,
  path = "",
  type = "website",
  publishedTime,
  image,
}: SeoProps): Metadata {
  const url = `${siteConfig.url}${path}`;
  const ogImage = image || siteConfig.ogImage;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      type,
      ...(publishedTime && { publishedTime }),
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: url,
    },
  };
}

export function generateArticleJsonLd(article: {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  updatedAt: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    url: `${siteConfig.url}/blog/${article.slug}`,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };
}

export function generateWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
  };
}
