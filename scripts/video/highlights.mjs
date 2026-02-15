import { mkdirSync, existsSync, createWriteStream } from "fs";
import https from "https";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { CONFIG } from "./config.mjs";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const HIGHLIGHTS_DIR = path.join(CONFIG.paths.output, "media", "highlights");
mkdirSync(HIGHLIGHTS_DIR, { recursive: true });

// Fetch game content/highlights from MLB Stats API
async function fetchGameContent(gamePk) {
  const url = `https://statsapi.mlb.com/api/v1/game/${gamePk}/content`;
  const response = await fetch(url);
  if (!response.ok) return null;
  return response.json();
}

// Extract highlight video URLs from game content
function extractHighlightUrls(content) {
  const highlights = [];

  // Game highlights
  const items = content?.highlights?.highlights?.items || [];
  for (const item of items) {
    const playbacks = item.playbacks || [];
    // Prefer mp4Avc (lower quality, smaller files) for efficiency
    const mp4 = playbacks.find((p) => p.name === "mp4Avc") ||
                playbacks.find((p) => p.url?.endsWith(".mp4"));

    if (mp4?.url) {
      highlights.push({
        title: item.title || item.headline || "Highlight",
        description: item.description || "",
        duration: item.duration || "00:30",
        url: mp4.url,
        type: item.type || "highlight",
      });
    }
  }

  return highlights;
}

// Download a video file
function downloadVideo(url, destPath) {
  return new Promise((resolve, reject) => {
    if (existsSync(destPath)) {
      resolve(destPath);
      return;
    }

    const file = createWriteStream(destPath);

    function doGet(getUrl) {
      https.get(getUrl, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          file.close();
          doGet(response.headers.location);
          return;
        }
        if (response.statusCode !== 200) {
          file.close();
          reject(new Error(`HTTP ${response.statusCode}`));
          return;
        }
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve(destPath);
        });
      }).on("error", (err) => {
        file.close();
        reject(err);
      });
    }

    doGet(url);
  });
}

// Trim a highlight clip to a short segment using FFmpeg
function trimClip(inputPath, outputPath, startSeconds, durationSeconds) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(inputPath)
      .outputOptions([
        "-ss", String(startSeconds),
        "-t", String(durationSeconds),
        "-c:v", "libx264",
        "-c:a", "aac",
        "-pix_fmt", "yuv420p",
        "-vf", `scale=${CONFIG.video.width}:${CONFIG.video.height}:force_original_aspect_ratio=decrease,pad=${CONFIG.video.width}:${CONFIG.video.height}:(ow-iw)/2:(oh-ih)/2:color=0c1929`,
      ])
      .output(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", reject)
      .run();
  });
}

// Fetch and download highlight clips for a game
export async function getGameHighlights(gamePk, maxClips = 3) {
  console.log(`  Fetching highlights for game ${gamePk}...`);

  try {
    const content = await fetchGameContent(gamePk);
    if (!content) {
      console.log("  No content available for this game");
      return [];
    }

    const highlights = extractHighlightUrls(content);
    if (highlights.length === 0) {
      console.log("  No video highlights found");
      return [];
    }

    console.log(`  Found ${highlights.length} highlights, downloading top ${maxClips}...`);

    const clips = [];
    for (let i = 0; i < Math.min(highlights.length, maxClips); i++) {
      const hl = highlights[i];
      const rawPath = path.join(HIGHLIGHTS_DIR, `${gamePk}_raw_${i}.mp4`);
      const clipPath = path.join(HIGHLIGHTS_DIR, `${gamePk}_clip_${i}.mp4`);

      try {
        // Download full highlight
        await downloadVideo(hl.url, rawPath);

        // Trim to 5-second clip (start at 2s to skip intro graphics)
        if (!existsSync(clipPath)) {
          await trimClip(rawPath, clipPath, 2, 5);
        }

        clips.push({
          path: clipPath,
          title: hl.title,
          duration: 5,
        });

        console.log(`  Clip ${i + 1}: ${hl.title.substring(0, 50)}`);
      } catch (err) {
        console.log(`  Could not process highlight ${i}: ${err.message}`);
      }
    }

    return clips;
  } catch (err) {
    console.log(`  Highlight fetch error: ${err.message}`);
    return [];
  }
}

// Search for player highlights across recent games
export async function getPlayerHighlights(playerName, maxClips = 2) {
  // MLB search API for player highlights
  const searchUrl = `https://search-api.mlb.com/svc/search/v2/mlb_global_sitesearch_en/query?q=${encodeURIComponent(playerName)}&page=1&sort=new&type=video&hl=false&expand=highlight.id,highlight.title,highlight.duration,highlight.playbacks`;

  try {
    const response = await fetch(searchUrl);
    if (!response.ok) return [];

    const data = await response.json();
    const results = data?.docs || [];
    const clips = [];

    for (let i = 0; i < Math.min(results.length, maxClips); i++) {
      const video = results[i];
      if (video.url) {
        const rawPath = path.join(HIGHLIGHTS_DIR, `player_${playerName.replace(/\s/g, "_")}_${i}.mp4`);
        try {
          await downloadVideo(video.url, rawPath);
          clips.push({ path: rawPath, title: video.title, duration: 5 });
        } catch {
          // Skip
        }
      }
    }

    return clips;
  } catch {
    return [];
  }
}
