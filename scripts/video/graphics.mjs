import { createCanvas, loadImage } from "canvas";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { CONFIG } from "./config.mjs";

const { width, height } = CONFIG.video;
const { colors } = CONFIG;

// ─── Helpers ────────────────────────────────────────────────

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

// Draw a circular-clipped headshot image
function drawCircularImage(ctx, img, cx, cy, radius) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  // Draw image centered and covering the circle
  const size = radius * 2;
  const aspect = img.width / img.height;
  let drawW, drawH, drawX, drawY;
  if (aspect > 1) {
    drawH = size;
    drawW = size * aspect;
    drawX = cx - drawW / 2;
    drawY = cy - drawH / 2;
  } else {
    drawW = size;
    drawH = size / aspect;
    drawX = cx - drawW / 2;
    drawY = cy - drawH / 2;
  }
  ctx.drawImage(img, drawX, drawY, drawW, drawH);
  ctx.restore();

  // Circle border
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
}

// ─── Base Canvas ────────────────────────────────────────────

function createBaseCanvas() {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, colors.bg);
  gradient.addColorStop(1, colors.bgLight);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Subtle grid
  ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Bottom accent
  ctx.fillStyle = colors.gold;
  ctx.fillRect(0, height - 6, width, 6);

  // Watermark
  ctx.font = "24px Arial";
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  ctx.textAlign = "right";
  ctx.fillText("GlobalBaseball", width - 40, height - 20);
  ctx.textAlign = "left";

  return { canvas, ctx };
}

// ─── Slide Renderers ────────────────────────────────────────

async function drawTitleSlide(slide) {
  const { canvas, ctx } = createBaseCanvas();

  // Decorative diamond
  ctx.save();
  ctx.translate(width / 2, 200);
  ctx.rotate(Math.PI / 4);
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 3;
  ctx.strokeRect(-40, -40, 80, 80);
  ctx.restore();

  ctx.font = "bold 80px Arial";
  ctx.fillStyle = colors.text;
  ctx.textAlign = "center";
  const headingLines = wrapText(ctx, slide.heading || "", width - 200);
  let y = 350;
  for (const line of headingLines) {
    ctx.fillText(line, width / 2, y);
    y += 95;
  }

  if (slide.subheading) {
    ctx.font = "42px Arial";
    ctx.fillStyle = colors.gold;
    ctx.fillText(slide.subheading, width / 2, y + 40);
    y += 40;
  }

  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 100, y + 50);
  ctx.lineTo(width / 2 + 100, y + 50);
  ctx.stroke();

  ctx.font = "bold 32px Arial";
  ctx.fillStyle = colors.blue;
  ctx.fillText("WBC 2026", width / 2, y + 100);

  ctx.textAlign = "left";
  return canvas;
}

