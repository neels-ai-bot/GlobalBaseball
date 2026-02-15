import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { mkdirSync, createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import path from "path";
import { CONFIG } from "./config.mjs";

export async function generateSpeech(text, outputPath) {
  mkdirSync(path.dirname(outputPath), { recursive: true });

  const tts = new MsEdgeTTS();
  await tts.setMetadata(
    CONFIG.voice,
    OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3
  );

  // toStream returns { audioStream: Readable, metadataStream, requestId }
  const { audioStream } = tts.toStream(text);
  const writable = createWriteStream(outputPath);
  await pipeline(audioStream, writable);

  return outputPath;
}

export async function generateSlideAudio(slides, sessionId) {
  const audioDir = path.join(CONFIG.paths.audio, sessionId);
  mkdirSync(audioDir, { recursive: true });

  const audioFiles = [];

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const audioPath = path.join(
      audioDir,
      `slide_${String(i).padStart(3, "0")}.mp3`
    );

    await generateSpeech(slide.narration, audioPath);

    // Estimate duration from word count (~150 words/min speaking rate)
    const wordCount = slide.narration.split(/\s+/).length;
    const duration = Math.max(3, (wordCount / 150) * 60 + 1.5);

    audioFiles.push({ path: audioPath, duration, index: i });
    console.log(
      `  Audio ${i + 1}/${slides.length}: ~${duration.toFixed(1)}s`
    );
  }

  return audioFiles;
}
