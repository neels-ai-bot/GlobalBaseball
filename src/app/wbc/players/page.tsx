import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WBC Players",
  description: "World Baseball Classic player directory with stats and team info.",
};

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const supabase = await createClient();

  const { data: players } = await supabase
    .from("players")
    .select(`
      *,
      team:teams!players_team_id_fkey(name, abbreviation, country, flag_emoji)
    `)
    .order("full_name", { ascending: true })
    .limit(200);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-8">WBC Players</h1>

      {!players || players.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <p className="text-lg">Player data will appear once rosters are fetched.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>B/T</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => {
                  const team = Array.isArray(player.team) ? player.team[0] : player.team;
                  return (
                    <TableRow key={player.id}>
                      <TableCell>
                        <Link href={`/wbc/players/${player.mlb_id || player.id}`} className="font-medium text-blue-600 hover:underline">
                          {player.full_name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{team?.flag_emoji}</span>
                          <span>{team?.country || team?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">{player.position || "N/A"}</Badge>
                      </TableCell>
                      <TableCell>{player.bats || "-"}/{player.throws || "-"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
