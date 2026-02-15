import { mkdirSync, existsSync, writeFileSync } from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import os from "os";
import { CONFIG } from "./config.mjs";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const CLIPS_DIR = path.join(CONFIG.paths.output, "media", "wbc-clips");
const FFMPEG_TEMP = path.join(os.tmpdir(), "gb-video");
mkdirSync(CLIPS_DIR, { recursive: true });
mkdirSync(FFMPEG_TEMP, { recursive: true });

// Key WBC 2023 games with lots of highlights
const NOTABLE_GAMES = {
  championship: { pk: 719497, label: "2023 WBC Final: USA vs Japan" },
  japan_mexico: { pk: 719499, label: "2023 WBC Semi: Mexico vs Japan" },
  usa_cuba: { pk: 719498, label: "2023 WBC Semi: Cuba vs USA" },
  usa_venezuela: { pk: 719501, label: "2023 QF: USA vs Venezuela" },
  mexico_puertorico: { pk: 719500, label: "2023 QF: Puerto Rico vs Mexico" },
  japan_italy: { pk: 719502, label: "2023 QF: Italy vs Japan" },
  dr_puertorico: { pk: 719506, label: "2023: Puerto Rico vs Dominican Republic" },
};

// Fetch highlight clips from a specific game
async function fetchGameHighlights(gamePk) {
  const url = `https://statsapi.mlb.com/api/v1/game/${gamePk}/content`;
  const response = await fetch(url);
  if (!response.ok) return [];

  const data = await response.json();
  const items = data?.highlights?.highlights?.items || [];

  return items
    .filter((item) => {
      // Filter for actual play highlights (not recaps or interviews)
      const isPlay =
        item.type === "video" ||
        item.title?.includes("HR") ||
        item.title?.includes("K") ||
        item.title?.includes("hit") ||
        item.title?.includes("catch") ||
        item.title?.includes("play") ||
        item.title?.includes("run") ||
        item.title?.includes("out") ||
        item.title?.includes("homer");
      return isPlay || items.indexOf(item) > 0; // Skip recap (usually first)
    })
    .map((item) => {
      const mp4 =
        item.playbacks?.find((p) => p.name === "mp4Avc") ||
        item.playbacks?.find((p) => p.url?.endsWith(".mp4"));
      return {
        title: item.title || "Highlight",
        description: item.description || "",
        url: mp4?.url,
        duration: item.duration,
      };
    })
    .filter((h) => h.url);
}

// Download and trim a highlight clip to a specific duration
async function downloadAndTrimClip(url, outputPath, startSec, durationSec) {
  if (existsSync(outputPath)) return outputPath;

  // Download raw video
  const rawPath = outputPath.replace(".mp4", "_raw.mp4");
  if (!existsSync(rawPath)) {
    const response = await fetch(url, { redirect: "follow" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    writeFileSync(rawPath, buffer);
  }

  // Trim and scale to match our video dimensions
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(rawPath)
      .outputOptions([
        "-ss", String(startSec),
        "-t", String(durationSec),
        "-c:v", "libx264",
        "-c:a", "aac",
        "-b:a", "192k",
        "-pix_fmt", "yuv420p",
        "-vf",
        `scale=${CONFIG.video.width}:${CONFIG.video.height}:force_original_aspect_ratio=decrease,pad=${CONFIG.video.width}:${CONFIG.video.height}:(ow-iw)/2:(oh-ih)/2:color=0c1929`,
        "-r", String(CONFIG.video.fps),
      ])
      .output(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", reject)
      .run();
  });
}

// Get highlight clips for a specific team from past WBC games
export async function getTeamWBCHighlights(teamName, maxClips = 2) {
  console.log(`  Searching WBC history for ${teamName}...`);
  const clips = [];

  // Search all notable games for this team
  for (const [key, game] of Object.entries(NOTABLE_GAMES)) {
    if (clips.length >= maxClips) break;

    const highlights = await fetchGameHighlights(game.pk);

    // Find highlights mentioning this team or its players
    const teamHighlights = highlights.filter(
      (h) =>
        h.title?.toLowerCase().includes(teamName.toLowerCase()) ||
        h.description?.toLowerCase().includes(teamName.toLowerCase())
    );

    // If no team-specific ones, just use best highlights from games they played in
    const gameLabel = game.label.toLowerCase();
    const isTeamGame = gameLabel.includes(teamName.toLowerCase());

    const toUse = teamHighlights.length > 0 ? teamHighlights : isTeamGame ? highlights.slice(1, 4) : [];

    for (const hl of toUse.slice(0, maxClips - clips.length)) {
      const clipId = `${game.pk}_${highlights.indexOf(hl)}`;
      const clipPath = path.join(CLIPS_DIR, `${clipId}.mp4`);

      try {
        await downloadAndTrimClip(hl.url, clipPath, 1, 5);
        clips.push({
          path: clipPath,
          title: hl.title,
          duration: 5,
          source: game.label,
        });
        console.log(`  Clip: ${hl.title.substring(0, 60)} (${game.label})`);
      } catch (err) {
        console.log(`  Could not process clip: ${err.message}`);
      }
    }
  }

  return clips;
}

// Get general WBC highlight clips (best moments from 2023)
export async function getBestWBCHighlights(maxClips = 3) {
  console.log("  Fetching best WBC 2023 moments...");
  const clips = [];

  // Championship game has the best highlights
  const priorityGames = [
    NOTABLE_GAMES.championship,
    NOTABLE_GAMES.japan_mexico,
    NOTABLE_GAMES.usa_cuba,
  ];

  for (const game of priorityGames) {
    if (clips.length >= maxClips) break;

    const highlights = await fetchGameHighlights(game.pk);

    // Skip the first (usually recap), get actual plays
    for (const hl of highlights.slice(1, 6)) {
      if (clips.length >= maxClips) break;

      const clipId = `best_${game.pk}_${highlights.indexOf(hl)}`;
      const clipPath = path.join(CLIPS_DIR, `${clipId}.mp4`);

      try {
        await downloadAndTrimClip(hl.url, clipPath, 1, 5);
        clips.push({
          path: clipPath,
          title: hl.title,
          duration: 5,
          source: game.label,
        });
        console.log(`  Clip: ${hl.title.substring(0, 60)}`);
      } catch (err) {
        console.log(`  Could not process: ${err.message}`);
      }
    }
  }

  console.log(`  Got ${clips.length} WBC highlight clips`);
  return clips;
}

// Get all notable game PKs (for custom fetching)
export { NOTABLE_GAMES };
