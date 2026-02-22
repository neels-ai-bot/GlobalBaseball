import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { mkdirSync } from "fs";
import { CONFIG } from "./config.mjs";
import {
  VIDEO_SYSTEM_PROMPT,
  buildGamePreviewVideoPrompt,
  buildTeamPreviewVideoPrompt,
} from "./prompts.mjs";
import { generateSlideAudio } from "./tts.mjs";
import { generateSlideImages, generateOverlayImages } from "./graphics.mjs";
import { composeVideo, composeBroadcastVideo } from "./composer.mjs";
import { uploadToYouTube } from "./uploader.mjs";
import { downloadPlayerHeadshots } from "./media.mjs";
import { getGameHighlights } from "./highlights.mjs";
import { getBestWBCHighlights, getTeamWBCHighlights, getCuratedWBCClips } from "./wbc-history.mjs";

// Ensure output directories exist
for (const dir of Object.values(CONFIG.paths)) {
  mkdirSync(dir, { recursive: true });
}

const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);

// ─── AI Script Generation ───────────────────────────────────

async function generateScript(prompt) {
  if (!CONFIG.geminiKey) {
    console.log("  No GEMINI_API_KEY set - using sample script");
    return null;
  }

  const genAI = new GoogleGenerativeAI(CONFIG.geminiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: VIDEO_SYSTEM_PROMPT,
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const jsonMatch =
    text.match(/```json\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;

  return JSON.parse(jsonStr);
}

function getSampleScript() {
  return {
    title: "WBC 2026 Preview - The World Stage Awaits",
    description:
      "A look ahead at the 2026 World Baseball Classic featuring the top teams and players.",
    tags: ["WBC", "2026", "Baseball", "World Baseball Classic", "Preview"],
    slides: [
      {
        type: "title",
        narration:
          "Welcome to GlobalBaseball. The 2026 World Baseball Classic is almost here, and the world stage awaits.",
        heading: "WBC 2026",
        subheading: "The World Stage Awaits",
      },
      {
        type: "team",
        narration:
          "Japan enters as defending champions with elite pitching, disciplined offense, and flawless defense.",
        heading: "Defending Champions: Japan",
        subheading: "Samurai Japan",
        points: [
          "Elite pitching depth from NPB and MLB",
          "Disciplined, situational offense",
          "Flawless defensive fundamentals",
        ],
        playerImages: [
          { name: "Shohei Ohtani", mlbId: 660271, position: "DH / P" },
          { name: "Yoshinobu Yamamoto", mlbId: 808967, position: "SP" },
        ],
      },
      {
        type: "team",
        narration:
          "The United States brings raw power and star quality, with a lineup stacked with All-Stars at every position.",
        heading: "Team USA",
        subheading: "Loaded Roster",
        points: [
          "MLB All-Star talent at every position",
          "Deep pitching rotation with power arms",
          "Explosive offense led by young sluggers",
        ],
        playerImages: [
          { name: "Bobby Witt Jr.", mlbId: 677951, position: "SS" },
          { name: "Corbin Carroll", mlbId: 682998, position: "OF" },
        ],
      },
      {
        type: "matchup_players",
        narration:
          "The ultimate matchup to watch: Shohei Ohtani versus Juan Soto. Two of baseball's biggest stars on the world stage.",
        heading: "Must-Watch Matchup",
        subheading: "Star Power Collision",
        playerImages: [
          { name: "Shohei Ohtani", mlbId: 660271, position: "Japan" },
          { name: "Juan Soto", mlbId: 665742, position: "Dominican Republic" },
        ],
        points: ["Two-way phenom vs elite pure hitter"],
      },
      {
        type: "stats",
        narration:
          "South Korea and Mexico are dark horses to watch. Both capable of pulling major upsets against the favorites.",
        heading: "Dark Horses",
        subheading: "Don't Sleep On These Teams",
        points: [
          "South Korea: KBO + MLB talent",
          "Mexico: Rising program",
          "Cuba: Historic powerhouse",
        ],
      },
      {
        type: "player",
        narration:
          "Keep your eyes on Julio Rodriguez. The dynamic Dominican outfielder combines speed, power, and highlight-reel defense.",
        heading: "Julio Rodriguez",
        subheading: "Dominican Republic - OF",
        playerName: "Julio Rodriguez",
        mlbId: 677594,
        position: "OF",
        points: [
          "Elite 5-tool outfielder",
          "Explosive bat speed and power",
          "Highlight-reel defensive plays",
          "Rising superstar ready for the world stage",
        ],
      },
      {
        type: "outro",
        narration:
          "Subscribe to GlobalBaseball for complete WBC 2026 coverage. Like this video and hit the bell for daily updates.",
        heading: "Subscribe for WBC 2026 Coverage",
        subheading: "New videos daily throughout the tournament",
      },
    ],
  };
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Collect all player MLB IDs from slides for headshot downloading
function collectPlayerIds(slides) {
  const players = [];
  const seen = new Set();

  for (const slide of slides) {
    const images = slide.playerImages || [];
    for (const img of images) {
      if (img.mlbId && !seen.has(img.mlbId)) {
        seen.add(img.mlbId);
        players.push({ mlb_id: img.mlbId, full_name: img.name });
      }
    }
    if (slide.mlbId && !seen.has(slide.mlbId)) {
      seen.add(slide.mlbId);
      players.push({ mlb_id: slide.mlbId, full_name: slide.playerName || slide.heading });
    }
  }

  return players;
}

// ─── Video Generation Pipeline ──────────────────────────────

async function generateVideo(script, sessionId, options = {}) {
  const broadcast = !args.includes("--classic");

  console.log(`  Title: "${script.title}" (${script.slides.length} slides)`);
  console.log(`  Style: ${broadcast ? "Broadcast (game footage + overlays)" : "Classic (slides + zoom)"}`);

  // Step 1: Download player headshots
  console.log("\n  Step 1/5: Downloading player headshots...");
  const playerIds = collectPlayerIds(script.slides);
  const headshots = playerIds.length > 0
    ? await downloadPlayerHeadshots(playerIds)
    : {};

  // Step 2: Fetch video clips
  let highlightClips = [];
  if (broadcast) {
    console.log("\n  Step 2/5: Downloading WBC broadcast footage...");
    highlightClips = await getCuratedWBCClips(Math.max(script.slides.length, 10));
  } else if (options.gamePk) {
    console.log("\n  Step 2/5: Fetching game highlights...");
    highlightClips = await getGameHighlights(options.gamePk, 2);
  } else if (options.teamName) {
    console.log("\n  Step 2/5: Fetching WBC history highlights for " + options.teamName + "...");
    highlightClips = await getTeamWBCHighlights(options.teamName, 2);
  } else {
    console.log("\n  Step 2/5: Fetching best WBC 2023 moments...");
    highlightClips = await getBestWBCHighlights(3);
  }

  // Step 3: Generate audio narration
  console.log("\n  Step 3/5: Generating audio...");
  const audioFiles = await generateSlideAudio(script.slides, sessionId);

  if (broadcast && highlightClips.length > 0) {
    // Broadcast mode: game footage as background with text overlays
    console.log("\n  Step 4/5: Generating overlay graphics...");
    const overlayImages = await generateOverlayImages(script.slides, sessionId, headshots);

    console.log("\n  Step 5/5: Composing broadcast video...");
    const clipPaths = highlightClips.map((c) => c.path);
    const videoPath = await composeBroadcastVideo(overlayImages, audioFiles, clipPaths, `${sessionId}.mp4`);

    console.log("\n  Upload check...");
    await uploadToYouTube(videoPath, script);
    return videoPath;
  } else {
    // Classic mode: static slides with Ken Burns zoom
    console.log("\n  Step 4/5: Generating slides...");
    const slideImages = await generateSlideImages(script.slides, sessionId, headshots);

    console.log("\n  Step 5/5: Composing video...");
    const useZoom = !args.includes("--no-zoom");
    const videoPath = await composeVideo(slideImages, audioFiles, `${sessionId}.mp4`, useZoom, highlightClips);

    console.log("\n  Upload check...");
    await uploadToYouTube(videoPath, script);
    return videoPath;
  }
}

// ─── Commands ───────────────────────────────────────────────

async function generateGamePreviewVideos() {
  console.log("\nFetching upcoming games...");

  const { data: games } = await supabase
    .from("games")
    .select(`
      id, mlb_game_pk, game_date, game_time, venue_name, series_description,
      away_team:teams!games_away_team_id_fkey(id, name, country),
      home_team:teams!games_home_team_id_fkey(id, name, country)
    `)
    .eq("status", "scheduled")
    .order("game_date", { ascending: true })
    .limit(5);

  if (!games || games.length === 0) {
    console.log("  No upcoming games found");
    return;
  }

  console.log(`  Found ${games.length} games\n`);

  for (const game of games) {
    const away = Array.isArray(game.away_team) ? game.away_team[0] : game.away_team;
    const home = Array.isArray(game.home_team) ? game.home_team[0] : game.home_team;
    if (!away || !home) continue;

    const sessionId = slugify(`game-${away.country}-vs-${home.country}-${game.game_date}`);
    console.log(`\n--- ${away.country} vs ${home.country} (${game.game_date}) ---`);

    try {
      // Fetch key players for both teams
      const { data: awayPlayers } = await supabase
        .from("players")
        .select("mlb_id, full_name, position")
        .eq("team_id", away.id)
        .limit(3);

      const { data: homePlayers } = await supabase
        .from("players")
        .select("mlb_id, full_name, position")
        .eq("team_id", home.id)
        .limit(3);

      const prompt = buildGamePreviewVideoPrompt({
        awayTeam: away.country || away.name,
        homeTeam: home.country || home.name,
        venue: game.venue_name || "TBD",
        date: game.game_date,
        seriesDescription: game.series_description,
        awayPlayers: awayPlayers?.map((p) => `${p.full_name} (${p.position})`),
        homePlayers: homePlayers?.map((p) => `${p.full_name} (${p.position})`),
      });

      const script = (await generateScript(prompt)) || getSampleScript();
      await generateVideo(script, sessionId, { gamePk: game.mlb_game_pk });
      console.log(`  Done: ${sessionId}`);
    } catch (err) {
      console.error(`  Error: ${err.message}`);
    }
  }
}

async function generateTeamPreviewVideos() {
  console.log("\nFetching teams...");

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, country")
    .order("name")
    .limit(20);

  if (!teams || teams.length === 0) {
    console.log("  No teams found");
    return;
  }

  console.log(`  Found ${teams.length} teams\n`);

  for (const team of teams) {
    const sessionId = slugify(`team-${team.country || team.name}`);
    console.log(`\n--- ${team.country || team.name} Team Preview ---`);

    try {
      const { data: players } = await supabase
        .from("players")
        .select("mlb_id, full_name, position")
        .eq("team_id", team.id)
        .limit(5);

      const prompt = buildTeamPreviewVideoPrompt({
        teamName: team.name,
        country: team.country,
        players: players?.map((p) => `${p.full_name} (${p.position})`) || [],
      });

      const script = (await generateScript(prompt)) || getSampleScript();
      await generateVideo(script, sessionId);
      console.log(`  Done: ${sessionId}`);
    } catch (err) {
      console.error(`  Error: ${err.message}`);
    }
  }
}

async function generateSampleVideo() {
  console.log("\nGenerating sample video with player headshots...\n");

  const sessionId = "sample-wbc-2026-preview-v2";
  const script = getSampleScript();
  const videoPath = await generateVideo(script, sessionId);

  console.log(`\nSample video ready: ${videoPath}`);
  return videoPath;
}

// ─── CLI ────────────────────────────────────────────────────

const args = process.argv.slice(2);
const type = args.find((a) => !a.startsWith("--")) || "sample";

console.log("=========================================");
console.log("   GlobalBaseball Video Generator v3");
console.log("=========================================");
console.log(`  Mode: ${type}`);
console.log(`  Style: ${args.includes("--classic") ? "Classic (slides)" : "Broadcast (game footage + overlays)"}`);

switch (type) {
  case "game":
  case "game-preview":
    await generateGamePreviewVideos();
    break;
  case "team":
  case "team-preview":
    await generateTeamPreviewVideos();
    break;
  case "sample":
    await generateSampleVideo();
    break;
  case "all":
    await generateSampleVideo();
    await generateGamePreviewVideos();
    await generateTeamPreviewVideos();
    break;
  default:
    console.log(`
Usage: node scripts/video/generate.mjs [type] [options]

Types:
  sample         Generate sample video with WBC footage
  game-preview   Generate game preview videos from database
  team-preview   Generate team preview videos from database
  all            Generate all video types

Options:
  --classic      Use classic slide mode instead of broadcast mode
  --no-zoom      Disable Ken Burns zoom (classic mode only)
`);
}
