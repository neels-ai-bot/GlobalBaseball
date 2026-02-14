import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDateTime } from "@/lib/utils";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WBC Schedule",
  description: "Complete World Baseball Classic game schedule with dates, times, and venues.",
};

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const supabase = await createClient();

  const { data: games } = await supabase
    .from("games")
    .select(`
      id, mlb_game_pk, game_date, game_time, status, detailed_status,
      away_score, home_score, venue_name, venue_city, series_description,
      away_team:teams!games_away_team_id_fkey(name, abbreviation, country, flag_emoji),
      home_team:teams!games_home_team_id_fkey(name, abbreviation, country, flag_emoji)
    `)
    .eq("league", "wbc")
    .order("game_date", { ascending: true });

  // Group games by date
  const gamesByDate = (games || []).reduce<Record<string, typeof games>>((acc, game) => {
    const date = game.game_date;
    if (!acc[date]) acc[date] = [];
    acc[date]!.push(game);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-8">WBC Schedule</h1>

      {Object.keys(gamesByDate).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <p className="text-lg">Schedule data will appear once games are fetched from the API.</p>
            <p className="text-sm mt-2">Cron jobs will automatically populate this data.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(gamesByDate).map(([date, dateGames]) => (
            <div key={date}>
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                {formatDate(date)}
              </h2>
              <div className="space-y-3">
                {dateGames?.map((game) => {
                  const away = Array.isArray(game.away_team) ? game.away_team[0] : game.away_team;
                  const home = Array.isArray(game.home_team) ? game.home_team[0] : game.home_team;
                  const isFinal = game.status === "final";
                  const isLive = game.status === "live";

                  return (
                    <Link key={game.id} href={`/wbc/games/${game.mlb_game_pk}`}>
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-lg">{away?.flag_emoji}</span>
                                <span className="font-medium">{away?.country || away?.name || "TBD"}</span>
                                {isFinal && <span className="font-bold text-lg ml-auto">{game.away_score}</span>}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{home?.flag_emoji}</span>
                                <span className="font-medium">{home?.country || home?.name || "TBD"}</span>
                                {isFinal && <span className="font-bold text-lg ml-auto">{game.home_score}</span>}
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              {isLive ? (
                                <Badge variant="error">LIVE</Badge>
                              ) : isFinal ? (
                                <Badge variant="default">Final</Badge>
                              ) : (
                                <span className="text-sm text-gray-500">
                                  {game.game_time ? formatDateTime(game.game_time) : "TBD"}
                                </span>
                              )}
                              {game.venue_name && (
                                <p className="text-xs text-gray-400 mt-1">{game.venue_name}</p>
                              )}
                            </div>
                          </div>
                          {game.series_description && (
                            <p className="text-xs text-gray-500 mt-2">{game.series_description}</p>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
