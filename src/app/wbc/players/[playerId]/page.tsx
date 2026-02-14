import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ playerId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { playerId } = await params;
  const supabase = await createClient();
  const { data: player } = await supabase
    .from("players")
    .select("full_name")
    .or(`mlb_id.eq.${playerId},id.eq.${playerId}`)
    .single();

  return {
    title: player ? `${player.full_name} - WBC Player` : "Player",
  };
}

export default async function PlayerPage({ params }: PageProps) {
  const { playerId } = await params;
  const supabase = await createClient();

  const { data: player } = await supabase
    .from("players")
    .select(`
      *,
      team:teams!players_team_id_fkey(name, abbreviation, country, flag_emoji)
    `)
    .or(`mlb_id.eq.${playerId},id.eq.${playerId}`)
    .single();

  if (!player) return notFound();

  const team = Array.isArray(player.team) ? player.team[0] : player.team;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <span>{team?.flag_emoji}</span>
          <span>{team?.country}</span>
        </div>
        <h1 className="text-3xl font-bold">{player.full_name}</h1>
        <div className="flex items-center gap-3 mt-2">
          {player.jersey_number && (
            <span className="text-2xl font-bold text-gray-400">#{player.jersey_number}</span>
          )}
          <Badge>{player.position || "N/A"}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Player Info</h2>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              {player.birth_date && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Born</dt>
                  <dd>{new Date(player.birth_date).toLocaleDateString()}</dd>
                </div>
              )}
              {player.birth_country && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Birth Country</dt>
                  <dd>{player.birth_country}</dd>
                </div>
              )}
              {player.height && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Height</dt>
                  <dd>{player.height}</dd>
                </div>
              )}
              {player.weight && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Weight</dt>
                  <dd>{player.weight} lbs</dd>
                </div>
              )}
              {player.bats && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Bats</dt>
                  <dd>{player.bats === "R" ? "Right" : player.bats === "L" ? "Left" : "Switch"}</dd>
                </div>
              )}
              {player.throws && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Throws</dt>
                  <dd>{player.throws === "R" ? "Right" : "Left"}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">WBC Stats</h2>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-center py-8">
              Stats will be available once games are played.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
