import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WBC Teams",
  description: "All participating teams in the World Baseball Classic.",
};

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const supabase = await createClient();

  const { data: teams } = await supabase
    .from("teams")
    .select("*")
    .eq("league", "wbc")
    .order("country", { ascending: true });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-8">WBC Teams</h1>

      {!teams || teams.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <p className="text-lg">Team data will appear once rosters are fetched.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {teams.map((team) => (
            <Link key={team.id} href={`/wbc/teams/${team.mlb_id || team.id}`}>
              <Card className="hover:shadow-lg transition-shadow text-center h-full">
                <CardContent className="py-8">
                  <div className="text-5xl mb-3">{team.flag_emoji || "&#127988;"}</div>
                  <h2 className="font-semibold">{team.country}</h2>
                  <p className="text-sm text-gray-500">{team.abbreviation}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
