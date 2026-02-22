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

// ─── Broadcast-Style Overlay Renderers ───────────────────────

function createOverlayCanvas() {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  return { canvas, ctx };
}

function setShadow(ctx, blur = 8) {
  ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
}

function clearShadow(ctx) {
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

function drawBottomVignette(ctx, intensity = 0.7) {
  // Smooth gradient from transparent to dark at the bottom
  const grad = ctx.createLinearGradient(0, height * 0.35, 0, height);
  grad.addColorStop(0, "rgba(0, 0, 0, 0)");
  grad.addColorStop(0.4, `rgba(0, 0, 0, ${intensity * 0.15})`);
  grad.addColorStop(0.7, `rgba(0, 0, 0, ${intensity * 0.5})`);
  grad.addColorStop(1, `rgba(0, 0, 0, ${intensity})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, height * 0.35, width, height * 0.65);

  // Subtle top edge darkening for brand bug readability
  const topGrad = ctx.createLinearGradient(0, 0, 0, 100);
  topGrad.addColorStop(0, "rgba(0, 0, 0, 0.35)");
  topGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, 320, 100);
}

function drawBrandBug(ctx) {
  const bugX = 32;
  const bugY = 26;
  const bugW = 244;
  const bugH = 38;

  // Drop shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  roundRect(ctx, bugX + 3, bugY + 3, bugW, bugH, 5);
  ctx.fill();

  // Gold background
  const grad = ctx.createLinearGradient(bugX, bugY, bugX, bugY + bugH);
  grad.addColorStop(0, "#e2b84d");
  grad.addColorStop(1, "#b8902e");
  ctx.fillStyle = grad;
  roundRect(ctx, bugX, bugY, bugW, bugH, 5);
  ctx.fill();

  // Subtle inner highlight
  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.lineWidth = 1;
  roundRect(ctx, bugX + 1, bugY + 1, bugW - 2, bugH - 2, 4);
  ctx.stroke();

  // Text
  ctx.font = "bold 19px Arial";
  ctx.fillStyle = "#0c1929";
  ctx.textAlign = "center";
  ctx.fillText("GLOBALBASEBALL", bugX + bugW / 2, bugY + 26);
  ctx.textAlign = "left";
}

function drawLowerThird(ctx, heading, subheading, points) {
  // Calculate content height to size the card properly
  let contentH = 0;
  if (heading) contentH += 52;
  if (subheading) contentH += 40;
  if (heading || subheading) contentH += 16; // padding
  const pointCount = points ? Math.min(points.length, 4) : 0;
  if (pointCount > 0) {
    if (heading || subheading) contentH += 14; // divider space
    contentH += pointCount * 38 + 12;
  }
  if (contentH === 0) return;

  const margin = 64;
  const barWidth = width - margin * 2;
  const bottomPad = 44;
  const barTop = height - bottomPad - contentH;

  // Card shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  roundRect(ctx, margin + 4, barTop + 4, barWidth, contentH, 10);
  ctx.fill();

  // Card background - frosted dark
  ctx.fillStyle = "rgba(8, 16, 30, 0.88)";
  roundRect(ctx, margin, barTop, barWidth, contentH, 10);
  ctx.fill();

  // Subtle gold border
  ctx.strokeStyle = "rgba(212, 164, 76, 0.35)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, margin, barTop, barWidth, contentH, 10);
  ctx.stroke();

  // Gold left accent bar (inset slightly)
  const accentGrad = ctx.createLinearGradient(margin, barTop, margin, barTop + contentH);
  accentGrad.addColorStop(0, "#e2b84d");
  accentGrad.addColorStop(1, "#b8902e");
  ctx.fillStyle = accentGrad;
  roundRect(ctx, margin, barTop, 6, contentH, 10);
  ctx.fill();
  ctx.fillRect(margin + 3, barTop + 8, 3, contentH - 16);

  // Gold top accent line
  ctx.fillStyle = colors.gold;
  ctx.fillRect(margin + 22, barTop, 140, 3);

  let y = barTop + 14;

  // Heading
  if (heading) {
    setShadow(ctx, 6);
    ctx.font = "bold 42px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.fillText(heading, margin + 26, y + 36);
    clearShadow(ctx);
    y += 52;
  }

  // Subheading
  if (subheading) {
    setShadow(ctx, 4);
    ctx.font = "30px Arial";
    ctx.fillStyle = colors.gold;
    ctx.fillText(subheading, margin + 26, y + 24);
    clearShadow(ctx);
    y += 40;
  }

  // Divider before points
  if (pointCount > 0 && (heading || subheading)) {
    y += 4;
    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    ctx.fillRect(margin + 22, y, barWidth - 44, 1);
    y += 10;
  }

  // Bullet points with diamond markers
  if (pointCount > 0) {
    ctx.font = "26px Arial";
    ctx.textAlign = "left";
    for (const point of points.slice(0, 4)) {
      y += 32;
      // Diamond bullet
      ctx.fillStyle = colors.gold;
      ctx.save();
      ctx.translate(margin + 38, y - 8);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-5, -5, 10, 10);
      ctx.restore();

      setShadow(ctx, 3);
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      const lines = wrapText(ctx, point, barWidth - 100);
      for (const line of lines) {
        ctx.fillText(line, margin + 58, y);
        y += 34;
      }
      clearShadow(ctx);
      y -= 34; // compensate last line advance
    }
  }
}

async function drawTitleOverlay(slide) {
  const { canvas, ctx } = createOverlayCanvas();

  // Full-screen cinematic vignette
  const vignette = ctx.createRadialGradient(
    width / 2, height / 2, height * 0.2,
    width / 2, height / 2, height * 0.9
  );
  vignette.addColorStop(0, "rgba(12, 25, 41, 0.45)");
  vignette.addColorStop(0.6, "rgba(12, 25, 41, 0.65)");
  vignette.addColorStop(1, "rgba(12, 25, 41, 0.85)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  drawBrandBug(ctx);

  // Decorative lines above title
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 180, 260);
  ctx.lineTo(width / 2 + 180, 260);
  ctx.stroke();

  // Small diamond at center of line
  ctx.fillStyle = colors.gold;
  ctx.save();
  ctx.translate(width / 2, 260);
  ctx.rotate(Math.PI / 4);
  ctx.fillRect(-8, -8, 16, 16);
  ctx.restore();

  // Title heading with shadow
  setShadow(ctx, 12);
  ctx.font = "bold 80px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  const headingLines = wrapText(ctx, slide.heading || "", width - 240);
  let y = 370;
  for (const line of headingLines) {
    ctx.fillText(line, width / 2, y);
    y += 95;
  }
  clearShadow(ctx);

  // Subheading
  if (slide.subheading) {
    setShadow(ctx, 8);
    ctx.font = "44px Arial";
    ctx.fillStyle = colors.gold;
    ctx.fillText(slide.subheading, width / 2, y + 30);
    clearShadow(ctx);
    y += 70;
  }

  // Line below title
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 120, y + 10);
  ctx.lineTo(width / 2 + 120, y + 10);
  ctx.stroke();

  // WBC 2026 badge at bottom
  const badgeY = height - 90;
  ctx.fillStyle = "rgba(212, 164, 76, 0.15)";
  roundRect(ctx, width / 2 - 100, badgeY - 20, 200, 44, 22);
  ctx.fill();
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 1.5;
  roundRect(ctx, width / 2 - 100, badgeY - 20, 200, 44, 22);
  ctx.stroke();
  setShadow(ctx, 4);
  ctx.font = "bold 26px Arial";
  ctx.fillStyle = colors.gold;
  ctx.fillText("WBC 2026", width / 2, badgeY + 6);
  clearShadow(ctx);

  // Bottom gold bar
  ctx.fillStyle = colors.gold;
  ctx.fillRect(0, height - 5, width, 5);

  ctx.textAlign = "left";
  return canvas;
}

async function drawContentOverlay(slide, headshots) {
  const { canvas, ctx } = createOverlayCanvas();

  drawBottomVignette(ctx, 0.75);
  drawBrandBug(ctx);
  drawLowerThird(ctx, slide.heading, slide.subheading, slide.points);

  // Player headshots in upper-right with name plates
  if (slide.playerImages && slide.playerImages.length > 0) {
    const startX = width - 200;
    let imgY = 90;

    for (const playerImg of slide.playerImages.slice(0, 2)) {
      try {
        const imgPath = headshots?.[playerImg.name] || headshots?.[playerImg.mlbId];
        if (imgPath && existsSync(imgPath)) {
          // Shadow behind headshot area
          ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
          ctx.beginPath();
          ctx.arc(startX + 3, imgY + 68, 68, 0, Math.PI * 2);
          ctx.fill();

          // Dark backing circle with gold ring
          ctx.fillStyle = "rgba(8, 16, 30, 0.8)";
          ctx.beginPath();
          ctx.arc(startX, imgY + 65, 68, 0, Math.PI * 2);
          ctx.fill();

          const img = await loadImage(imgPath);
          drawCircularImage(ctx, img, startX, imgY + 65, 58);

          // Name plate below headshot
          const nameW = 170;
          ctx.fillStyle = "rgba(8, 16, 30, 0.85)";
          roundRect(ctx, startX - nameW / 2, imgY + 140, nameW, playerImg.position ? 52 : 32, 6);
          ctx.fill();
          ctx.strokeStyle = "rgba(212, 164, 76, 0.3)";
          ctx.lineWidth = 1;
          roundRect(ctx, startX - nameW / 2, imgY + 140, nameW, playerImg.position ? 52 : 32, 6);
          ctx.stroke();

          setShadow(ctx, 3);
          ctx.font = "bold 18px Arial";
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.fillText(playerImg.name, startX, imgY + 159);
          if (playerImg.position) {
            ctx.font = "14px Arial";
            ctx.fillStyle = colors.gold;
            ctx.fillText(playerImg.position, startX, imgY + 179);
          }
          clearShadow(ctx);
          ctx.textAlign = "left";
          imgY += 215;
        }
      } catch {
        // Skip failed image loads
      }
    }
  }

  return canvas;
}

async function drawMatchupOverlay(slide, headshots) {
  const { canvas, ctx } = createOverlayCanvas();

  // Cinematic vignette
  const vignette = ctx.createRadialGradient(
    width / 2, height / 2, height * 0.25,
    width / 2, height / 2, height * 0.85
  );
  vignette.addColorStop(0, "rgba(0, 0, 0, 0.1)");
  vignette.addColorStop(1, "rgba(0, 0, 0, 0.6)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  drawBrandBug(ctx);

  // Top banner with gradient edges
  const bannerGrad = ctx.createLinearGradient(0, 0, 0, 170);
  bannerGrad.addColorStop(0, "rgba(8, 16, 30, 0.9)");
  bannerGrad.addColorStop(1, "rgba(8, 16, 30, 0)");
  ctx.fillStyle = bannerGrad;
  ctx.fillRect(0, 0, width, 170);

  // Gold top line
  ctx.fillStyle = colors.gold;
  ctx.fillRect(width / 2 - 200, 0, 400, 4);

  setShadow(ctx, 8);
  ctx.font = "bold 48px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText(slide.heading || "", width / 2, 80);

  if (slide.subheading) {
    ctx.font = "30px Arial";
    ctx.fillStyle = colors.gold;
    ctx.fillText(slide.subheading, width / 2, 125);
  }
  clearShadow(ctx);

  // VS badge - golden circle with shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.beginPath();
  ctx.arc(width / 2 + 3, height / 2 - 15, 48, 0, Math.PI * 2);
  ctx.fill();

  const vsGrad = ctx.createRadialGradient(
    width / 2, height / 2 - 20, 5,
    width / 2, height / 2 - 20, 48
  );
  vsGrad.addColorStop(0, "#f0cc60");
  vsGrad.addColorStop(1, "#b8902e");
  ctx.fillStyle = vsGrad;
  ctx.beginPath();
  ctx.arc(width / 2, height / 2 - 20, 46, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(width / 2, height / 2 - 20, 44, 0, Math.PI * 2);
  ctx.stroke();

  ctx.font = "bold 40px Arial";
  ctx.fillStyle = "#0c1929";
  ctx.fillText("VS", width / 2, height / 2 - 6);

  // Player headshots on left and right
  if (slide.playerImages && slide.playerImages.length >= 2) {
    for (let i = 0; i < 2; i++) {
      const p = slide.playerImages[i];
      const cx = i === 0 ? width * 0.24 : width * 0.76;
      const cy = height / 2 - 20;

      // Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      ctx.beginPath();
      ctx.arc(cx + 3, cy + 3, 125, 0, Math.PI * 2);
      ctx.fill();

      // Dark backing with colored border
      ctx.fillStyle = "rgba(8, 16, 30, 0.75)";
      ctx.beginPath();
      ctx.arc(cx, cy, 125, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = i === 0 ? colors.blue : colors.gold;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 125, 0, Math.PI * 2);
      ctx.stroke();

      const imgPath = headshots?.[p.name] || headshots?.[p.mlbId];
      if (imgPath && existsSync(imgPath)) {
        try {
          const img = await loadImage(imgPath);
          drawCircularImage(ctx, img, cx, cy, 110);

          // Name plate
          const plateW = 220;
          ctx.fillStyle = "rgba(8, 16, 30, 0.85)";
          roundRect(ctx, cx - plateW / 2, cy + 135, plateW, p.position ? 56 : 36, 8);
          ctx.fill();
          ctx.strokeStyle = i === 0 ? "rgba(59, 130, 246, 0.4)" : "rgba(212, 164, 76, 0.4)";
          ctx.lineWidth = 1.5;
          roundRect(ctx, cx - plateW / 2, cy + 135, plateW, p.position ? 56 : 36, 8);
          ctx.stroke();

          setShadow(ctx, 4);
          ctx.font = "bold 26px Arial";
          ctx.fillStyle = i === 0 ? colors.blue : colors.gold;
          ctx.textAlign = "center";
          ctx.fillText(p.name, cx, cy + 160);
          if (p.position) {
            ctx.font = "20px Arial";
            ctx.fillStyle = colors.textDim;
            ctx.fillText(p.position, cx, cy + 183);
          }
          clearShadow(ctx);
        } catch {
          // Skip
        }
      }
    }
  }

  // Bottom info bar
  drawBottomVignette(ctx, 0.5);
  drawLowerThird(ctx, null, null, slide.points);

  // Bottom gold bar
  ctx.fillStyle = colors.gold;
  ctx.fillRect(0, height - 4, width, 4);

  ctx.textAlign = "left";
  return canvas;
}

async function drawOutroOverlay(slide) {
  const { canvas, ctx } = createOverlayCanvas();

  // Cinematic vignette overlay
  const vignette = ctx.createRadialGradient(
    width / 2, height / 2, height * 0.15,
    width / 2, height / 2, height * 0.9
  );
  vignette.addColorStop(0, "rgba(12, 25, 41, 0.6)");
  vignette.addColorStop(0.5, "rgba(12, 25, 41, 0.75)");
  vignette.addColorStop(1, "rgba(12, 25, 41, 0.9)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  // Gold lines framing
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 200, 230);
  ctx.lineTo(width / 2 + 200, 230);
  ctx.stroke();

  // Brand name with glow
  setShadow(ctx, 16);
  ctx.font = "bold 76px Arial";
  ctx.fillStyle = colors.gold;
  ctx.textAlign = "center";
  ctx.fillText("GlobalBaseball", width / 2, 320);
  clearShadow(ctx);

  // Heading
  setShadow(ctx, 8);
  ctx.font = "44px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(slide.heading || "Subscribe for More", width / 2, 420);

  if (slide.subheading) {
    ctx.font = "30px Arial";
    ctx.fillStyle = colors.textDim;
    ctx.fillText(slide.subheading, width / 2, 475);
  }
  clearShadow(ctx);

  // Subscribe button with shadow and gradient
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  roundRect(ctx, width / 2 - 158, 535, 320, 70, 12);
  ctx.fill();

  const btnGrad = ctx.createLinearGradient(0, 530, 0, 600);
  btnGrad.addColorStop(0, "#ef4444");
  btnGrad.addColorStop(1, "#c52d2d");
  ctx.fillStyle = btnGrad;
  roundRect(ctx, width / 2 - 160, 530, 320, 70, 12);
  ctx.fill();

  // Button highlight
  ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
  ctx.lineWidth = 1;
  roundRect(ctx, width / 2 - 159, 531, 318, 34, 12);
  ctx.stroke();

  setShadow(ctx, 4);
  ctx.font = "bold 32px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("SUBSCRIBE", width / 2, 576);
  clearShadow(ctx);

  // Sub-text
  ctx.font = "26px Arial";
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.fillText("Like & Subscribe for daily WBC coverage", width / 2, 660);

  // Bottom gold framing
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 200, 710);
  ctx.lineTo(width / 2 + 200, 710);
  ctx.stroke();

  ctx.fillStyle = colors.gold;
  ctx.fillRect(0, height - 5, width, 5);

  ctx.textAlign = "left";
  return canvas;
}

const OVERLAY_RENDERERS = {
  title: drawTitleOverlay,
  team: drawContentOverlay,
  stats: drawContentOverlay,
  matchup: drawMatchupOverlay,
  matchup_players: drawMatchupOverlay,
  player: drawContentOverlay,
  points: drawContentOverlay,
  outro: drawOutroOverlay,
};

export async function generateOverlayImages(slides, sessionId, headshots = {}) {
  mkdirSync(CONFIG.paths.slides, { recursive: true });

  const imagePaths = [];

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const renderer = OVERLAY_RENDERERS[slide.type] || drawContentOverlay;
    const canvas = await renderer(slide, headshots);

    const imagePath = `${CONFIG.paths.slides}/${sessionId}_overlay_${String(i).padStart(3, "0")}.png`;
    writeFileSync(imagePath, canvas.toBuffer("image/png"));

    imagePaths.push(imagePath);
    console.log(`    Overlay ${i + 1}/${slides.length}: ${slide.type}`);
  }

  return imagePaths;
}
