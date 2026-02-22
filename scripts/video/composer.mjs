import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import {
  writeFileSync,
  mkdirSync,
  createReadStream,
  createWriteStream,
  copyFileSync,
  existsSync,
  unlinkSync,
} from "fs";
import path from "path";
import os from "os";
import { CONFIG } from "./config.mjs";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const FFMPEG_TEMP = path.join(os.tmpdir(), "gb-video");

// Merge MP3 files by binary concatenation
function mergeAudioFiles(audioFiles, outputPath) {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath);
    let i = 0;

    function appendNext() {
      if (i >= audioFiles.length) {
        output.end();
        return;
      }
      const input = createReadStream(audioFiles[i].path);
      i++;
      input.on("error", reject);
      input.pipe(output, { end: false });
      input.on("end", appendNext);
    }

    output.on("finish", () => resolve(outputPath));
    output.on("error", reject);
    appendNext();
  });
}

// Create a single slide segment with Ken Burns zoom effect
function createSlideSegment(imagePath, audioPath, duration, outputPath) {
  return new Promise((resolve, reject) => {
    // Slow zoom: 1.0 -> 1.15 over the slide duration
    const totalFrames = Math.ceil(duration * CONFIG.video.fps);
    const zoomPerFrame = 0.15 / totalFrames;

    ffmpeg()
      .input(imagePath)
      .inputOptions(["-loop", "1"])
      .input(audioPath)
      .outputOptions([
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-t", String(duration),
        "-vf",
        `zoompan=z='min(zoom+${zoomPerFrame.toFixed(6)},1.15)':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${CONFIG.video.width}x${CONFIG.video.height}:fps=${CONFIG.video.fps}`,
        "-shortest",
      ])
      .output(outputPath)
      .on("error", reject)
      .on("end", () => resolve(outputPath))
      .run();
  });
}

// Simple slide (no zoom) for faster encoding as fallback
function createSimpleVideo(concatFile, audioPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(concatFile)
      .inputOptions(["-f", "concat", "-safe", "0"])
      .input(audioPath)
      .outputOptions([
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        "-movflags", "+faststart",
      ])
      .output(outputPath)
      .on("start", () => console.log("  FFmpeg encoding..."))
      .on("end", () => resolve(outputPath))
      .on("error", reject)
      .run();
  });
}

// Re-encode a highlight clip to match our video format (for seamless concat)
function normalizeClip(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    if (existsSync(outputPath)) { resolve(outputPath); return; }
    ffmpeg()
      .input(inputPath)
      .outputOptions([
        "-c:v", "libx264",
        "-c:a", "aac",
        "-b:a", "192k",
        "-pix_fmt", "yuv420p",
        "-r", String(CONFIG.video.fps),
        "-vf", `scale=${CONFIG.video.width}:${CONFIG.video.height}:force_original_aspect_ratio=decrease,pad=${CONFIG.video.width}:${CONFIG.video.height}:(ow-iw)/2:(oh-ih)/2:color=0c1929`,
      ])
      .output(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", reject)
      .run();
  });
}

// ─── Broadcast Mode: Game Footage + Overlay ─────────────────

function createBroadcastSegment(clipPath, overlayPath, audioPath, duration, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(clipPath)
      .inputOptions(["-stream_loop", "-1"]) // Loop clip if shorter than narration
      .input(overlayPath)
      .inputOptions(["-loop", "1"]) // Hold overlay PNG for full duration
      .input(audioPath)
      .complexFilter([
        `[0:v]scale=${CONFIG.video.width}:${CONFIG.video.height}:force_original_aspect_ratio=decrease,pad=${CONFIG.video.width}:${CONFIG.video.height}:(ow-iw)/2:(oh-ih)/2:color=0c1929,setsar=1[bg]`,
        `[bg][1:v]overlay=0:0:format=auto[vout]`,
      ])
      .outputOptions([
        "-map", "[vout]",
        "-map", "2:a",
        "-c:v", "libx264",
        "-c:a", "aac",
        "-b:a", "192k",
        "-pix_fmt", "yuv420p",
        "-t", String(duration),
        "-r", String(CONFIG.video.fps),
      ])
      .output(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", reject)
      .run();
  });
}

