import { mkdirSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { CONFIG } from "./config.mjs";

const MEDIA_DIR = path.join(CONFIG.paths.output, "media");
const HEADSHOTS_DIR = path.join(MEDIA_DIR, "headshots");

mkdirSync(HEADSHOTS_DIR, { recursive: true });

// Download a file using fetch (handles redirects automatically)
async function downloadFile(url, destPath) {
  if (existsSync(destPath)) return destPath; // Cached

  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(destPath, buffer);
  return destPath;
}

// Download player headshot from MLB
// Working URL: https://securea.mlb.com/mlb/images/players/head_shot/{mlb_id}.jpg
export async function downloadHeadshot(mlbId) {
  if (!mlbId) return null;

  const destPath = path.join(HEADSHOTS_DIR, `${mlbId}.jpg`);
  const url = `https://securea.mlb.com/mlb/images/players/head_shot/${mlbId}.jpg`;

  try {
    await downloadFile(url, destPath);
    return destPath;
  } catch (err) {
    console.log(`  Could not download headshot for MLB ID ${mlbId}: ${err.message}`);
    return null;
  }
}

// Download multiple player headshots, returns map of name/id -> filePath
export async function downloadPlayerHeadshots(players) {
  const headshots = {};
  let downloaded = 0;

  for (const player of players) {
    if (player.mlb_id) {
      const filePath = await downloadHeadshot(player.mlb_id);
      if (filePath) {
        headshots[player.mlb_id] = filePath;
        headshots[player.full_name] = filePath;
        downloaded++;
      }
    }
  }

  console.log(`  Downloaded ${downloaded} player headshots`);
  return headshots;
}
