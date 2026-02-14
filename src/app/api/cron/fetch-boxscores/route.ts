import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBoxScore, getLinescore } from "@/lib/mlb-api/boxscore";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Get games that are live or recently final (today)
    const today = new Date().toISOString().split("T")[0];
    const { data: games } = await supabase
      .from("games")
      .select("id, mlb_game_pk, status")
      .eq("game_date", today)
      .in("status", ["live", "final", "scheduled"]);

    if (!games || games.length === 0) {
      return NextResponse.json({ success: true, message: "No games to update" });
    }

    let updatedCount = 0;

    for (const game of games) {
      try {
        const [boxscore, linescore] = await Promise.all([
          getBoxScore(game.mlb_game_pk),
          getLinescore(game.mlb_game_pk),
        ]);

        const awayRuns = linescore.teams?.away?.runs ?? null;
        const homeRuns = linescore.teams?.home?.runs ?? null;

        let status = game.status;
        if (linescore.currentInning && linescore.inningState) {
          status = "live";
        }
        // Check if the game is final based on linescore
        if (linescore.innings && linescore.innings.length >= 9 && !linescore.currentInning) {
          status = "final";
        }

        await supabase
          .from("games")
          .update({
            away_score: awayRuns,
            home_score: homeRuns,
            status,
            linescore: linescore as unknown as Record<string, unknown>,
            boxscore_data: boxscore as unknown as Record<string, unknown>,
          })
          .eq("id", game.id);

        updatedCount++;
      } catch (err) {
        console.error(`Error fetching boxscore for game ${game.mlb_game_pk}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} boxscores`,
    });
  } catch (error) {
    console.error("Fetch boxscores error:", error);
    return NextResponse.json(
      { error: "Failed to fetch boxscores" },
      { status: 500 }
    );
  }
}
