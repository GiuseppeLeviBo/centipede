import { COLORS, PLAYER_ZONE_ROWS, MUSHROOM_HP, BONUS_LIFETIME } from './constants';
import type { GameData } from './types';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function arcadeFont(sizePx: number): string {
  return `bold ${Math.round(sizePx)}px "Press Start 2P", "Courier New", monospace`;
}

function drawCenteredText(ctx: CanvasRenderingContext2D, text: string, y: number, preferredSize: number, options?: { maxWidth?: number; minSize?: number }): void {
  const fit = measureOverlayText(ctx, text, options?.maxWidth ?? ctx.canvas.width * 0.9, preferredSize, options?.minSize ?? 8);
  ctx.font = arcadeFont(fit.size);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (fit.lines.length === 1) {
    ctx.fillText(fit.lines[0], ctx.canvas.width / 2, y);
    return;
  }

  const lineGap = fit.size * 0.92;
  const startY = y - (fit.height / 2) + fit.size / 2;
  fit.lines.forEach((line, index) => {
    ctx.fillText(line, ctx.canvas.width / 2, startY + index * lineGap);
  });
}

function measureOverlayText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  preferredSize: number,
  minSize: number,
): { size: number; lines: string[]; height: number } {
  let size = preferredSize;

  while (size > minSize) {
    ctx.font = arcadeFont(size);
    if (ctx.measureText(text).width <= maxWidth) {
      return { size, lines: [text], height: size };
    }
    size -= 1;
  }

  ctx.font = arcadeFont(minSize);
  if (ctx.measureText(text).width <= maxWidth || !text.includes(' ')) {
    return { size: minSize, lines: [text], height: minSize };
  }

  const words = text.split(/\s+/).filter(Boolean);
  const mid = Math.ceil(words.length / 2);
  const line1 = words.slice(0, mid).join(' ');
  const line2 = words.slice(mid).join(' ');
  const lineGap = minSize * 0.92;

  return {
    size: minSize,
    lines: [line1, line2].filter(Boolean),
    height: minSize + lineGap,
  };
}

export function renderGame(ctx: CanvasRenderingContext2D, game: GameData, time: number): void {
  const cs = game.cellSize;
  const w = game.canvasWidth;
  const h = game.canvasHeight;

  ctx.save();

  // Screen shake
  if (game.shakeAmount > 0) {
    const sx = (Math.random() - 0.5) * game.shakeAmount * 2;
    const sy = (Math.random() - 0.5) * game.shakeAmount * 2;
    ctx.translate(sx, sy);
  }

  // Clear
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, w + 40, h + 40);

  // Draw grid lines very subtly
  ctx.strokeStyle = 'rgba(0, 80, 0, 0.1)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= w; x += cs) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += cs) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Player zone indicator
  const playerZoneTop = h - PLAYER_ZONE_ROWS * cs;
  ctx.strokeStyle = 'rgba(0, 255, 0, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, playerZoneTop);
  ctx.lineTo(w, playerZoneTop);
  ctx.stroke();

  // Draw mushrooms
  drawMushrooms(ctx, game, time);

  // Draw centipede
  drawCentipede(ctx, game, time);

  // Draw spider
  if (game.spider) {
    drawSpider(ctx, game, time);
  }

  // Draw flea
  if (game.flea) {
    drawFlea(ctx, game, time);
  }

  // Draw scorpion
  if (game.scorpion) {
    drawScorpion(ctx, game, time);
  }

  // Draw bonus mushrooms (on top of regular mushrooms)
  drawBonusMushrooms(ctx, game, time);

  // Draw bullets
  if (game.bullets.length > 0) {
    ctx.strokeStyle = COLORS.bullet;
    ctx.shadowColor = COLORS.bullet;
    ctx.shadowBlur = 6;
    ctx.lineWidth = 2;
    game.bullets.forEach((bullet) => {
      const len = cs * 0.5;
      const mag = Math.hypot(bullet.dx, bullet.dy);
      const nx = mag > 0 ? bullet.dx / mag : 0;
      const ny = mag > 0 ? bullet.dy / mag : -1;
      ctx.beginPath();
      ctx.moveTo(bullet.x - nx * len * 0.5, bullet.y - ny * len * 0.5);
      ctx.lineTo(bullet.x + nx * len * 0.5, bullet.y + ny * len * 0.5);
      ctx.stroke();
    });
    ctx.shadowBlur = 0;
  }

  // Draw player
  if (game.player.alive) {
    drawPlayer(ctx, game, time);
  } else if (game.deathAnimTimer > 0) {
    drawExplosion(ctx, game.player.x, game.player.y, cs, game.deathAnimTimer);
  }

  // Draw floating texts
  drawFloatingTexts(ctx, game);

  // HUD
  drawHUD(ctx, game);

  ctx.restore();
}