export function composeBroadcastVideo(overlayImages, audioFiles, clipPaths, outputFilename) {
  return new Promise(async (resolve, reject) => {
    mkdirSync(CONFIG.paths.videos, { recursive: true });
    mkdirSync(FFMPEG_TEMP, { recursive: true });

    const segmentsTemp = path.join(FFMPEG_TEMP, "broadcast_segments");
    mkdirSync(segmentsTemp, { recursive: true });

    const outputPath = path.join(CONFIG.paths.videos, outputFilename);
    const segments = [];

    console.log(`  Composing ${overlayImages.length} broadcast segments over ${clipPaths.length} clips...`);

    for (let i = 0; i < overlayImages.length; i++) {
      const segPath = path.join(segmentsTemp, `bcast_${String(i).padStart(3, "0")}.mp4`);

      // Remove stale segment
      if (existsSync(segPath)) unlinkSync(segPath);

      const dur = audioFiles[i]?.duration || 5;
      const clipIndex = i % clipPaths.length; // Cycle through available clips

      process.stdout.write(`\r  Segment ${i + 1}/${overlayImages.length} (~${dur.toFixed(0)}s) using clip ${clipIndex + 1}...    `);

      try {
        // Copy files to temp to avoid path-with-spaces issues
        const tempClip = path.join(segmentsTemp, `clip_src_${i}.mp4`);
        const tempOverlay = path.join(segmentsTemp, `overlay_${i}.png`);
        const tempAudio = path.join(segmentsTemp, `audio_${i}.mp3`);

        copyFileSync(clipPaths[clipIndex], tempClip);
        copyFileSync(overlayImages[i], tempOverlay);
        copyFileSync(audioFiles[i].path, tempAudio);

        await createBroadcastSegment(tempClip, tempOverlay, tempAudio, dur, segPath);
        segments.push(segPath);
      } catch (err) {
        console.error(`\n  Segment ${i} error: ${err.message}`);
        reject(err);
        return;
      }
    }

    console.log("\n  All broadcast segments created");

    // Concatenate all segments
    console.log("  Concatenating final broadcast video...");
    const concatFile = path.join(FFMPEG_TEMP, "broadcast.txt");
    const concatContent = segments
      .map((s) => `file '${s.replace(/\\/g, "/")}'`)
      .join("\n");
    writeFileSync(concatFile, concatContent);

    ffmpeg()
      .input(concatFile)
      .inputOptions(["-f", "concat", "-safe", "0"])
      .outputOptions(["-c", "copy", "-movflags", "+faststart"])
      .output(outputPath)
      .on("end", () => {
        console.log(`  Broadcast video saved: ${outputPath}`);
        resolve(outputPath);
      })
      .on("error", (err) => {
        console.error(`  Concat error: ${err.message}`);
        reject(err);
      })
      .run();
  });
}

// ─── Classic Mode: Slide Images + Ken Burns ─────────────────

