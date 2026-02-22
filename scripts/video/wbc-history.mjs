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

// Key WBC 2023 games
const NOTABLE_GAMES = {
  championship: { pk: 719497, label: "2023 Final: USA vs Japan", teams: ["japan", "united states", "usa"] },
  japan_mexico: { pk: 719499, label: "2023 Semi: Mexico vs Japan", teams: ["japan", "mexico"] },
  usa_cuba: { pk: 719498, label: "2023 Semi: Cuba vs USA", teams: ["united states", "usa", "cuba"] },
  usa_venezuela: { pk: 719501, label: "2023 QF: USA vs Venezuela", teams: ["united states", "usa", "venezuela"] },
  mexico_puertorico: { pk: 719500, label: "2023 QF: Puerto Rico vs Mexico", teams: ["mexico", "puerto rico"] },
  japan_italy: { pk: 719502, label: "2023 QF: Italy vs Japan", teams: ["japan", "italy"] },
  dr_puertorico: { pk: 719506, label: "2023: PR vs Dominican Republic", teams: ["dominican republic", "puerto rico"] },
};

// Cache game highlights to avoid redundant API calls
const highlightsCache = {};

async function fetchGameHighlights(gamePk) {
  if (highlightsCache[gamePk]) return highlightsCache[gamePk];

  const url = `https://statsapi.mlb.com/api/v1/game/${gamePk}/content`;
  const response = await fetch(url);
  if (!response.ok) return [];
  const data = await response.json();
  const items = data?.highlights?.highlights?.items || [];

  const result = items
    .map((item) => {
      const mp4 =
        item.playbacks?.find((p) => p.name === "mp4Avc") ||
        item.playbacks?.find((p) => p.url?.endsWith(".mp4"));
      return {
        title: item.title || "Highlight",
        description: item.description || "",
        url: mp4?.url,
      };
    })
    .filter((h) => h.url);

  highlightsCache[gamePk] = result;
  return result;
}

