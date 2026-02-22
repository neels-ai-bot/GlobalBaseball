import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";
import { buildDailyDigestEmail } from "@/lib/email/templates";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Fetch articles published in the last 24 hours
    const since = new Date();
    since.setHours(since.getHours() - 24);

    const { data: articles, error: articlesError } = await supabase
      .from("articles")
      .select("title, slug, excerpt, type")
      .eq("status", "published")
      .gte("published_at", since.toISOString())
      .order("published_at", { ascending: false });

    if (articlesError) {
      console.error("Failed to fetch articles:", articlesError);
      return NextResponse.json(
        { error: "Failed to fetch articles" },
        { status: 500 }
      );
    }

    if (!articles || articles.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No new articles in the last 24 hours. Skipping digest.",
      });
    }

    // Fetch all active subscribers
    const { data: subscribers, error: subscribersError } = await supabase
      .from("subscribers")
      .select("email")
      .eq("status", "active");

    if (subscribersError) {
      console.error("Failed to fetch subscribers:", subscribersError);
      return NextResponse.json(
        { error: "Failed to fetch subscribers" },
        { status: 500 }
      );
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active subscribers. Skipping digest.",
      });
    }

    // Build the email HTML
    const html = buildDailyDigestEmail(articles);

    // Send via Resend
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "RESEND_API_KEY not configured" },
        { status: 500 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    let sentCount = 0;
    let failedCount = 0;

    for (const subscriber of subscribers) {
      try {
        await resend.emails.send({
          from: "GlobalBaseball <newsletter@globalbaseball.com>",
          to: subscriber.email,
          subject: `Daily Digest: ${articles.length} new article${articles.length > 1 ? "s" : ""} ⚾`,
          html,
        });
        sentCount++;
      } catch (emailErr) {
        console.error(`Failed to send to ${subscriber.email}:`, emailErr);
        failedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Daily digest sent to ${sentCount} subscribers (${failedCount} failed). ${articles.length} articles included.`,
    });
  } catch (error) {
    console.error("Daily digest cron error:", error);
    return NextResponse.json(
      { error: "Failed to send daily digest" },
      { status: 500 }
    );
  }
}
