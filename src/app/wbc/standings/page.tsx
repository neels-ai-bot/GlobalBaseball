import { createClient } from "@/lib/supabase/server";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WBC Standings",
  description: "World Baseball Classic standings by pool with win-loss records and run differentials.",
};

export const dynamic = "force-dynamic";

export default async function StandingsPage() {
  const supabase = await createClient();

  // Get latest standings snapshots
  const { data: snapshots } = await supabase
    .from("stats_snapshots")
    .select(`
      stats_data, snapshot_date,
      team:teams!stats_snapshots_team_id_fkey(name, abbreviation, country, flag_emoji)
    `)
    .eq("snapshot_type", "standings")
    .eq("league", "wbc")
    .order("snapshot_date", { ascending: false });

  // Get unique latest snapshot per team
  const latestByTeam = new Map<string, (typeof snapshots extends (infer T)[] | null ? T : never)>();
  for (const snap of snapshots || []) {
    const team = Array.isArray(snap.team) ? snap.team[0] : snap.team;
    const teamName = team?.name || "Unknown";
    if (!latestByTeam.has(teamName)) {
      latestByTeam.set(teamName, snap);
    }
  }

  // Group by division/pool
  const pools = new Map<string, typeof snapshots>();
  for (const snap of latestByTeam.values()) {
    const pool = (snap.stats_data as Record<string, unknown>).division as string || "Pool";
    if (!pools.has(pool)) pools.set(pool, []);
    pools.get(pool)!.push(snap);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-8">WBC Standings</h1>

      {pools.size === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <p className="text-lg">Standings will appear once tournament data is available.</p>
            <p className="text-sm mt-2">Standings are automatically updated via cron jobs.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Array.from(pools.entries()).map(([poolName, poolTeams]) => (
            <Card key={poolName}>
              <CardHeader>
                <h2 className="text-lg font-semibold">{poolName}</h2>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team</TableHead>
                      <TableHead className="text-center">W</TableHead>
                      <TableHead className="text-center">L</TableHead>
                      <TableHead className="text-center">PCT</TableHead>
                      <TableHead className="text-center">RS</TableHead>
                      <TableHead className="text-center">RA</TableHead>
                      <TableHead className="text-center">DIFF</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {poolTeams
                      ?.sort((a, b) => {
                        const aWins = (a.stats_data as Record<string, unknown>).wins as number || 0;
                        const bWins = (b.stats_data as Record<string, unknown>).wins as number || 0;
                        return bWins - aWins;
                      })
                      .map((snap) => {
                        const team = Array.isArray(snap.team) ? snap.team[0] : snap.team;
                        const stats = snap.stats_data as Record<string, unknown>;
                        return (
                          <TableRow key={team?.name}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span>{team?.flag_emoji}</span>
                                <span className="font-medium">{team?.country || team?.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">{stats.wins as number}</TableCell>
                            <TableCell className="text-center">{stats.losses as number}</TableCell>
                            <TableCell className="text-center">{stats.winningPercentage as string}</TableCell>
                            <TableCell className="text-center">{stats.runsScored as number}</TableCell>
                            <TableCell className="text-center">{stats.runsAllowed as number}</TableCell>
                            <TableCell className="text-center">
                              <span className={(stats.runDifferential as number) > 0 ? "text-green-600" : (stats.runDifferential as number) < 0 ? "text-red-600" : ""}>
                                {(stats.runDifferential as number) > 0 ? "+" : ""}{stats.runDifferential as number}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