function drawMushrooms(ctx: CanvasRenderingContext2D, game: GameData, _time: number): void {
  const cs = game.cellSize;
  const r = cs * 0.4;

  game.mushrooms.forEach((m) => {
    const x = m.col * cs + cs / 2;
    const y = m.row * cs + cs / 2;
    const hpRatio = m.hp / MUSHROOM_HP;

    let color: string;
    if (m.poisoned) {
      if (m.hp === 4) color = COLORS.mushroomPoison;
      else if (m.hp === 3) color = COLORS.mushroomPoisonDamaged1;
      else if (m.hp === 2) color = COLORS.mushroomPoisonDamaged2;
      else color = COLORS.mushroomPoisonDamaged3;
    } else {
      if (m.hp === 4) color = COLORS.mushroom;
      else if (m.hp === 3) color = COLORS.mushroomDamaged1;
      else if (m.hp === 2) color = COLORS.mushroomDamaged2;
      else color = COLORS.mushroomDamaged3;
    }

    if (m.isBomb) {
      // Bomb mushroom: red orb with orange fuse and spark
      ctx.save();
      // Glow
      ctx.shadowColor = '#FF3300';
      ctx.shadowBlur = 8;

      ctx.fillStyle = '#E61A1A';
      ctx.beginPath();
      ctx.arc(x, y, r * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner skull/fuse detail
      ctx.fillStyle = '#FFCC00';
      ctx.fillRect(x - r * 0.1, y - r * 1.1, r * 0.2, r * 0.4);
      
      // Sparkle
      const spark = Math.sin(_time * 0.4) > 0;
      if (spark) {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x, y - r * 1.2, r * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else {
      // Mushroom cap (dome)
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y - r * 0.1, r * hpRatio + r * (1 - hpRatio) * 0.5, Math.PI, 0);
      ctx.closePath();
      ctx.fill();

      // Stem
      ctx.fillRect(x - r * 0.2, y - r * 0.1, r * 0.4, r * 0.6);

      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.beginPath();
      ctx.arc(x - r * 0.2, y - r * 0.3, r * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawCentipede(ctx: CanvasRenderingContext2D, game: GameData, time: number): void {
  const cs = game.cellSize;
  const r = cs * 0.4;

  for (const chain of game.centipede) {
    // Draw connecting lines
    ctx.strokeStyle = COLORS.centipedeBody;
    ctx.lineWidth = cs * 0.15;
    for (let i = 1; i < chain.length; i++) {
      ctx.beginPath();
      ctx.moveTo(chain[i - 1].x, chain[i - 1].y);
      ctx.lineTo(chain[i].x, chain[i].y);
      ctx.stroke();
    }

    // Draw segments
    for (let i = chain.length - 1; i >= 0; i--) {
      const seg = chain[i];
      const pulse = Math.sin(time * 0.01 + i * 0.5) * 0.1 + 1;

      if (seg.isHead) {
        // Head - larger with eyes
        ctx.fillStyle = COLORS.centipedeHead;
        ctx.shadowColor = COLORS.centipedeHead;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(seg.x, seg.y, r * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Eyes
        const eyeOffset = r * 0.35;
        const eyeDir = seg.direction;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(seg.x + eyeDir * eyeOffset * 0.5, seg.y - eyeOffset, r * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(seg.x + eyeDir * eyeOffset * 0.5, seg.y + eyeOffset, r * 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(seg.x + eyeDir * eyeOffset * 0.7, seg.y - eyeOffset, r * 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(seg.x + eyeDir * eyeOffset * 0.7, seg.y + eyeOffset, r * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Antennae
        ctx.strokeStyle = COLORS.centipedeHead;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(seg.x, seg.y - r * 0.5);
        ctx.lineTo(seg.x + eyeDir * r, seg.y - r * 1.2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(seg.x, seg.y + r * 0.5);
        ctx.lineTo(seg.x + eyeDir * r, seg.y + r * 1.2);
        ctx.stroke();
      } else {
        // Body segment
        ctx.fillStyle = COLORS.centipedeBody;
        ctx.beginPath();
        ctx.arc(seg.x, seg.y, r * 0.8 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Dot pattern
        ctx.fillStyle = 'rgba(255,255,0,0.3)';
        ctx.beginPath();
        ctx.arc(seg.x, seg.y, r * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        ctx.strokeStyle = COLORS.centipedeBody;
        ctx.lineWidth = 1;
        const legAngle = Math.sin(time * 0.1 + i) * 0.4;
        ctx.beginPath();
        ctx.moveTo(seg.x, seg.y);
        ctx.lineTo(seg.x + Math.cos(legAngle) * r, seg.y + Math.sin(legAngle) * r);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(seg.x, seg.y);
        ctx.lineTo(seg.x - Math.cos(legAngle) * r, seg.y - Math.sin(legAngle) * r);
        ctx.stroke();
      }
    }
  }
}

function drawPlayer(ctx: CanvasRenderingContext2D, game: GameData, time: number): void {
  const cs = game.cellSize;
  const p = game.player;
  const r = cs * 0.4;

  // Depower flash overlay
  const depowerFlash = game.depowered && Math.sin(time * 0.2) > 0;

  // Glow effect
  const glowColor = depowerFlash ? '#FF0000' : COLORS.player;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 10;

  // Ship body (triangle pointing up)
  ctx.fillStyle = depowerFlash ? '#884400' : COLORS.player;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - r);
  ctx.lineTo(p.x - r * 0.8, p.y + r * 0.5);
  ctx.lineTo(p.x + r * 0.8, p.y + r * 0.5);
  ctx.closePath();
  ctx.fill();

  // Inner detail
  ctx.fillStyle = '#003300';
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - r * 0.4);
  ctx.lineTo(p.x - r * 0.3, p.y + r * 0.2);
  ctx.lineTo(p.x + r * 0.3, p.y + r * 0.2);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;

  // Double cannon visual: two small barrels
  if (game.weaponMode === 'double' && game.weaponTimer > 0) {
    ctx.fillStyle = COLORS.bonusDouble;
    ctx.fillRect(p.x - r * 0.35, p.y - r * 1.1, r * 0.15, r * 0.5);
    ctx.fillRect(p.x + r * 0.2, p.y - r * 1.1, r * 0.15, r * 0.5);
  }

  // Triple cannon visual: center + two angled barrels
  if (game.weaponMode === 'triple' && game.weaponTimer > 0) {
    ctx.fillStyle = COLORS.bonusTriple;
    // Center barrel
    ctx.fillRect(p.x - r * 0.07, p.y - r * 1.2, r * 0.14, r * 0.6);
    // Left barrel (angled)
    ctx.save();
    ctx.translate(p.x - r * 0.3, p.y - r * 0.5);
    ctx.rotate((-30 * Math.PI) / 180);
    ctx.fillRect(-r * 0.06, -r * 0.7, r * 0.12, r * 0.7);
    ctx.restore();
    // Right barrel (angled)
    ctx.save();
    ctx.translate(p.x + r * 0.3, p.y - r * 0.5);
    ctx.rotate((30 * Math.PI) / 180);
    ctx.fillRect(-r * 0.06, -r * 0.7, r * 0.12, r * 0.7);
    ctx.restore();
  }

  // Thruster flame
  const flicker = Math.sin(time * 0.3) * 0.3 + 0.7;
  ctx.fillStyle = `rgba(255, 200, 0, ${flicker})`;
  ctx.beginPath();
  ctx.moveTo(p.x - r * 0.3, p.y + r * 0.5);
  ctx.lineTo(p.x, p.y + r * 0.5 + r * 0.4 * flicker);
  ctx.lineTo(p.x + r * 0.3, p.y + r * 0.5);
  ctx.closePath();
  ctx.fill();
}

function drawSpider(ctx: CanvasRenderingContext2D, game: GameData, time: number): void {
  if (!game.spider) return;
  const cs = game.cellSize;
  const s = game.spider;
  const r = cs * 0.45;

  ctx.fillStyle = COLORS.spider;
  ctx.shadowColor = COLORS.spider;
  ctx.shadowBlur = 6;

  // Body
  ctx.beginPath();
  ctx.ellipse(s.x, s.y, r, r * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Legs (4 pairs)
  ctx.strokeStyle = COLORS.spider;
  ctx.lineWidth = 1.5;
  for (let leg = 0; leg < 4; leg++) {
    const angle = (leg / 4) * Math.PI - Math.PI / 2;
    const legWobble = Math.sin(time * 0.15 + leg * 1.5) * 0.3;
    
    // Right leg
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(
      s.x + Math.cos(angle + legWobble) * r * 1.5,
      s.y + Math.sin(angle + legWobble) * r * 1.5
    );
    ctx.stroke();
    
    // Left leg
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(
      s.x - Math.cos(angle + legWobble) * r * 1.5,
      s.y + Math.sin(angle + legWobble) * r * 1.5
    );
    ctx.stroke();
  }

  // Eyes
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(s.x - r * 0.25, s.y - r * 0.15, r * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(s.x + r * 0.25, s.y - r * 0.15, r * 0.12, 0, Math.PI * 2);
  ctx.fill();
}

function drawFlea(ctx: CanvasRenderingContext2D, game: GameData, time: number): void {
  if (!game.flea) return;
  const cs = game.cellSize;
  const f = game.flea;
  const r = cs * 0.3;

  ctx.fillStyle = COLORS.flea;
  ctx.shadowColor = COLORS.flea;
  ctx.shadowBlur = 4;

  // Body
  ctx.beginPath();
  ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Trail dots
  const wobble = Math.sin(time * 0.2) * 3;
  ctx.fillStyle = 'rgba(255, 0, 255, 0.4)';
  ctx.beginPath();
  ctx.arc(f.x + wobble, f.y - r * 2, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(f.x - wobble, f.y - r * 3.5, r * 0.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawScorpion(ctx: CanvasRenderingContext2D, game: GameData, time: number): void {
  if (!game.scorpion) return;
  const cs = game.cellSize;
  const s = game.scorpion;
  const r = cs * 0.4;
  const dir = s.direction;

  ctx.fillStyle = COLORS.scorpion;
  ctx.shadowColor = COLORS.scorpion;
  ctx.shadowBlur = 6;

  // Body
  ctx.beginPath();
  ctx.ellipse(s.x, s.y, r, r * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Tail (curled up)
  ctx.strokeStyle = COLORS.scorpion;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(s.x - dir * r, s.y);
  ctx.quadraticCurveTo(
    s.x - dir * r * 1.5,
    s.y - r,
    s.x - dir * r * 0.8,
    s.y - r * 1.5
  );
  ctx.stroke();

  // Stinger
  ctx.fillStyle = '#FF0000';
  ctx.beginPath();
  ctx.arc(s.x - dir * r * 0.8, s.y - r * 1.5, r * 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Claws
  const clawWobble = Math.sin(time * 0.1) * 0.2;
  ctx.strokeStyle = COLORS.scorpion;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(s.x + dir * r, s.y - r * 0.3);
  ctx.lineTo(s.x + dir * r * 1.6, s.y - r * 0.5 + clawWobble * r);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(s.x + dir * r, s.y + r * 0.3);
  ctx.lineTo(s.x + dir * r * 1.6, s.y + r * 0.5 - clawWobble * r);
  ctx.stroke();

  // Legs
  for (let i = 0; i < 3; i++) {
    const legX = s.x + (i - 1) * r * 0.5;
    const legWobble = Math.sin(time * 0.15 + i) * r * 0.3;
    ctx.beginPath();
    ctx.moveTo(legX, s.y + r * 0.4);
    ctx.lineTo(legX + legWobble, s.y + r * 1.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(legX, s.y - r * 0.4);
    ctx.lineTo(legX - legWobble, s.y - r * 1.2);
    ctx.stroke();
  }
}

function drawExplosion(ctx: CanvasRenderingContext2D, x: number, y: number, cs: number, timer: number): void {
  const progress = 1 - timer / 60;
  const particles = 12;

  for (let i = 0; i < particles; i++) {
    const angle = (i / particles) * Math.PI * 2;
    const dist = progress * cs * 2;
    const px = x + Math.cos(angle) * dist;
    const py = y + Math.sin(angle) * dist;
    const size = cs * 0.2 * (1 - progress);

    ctx.fillStyle = i % 2 === 0 ? COLORS.player : COLORS.bullet;
    ctx.globalAlpha = 1 - progress;
    ctx.fillRect(px - size / 2, py - size / 2, size, size);
  }
  ctx.globalAlpha = 1;
}

function drawBonusMushrooms(ctx: CanvasRenderingContext2D, game: GameData, time: number): void {
  const cs = game.cellSize;

  for (const bm of game.bonusMushrooms) {
    const x = bm.col * cs + cs / 2;
    const y = bm.row * cs + cs / 2;
    const r = cs * 0.46;

    // Remaining life fraction → use for alpha flicker when about to expire
    const lifeFrac = bm.ttl / BONUS_LIFETIME;
    const flicker = lifeFrac < 0.25
      ? (Math.sin(time * 0.6) * 0.5 + 0.5)  // fast blink when expiring
      : 1;
    if (flicker < 0.3) continue;             // skip draw on dark phase

    const pulse = 1 + Math.sin(time * 0.12) * 0.08;

    let capColor: string;
    let glowColor: string;
    let label: string;

    if (bm.type === 'GOLD') {
      capColor = COLORS.bonusGold;
      glowColor = '#FFAA00';
      label = '$';
    } else if (bm.type === 'ONEUP') {
      capColor = COLORS.bonusOneUp;
      glowColor = '#00FF44';
      label = '♥';
    } else if (bm.type === 'GEM') {
      capColor = COLORS.bonusGem;
      glowColor = '#8800FF';
      label = '◆';
    } else if (bm.type === 'DOUBLE') {
      capColor = COLORS.bonusDouble;
      glowColor = '#FF2222';
      label = 'II';
    } else if (bm.type === 'TRIPLE') {
      capColor = COLORS.bonusTriple;
      glowColor = '#FF6600';
      label = 'III';
    } else if (bm.type === 'SPAWN_SPIDER') {
      capColor = COLORS.bonusSpawn;
      glowColor = '#FF00CC';
      label = '🕷';
    } else if (bm.type === 'SPAWN_SCORPION') {
      capColor = COLORS.bonusSpawn;
      glowColor = '#FF00CC';
      label = '🦂';
    } else if (bm.type === 'SPAWN_CENTIPEDE') {
      capColor = COLORS.bonusSpawn;
      glowColor = '#FF00CC';
      label = '🐛';
    } else {
      // DEPOWER — dark red / skull-like
      capColor = COLORS.bonusDepower;
      glowColor = '#FF0000';
      label = '☠';
    }

    ctx.save();
    ctx.globalAlpha = flicker;

    // Glow ring
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 12;

    // Mushroom cap
    ctx.fillStyle = capColor;
    ctx.beginPath();
    ctx.arc(x, y - r * 0.05, r * pulse, Math.PI, 0);
    ctx.closePath();
    ctx.fill();

    // Stem
    ctx.shadowBlur = 0;
    ctx.fillStyle = capColor;
    ctx.globalAlpha = flicker * 0.8;
    ctx.fillRect(x - r * 0.22, y - r * 0.05, r * 0.44, r * 0.6);

    // White spots on cap
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.arc(x - r * 0.22, y - r * 0.3, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + r * 0.2, y - r * 0.45, r * 0.09, 0, Math.PI * 2);
    ctx.fill();

    // Label in centre of cap
    ctx.globalAlpha = flicker;
    ctx.fillStyle = '#000';
    ctx.shadowBlur = 0;
    const labelSize = clamp(cs * 0.38, 7, 14);
    ctx.font = arcadeFont(labelSize);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y - r * 0.18);

    ctx.restore();
  }
}

function drawFloatingTexts(ctx: CanvasRenderingContext2D, game: GameData): void {
  for (const ft of game.floatingTexts) {
    const alpha = Math.min(1, ft.ttl / 40);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.shadowColor = ft.color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = ft.color;
    const cs = game.cellSize;
    const fontSize = clamp(cs * 0.65, 8, 18);
    ctx.font = arcadeFont(fontSize);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  }
}

function drawHUD(ctx: CanvasRenderingContext2D, game: GameData): void {
  const cs = game.cellSize;
  const w = game.canvasWidth;
  const fontSize = clamp(cs * 0.7, 10, 16);

  ctx.font = arcadeFont(fontSize);
  ctx.textBaseline = 'top';

  // Score (left)
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = 'left';
  ctx.fillText(`${game.score}`, cs * 0.5, cs * 0.2);

  // High Score (center)
  ctx.fillStyle = COLORS.hud;
  ctx.textAlign = 'center';
  const hiFontSize = clamp(cs * 0.5, 8, 14);
  ctx.font = arcadeFont(hiFontSize);
  ctx.fillText(`HI ${game.highScore}`, w / 2, cs * 0.15);

  // Level
  ctx.fillText(`LV ${game.level}`, w / 2, cs * 0.15 + hiFontSize + 2);

  // Lives (right) - draw as small ships
  ctx.textAlign = 'right';
  for (let i = 0; i < game.lives; i++) {
    const lx = w - cs * 0.5 - i * cs * 0.9;
    const ly = cs * 0.5;
    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.moveTo(lx, ly - cs * 0.25);
    ctx.lineTo(lx - cs * 0.2, ly + cs * 0.15);
    ctx.lineTo(lx + cs * 0.2, ly + cs * 0.15);
    ctx.closePath();
    ctx.fill();
  }

  // Score multiplier banner
  if (game.scoreMultiplierTimer > 0) {
    const multFrac = game.scoreMultiplierTimer / 600;
    const blink = multFrac < 0.15 ? Math.sin(Date.now() * 0.02) > 0 : true;
    if (blink) {
      const multSize = clamp(cs * 0.55, 8, 14);
      ctx.font = arcadeFont(multSize);
      ctx.textAlign = 'left';
      ctx.fillStyle = COLORS.bonusGem;
      ctx.shadowColor = COLORS.bonusGem;
      ctx.shadowBlur = 8;
      ctx.fillText(`×2 ${Math.ceil(game.scoreMultiplierTimer / 60)}s`, cs * 0.5, cs * 1.1);
      ctx.shadowBlur = 0;
    }
  }

  // Weapon mode banner
  if (game.weaponTimer > 0 && game.weaponMode !== 'normal') {
    const wFrac = game.weaponTimer / 900;
    const blink = wFrac < 0.15 ? Math.sin(Date.now() * 0.02) > 0 : true;
    if (blink) {
      const wSize = clamp(cs * 0.55, 8, 14);
      ctx.font = arcadeFont(wSize);
      ctx.textAlign = 'left';
      const wColor = game.weaponMode === 'triple' ? COLORS.bonusTriple : COLORS.bonusDouble;
      ctx.fillStyle = wColor;
      ctx.shadowColor = wColor;
      ctx.shadowBlur = 8;
      const wLabel = game.weaponMode === 'triple' ? 'TRIPLE' : 'DOUBLE';
      ctx.fillText(`${wLabel} ${Math.ceil(game.weaponTimer / 60)}s`, cs * 0.5, cs * 1.7);
      ctx.shadowBlur = 0;
    }
  }

  // Depower banner
  if (game.depowered && game.depowerTimer > 0) {
    const _dFrac = game.depowerTimer / 600; void _dFrac;
    const blink = Math.sin(Date.now() * 0.015) > 0;
    if (blink) {
      const dSize = clamp(cs * 0.55, 8, 14);
      ctx.font = arcadeFont(dSize);
      ctx.textAlign = 'left';
      ctx.fillStyle = COLORS.depowerFlash;
      ctx.shadowColor = COLORS.depowerFlash;
      ctx.shadowBlur = 10;
      ctx.fillText(`SLOW FIRE ${Math.ceil(game.depowerTimer / 60)}s`, cs * 0.5, cs * 2.3);
      ctx.shadowBlur = 0;
    }
  }
}

export function renderMenu(ctx: CanvasRenderingContext2D, game: GameData, time: number): void {
  const w = game.canvasWidth;
  const h = game.canvasHeight;
  const cs = game.cellSize;

  // Background
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);

  // Animated background grid
  ctx.strokeStyle = 'rgba(0, 100, 0, 0.15)';
  ctx.lineWidth = 1;
  const offset = (time * 0.5) % cs;
  for (let x = -cs + offset; x <= w + cs; x += cs) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = -cs + offset; y <= h + cs; y += cs) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Title glow
  const glow = Math.sin(time * 0.03) * 5 + 10;
  ctx.shadowColor = '#00FF00';
  ctx.shadowBlur = glow;
  ctx.fillStyle = '#00FF00';
  ctx.textBaseline = 'middle';
  const prefTitleSize = clamp(cs * 1.5, 16, 36);
  drawCenteredText(ctx, 'CENTIPEDE', h * 0.16, prefTitleSize);
  ctx.shadowBlur = 0;

  // Subtitle
  ctx.fillStyle = '#00AA00';
  const prefSubSize = clamp(cs * 0.65, 10, 16);
  drawCenteredText(ctx, 'ARCADE CLONE', h * 0.23, prefSubSize);

  // Draw a decorative centipede
  const centiY = h * 0.38;
  const segCount = 10;
  for (let i = 0; i < segCount; i++) {
    const cx = w / 2 - (segCount / 2) * cs * 0.8 + i * cs * 0.8;
    const cy = centiY + Math.sin(time * 0.05 + i * 0.6) * cs;
    const segR = cs * 0.35;

    if (i === 0) {
      ctx.fillStyle = '#FF0000';
      ctx.shadowColor = '#FF0000';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(cx, cy, segR, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Eyes
      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.arc(cx + segR * 0.3, cy - segR * 0.3, segR * 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + segR * 0.3, cy + segR * 0.3, segR * 0.15, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#FF6600';
      ctx.beginPath();
      ctx.arc(cx, cy, segR * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Connect segments
    if (i > 0) {
      const prevX = w / 2 - (segCount / 2) * cs * 0.8 + (i - 1) * cs * 0.8;
      const prevY = centiY + Math.sin(time * 0.05 + (i - 1) * 0.6) * cs;
      ctx.strokeStyle = '#FF6600';
      ctx.lineWidth = cs * 0.12;
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(cx, cy);
      ctx.stroke();
    }
  }

  // Instructions
  const instrSize = clamp(cs * 0.55, 8, 14);
  ctx.fillStyle = '#FFFFFF';

  const blink = Math.sin(time * 0.05) > 0;
  if (blink) {
    drawCenteredText(ctx, 'PRESS SPACE OR TAP TO START', h * 0.53, instrSize);
  }

  // Controls info
  ctx.fillStyle = '#888888';
  const infoSize = clamp(cs * 0.42, 7, 11);
  ctx.font = arcadeFont(infoSize);
  ctx.textAlign = 'center';
  
  const lines = [
    '🎮 ARROW KEYS / WASD to move',
    '🔫 SPACE to shoot',
    '📱 Touch/click to move & auto-fire',
    '',
    '🐛 Shoot the centipede!',
    '🍄 Mushrooms block the path',
    '🕷️ Watch out for spiders!',
    '🦂 Scorpions poison mushrooms',
    '',
    '💛 GOLD  →  bonus points',
    '💚 1-UP  →  extra life',
    '💜 GEM   →  x2 score 10s',
    '🔴 DBL   →  double shot',
    '🟠 TRI   →  triple shot',
    '💀 SKULL →  slow fire',
  ];

  const rowHeight = infoSize + 5;
  // If window height is very small, we might overflow, so wrap or shift
  const startY = clamp(h * 0.60, h * 0.58, h * 0.62);
  lines.forEach((line, i) => {
    ctx.fillText(line, w / 2, startY + i * rowHeight);
  });

  // High score
  if (game.highScore > 0) {
    ctx.fillStyle = '#FFD700';
    drawCenteredText(ctx, `HIGH SCORE: ${game.highScore}`, h * 0.94, instrSize);
  }
}

export function renderGameOver(ctx: CanvasRenderingContext2D, game: GameData, time: number): void {
  // Draw the game state behind
  renderGame(ctx, game, time);

  const w = game.canvasWidth;
  const h = game.canvasHeight;
  const cs = game.cellSize;

  // Dark overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, w, h);

  const titleFit = measureOverlayText(ctx, 'GAME OVER', w * 0.9, clamp(cs * 1.8, 16, 36), 10);
  const scoreFit = measureOverlayText(ctx, `SCORE: ${game.score}`, w * 0.9, clamp(cs * 0.9, 10, 24), 8);
  const highScoreText = game.score >= game.highScore ? '★ NEW HIGH SCORE! ★' : `HIGH SCORE: ${game.highScore}`;
  const highScoreFit = measureOverlayText(ctx, highScoreText, w * 0.9, clamp(cs * 0.7, 9, 16), 8);
  const levelFit = measureOverlayText(ctx, `LEVEL REACHED: ${game.level}`, w * 0.9, clamp(cs * 0.7, 9, 16), 8);
  const promptFit = measureOverlayText(ctx, 'PRESS SPACE OR TAP TO RESTART', w * 0.9, clamp(cs * 0.7, 9, 16), 8);

  const gap = clamp(cs * 0.35, 3, 8);
  const blockHeight = titleFit.height + scoreFit.height + highScoreFit.height + levelFit.height + promptFit.height + gap * 4;
  let y = clamp((h - blockHeight) / 2 + titleFit.height / 2, cs * 1.5, h * 0.34);

  ctx.shadowColor = '#FF0000';
  ctx.shadowBlur = 15;
  ctx.fillStyle = '#FF0000';
  ctx.textBaseline = 'middle';
  drawCenteredText(ctx, 'GAME OVER', y, titleFit.size, { maxWidth: w * 0.9, minSize: 10 });
  ctx.shadowBlur = 0;
  y += titleFit.height + gap;

  ctx.fillStyle = '#FFFFFF';
  drawCenteredText(ctx, `SCORE: ${game.score}`, y, scoreFit.size, { maxWidth: w * 0.9, minSize: 8 });
  y += scoreFit.height + gap;

  ctx.fillStyle = game.score >= game.highScore ? '#FFD700' : '#AAA';
  drawCenteredText(ctx, highScoreText, y, highScoreFit.size, { maxWidth: w * 0.9, minSize: 8 });
  y += highScoreFit.height + gap;

  ctx.fillStyle = '#00FF00';
  drawCenteredText(ctx, `LEVEL REACHED: ${game.level}`, y, levelFit.size, { maxWidth: w * 0.9, minSize: 8 });
  y += levelFit.height + gap;

  const blink = Math.sin(time * 0.05) > 0;
  if (blink) {
    ctx.fillStyle = '#FFFFFF';
    drawCenteredText(ctx, 'PRESS SPACE OR TAP TO RESTART', y, promptFit.size, { maxWidth: w * 0.9, minSize: 8 });
  }
}

export function renderDemoGame(ctx: CanvasRenderingContext2D, game: GameData, time: number): void {
  renderGame(ctx, game, time);

  const w = game.canvasWidth;
  const h = game.canvasHeight;
  const cs = game.cellSize;
  const pulse = Math.sin(time * 0.06) * 0.25 + 0.75;

  ctx.save();
  ctx.fillStyle = `rgba(0, 0, 0, ${0.25 * pulse})`;
  ctx.fillRect(0, 0, w, h);

  ctx.textBaseline = 'middle';
  const titleSize = clamp(cs * 1.1, 14, 28);
  ctx.fillStyle = '#00FF00';
  ctx.shadowColor = '#00FF00';
  ctx.shadowBlur = 10;
  drawCenteredText(ctx, 'AUTO PLAY', cs * 3.1, titleSize);

  const smallSize = clamp(cs * 0.5, 8, 14);
  ctx.fillStyle = '#FFFFFF';
  ctx.shadowBlur = 0;
  drawCenteredText(ctx, 'PRESS SPACE OR TAP TO PLAY', cs * 4.2, smallSize);
  ctx.restore();
}

export function renderHighScores(ctx: CanvasRenderingContext2D, game: GameData, time: number): void {
  const w = game.canvasWidth;
  const h = game.canvasHeight;
  const cs = game.cellSize;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, h);

  // Subtle animated scan grid
  ctx.strokeStyle = 'rgba(255, 215, 0, 0.12)';
  ctx.lineWidth = 1;
  const offset = (time * 0.35) % cs;
  for (let y = -cs + offset; y <= h + cs; y += cs) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  ctx.textBaseline = 'middle';
  const titleSize = clamp(cs * 1.25, 14, 28);
  ctx.fillStyle = '#FFD700';
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = 14;
  drawCenteredText(ctx, 'HIGH SCORES', h * 0.15, titleSize);
  ctx.shadowBlur = 0;

  const rowSize = clamp(cs * 0.6, 8, 14);
  ctx.font = arcadeFont(rowSize);
  const startY = h * 0.26;
  const rowGap = clamp(cs * 1.05, 14, 24);

  game.highScores.slice(0, 10).forEach((entry, i) => {
    const y = startY + i * rowGap;
    const rank = String(i + 1).padStart(2, '0');
    ctx.fillStyle = i === 0 ? '#FFD700' : i < 3 ? '#FFFFFF' : '#AAAAAA';
    ctx.textAlign = 'left';
    ctx.fillText(rank, w * 0.22, y);
    ctx.fillText(entry.initials.padEnd(3, 'X'), w * 0.40, y);
    ctx.textAlign = 'right';
    ctx.fillText(String(entry.score), w * 0.78, y);
  });

  const blink = Math.sin(time * 0.05) > 0;
  if (blink) {
    ctx.fillStyle = '#00FF00';
    const smallSize = clamp(cs * 0.5, 8, 14);
    drawCenteredText(ctx, 'PRESS SPACE OR TAP TO PLAY', h * 0.92, smallSize);
  }
}
