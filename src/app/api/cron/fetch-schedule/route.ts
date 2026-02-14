import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWbcSchedule } from "@/lib/mlb-api/schedule";
import { WBC_TEAMS } from "@/lib/mlb-api/constants";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Fetch schedule for the next 30 days
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 30);

    const startStr = today.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];

    const dates = await getWbcSchedule(startStr, endStr);

    let upsertedCount = 0;

    for (const dateEntry of dates) {
      for (const game of dateEntry.games) {
        // Ensure teams exist
        for (const side of ["away", "home"] as const) {
          const teamData = game.teams[side].team;
          const wbcInfo = WBC_TEAMS[teamData.id];

          await supabase.from("teams").upsert(
            {
              mlb_id: teamData.id,
              name: teamData.name,
              abbreviation: teamData.abbreviation || wbcInfo?.code || "",
              country: wbcInfo?.country || teamData.name,
              country_code: wbcInfo?.code || "",
              flag_emoji: wbcInfo?.flag || null,
              league: "wbc",
            },
            { onConflict: "mlb_id" }
          );
        }

        // Get team IDs from our DB
        const { data: awayTeam } = await supabase
          .from("teams")
          .select("id")
          .eq("mlb_id", game.teams.away.team.id)
          .single();

        const { data: homeTeam } = await supabase
          .from("teams")
          .select("id")
          .eq("mlb_id", game.teams.home.team.id)
          .single();

        // Determine game status
        let status = "scheduled";
        if (game.status.abstractGameState === "Live") status = "live";
        else if (game.status.abstractGameState === "Final") status = "final";

        // Upsert game
        await supabase.from("games").upsert(
          {
            mlb_game_pk: game.gamePk,
            game_date: game.officialDate,
            game_time: game.gameDate,
            status,
            detailed_status: game.status.detailedState,
            away_team_id: awayTeam?.id || null,
            home_team_id: homeTeam?.id || null,
            away_score: game.teams.away.score ?? null,
            home_score: game.teams.home.score ?? null,
            venue_name: game.venue?.name || null,
            venue_city: game.venue?.location?.city || null,
            series_description: game.seriesDescription || null,
            series_game_number: game.seriesGameNumber || null,
            league: "wbc",
            season: game.season,
          },
          { onConflict: "mlb_game_pk" }
        );

        upsertedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Upserted ${upsertedCount} games`,
    });
  } catch (error) {
    console.error("Fetch schedule error:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedule" },
      { status: 500 }
    );
  }
}
