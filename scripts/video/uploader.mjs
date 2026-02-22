import { google } from "googleapis";
import { createReadStream, readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import http from "http";
import { exec } from "child_process";
import { CONFIG } from "./config.mjs";

const CREDENTIALS_PATH = path.join(CONFIG.paths.output, "youtube-credentials.json");
const TOKEN_PATH = path.join(CONFIG.paths.output, "youtube-token.json");
const OAUTH_PORT = 8976;

function getAuthClient() {
  if (!existsSync(CREDENTIALS_PATH)) {
    return null;
  }

  const credentials = JSON.parse(readFileSync(CREDENTIALS_PATH, "utf8"));
  const { client_id, client_secret } = credentials.installed || credentials.web;

  const auth = new google.auth.OAuth2(
    client_id,
    client_secret,
    `http://localhost:${OAUTH_PORT}`
  );

  if (existsSync(TOKEN_PATH)) {
    const token = JSON.parse(readFileSync(TOKEN_PATH, "utf8"));
    auth.setCredentials(token);
  }

  return auth;
}

// Interactive OAuth - opens browser, catches callback on local server
function authenticateInteractive(auth) {
  return new Promise((resolve, reject) => {
    const authUrl = auth.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/youtube.upload",
        "https://www.googleapis.com/auth/youtube",
      ],
    });

    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url, `http://localhost:${OAUTH_PORT}`);
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");

        if (error) {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(`<html><body style="font-family:Arial;text-align:center;padding:60px;background:#0c1929;color:white"><h1 style="color:#ef4444">Authorization Denied</h1><p>${error}</p></body></html>`);
          server.close();
          reject(new Error(`OAuth error: ${error}`));
          return;
        }

        if (code) {
          const { tokens } = await auth.getToken(code);
          auth.setCredentials(tokens);
          writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));

          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(`<html><body style="font-family:Arial;text-align:center;padding:60px;background:#0c1929;color:white"><h1 style="color:#d4a44c">GlobalBaseball Authorized</h1><p style="color:#94a3b8;font-size:18px">YouTube upload permission granted. You can close this window.</p></body></html>`);
          server.close();
          resolve(tokens);
        }
      } catch (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Authorization error");
        server.close();
        reject(err);
      }
    });

    server.listen(OAUTH_PORT, () => {
      console.log(`  Opening browser for YouTube authorization...`);
      console.log(`  (If browser doesn't open, visit this URL manually):`);
      console.log(`  ${authUrl}\n`);
      exec(`start "" "${authUrl}"`);
    });

    setTimeout(() => {
      server.close();
      reject(new Error("OAuth timeout - no response within 3 minutes"));
    }, 180000);
  });
}

function showSetupInstructions() {
  console.log(`
  ┌──────────────────────────────────────────────────────────┐
  │            YouTube Upload Setup Required                  │
  ├──────────────────────────────────────────────────────────┤
  │                                                          │
  │  Step 1: Create a YouTube channel                        │
  │    - Go to youtube.com and sign in                       │
  │    - Click your profile icon -> "Create a channel"       │
  │                                                          │
  │  Step 2: Set up Google Cloud project                     │
  │    - Go to https://console.cloud.google.com              │
  │    - Create a new project (e.g. "GlobalBaseball")        │
  │    - Enable "YouTube Data API v3"                        │
  │                                                          │
  │  Step 3: Create OAuth credentials                        │
  │    - Go to APIs & Services -> Credentials                │
  │    - Click "+ CREATE CREDENTIALS" -> "OAuth client ID"   │
  │    - If prompted, configure consent screen first:        │
  │      - User type: External                               │
  │      - App name: "GlobalBaseball"                        │
  │      - Add yourself as test user                         │
  │    - Application type: "Desktop app"                     │
  │    - Name: "GlobalBaseball Uploader"                     │
  │    - Click "Download JSON"                               │
  │                                                          │
  │  Step 4: Save the credentials file as:                   │
  │    output/youtube-credentials.json                       │
  │                                                          │
  │  Step 5: Run the upload again - browser will open for    │
  │          one-time authorization                          │
  │                                                          │
  └──────────────────────────────────────────────────────────┘
`);
}

export async function uploadToYouTube(videoPath, metadata) {
  const auth = getAuthClient();
  if (!auth) {
    showSetupInstructions();
    console.log("  Skipping YouTube upload (no credentials configured)");
    return null;
  }

  // If no token, run interactive OAuth in browser
  if (!auth.credentials || !auth.credentials.access_token) {
    console.log("\n  YouTube authorization required (first time only)...");
    try {
      await authenticateInteractive(auth);
      console.log("  Authorization successful!\n");
    } catch (err) {
      console.error(`  Auth failed: ${err.message}`);
      return null;
    }
  }

  const youtube = google.youtube({ version: "v3", auth });

  try {
    console.log(`  Uploading "${metadata.title}" to YouTube...`);
    console.log(`  File: ${videoPath}`);
    console.log("  This may take a minute...\n");

    const response = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title: metadata.title,
          description:
            (metadata.description || "") +
            "\n\n#WBC2026 #Baseball #WorldBaseballClassic #GlobalBaseball",
          tags: metadata.tags || [
            "WBC", "Baseball", "2026", "World Baseball Classic",
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
    console.log(`  Published! https://youtube.com/watch?v=${videoId}`);
    return videoId;
  } catch (err) {
    console.error("  YouTube upload error:", err.message);
    if (err.message.includes("invalid_grant") || err.message.includes("Token has been expired")) {
      console.log("  Token expired - re-authorizing...");
      try {
        auth.setCredentials({});
        await authenticateInteractive(auth);
        return uploadToYouTube(videoPath, metadata);
      } catch {
        console.error("  Re-auth failed. Delete output/youtube-token.json and try again.");
      }
    }
    return null;
  }
}

// Standalone upload function for direct CLI usage
export async function uploadExistingVideo(videoPath) {
  const metadata = {
    title: "WBC 2026 Preview - The World Stage Awaits",
    description: "A look ahead at the 2026 World Baseball Classic featuring the top teams and players from around the world.",
    tags: ["WBC", "2026", "Baseball", "World Baseball Classic", "Preview", "GlobalBaseball"],
    privacy: "public",
  };

  return uploadToYouTube(videoPath, metadata);
}
