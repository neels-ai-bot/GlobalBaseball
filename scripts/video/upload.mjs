import { existsSync } from "fs";
import path from "path";
import { CONFIG } from "./config.mjs";
import { uploadToYouTube } from "./uploader.mjs";

const args = process.argv.slice(2);

// Find video file
let videoPath = args.find((a) => !a.startsWith("--"));
if (!videoPath) {
  // Default to most recent sample video
  videoPath = path.join(CONFIG.paths.videos, "sample-wbc-2026-preview-v2.mp4");
}

if (!existsSync(videoPath)) {
  console.error(`Video not found: ${videoPath}`);
  console.log("\nUsage: node scripts/video/upload.mjs [video-path] [options]");
  console.log("\nOptions:");
  console.log("  --title \"Video Title\"    Set the video title");
  console.log("  --unlisted               Upload as unlisted (default: public)");
  console.log("  --private                Upload as private");
  process.exit(1);
}

// Parse options
const title = args.find((a, i) => args[i - 1] === "--title") ||
  "WBC 2026 Preview - The World Stage Awaits";
const privacy = args.includes("--private")
  ? "private"
  : args.includes("--unlisted")
    ? "unlisted"
    : "public";

const metadata = {
  title,
  description:
    "A look ahead at the 2026 World Baseball Classic featuring the top teams and players from around the world.\n\nFeaturing highlights from WBC 2023 and previews of the biggest matchups in 2026.",
  tags: [
    "WBC", "WBC 2026", "World Baseball Classic", "Baseball",
    "Japan", "USA", "Team USA", "Shohei Ohtani", "Preview",
    "GlobalBaseball", "International Baseball",
  ],
  privacy,
};

console.log("=========================================");
console.log("   GlobalBaseball YouTube Uploader");
console.log("=========================================");
console.log(`  Video: ${videoPath}`);
console.log(`  Title: ${metadata.title}`);
console.log(`  Privacy: ${metadata.privacy}`);
console.log("");

const videoId = await uploadToYouTube(videoPath, metadata);

if (videoId) {
  console.log("\nDone! Your video is live.");
} else {
  console.log("\nUpload did not complete. Check the messages above.");
}
