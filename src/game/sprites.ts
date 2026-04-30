import { COLORS } from './constants';
import type { 
  Mushroom, 
  CentipedeSegment, 
  Bullet, 
  Spider, 
  Flea, 
  Scorpion, 
  BonusMushroom, 
  WeaponMode,
  Player
} from './types';

export function drawMushroom(ctx: CanvasRenderingContext2D, m: Mushroom, cs: number, time: number): void {
  const x = m.col * cs + cs / 2;
  const y = m.row * cs + cs / 2;
  const r = cs * 0.4;
  const hpRatio = m.hp / 4; // MUSHROOM_HP is 4

  let color: string;
  if (m.isBomb) {
    // Bomb mushroom: red orb with orange fuse and spark
    ctx.save();
    ctx.shadowColor = '#FF3300';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#E61A1A';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFCC00';
    ctx.fillRect(x - r * 0.1, y - r * 1.1, r * 0.2, r * 0.4);
    if (Math.sin(time * 0.4) > 0) {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(x, y - r * 1.2, r * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

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

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y - r * 0.1, r * hpRatio + r * (1 - hpRatio) * 0.5, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(x - r * 0.2, y - r * 0.1, r * 0.4, r * 0.6);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.arc(x - r * 0.2, y - r * 0.3, r * 0.15, 0, Math.PI * 2);
  ctx.fill();
}

export function drawCentipedeSegment(ctx: CanvasRenderingContext2D, seg: CentipedeSegment, cs: number, time: number, index: number): void {
  const r = cs * 0.4;
  const pulse = Math.sin(time * 0.01 + index * 0.5) * 0.1 + 1;

  if (seg.isHead) {
    ctx.fillStyle = COLORS.centipedeHead;
    ctx.shadowColor = COLORS.centipedeHead;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(seg.x, seg.y, r * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    const eyeOffset = r * 0.35;
    const eyeDir = seg.direction;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(seg.x + eyeDir * eyeOffset * 0.5, seg.y - eyeOffset, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(seg.x + eyeDir * eyeOffset * 0.5, seg.y + eyeOffset, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(seg.x + eyeDir * eyeOffset * 0.7, seg.y - eyeOffset, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(seg.x + eyeDir * eyeOffset * 0.7, seg.y + eyeOffset, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
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
    ctx.fillStyle = COLORS.centipedeBody;
    ctx.beginPath();
    ctx.arc(seg.x, seg.y, r * 0.8 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,0,0.3)';
    ctx.beginPath();
    ctx.arc(seg.x, seg.y, r * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = COLORS.centipedeBody;
    ctx.lineWidth = 1;
    const legAngle = Math.sin(time * 0.1 + index) * 0.4;
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

export function drawBullet(ctx: CanvasRenderingContext2D, bullet: Bullet, cs: number): void {
  ctx.strokeStyle = COLORS.bullet;
  ctx.shadowColor = COLORS.bullet;
  ctx.shadowBlur = 6;
  ctx.lineWidth = 2;
  const len = cs * 0.5;
  const mag = Math.hypot(bullet.dx, bullet.dy);
  const nx = mag > 0 ? bullet.dx / mag : 0;
  const ny = mag > 0 ? bullet.dy / mag : -1;
  ctx.beginPath();
  ctx.moveTo(bullet.x - nx * len * 0.5, bullet.y - ny * len * 0.5);
  ctx.lineTo(bullet.x + nx * len * 0.5, bullet.y + ny * len * 0.5);
  ctx.stroke();
  ctx.shadowBlur = 0;
}

export function drawPlayer(ctx: CanvasRenderingContext2D, p: Player, cs: number, time: number, weaponMode: WeaponMode, weaponTimer: number, depowered: boolean): void {
  const r = cs * 0.4;
  const depowerFlash = depowered && Math.sin(time * 0.2) > 0;
  const glowColor = depowerFlash ? '#FF0000' : COLORS.player;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 10;
  ctx.fillStyle = depowerFlash ? '#884400' : COLORS.player;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - r);
  ctx.lineTo(p.x - r * 0.8, p.y + r * 0.5);
  ctx.lineTo(p.x + r * 0.8, p.y + r * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#003300';
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - r * 0.4);
  ctx.lineTo(p.x - r * 0.3, p.y + r * 0.2);
  ctx.lineTo(p.x + r * 0.3, p.y + r * 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  if (weaponMode === 'double' && weaponTimer > 0) {
    ctx.fillStyle = COLORS.bonusDouble;
    ctx.fillRect(p.x - r * 0.35, p.y - r * 1.1, r * 0.15, r * 0.5);
    ctx.fillRect(p.x + r * 0.2, p.y - r * 1.1, r * 0.15, r * 0.5);
  }
  if (weaponMode === 'triple' && weaponTimer > 0) {
    ctx.fillStyle = COLORS.bonusTriple;
    ctx.fillRect(p.x - r * 0.07, p.y - r * 1.2, r * 0.14, r * 0.6);
    ctx.save();
    ctx.translate(p.x - r * 0.3, p.y - r * 0.5);
    ctx.rotate((-30 * Math.PI) / 180);
    ctx.fillRect(-r * 0.06, -r * 0.7, r * 0.12, r * 0.7);
    ctx.restore();
    ctx.save();
    ctx.translate(p.x + r * 0.3, p.y - r * 0.5);
    ctx.rotate((30 * Math.PI) / 180);
    ctx.fillRect(-r * 0.06, -r * 0.7, r * 0.12, r * 0.7);
    ctx.restore();
  }
  const flicker = Math.sin(time * 0.3) * 0.3 + 0.7;
  ctx.fillStyle = `rgba(255, 200, 0, ${flicker})`;
  ctx.beginPath();
  ctx.moveTo(p.x - r * 0.3, p.y + r * 0.5);
  ctx.lineTo(p.x, p.y + r * 0.5 + r * 0.4 * flicker);
  ctx.lineTo(p.x + r * 0.3, p.y + r * 0.5);
  ctx.closePath();
  ctx.fill();
}

export function drawSpider(ctx: CanvasRenderingContext2D, s: Spider, cs: number, time: number): void {
  const r = cs * 0.45;
  ctx.fillStyle = COLORS.spider;
  ctx.shadowColor = COLORS.spider;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.ellipse(s.x, s.y, r, r * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = COLORS.spider;
  ctx.lineWidth = 1.5;
  for (let leg = 0; leg < 4; leg++) {
    const angle = (leg / 4) * Math.PI - Math.PI / 2;
    const legWobble = Math.sin(time * 0.15 + leg * 1.5) * 0.3;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x + Math.cos(angle + legWobble) * r * 1.5, s.y + Math.sin(angle + legWobble) * r * 1.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x - Math.cos(angle + legWobble) * r * 1.5, s.y + Math.sin(angle + legWobble) * r * 1.5);
    ctx.stroke();
  }
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(s.x - r * 0.25, s.y - r * 0.15, r * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(s.x + r * 0.25, s.y - r * 0.15, r * 0.12, 0, Math.PI * 2);
  ctx.fill();
}

export function drawFlea(ctx: CanvasRenderingContext2D, f: Flea, cs: number, time: number): void {
  const r = cs * 0.3;
  ctx.fillStyle = COLORS.flea;
  ctx.shadowColor = COLORS.flea;
  ctx.shadowBlur = 4;
  ctx.beginPath();
  ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  const wobble = Math.sin(time * 0.2) * 3;
  ctx.fillStyle = 'rgba(255, 0, 255, 0.4)';
  ctx.beginPath();
  ctx.arc(f.x + wobble, f.y - r * 2, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(f.x - wobble, f.y - r * 3.5, r * 0.2, 0, Math.PI * 2);
  ctx.fill();
}

export function drawScorpion(ctx: CanvasRenderingContext2D, s: Scorpion, cs: number, time: number): void {
  const r = cs * 0.4;
  const dir = s.direction;
  ctx.fillStyle = COLORS.scorpion;
  ctx.shadowColor = COLORS.scorpion;
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.ellipse(s.x, s.y, r, r * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = COLORS.scorpion;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(s.x - dir * r, s.y);
  ctx.quadraticCurveTo(s.x - dir * r * 1.5, s.y - r, s.x - dir * r * 0.8, s.y - r * 1.5);
  ctx.stroke();
  ctx.fillStyle = '#FF0000';
  ctx.beginPath();
  ctx.arc(s.x - dir * r * 0.8, s.y - r * 1.5, r * 0.15, 0, Math.PI * 2);
  ctx.fill();
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

export function drawBonusMushroom(ctx: CanvasRenderingContext2D, bm: BonusMushroom, cs: number, time: number): void {
  const x = bm.col * cs + cs / 2;
  const y = bm.row * cs + cs / 2;
  const r = cs * 0.46;
  const lifeFrac = bm.ttl / 420; // BONUS_LIFETIME is 420
  const flicker = lifeFrac < 0.25 ? (Math.sin(time * 0.6) * 0.5 + 0.5) : 1;
  if (flicker < 0.3) return;
  const pulse = 1 + Math.sin(time * 0.12) * 0.08;
  let capColor: string, glowColor: string, label: string;
  if (bm.type === 'GOLD') { capColor = COLORS.bonusGold; glowColor = '#FFAA00'; label = '$'; }
  else if (bm.type === 'ONEUP') { capColor = COLORS.bonusOneUp; glowColor = '#00FF44'; label = '♥'; }
  else if (bm.type === 'GEM') { capColor = COLORS.bonusGem; glowColor = '#8800FF'; label = '◆'; }
  else if (bm.type === 'DOUBLE') { capColor = COLORS.bonusDouble; glowColor = '#FF2222'; label = 'II'; }
  else if (bm.type === 'TRIPLE') { capColor = COLORS.bonusTriple; glowColor = '#FF6600'; label = 'III'; }
  else if (bm.type === 'DEPOWER') { capColor = COLORS.bonusDepower; glowColor = '#FF0000'; label = '☠'; }
  else if (bm.type === 'SPAWN_SPIDER') { capColor = COLORS.bonusSpiderSpawn; glowColor = '#FFCC00'; label = '🕷'; }
  else if (bm.type === 'SPAWN_SCORPION') { capColor = COLORS.bonusScorpionSpawn; glowColor = '#CC6600'; label = '🦂'; }
  else { capColor = COLORS.bonusCentispawn; glowColor = '#FF0000'; label = '⊗'; }
  ctx.save();
  ctx.globalAlpha = flicker;
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 12;
  ctx.fillStyle = capColor;
  ctx.beginPath();
  ctx.arc(x, y - r * 0.05, r * pulse, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = capColor;
  ctx.globalAlpha = flicker * 0.8;
  ctx.fillRect(x - r * 0.22, y - r * 0.05, r * 0.44, r * 0.6);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.beginPath();
  ctx.arc(x - r * 0.22, y - r * 0.3, r * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + r * 0.2, y - r * 0.45, r * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = flicker;
  ctx.fillStyle = '#000';
  ctx.font = `bold ${Math.max(6, cs * 0.35)}px "Press Start 2P", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y - r * 0.18);
  ctx.restore();
}

export function drawExplosion(ctx: CanvasRenderingContext2D, x: number, y: number, cs: number, timer: number): void {
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
