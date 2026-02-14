import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWbcStandings } from "@/lib/mlb-api/standings";
import { CURRENT_WBC_SEASON } from "@/lib/mlb-api/constants";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();
    const records = await getWbcStandings();

    let snapshotCount = 0;

    for (const record of records) {
      for (const teamRecord of record.teamRecords) {
        // Find or create team
        const { data: team } = await supabase
          .from("teams")
          .select("id")
          .eq("mlb_id", teamRecord.team.id)
          .single();

        if (team) {
          await supabase.from("stats_snapshots").insert({
            team_id: team.id,
            snapshot_type: "standings",
            stats_data: {
              wins: teamRecord.wins,
              losses: teamRecord.losses,
              winningPercentage: teamRecord.winningPercentage,
              gamesPlayed: teamRecord.gamesPlayed,
              runsScored: teamRecord.runsScored,
              runsAllowed: teamRecord.runsAllowed,
              runDifferential: teamRecord.runDifferential,
              streak: teamRecord.streak?.streakCode,
              divisionRank: teamRecord.divisionRank,
              division: record.division?.name,
            },
            league: "wbc",
            season: CURRENT_WBC_SEASON,
            snapshot_date: new Date().toISOString().split("T")[0],
          });
          snapshotCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${snapshotCount} standings snapshots`,
    });
  } catch (error) {
    console.error("Fetch standings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch standings" },
      { status: 500 }
    );
  }
}