// Download and trim a clip, scaled to our video size
function downloadAndTrimClip(url, outputPath, startSec, durationSec) {
  return new Promise(async (resolve, reject) => {
    if (existsSync(outputPath)) { resolve(outputPath); return; }

    const rawPath = outputPath.replace(".mp4", "_raw.mp4");
    if (!existsSync(rawPath)) {
      try {
        const response = await fetch(url, { redirect: "follow" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const buffer = Buffer.from(await response.arrayBuffer());
        writeFileSync(rawPath, buffer);
      } catch (err) {
        reject(err);
        return;
      }
    }

    ffmpeg()
      .input(rawPath)
      .outputOptions([
        "-ss", String(startSec),
        "-t", String(durationSec),
        "-c:v", "libx264",
        "-c:a", "aac",
        "-b:a", "192k",
        "-pix_fmt", "yuv420p",
        "-vf", `scale=${CONFIG.video.width}:${CONFIG.video.height}:force_original_aspect_ratio=decrease,pad=${CONFIG.video.width}:${CONFIG.video.height}:(ow-iw)/2:(oh-ih)/2:color=0c1929`,
        "-r", String(CONFIG.video.fps),
      ])
      .output(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", reject)
      .run();
  });
}

// Get team-specific WBC highlights
export async function getTeamWBCHighlights(teamName, maxClips = 3) {
  console.log(`  Searching WBC history for ${teamName}...`);
  const clips = [];
  const teamLower = teamName.toLowerCase();

  for (const [key, game] of Object.entries(NOTABLE_GAMES)) {
    if (clips.length >= maxClips) break;
    if (!game.teams.some((t) => teamLower.includes(t) || t.includes(teamLower))) continue;

    const highlights = await fetchGameHighlights(game.pk);
    // Skip first (recap), get action clips
    for (const hl of highlights.slice(1, 5)) {
      if (clips.length >= maxClips) break;
      const clipId = `team_${game.pk}_${highlights.indexOf(hl)}`;
      const clipPath = path.join(CLIPS_DIR, `${clipId}.mp4`);
      try {
        await downloadAndTrimClip(hl.url, clipPath, 1, 8);
        clips.push({ path: clipPath, title: hl.title, duration: 8, source: game.label });
        console.log(`    ${hl.title.substring(0, 55)}`);
      } catch (err) {
        // skip
      }
    }
  }

  return clips;
}

// Get a large curated set of WBC clips for a full broadcast-style video
export async function getCuratedWBCClips(maxClips = 10) {
  console.log("  Downloading WBC 2023 highlight footage...");
  const clips = [];

  // Prioritize: championship, semis, then quarterfinals
  const gameOrder = [
    NOTABLE_GAMES.championship,
    NOTABLE_GAMES.japan_mexico,
    NOTABLE_GAMES.usa_cuba,
    NOTABLE_GAMES.usa_venezuela,
    NOTABLE_GAMES.mexico_puertorico,
    NOTABLE_GAMES.japan_italy,
    NOTABLE_GAMES.dr_puertorico,
  ];

  for (const game of gameOrder) {
    if (clips.length >= maxClips) break;

    const highlights = await fetchGameHighlights(game.pk);
    // Skip recap (index 0), grab 2-3 action clips per game
    const actionClips = highlights.slice(1, 4);

    for (const hl of actionClips) {
      if (clips.length >= maxClips) break;

      const clipId = `curated_${game.pk}_${highlights.indexOf(hl)}`;
      const clipPath = path.join(CLIPS_DIR, `${clipId}.mp4`);

      try {
        await downloadAndTrimClip(hl.url, clipPath, 1, 10);
        clips.push({
          path: clipPath,
          title: hl.title,
          duration: 10,
          source: game.label,
          teams: game.teams,
        });
        console.log(`    ${hl.title.substring(0, 55)} (${game.label})`);
      } catch {
        // skip failed downloads
      }
    }
  }

  console.log(`  Downloaded ${clips.length} clips`);
  return clips;
}

// Get best highlights (fewer clips, for non-broadcast mode)
export async function getBestWBCHighlights(maxClips = 3) {
  console.log("  Fetching best WBC 2023 moments...");
  const clips = [];
  const highlights = await fetchGameHighlights(NOTABLE_GAMES.championship.pk);

  for (const hl of highlights.slice(1, maxClips + 1)) {
    const clipId = `best_${NOTABLE_GAMES.championship.pk}_${highlights.indexOf(hl)}`;
    const clipPath = path.join(CLIPS_DIR, `${clipId}.mp4`);
    try {
      await downloadAndTrimClip(hl.url, clipPath, 1, 5);
      clips.push({ path: clipPath, title: hl.title, duration: 5, source: "2023 WBC Final" });
      console.log(`    ${hl.title.substring(0, 55)}`);
    } catch { /* skip */ }
  }

  console.log(`  Got ${clips.length} WBC highlight clips`);
  return clips;
}

// ─── Dynamic WBC 2023 Schedule Lookup ────────────────────────

const WBC_NATIONAL_TEAMS = new Set([
  "australia", "canada", "china", "chinese taipei", "colombia", "cuba",
  "czech republic", "dominican republic", "great britain", "israel", "italy",
  "japan", "kingdom of the netherlands", "korea", "mexico", "nicaragua",
  "panama", "puerto rico", "united states", "venezuela",
]);

// Our names -> API name variations
const TEAM_ALIASES = {
  "south korea": "korea",
  "netherlands": "kingdom of the netherlands",
  "usa": "united states",
};

function normalizeToApi(name) {
  const lower = name.toLowerCase();
  return TEAM_ALIASES[lower] || lower;
}

function teamMatches(apiName, searchName) {
  const api = apiName.toLowerCase();
  const search = normalizeToApi(searchName);
  return api === search || api.includes(search) || search.includes(api);
}

let wbc2023Cache = null;

async function getWBC2023Schedule() {
  if (wbc2023Cache) return wbc2023Cache;

  const url = "https://statsapi.mlb.com/api/v1/schedule?sportId=51&season=2023";
  const response = await fetch(url);
  if (!response.ok) return [];
  const data = await response.json();

  const games = [];
  for (const date of data.dates || []) {
    for (const g of date.games || []) {
      const away = (g.teams?.away?.team?.name || "").toLowerCase();
      const home = (g.teams?.home?.team?.name || "").toLowerCase();
      if (WBC_NATIONAL_TEAMS.has(away) && WBC_NATIONAL_TEAMS.has(home)) {
        games.push({ pk: g.gamePk, away, home, date: date.date });
      }
    }
  }

  wbc2023Cache = games;
  return games;
}

// Get highlight clips from a specific team's WBC 2023 games
export async function getTeamClips(teamName, maxClips = 5) {
  console.log(`  Fetching ${teamName}-specific WBC 2023 highlights...`);
  const schedule = await getWBC2023Schedule();

  const teamGames = schedule.filter(
    (g) => teamMatches(g.away, teamName) || teamMatches(g.home, teamName)
  );

  if (teamGames.length === 0) {
    console.log(`    No WBC 2023 games found for ${teamName}, using curated`);
    return getCuratedWBCClips(maxClips);
  }

  console.log(`    Found ${teamGames.length} games for ${teamName}`);
  const clips = [];
  const tag = teamName.toLowerCase().replace(/\s+/g, "_");

  for (const game of teamGames) {
    if (clips.length >= maxClips) break;

    const highlights = await fetchGameHighlights(game.pk);
    for (const hl of highlights.slice(1, 3)) {
      if (clips.length >= maxClips) break;
      const clipId = `t_${tag}_${game.pk}_${highlights.indexOf(hl)}`;
      const clipPath = path.join(CLIPS_DIR, `${clipId}.mp4`);
      try {
        await downloadAndTrimClip(hl.url, clipPath, 1, 10);
        clips.push({ path: clipPath, title: hl.title, duration: 10, source: `${game.away} vs ${game.home}` });
        console.log(`    ${hl.title.substring(0, 55)}`);
      } catch {
        // skip
      }
    }
  }

  if (clips.length === 0) {
    console.log(`    No clips downloaded for ${teamName}, using curated`);
    return getCuratedWBCClips(maxClips);
  }

  console.log(`    Got ${clips.length} ${teamName}-specific clips`);
  return clips;
}

// Get clips for a specific matchup - prioritizes head-to-head, then mixes each team's clips
export async function getMatchupClips(teamAName, teamBName, maxClips = 5) {
  console.log(`  Fetching ${teamAName} vs ${teamBName} highlights...`);
  const schedule = await getWBC2023Schedule();
  const clips = [];

  // Priority 1: Head-to-head game
  const h2h = schedule.filter(
    (g) =>
      (teamMatches(g.away, teamAName) && teamMatches(g.home, teamBName)) ||
      (teamMatches(g.away, teamBName) && teamMatches(g.home, teamAName))
  );

  if (h2h.length > 0) {
    console.log(`    Head-to-head found: ${h2h[0].away} vs ${h2h[0].home}`);
    for (const game of h2h) {
      const highlights = await fetchGameHighlights(game.pk);
      for (const hl of highlights.slice(1, maxClips + 1)) {
        if (clips.length >= maxClips) break;
        const clipId = `h2h_${game.pk}_${highlights.indexOf(hl)}`;
        const clipPath = path.join(CLIPS_DIR, `${clipId}.mp4`);
        try {
          await downloadAndTrimClip(hl.url, clipPath, 1, 10);
          clips.push({ path: clipPath, title: hl.title, duration: 10, source: `${game.away} vs ${game.home}` });
          console.log(`    ${hl.title.substring(0, 55)}`);
        } catch {
          // skip
        }
      }
    }
    if (clips.length >= maxClips) return clips;
  }

  // Priority 2: Mix clips from each team's games
  const remaining = maxClips - clips.length;
  const perTeam = Math.ceil(remaining / 2);

  for (const [name, limit] of [[teamAName, perTeam], [teamBName, remaining - clips.length > perTeam ? perTeam : remaining - clips.length]]) {
    const teamGames = schedule.filter(
      (g) => teamMatches(g.away, name) || teamMatches(g.home, name)
    );
    let count = 0;
    for (const game of teamGames) {
      if (count >= limit || clips.length >= maxClips) break;
      const highlights = await fetchGameHighlights(game.pk);
      for (const hl of highlights.slice(1, 3)) {
        if (count >= limit || clips.length >= maxClips) break;
        const tag = name.toLowerCase().replace(/\s+/g, "_");
        const clipId = `m_${tag}_${game.pk}_${highlights.indexOf(hl)}`;
        const clipPath = path.join(CLIPS_DIR, `${clipId}.mp4`);
        try {
          await downloadAndTrimClip(hl.url, clipPath, 1, 10);
          clips.push({ path: clipPath, title: hl.title, duration: 10, source: `${game.away} vs ${game.home}` });
          console.log(`    ${hl.title.substring(0, 55)}`);
          count++;
        } catch {
          // skip
        }
      }
    }
  }

  if (clips.length === 0) {
    console.log(`    No specific clips found, using curated`);
    return getCuratedWBCClips(maxClips);
  }

  return clips;
}

export { NOTABLE_GAMES };
