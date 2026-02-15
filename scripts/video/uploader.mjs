import { google } from "googleapis";
import { createReadStream, readFileSync, existsSync } from "fs";
import path from "path";
import { CONFIG } from "./config.mjs";

const CREDENTIALS_PATH = path.join(
  CONFIG.paths.output,
  "youtube-credentials.json"
);
const TOKEN_PATH = path.join(CONFIG.paths.output, "youtube-token.json");

function getAuthClient() {
  if (!existsSync(CREDENTIALS_PATH)) {
    console.log(`
  ┌──────────────────────────────────────────────────────┐
  │          YouTube Upload Setup Required                │
  ├──────────────────────────────────────────────────────┤
  │                                                      │
  │  1. Go to https://console.cloud.google.com           │
  │  2. Create a project (or select existing)            │
  │  3. Enable "YouTube Data API v3"                     │
  │  4. Create OAuth 2.0 credentials (Desktop app)      │
  │  5. Download the JSON and save it as:                │
  │     output/youtube-credentials.json                  │
  │  6. Run this script again                            │
  │                                                      │
  │  Videos are saved locally and can be uploaded        │
  │  manually to YouTube in the meantime.                │
  │                                                      │
  └──────────────────────────────────────────────────────┘
`);
    return null;
  }

  const credentials = JSON.parse(readFileSync(CREDENTIALS_PATH, "utf8"));
  const { client_id, client_secret, redirect_uris } =
    credentials.installed || credentials.web;

  const auth = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  if (existsSync(TOKEN_PATH)) {
    const token = JSON.parse(readFileSync(TOKEN_PATH, "utf8"));
    auth.setCredentials(token);
  }

  return auth;
}

export async function uploadToYouTube(videoPath, metadata) {
  const auth = getAuthClient();
  if (!auth) {
    console.log("  Skipping YouTube upload (no credentials configured)");
    return null;
  }

  // Check if we have a valid token
  if (!auth.credentials || !auth.credentials.access_token) {
    const authUrl = auth.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/youtube.upload"],
    });

    console.log(`\n  Authorize this app by visiting:\n  ${authUrl}\n`);
    console.log(
      "  After authorization, save the token to output/youtube-token.json"
    );
    return null;
  }

  const youtube = google.youtube({ version: "v3", auth });

  try {
    const response = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title: metadata.title,
          description:
            metadata.description +
            "\n\n#WBC2026 #Baseball #WorldBaseballClassic #GlobalBaseball",
          tags: metadata.tags || [
            "WBC",
            "Baseball",
            "2026",
            "World Baseball Classic",
          ],
          categoryId: "17", // Sports
          defaultLanguage: "en",
        },
        status: {
          privacyStatus: metadata.privacy || "public",
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        body: createReadStream(videoPath),
      },
    });

    const videoId = response.data.id;
    console.log(`  Uploaded: https://youtube.com/watch?v=${videoId}`);
    return videoId;
  } catch (err) {
    console.error("  YouTube upload error:", err.message);
    return null;
  }
}
