import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ gameId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { gameId } = await params;
  const supabase = await createClient();
  const { data: game } = await supabase
    .from("games")
    .select(`
      away_team:teams!games_away_team_id_fkey(country),
      home_team:teams!games_home_team_id_fkey(country)
    `)
    .eq("mlb_game_pk", parseInt(gameId))
    .single();

  const away = Array.isArray(game?.away_team) ? game?.away_team[0] : game?.away_team;
  const home = Array.isArray(game?.home_team) ? game?.home_team[0] : game?.home_team;

  return {
    title: game ? `${away?.country} vs ${home?.country}` : "Game Details",
  };
}

export default async function GamePage({ params }: PageProps) {
  const { gameId } = await params;
  const supabase = await createClient();

  const { data: game } = await supabase
    .from("games")
    .select(`
      *,
      away_team:teams!games_away_team_id_fkey(*),
      home_team:teams!games_home_team_id_fkey(*)
    `)
    .eq("mlb_game_pk", parseInt(gameId))
    .single();

  if (!game) return notFound();

  const away = Array.isArray(game.away_team) ? game.away_team[0] : game.away_team;
  const home = Array.isArray(game.home_team) ? game.home_team[0] : game.home_team;
  const isFinal = game.status === "final";
  const isLive = game.status === "live";

  // Get related article
  const { data: article } = await supabase
    .from("articles")
    .select("slug, title, type")
    .eq("game_id", game.id)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Game Header */}
      <Card className="mb-8">
        <CardContent className="py-8">
          <div className="text-center mb-4">
            {isLive && <Badge variant="error" className="mb-2">LIVE</Badge>}
            {isFinal && <Badge variant="default" className="mb-2">Final</Badge>}
            {game.series_description && (
              <p className="text-sm text-gray-500">{game.series_description}</p>
            )}
          </div>

          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="text-5xl mb-2">{away?.flag_emoji}</div>
              <h2 className="text-xl font-bold">{away?.country || "TBD"}</h2>
              {(isFinal || isLive) && (
                <p className="text-4xl font-bold mt-2">{game.away_score}</p>
              )}
            </div>
            <div className="text-2xl font-bold text-gray-400">vs</div>
            <div className="text-center">
              <div className="text-5xl mb-2">{home?.flag_emoji}</div>
              <h2 className="text-xl font-bold">{home?.country || "TBD"}</h2>
              {(isFinal || isLive) && (
                <p className="text-4xl font-bold mt-2">{game.home_score}</p>
              )}
            </div>
          </div>

          <div className="text-center mt-6 text-sm text-gray-500">
            <p>{formatDate(game.game_date)}</p>
            {game.venue_name && <p>{game.venue_name}{game.venue_city ? `, ${game.venue_city}` : ""}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Related Article */}
      {article && (
        <Card className="mb-8">
          <CardHeader>
            <h2 className="font-semibold">
              {article.type === "recap" ? "Game Recap" : "Game Preview"}
            </h2>
          </CardHeader>
          <CardContent>
            <Link href={`/blog/${article.slug}`} className="text-blue-600 hover:underline font-medium">
              {article.title}
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Linescore */}
      {game.linescore && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Line Score</h2>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-center">
              Detailed box score data available after game completion.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