export function composeVideo(slideImages, audioFiles, outputFilename, useZoom = true, highlightClips = []) {
  return new Promise(async (resolve, reject) => {
    mkdirSync(CONFIG.paths.videos, { recursive: true });
    mkdirSync(FFMPEG_TEMP, { recursive: true });

    const slidesTemp = path.join(FFMPEG_TEMP, "slides");
    const segmentsTemp = path.join(FFMPEG_TEMP, "segments");
    mkdirSync(slidesTemp, { recursive: true });
    mkdirSync(segmentsTemp, { recursive: true });

    const outputPath = path.join(CONFIG.paths.videos, outputFilename);

    // Step 1: Copy slides and audio to temp (avoids path space issues)
    console.log("  Copying files to temp...");
    const tempSlides = [];
    const tempAudio = [];

    for (let i = 0; i < slideImages.length; i++) {
      const slideDest = path.join(slidesTemp, `s${String(i).padStart(3, "0")}.png`);
      copyFileSync(slideImages[i], slideDest);
      tempSlides.push(slideDest);

      const audioDest = path.join(slidesTemp, `a${String(i).padStart(3, "0")}.mp3`);
      copyFileSync(audioFiles[i].path, audioDest);
      tempAudio.push(audioDest);
    }

    // Normalize highlight clips to match our format
    const normalizedClips = [];
    if (highlightClips.length > 0) {
      console.log(`  Normalizing ${highlightClips.length} highlight clips...`);
      for (let i = 0; i < highlightClips.length; i++) {
        const normPath = path.join(segmentsTemp, `clip_${String(i).padStart(3, "0")}.mp4`);
        try {
          await normalizeClip(highlightClips[i].path, normPath);
          normalizedClips.push(normPath);
        } catch (err) {
          console.log(`  Could not normalize clip ${i}: ${err.message}`);
        }
      }
    }

    if (useZoom) {
      // Step 2: Create per-slide video segments with Ken Burns zoom
      console.log("  Creating zoom segments...");
      const segments = [];

      for (let i = 0; i < tempSlides.length; i++) {
        const segPath = path.join(segmentsTemp, `seg_${String(i).padStart(3, "0")}.mp4`);

        // Remove stale segment
        if (existsSync(segPath)) unlinkSync(segPath);

        const dur = audioFiles[i]?.duration || 5;
        process.stdout.write(`\r  Segment ${i + 1}/${tempSlides.length} (~${dur.toFixed(0)}s)...    `);

        try {
          await createSlideSegment(tempSlides[i], tempAudio[i], dur, segPath);
          segments.push(segPath);
        } catch (err) {
          console.error(`\n  Segment ${i} error: ${err.message}`);
          reject(err);
          return;
        }

        // Insert a highlight clip after slides 1, 3, 5 (between content slides)
        const clipIndex = Math.floor(i / 2);
        if (i > 0 && i % 2 === 1 && clipIndex < normalizedClips.length) {
          segments.push(normalizedClips[clipIndex]);
          console.log(`\n  + Inserted highlight clip ${clipIndex + 1}`);
        }
      }
      console.log("\n  All segments created");

      // Step 3: Concatenate all segments (slides + clips interleaved)
      console.log("  Concatenating segments...");
      const segConcatFile = path.join(FFMPEG_TEMP, "segments.txt");
      const segConcatContent = segments
        .map((s) => `file '${s.replace(/\\/g, "/")}'`)
        .join("\n");
      writeFileSync(segConcatFile, segConcatContent);

      ffmpeg()
        .input(segConcatFile)
        .inputOptions(["-f", "concat", "-safe", "0"])
        .outputOptions([
          "-c", "copy",
          "-movflags", "+faststart",
        ])
        .output(outputPath)
        .on("end", () => {
          console.log(`  Video saved: ${outputPath}`);
          resolve(outputPath);
        })
        .on("error", (err) => {
          console.error(`  Concat error: ${err.message}`);
          reject(err);
        })
        .run();
    } else {
      // Fallback: simple slideshow without zoom
      console.log("  Merging audio...");
      const mergedAudioPath = path.join(FFMPEG_TEMP, "merged_audio.mp3");
      await mergeAudioFiles(audioFiles, mergedAudioPath);

      const concatLines = [];
      for (let i = 0; i < tempSlides.length; i++) {
        concatLines.push(`file '${tempSlides[i].replace(/\\/g, "/")}'`);
        concatLines.push(`duration ${audioFiles[i]?.duration || 5}`);
      }
      concatLines.push(`file '${tempSlides[tempSlides.length - 1].replace(/\\/g, "/")}'`);

      const concatFile = path.join(FFMPEG_TEMP, "slides.txt");
      writeFileSync(concatFile, concatLines.join("\n"));

      try {
        await createSimpleVideo(concatFile, mergedAudioPath, outputPath);
        console.log(`  Video saved: ${outputPath}`);
        resolve(outputPath);
      } catch (err) {
        reject(err);
      }
    }
  });
}
