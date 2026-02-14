import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ teamId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { teamId } = await params;
  const supabase = await createClient();
  const { data: team } = await supabase
    .from("teams")
    .select("country, name")
    .or(`mlb_id.eq.${teamId},id.eq.${teamId}`)
    .single();

  return {
    title: team ? `${team.country} - WBC Team` : "Team",
    description: team ? `World Baseball Classic roster and stats for ${team.country}` : "",
  };
}

export default async function TeamPage({ params }: PageProps) {
  const { teamId } = await params;
  const supabase = await createClient();

  const { data: team } = await supabase
    .from("teams")
    .select("*")
    .or(`mlb_id.eq.${teamId},id.eq.${teamId}`)
    .single();

  if (!team) return notFound();

  const { data: players } = await supabase
    .from("players")
    .select("*")
    .eq("team_id", team.id)
    .order("position", { ascending: true });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4 mb-8">
        <span className="text-6xl">{team.flag_emoji}</span>
        <div>
          <h1 className="text-3xl font-bold">{team.country}</h1>
          <p className="text-gray-500">{team.name} ({team.abbreviation})</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Roster</h2>
        </CardHeader>
        <CardContent className="p-0">
          {!players || players.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              Roster data will appear once it&apos;s fetched from the API.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>B/T</TableHead>
                  <TableHead>Country</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell>{player.jersey_number || "-"}</TableCell>
                    <TableCell>
                      <span className="font-medium">{player.full_name}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">{player.position || "N/A"}</Badge>
                    </TableCell>
                    <TableCell>{player.bats || "-"}/{player.throws || "-"}</TableCell>
                    <TableCell>{player.birth_country || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
