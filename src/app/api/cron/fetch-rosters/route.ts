import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTeamRoster } from "@/lib/mlb-api/players";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Get all WBC teams
    const { data: teams } = await supabase
      .from("teams")
      .select("id, mlb_id")
      .eq("league", "wbc")
      .not("mlb_id", "is", null);

    if (!teams || teams.length === 0) {
      return NextResponse.json({ success: true, message: "No teams found" });
    }

    let playerCount = 0;

    for (const team of teams) {
      if (!team.mlb_id) continue;

      try {
        const roster = await getTeamRoster(team.mlb_id);

        for (const entry of roster) {
          await supabase.from("players").upsert(
            {
              mlb_id: entry.person.id,
              full_name: entry.person.fullName,
              first_name: entry.person.firstName || null,
              last_name: entry.person.lastName || null,
              team_id: team.id,
              position: entry.position?.abbreviation || null,
              jersey_number: entry.jerseyNumber || null,
              bats: entry.person.batSide?.code || null,
              throws: entry.person.pitchHand?.code || null,
              birth_date: entry.person.birthDate || null,
              birth_country: entry.person.birthCountry || null,
              height: entry.person.height || null,
              weight: entry.person.weight || null,
            },
            { onConflict: "mlb_id" }
          );
          playerCount++;
        }
      } catch (err) {
        console.error(`Error fetching roster for team ${team.mlb_id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Upserted ${playerCount} players`,
    });
  } catch (error) {
    console.error("Fetch rosters error:", error);
    return NextResponse.json(
      { error: "Failed to fetch rosters" },
      { status: 500 }
    );
  }
}
