import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateContent } from "@/lib/ai/client";
import { SYSTEM_PROMPTS, buildStandingsUpdatePrompt } from "@/lib/ai/prompts";
import { getWbcStandings } from "@/lib/mlb-api/standings";
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
    const standings = await getWbcStandings();
    const today = new Date().toISOString().split("T")[0];

    const standingsData = standings.map((record) => ({
      group: record.division?.name || "Pool",
      teams: record.teamRecords.map((tr) => ({
        team: tr.team.name,
        wins: tr.wins,
        losses: tr.losses,
        pct: tr.winningPercentage,
        runsScored: tr.runsScored,
        runsAllowed: tr.runsAllowed,
        diff: tr.runDifferential,
      })),
    }));

    const prompt = buildStandingsUpdatePrompt({
      standings: standingsData,
      date: today,
      tournament: "World Baseball Classic 2026",
    });

    const content = await generateContent(SYSTEM_PROMPTS.standingsUpdate, prompt, 2500);

    const titleMatch = content.match(/TITLE:\s*(.+?)(?:\n|EXCERPT:)/s);
    const excerptMatch = content.match(/EXCERPT:\s*(.+?)(?:\n\n|<)/s);

    const title = titleMatch?.[1]?.trim() || `WBC Standings Update - ${today}`;
    const excerpt = excerptMatch?.[1]?.trim() || `Latest World Baseball Classic standings and analysis for ${today}`;

    const htmlContent = content
      .replace(/TITLE:.*\n?/s, "")
      .replace(/EXCERPT:.*\n?\n?/s, "")
      .trim();

    const slug = slugify(`wbc-standings-update-${today}`);

    await supabase.from("articles").upsert(
      {
        slug,
        title,
        excerpt,
        content: htmlContent,
        type: "standings",
        status: "published",
        league: "wbc",
        tags: ["wbc", "standings", "analysis"],
        meta_title: title,
        meta_description: excerpt,
        published_at: new Date().toISOString(),
      },
      { onConflict: "slug" }
    );

    return NextResponse.json({
      success: true,
      message: "Standings article generated",
    });
  } catch (error) {
    console.error("Generate standings error:", error);
    return NextResponse.json(
      { error: "Failed to generate standings article" },
      { status: 500 }
    );
  }
}
