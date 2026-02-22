import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // This endpoint serves as a trigger for the video generation pipeline.
    // Video generation requires FFmpeg and Canvas which run as Node.js scripts,
    // not as serverless functions. This endpoint can be called by Vercel cron
    // and would need to trigger an external service (e.g., a GitHub Action
    // or a long-running server) to actually run the video generation.
    //
    // For now, this returns instructions. Use the CLI scripts directly:
    //   npm run video:batch    - Generate all WBC videos
    //   npm run video:upload   - Upload to YouTube

    return NextResponse.json({
      success: true,
      message: "Video generation requires CLI execution. Use: npm run video:batch && npm run video:upload",
      note: "Serverless functions have a 10s timeout on Hobby plan. Video generation takes 5-30 minutes per video and must run locally or on a dedicated server.",
    });
  } catch (error) {
    console.error("Generate and upload error:", error);
    return NextResponse.json(
      { error: "Failed to process" },
      { status: 500 }
    );
  }
}