async function drawTeamSlide(slide, headshots) {
  const { canvas, ctx } = createBaseCanvas();

  // If we have player images, use right-side layout
  const hasImages = slide.playerImages && slide.playerImages.length > 0;
  const textAreaWidth = hasImages ? width * 0.55 : width - 200;

  // Team name
  ctx.font = "bold 64px Arial";
  ctx.fillStyle = colors.gold;
  ctx.fillText(slide.heading || "", 100, 140);

  if (slide.subheading) {
    ctx.font = "36px Arial";
    ctx.fillStyle = colors.textDim;
    ctx.fillText(slide.subheading, 100, 195);
  }

  ctx.fillStyle = colors.gold;
  ctx.fillRect(100, 225, 200, 4);

  // Points
  if (slide.points && slide.points.length > 0) {
    ctx.font = "38px Arial";
    let y = 310;
    for (const point of slide.points) {
      ctx.fillStyle = colors.gold;
      ctx.beginPath();
      ctx.arc(130, y - 12, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = colors.text;
      const lines = wrapText(ctx, point, textAreaWidth - 160);
      for (const line of lines) {
        ctx.fillText(line, 160, y);
        y += 52;
      }
      y += 18;
    }
  }

  // Draw player headshots on right side
  if (hasImages) {
    const startX = width * 0.6;
    const imgSize = 140;
    const gap = 30;
    let imgY = 200;

    for (const playerImg of slide.playerImages) {
      try {
        const imgPath = headshots?.[playerImg.name] || headshots?.[playerImg.mlbId];
        if (imgPath && existsSync(imgPath)) {
          const img = await loadImage(imgPath);
          drawCircularImage(ctx, img, startX + imgSize / 2, imgY + imgSize / 2, imgSize / 2);

          // Player name label
          ctx.font = "bold 26px Arial";
          ctx.fillStyle = colors.text;
          ctx.textAlign = "center";
          ctx.fillText(playerImg.name, startX + imgSize / 2, imgY + imgSize + 30);
          if (playerImg.position) {
            ctx.font = "20px Arial";
            ctx.fillStyle = colors.textDim;
            ctx.fillText(playerImg.position, startX + imgSize / 2, imgY + imgSize + 56);
          }
          ctx.textAlign = "left";

          imgY += imgSize + 80;
        }
      } catch {
        // Skip if image fails to load
      }
    }
  }

  return canvas;
}

async function drawPlayerSlide(slide, headshots) {
  const { canvas, ctx } = createBaseCanvas();

  // Large headshot on left
  const imgPath =
    headshots?.[slide.playerName] || headshots?.[slide.mlbId];

  if (imgPath && existsSync(imgPath)) {
    try {
      const img = await loadImage(imgPath);
      drawCircularImage(ctx, img, 300, 400, 200);

      // Name under headshot
      ctx.font = "bold 42px Arial";
      ctx.fillStyle = colors.gold;
      ctx.textAlign = "center";
      ctx.fillText(slide.playerName || slide.heading || "", 300, 650);

      if (slide.position) {
        ctx.font = "28px Arial";
        ctx.fillStyle = colors.textDim;
        ctx.fillText(slide.position, 300, 690);
      }
      ctx.textAlign = "left";
    } catch {
      // Fallback to text-only
      ctx.font = "bold 64px Arial";
      ctx.fillStyle = colors.gold;
      ctx.fillText(slide.heading || "", 100, 140);
    }
  } else {
    ctx.font = "bold 64px Arial";
    ctx.fillStyle = colors.gold;
    ctx.fillText(slide.heading || "", 100, 140);
  }

  // Stats/info on right side
  const rightX = 580;
  ctx.font = "bold 48px Arial";
  ctx.fillStyle = colors.text;
  ctx.fillText(slide.heading || "", rightX, 180);

  if (slide.subheading) {
    ctx.font = "32px Arial";
    ctx.fillStyle = colors.textDim;
    ctx.fillText(slide.subheading, rightX, 230);
  }

  if (slide.points && slide.points.length > 0) {
    ctx.font = "34px Arial";
    let y = 310;
    for (const point of slide.points) {
      ctx.fillStyle = colors.gold;
      ctx.beginPath();
      ctx.arc(rightX + 20, y - 10, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = colors.text;
      const lines = wrapText(ctx, point, width - rightX - 150);
      for (const line of lines) {
        ctx.fillText(line, rightX + 45, y);
        y += 46;
      }
      y += 14;
    }
  }

  return canvas;
}

async function drawStatsSlide(slide) {
  const { canvas, ctx } = createBaseCanvas();

  ctx.font = "bold 56px Arial";
  ctx.fillStyle = colors.text;
  ctx.textAlign = "center";
  ctx.fillText(slide.heading || "", width / 2, 130);

  if (slide.subheading) {
    ctx.font = "32px Arial";
    ctx.fillStyle = colors.gold;
    ctx.fillText(slide.subheading, width / 2, 185);
  }

  if (slide.points && slide.points.length > 0) {
    const cols = Math.min(slide.points.length, 3);
    const cardWidth = (width - 200 - (cols - 1) * 30) / cols;
    const startX = 100;
    let row = 0;

    slide.points.forEach((point, i) => {
      const col = i % cols;
      if (i > 0 && col === 0) row++;
      const x = startX + col * (cardWidth + 30);
      const y = 250 + row * 200;

      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      roundRect(ctx, x, y, cardWidth, 160, 12);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = "30px Arial";
      ctx.fillStyle = colors.text;
      ctx.textAlign = "center";
      const lines = wrapText(ctx, point, cardWidth - 40);
      let textY = y + 60 + (lines.length - 1) * -18;
      for (const line of lines) {
        ctx.fillText(line, x + cardWidth / 2, textY);
        textY += 38;
      }
    });
  }

  ctx.textAlign = "left";
  return canvas;
}

async function drawMatchupSlide(slide) {
  const { canvas, ctx } = createBaseCanvas();

  ctx.font = "bold 48px Arial";
  ctx.fillStyle = colors.text;
  ctx.textAlign = "center";
  ctx.fillText(slide.heading || "", width / 2, 120);

  if (slide.subheading) {
    ctx.font = "32px Arial";
    ctx.fillStyle = colors.textDim;
    ctx.fillText(slide.subheading, width / 2, 175);
  }

  ctx.font = "bold 80px Arial";
  ctx.fillStyle = colors.gold;
  ctx.fillText("VS", width / 2, height / 2 + 20);

  if (slide.points && slide.points.length >= 2) {
    ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
    roundRect(ctx, 60, 230, width / 2 - 120, height - 330, 16);
    ctx.fill();

    ctx.font = "bold 34px Arial";
    ctx.fillStyle = colors.blue;
    ctx.textAlign = "center";
    const leftLines = wrapText(ctx, slide.points[0], width / 2 - 180);
    let y = 360;
    for (const line of leftLines) {
      ctx.fillText(line, width / 4, y);
      y += 46;
    }

    ctx.fillStyle = "rgba(212, 164, 76, 0.1)";
    roundRect(ctx, width / 2 + 60, 230, width / 2 - 120, height - 330, 16);
    ctx.fill();

    ctx.fillStyle = colors.gold;
    const rightLines = wrapText(ctx, slide.points[1], width / 2 - 180);
    y = 360;
    for (const line of rightLines) {
      ctx.fillText(line, (width * 3) / 4, y);
      y += 46;
    }
  }

  ctx.textAlign = "left";
  return canvas;
}

async function drawMatchupWithPlayersSlide(slide, headshots) {
  const { canvas, ctx } = createBaseCanvas();

  ctx.font = "bold 48px Arial";
  ctx.fillStyle = colors.text;
  ctx.textAlign = "center";
  ctx.fillText(slide.heading || "", width / 2, 100);

  if (slide.subheading) {
    ctx.font = "32px Arial";
    ctx.fillStyle = colors.textDim;
    ctx.fillText(slide.subheading, width / 2, 150);
  }

  // VS
  ctx.font = "bold 72px Arial";
  ctx.fillStyle = colors.gold;
  ctx.fillText("VS", width / 2, height / 2 + 10);

  // Player headshots - left and right
  if (slide.playerImages && slide.playerImages.length >= 2) {
    for (let i = 0; i < Math.min(slide.playerImages.length, 2); i++) {
      const p = slide.playerImages[i];
      const cx = i === 0 ? width / 4 : (width * 3) / 4;
      const cy = height / 2 - 30;

      const imgPath = headshots?.[p.name] || headshots?.[p.mlbId];
      if (imgPath && existsSync(imgPath)) {
        try {
          const img = await loadImage(imgPath);
          drawCircularImage(ctx, img, cx, cy, 130);

          ctx.font = "bold 30px Arial";
          ctx.fillStyle = i === 0 ? colors.blue : colors.gold;
          ctx.textAlign = "center";
          ctx.fillText(p.name, cx, cy + 170);
          if (p.position) {
            ctx.font = "22px Arial";
            ctx.fillStyle = colors.textDim;
            ctx.fillText(p.position, cx, cy + 200);
          }
        } catch {
          // Skip
        }
      }
    }
  }

  // Points below
  if (slide.points && slide.points.length > 0) {
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    let y = height - 180;
    for (const point of slide.points) {
      ctx.fillStyle = colors.text;
      ctx.fillText(point, width / 2, y);
      y += 42;
    }
  }

  ctx.textAlign = "left";
  return canvas;
}

async function drawOutroSlide(slide) {
  const { canvas, ctx } = createBaseCanvas();

  ctx.font = "bold 72px Arial";
  ctx.fillStyle = colors.gold;
  ctx.textAlign = "center";
  ctx.fillText("GlobalBaseball", width / 2, 320);

  ctx.font = "44px Arial";
  ctx.fillStyle = colors.text;
  ctx.fillText(slide.heading || "Subscribe for More", width / 2, 430);

  if (slide.subheading) {
    ctx.font = "32px Arial";
    ctx.fillStyle = colors.textDim;
    ctx.fillText(slide.subheading, width / 2, 490);
  }

  ctx.fillStyle = colors.red;
  roundRect(ctx, width / 2 - 160, 540, 320, 70, 12);
  ctx.fill();

  ctx.font = "bold 32px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("SUBSCRIBE", width / 2, 586);

  ctx.font = "28px Arial";
  ctx.fillStyle = colors.textDim;
  ctx.fillText("Like & Subscribe for daily WBC coverage", width / 2, 670);

  ctx.textAlign = "left";
  return canvas;
}

// ─── Registry ───────────────────────────────────────────────

const SLIDE_RENDERERS = {
  title: drawTitleSlide,
  team: drawTeamSlide,
  stats: drawStatsSlide,
  matchup: drawMatchupSlide,
  matchup_players: drawMatchupWithPlayersSlide,
  player: drawPlayerSlide,
  points: drawTeamSlide,
  outro: drawOutroSlide,
};

// ─── Main Export ────────────────────────────────────────────

export async function generateSlideImages(slides, sessionId, headshots = {}) {
  mkdirSync(CONFIG.paths.slides, { recursive: true });

  const imagePaths = [];

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const renderer = SLIDE_RENDERERS[slide.type] || drawTeamSlide;
    const canvas = await renderer(slide, headshots);

    const imagePath = `${CONFIG.paths.slides}/${sessionId}_slide_${String(i).padStart(3, "0")}.png`;
    writeFileSync(imagePath, canvas.toBuffer("image/png"));

    imagePaths.push(imagePath);
    console.log(`  Slide ${i + 1}/${slides.length}: ${slide.type}`);
  }

  return imagePaths;
}
