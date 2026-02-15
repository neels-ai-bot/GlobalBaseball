import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "..");

// Load .env.local
try {
  const env = readFileSync(path.join(ROOT, ".env.local"), "utf8");
  for (const line of env.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
} catch {
  // .env.local not found, rely on existing env vars
}

export const CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  geminiKey: process.env.GEMINI_API_KEY,

  video: { width: 1920, height: 1080, fps: 30 },
  voice: "en-US-AndrewNeural",

  colors: {
    bg: "#0c1929",
    bgLight: "#162a4a",
    text: "#ffffff",
    textDim: "#94a3b8",
    gold: "#d4a44c",
    blue: "#3b82f6",
    green: "#22c55e",
    red: "#ef4444",
  },

  paths: {
    output: path.join(ROOT, "output"),
    videos: path.join(ROOT, "output", "videos"),
    audio: path.join(ROOT, "output", "audio"),
    slides: path.join(ROOT, "output", "slides"),
    temp: path.join(ROOT, "output", "temp"),
  },
};

export const ROOT_DIR = ROOT;
