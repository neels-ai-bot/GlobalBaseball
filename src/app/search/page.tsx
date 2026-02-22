"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";

interface SearchResult {
  type: "article" | "team" | "player";
  title: string;
  href: string;
  subtitle?: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    const supabase = createClient();
    const allResults: SearchResult[] = [];

    // Search articles
    const { data: articles } = await supabase
      .from("articles")
      .select("slug, title, type")
      .eq("status", "published")
      .ilike("title", `%${query}%`)
      .limit(10);

    if (articles) {
      allResults.push(
        ...articles.map((a) => ({
          type: "article" as const,
          title: a.title,
          href: `/blog/${a.slug}`,
          subtitle: a.type,
        }))
      );
    }

    // Search teams
    const { data: teams } = await supabase
      .from("teams")
      .select("id, country, name, abbreviation")
      .or(`country.ilike.%${query}%,name.ilike.%${query}%,abbreviation.ilike.%${query}%`)
      .limit(10);

    if (teams) {
      allResults.push(
        ...teams.map((t) => ({
          type: "team" as const,
          title: t.country,
          href: `/wbc/teams/${t.id}`,
          subtitle: t.name,
        }))
      );
    }

    // Search players
    const { data: players } = await supabase
      .from("players")
      .select("id, full_name, position, birth_country")
      .ilike("full_name", `%${query}%`)
      .limit(10);

    if (players) {
      allResults.push(
        ...players.map((p) => ({
          type: "player" as const,
          title: p.full_name,
          href: `/wbc/players/${p.id}`,
          subtitle: `${p.position || ""}${p.birth_country ? ` · ${p.birth_country}` : ""}`,
        }))
      );
    }

    setResults(allResults);
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Search</h1>

      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <Input
          type="text"
          placeholder="Search teams, players, articles..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </form>

      {searched && results.length === 0 && !loading && (
        <p className="text-gray-500 text-center py-8">
          No results found for &quot;{query}&quot;
        </p>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((result, i) => (
            <Link key={i} href={result.href}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="py-4 flex items-center gap-3">
                  <Badge
                    variant={
                      result.type === "article" ? "info" :
                      result.type === "team" ? "success" : "default"
                    }
                  >
                    {result.type}
                  </Badge>
                  <div>
                    <p className="font-medium">{result.title}</p>
                    {result.subtitle && (
                      <p className="text-sm text-gray-500">{result.subtitle}</p>
                    )}
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
