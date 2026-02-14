import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateContent } from "@/lib/ai/client";
import { SYSTEM_PROMPTS, buildGameRecapPrompt } from "@/lib/ai/prompts";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Find final games without recaps
    const { data: games } = await supabase
      .from("games")
      .select(`
        id, mlb_game_pk, game_date, away_score, home_score,
        venue_name, series_description, linescore, boxscore_data,
        away_team:teams!games_away_team_id_fkey(name, abbreviation, country),
        home_team:teams!games_home_team_id_fkey(name, abbreviation, country)
      `)
      .eq("status", "final")
      .eq("recap_generated", false)
      .order("game_date", { ascending: false })
      .limit(5);

    if (!games || games.length === 0) {
      return NextResponse.json({ success: true, message: "No games need recaps" });
    }

    let generatedCount = 0;

    for (const game of games) {
      try {
        const awayTeam = Array.isArray(game.away_team) ? game.away_team[0] : game.away_team;
        const homeTeam = Array.isArray(game.home_team) ? game.home_team[0] : game.home_team;

        if (!awayTeam || !homeTeam) continue;

        const prompt = buildGameRecapPrompt({
          awayTeam: awayTeam.country || awayTeam.name,
          homeTeam: homeTeam.country || homeTeam.name,
          awayScore: game.away_score || 0,
          homeScore: game.home_score || 0,
          venue: game.venue_name || "Unknown Venue",
          date: game.game_date,
          boxscoreData: game.boxscore_data || {},
          linescoreData: game.linescore || {},
          seriesDescription: game.series_description || undefined,
        });

        const content = await generateContent(SYSTEM_PROMPTS.gameRecap, prompt, 2500);

        // Parse title and excerpt from response
        const titleMatch = content.match(/TITLE:\s*(.+?)(?:\n|EXCERPT:)/s);
        const excerptMatch = content.match(/EXCERPT:\s*(.+?)(?:\n\n|<)/s);

        const title = titleMatch?.[1]?.trim() || `${awayTeam.country} vs ${homeTeam.country} - Game Recap`;
        const excerpt = excerptMatch?.[1]?.trim() || `${awayTeam.country} ${game.away_score} - ${homeTeam.country} ${game.home_score}`;

        // Remove TITLE and EXCERPT lines from content
        const htmlContent = content
          .replace(/TITLE:.*\n?/s, "")
          .replace(/EXCERPT:.*\n?\n?/s, "")
          .trim();

        const slug = slugify(`${title}-${game.game_date}`);

        // Insert article
        await supabase.from("articles").upsert(
          {
            slug,
            title,
            excerpt,
            content: htmlContent,
            type: "recap",
            status: "published",
            game_id: game.id,
            league: "wbc",
            tags: ["wbc", "recap", awayTeam.abbreviation?.toLowerCase(), homeTeam.abbreviation?.toLowerCase()].filter(Boolean) as string[],
            meta_title: title,
            meta_description: excerpt,
            published_at: new Date().toISOString(),
          },
          { onConflict: "slug" }
        );

        // Mark game as recap generated
        await supabase
          .from("games")
          .update({ recap_generated: true })
          .eq("id", game.id);

        generatedCount++;
      } catch (err) {
        console.error(`Error generating recap for game ${game.mlb_game_pk}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${generatedCount} recaps`,
    });
  } catch (error) {
    console.error("Generate recap error:", error);
    return NextResponse.json(
      { error: "Failed to generate recaps" },
      { status: 500 }
    );
  }
}
