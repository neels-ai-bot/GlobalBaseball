import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://globalbaseball.com";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/wbc`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/wbc/schedule`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/wbc/standings`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE_URL}/wbc/teams`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/wbc/players`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
  ];

  // Dynamic pages from Supabase (only if configured)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === "your-supabase-url") {
    return staticPages;
  }

  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();

    const { data: articles } = await supabase
      .from("articles")
      .select("slug, updated_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(500);

    const articlePages: MetadataRoute.Sitemap = (articles || []).map((article) => ({
      url: `${BASE_URL}/blog/${article.slug}`,
      lastModified: new Date(article.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    const { data: teams } = await supabase
      .from("teams")
      .select("mlb_id, updated_at")
      .eq("league", "wbc");

    const teamPages: MetadataRoute.Sitemap = (teams || []).map((team) => ({
      url: `${BASE_URL}/wbc/teams/${team.mlb_id}`,
      lastModified: new Date(team.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    return [...staticPages, ...articlePages, ...teamPages];
  } catch {
    return staticPages;
  }
}
