import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateContent } from "@/lib/ai/client";
import { SYSTEM_PROMPTS, buildGamePreviewPrompt } from "@/lib/ai/prompts";
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

    // Find upcoming games without previews (next 30 days)
    const today = new Date();
    const twoDaysLater = new Date(today);
    twoDaysLater.setDate(twoDaysLater.getDate() + 30);

    const { data: games } = await supabase
      .from("games")
      .select(`
        id, mlb_game_pk, game_date, game_time, venue_name, series_description,
        away_team:teams!games_away_team_id_fkey(name, abbreviation, country),
        home_team:teams!games_home_team_id_fkey(name, abbreviation, country)
      `)
      .eq("status", "scheduled")
      .eq("preview_generated", false)
      .gte("game_date", today.toISOString().split("T")[0])
      .lte("game_date", twoDaysLater.toISOString().split("T")[0])
      .order("game_date", { ascending: true })
      .limit(5);

    if (!games || games.length === 0) {
      return NextResponse.json({ success: true, message: "No games need previews" });
    }

    let generatedCount = 0;

    for (const game of games) {
      try {
        const awayTeam = Array.isArray(game.away_team) ? game.away_team[0] : game.away_team;
        const homeTeam = Array.isArray(game.home_team) ? game.home_team[0] : game.home_team;

        if (!awayTeam || !homeTeam) continue;

        const prompt = buildGamePreviewPrompt({
          awayTeam: awayTeam.country || awayTeam.name,
          homeTeam: homeTeam.country || homeTeam.name,
          venue: game.venue_name || "TBD",
          date: game.game_date,
          time: game.game_time ? new Date(game.game_time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "TBD",
          seriesDescription: game.series_description || undefined,
        });

        const content = await generateContent(SYSTEM_PROMPTS.gamePreview, prompt, 2000);

        const titleMatch = content.match(/TITLE:\s*(.+?)(?:\n|EXCERPT:)/s);
        const excerptMatch = content.match(/EXCERPT:\s*(.+?)(?:\n\n|<)/s);

        const title = titleMatch?.[1]?.trim() || `${awayTeam.country} vs ${homeTeam.country} - Preview`;
        const excerpt = excerptMatch?.[1]?.trim() || `Preview: ${awayTeam.country} takes on ${homeTeam.country}`;

        const htmlContent = content
          .replace(/TITLE:.*\n?/s, "")
          .replace(/EXCERPT:.*\n?\n?/s, "")
          .trim();

        const slug = slugify(`${title}-${game.game_date}`);

        await supabase.from("articles").upsert(
          {
            slug,
            title,
            excerpt,
            content: htmlContent,
            type: "preview",
            status: "published",
            game_id: game.id,
            league: "wbc",
            tags: ["wbc", "preview", awayTeam.abbreviation?.toLowerCase(), homeTeam.abbreviation?.toLowerCase()].filter(Boolean) as string[],
            meta_title: title,
            meta_description: excerpt,
            published_at: new Date().toISOString(),
          },
          { onConflict: "slug" }
        );

        await supabase
          .from("games")
          .update({ preview_generated: true })
          .eq("id", game.id);

        generatedCount++;
      } catch (err) {
        console.error(`Error generating preview for game ${game.mlb_game_pk}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${generatedCount} previews`,
    });
  } catch (error) {
    console.error("Generate preview error:", error);
    return NextResponse.json(
      { error: "Failed to generate previews" },
      { status: 500 }
    );
  }
}
