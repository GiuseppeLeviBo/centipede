import {
  GRID_COLS,
  GRID_ROWS,
  PLAYER_ZONE_ROWS,
  PLAYER_SPEED,
  BULLET_SPEED,
  MAX_BULLETS,
  AUTO_FIRE_INTERVAL,
  CENTIPEDE_SPEED,
  CENTIPEDE_HEAD_SPEED,
  SPIDER_SPEED,
  FLEA_SPEED,
  SCORPION_SPEED,
  CENTIPEDE_LEVEL_SPEED_BONUS,
  CENTIPEDE_LEVEL_SPEED_CAP,
  SCORE_CENTIPEDE_HEAD,
  SCORE_CENTIPEDE_BODY,
  SCORE_SPIDER_CLOSE,
  SCORE_SPIDER_MEDIUM,
  SCORE_SPIDER_FAR,
  SCORE_FLEA,
  SCORE_SCORPION,
  SCORE_MUSHROOM,
  SCORE_MUSHROOM_RESTORE,
  MUSHROOM_HP,
  EXTRA_LIFE_SCORE,
  CENTIPEDE_LENGTH,
  BONUS_SPAWN_CHANCE,
  BONUS_MAX_ON_FIELD,
  BONUS_LIFETIME,
  BONUS_SCORE_GOLD_MIN,
  BONUS_SCORE_GOLD_MAX,
  BONUS_SCORE_GEM,
  SCORE_MULTIPLIER_DURATION,
  SCORE_MULTIPLIER_VALUE,
  WEAPON_DURATION,
  DEPOWER_DURATION,
  DEPOWER_COOLDOWN_PENALTY,
  TRIPLE_ANGLE,
  BONUS_LEVEL_BONUS_CHANCE,
  ATTRACT_TITLE_FRAMES,
  ATTRACT_DEMO_FRAMES,
  ATTRACT_SCORES_FRAMES,
  GAME_OVER_ATTRACT_FRAMES,
  GAMEPLAY_CONFIG,
} from './constants';
import type {
  GameData,
  CentipedeSegment,
  Mushroom,
  BonusType,
  HighScoreEntry,
  WeaponMode,
} from './types';

function mushroomKey(col: number, row: number): string {
  return `${col},${row}`;
}

function chooseWeighted<T>(options: { type: T; weight: number }[], fallback: T): T {
  const valid = options.filter(opt => opt.weight > 0);
  if (valid.length === 0) return fallback;

  const totalWeight = valid.reduce((sum, opt) => sum + opt.weight, 0);
  if (totalWeight <= 0) return fallback;

  let roll = Math.random() * totalWeight;
  for (const opt of valid) {
    if (roll < opt.weight) return opt.type;
    roll -= opt.weight;
  }
  // Floating-point rounding guard — return last valid entry
  return valid[valid.length - 1].type;
}

const HIGH_SCORE_KEY = 'centipede_highscores_v1';

const DEFAULT_HIGH_SCORES: HighScoreEntry[] = [
  { initials: 'ACE', score: 24000 },
  { initials: 'BUG', score: 21000 },
  { initials: 'ADA', score: 18000 },
  { initials: 'DON', score: 15000 },
  { initials: 'EDL', score: 12000 },
  { initials: 'ZAP', score: 9000 },
  { initials: 'MSH', score: 7000 },
  { initials: 'WEB', score: 5000 },
  { initials: 'ONE', score: 3000 },
  { initials: 'YOU', score: 1000 },
];

function loadHighScores(): HighScoreEntry[] {
  try {
    const raw = localStorage.getItem(HIGH_SCORE_KEY);
    if (!raw) return [...DEFAULT_HIGH_SCORES];
    const parsed = JSON.parse(raw) as HighScoreEntry[];
    if (!Array.isArray(parsed)) return [...DEFAULT_HIGH_SCORES];
    return parsed
      .filter((entry) => typeof entry.initials === 'string' && typeof entry.score === 'number')
      .map((entry) => ({ initials: entry.initials.toUpperCase().slice(0, 3).padEnd(3, 'X'), score: entry.score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  } catch {
    return [...DEFAULT_HIGH_SCORES];
  }
}

function saveHighScores(entries: HighScoreEntry[]): void {
  localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(entries.slice(0, 10)));
}

function submitHighScore(game: GameData, initials = 'YOU'): void {
  const entry = { initials: initials.toUpperCase().slice(0, 3).padEnd(3, 'X'), score: game.score };
  const updated = [...game.highScores, entry].sort((a, b) => b.score - a.score).slice(0, 10);
  game.highScores = updated;
  game.highScore = updated[0]?.score ?? 0;
  saveHighScores(updated);
  localStorage.setItem('centipede_highscore', String(game.highScore));
}

export function createGame(canvasWidth: number, canvasHeight: number): GameData {
  const cellSize = Math.floor(Math.min(canvasWidth / GRID_COLS, canvasHeight / GRID_ROWS));
  const actualWidth = cellSize * GRID_COLS;
  const actualHeight = cellSize * GRID_ROWS;

  const highScores = loadHighScores();
  const legacyHighScore = parseInt(localStorage.getItem('centipede_highscore') || '0', 10);
  const highScore = Math.max(highScores[0]?.score ?? 0, legacyHighScore);

  return {
    state: 'menu',
    score: 0,
    highScore,
    highScores,
    lives: 3,
    level: 1,
    player: {
      x: actualWidth / 2,
      y: actualHeight - cellSize * 2,
      alive: true,
      respawnTimer: 0,
    },
    bullets: [],
    shootCooldown: 0,
    shotsFired: 0,
    centipede: [],
    mushrooms: new Map(),
    spider: null,
    flea: null,
    scorpion: null,
    bonusMushrooms: [],
    bonusMushroomTimer: 0,
    floatingTexts: [],
    scoreMultiplier: 1,
    scoreMultiplierTimer: 0,
    weaponMode: 'normal' as WeaponMode,
    weaponTimer: 0,
    depowered: false,
    depowerTimer: 0,
    depowerCooldownPenalty: 0,
    demoMode: false,
    attractTimer: 0,
    cellSize,
    canvasWidth: actualWidth,
    canvasHeight: actualHeight,
    nextLifeScore: EXTRA_LIFE_SCORE,
    frameCount: 0,
    spiderTimer: 300,
    fleaTimer: 600,
    scorpionTimer: 900,
    levelClearTimer: 0,
    deathAnimTimer: 0,
    shakeAmount: 0,
    _pendingPlayerKill: false,
  };
}

export function resizeGame(game: GameData, canvasWidth: number, canvasHeight: number): void {
  const oldCellSize = game.cellSize;
  const cellSize = Math.floor(Math.min(canvasWidth / GRID_COLS, canvasHeight / GRID_ROWS));
  const scale = oldCellSize > 0 ? cellSize / oldCellSize : 1;

  game.cellSize = cellSize;
  game.canvasWidth = cellSize * GRID_COLS;
  game.canvasHeight = cellSize * GRID_ROWS;

  if (scale === 1) return;

  // Rescale player
  game.player.x *= scale;
  game.player.y *= scale;

  // Rescale bullets
  for (const b of game.bullets) { b.x *= scale; b.y *= scale; }

  // Rescale centipede
  for (const chain of game.centipede) {
    for (const seg of chain) { seg.x *= scale; seg.y *= scale; seg.targetY *= scale; }
  }

  // Rescale spider
  if (game.spider) { game.spider.x *= scale; game.spider.y *= scale; }

  // Rescale flea
  if (game.flea) { game.flea.x *= scale; game.flea.y *= scale; }

  // Rescale scorpion
  if (game.scorpion) { game.scorpion.x *= scale; game.scorpion.y *= scale; }

  // Rescale floating texts
  for (const ft of game.floatingTexts) { ft.x *= scale; ft.y *= scale; }
}

export function startGame(game: GameData): void {
  game.state = 'playing';
  game.demoMode = false;
  game.attractTimer = 0;
  game.score = 0;
  game.lives = 3;
  game.level = 1;
  game.nextLifeScore = EXTRA_LIFE_SCORE;
  game.frameCount = 0;
  game.mushrooms.clear();
  game.bullets = [];
  game.shootCooldown = 0;
  game.shotsFired = 0;
  game.spider = null;
  game.flea = null;
  game.scorpion = null;
  game.bonusMushrooms = [];
  game.bonusMushroomTimer = 0;
  game.floatingTexts = [];
  game.scoreMultiplier = 1;
  game.scoreMultiplierTimer = 0;
  game.weaponMode = 'normal';
  game.weaponTimer = 0;
  game.depowered = false;
  game.depowerTimer = 0;
  game.depowerCooldownPenalty = 0;
  game.shakeAmount = 0;
  game.centipede = [];

  // Place player
  game.player = {
    x: game.canvasWidth / 2,
    y: game.canvasHeight - game.cellSize * 2,
    alive: true,
    respawnTimer: 0,
  };

  // Generate random mushrooms
  generateMushrooms(game);

  // Create first centipede
  spawnCentipede(game);

  // Reset enemy spawn timers (first spawn of the game)
  game.spiderTimer   = GAMEPLAY_CONFIG.enemies.spider.firstSpawnBase   + Math.random() * GAMEPLAY_CONFIG.enemies.spider.firstSpawnRandom;
  game.fleaTimer     = GAMEPLAY_CONFIG.enemies.flea.firstSpawnBase     + Math.random() * GAMEPLAY_CONFIG.enemies.flea.firstSpawnRandom;
  game.scorpionTimer = GAMEPLAY_CONFIG.enemies.scorpion.firstSpawnBase + Math.random() * GAMEPLAY_CONFIG.enemies.scorpion.firstSpawnRandom;
}

export function startDemoGame(game: GameData): void {
  startGame(game);
  game.state = 'demo';
  game.demoMode = true;
  game.attractTimer = 0;
}

export function updateAttractMode(game: GameData): void {
  if (game.state === 'playing') return;

  game.attractTimer++;

  if (game.state === 'menu' && game.attractTimer >= ATTRACT_TITLE_FRAMES) {
    startDemoGame(game);
  } else if (game.state === 'demo' && game.attractTimer >= ATTRACT_DEMO_FRAMES) {
    game.state = 'scores';
    game.demoMode = false;
    game.attractTimer = 0;
  } else if (game.state === 'scores' && game.attractTimer >= ATTRACT_SCORES_FRAMES) {
    game.state = 'menu';
    game.demoMode = false;
    game.attractTimer = 0;
  } else if (game.state === 'gameover' && game.attractTimer >= GAME_OVER_ATTRACT_FRAMES) {
    game.state = 'scores';
    game.demoMode = false;
    game.attractTimer = 0;
  }
}

function generateMushrooms(game: GameData): void {
  for (let row = 1; row < GRID_ROWS - PLAYER_ZONE_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      if (Math.random() < GAMEPLAY_CONFIG.mushrooms.initialSpawnChance) {
        game.mushrooms.set(mushroomKey(col, row), {
          col,
          row,
          hp: MUSHROOM_HP,
          poisoned: false,
          isBomb: Math.random() < GAMEPLAY_CONFIG.mushrooms.bombChance,
        });
      }
    }
  }
}

function spawnCentipede(game: GameData): void {
  const cs = game.cellSize;
  const levelSpeedBonus = Math.min(CENTIPEDE_LEVEL_SPEED_CAP, (game.level - 1) * CENTIPEDE_LEVEL_SPEED_BONUS);
  const scaling = GAMEPLAY_CONFIG.levelScaling.centipede;
  const mainLength = Math.max(
    scaling.minMainLength,
    CENTIPEDE_LENGTH - Math.floor((game.level - 1) / scaling.mainLengthReductionEveryLevels)
  );

  const createChain = (
    length: number,
    startCol: number,
    row: number,
    direction: 1 | -1,
    trailDirection: 1 | -1
  ): CentipedeSegment[] => {
    const chain: CentipedeSegment[] = [];
    for (let i = 0; i < length; i++) {
      chain.push({
        x: (startCol + i * trailDirection) * cs + cs / 2,
        y: row * cs + cs / 2,
        isHead: i === 0,
        direction,
        descending: false,
        targetY: row * cs + cs / 2,
        poisoned: false,
        speed: (i === 0 ? CENTIPEDE_HEAD_SPEED : CENTIPEDE_SPEED) + levelSpeedBonus,
      });
    }
    return chain;
  };

  // Always spawn a real centipede body. Difficulty grows via speed and short helper chains,
  // never by replacing the body with single head-only enemies.
  game.centipede.push(createChain(mainLength, GRID_COLS - 1, 0, -1, -1));

  const helperCount = Math.min(scaling.helperMaxChains, Math.floor((game.level - 1) / scaling.helperChainEveryLevels));
  const helperLength = Math.min(
    scaling.helperLengthMax,
    scaling.helperLengthBase + Math.floor((game.level - 1) / scaling.helperLengthIncreaseEveryLevels)
  );
  for (let i = 0; i < helperCount; i++) {
    const fromLeft = i % 2 === 0;
    game.centipede.push(
      createChain(
        helperLength,
        fromLeft ? 0 : GRID_COLS - 1,
        Math.min(scaling.helperStartMaxRow, i + 1),
        fromLeft ? 1 : -1,
        fromLeft ? 1 : -1
      )
    );
  }
}

export function shootBullet(game: GameData): boolean {
  const cooldown = game.depowered ? AUTO_FIRE_INTERVAL + DEPOWER_COOLDOWN_PENALTY : AUTO_FIRE_INTERVAL;
  const maxBullets = game.weaponMode === 'triple' ? MAX_BULLETS + 4 : game.weaponMode === 'double' ? MAX_BULLETS + 2 : MAX_BULLETS;

  if (
    game.shootCooldown > 0 ||
    game.bullets.length >= maxBullets ||
    !game.player.alive ||
    (game.state !== 'playing' && game.state !== 'demo')
  ) {
    return false;
  }

  const px = game.player.x;
  const py = game.player.y - game.cellSize / 2;
  const cs = game.cellSize;
  const speed = BULLET_SPEED * cs;

  const makeBullet = (x: number, y: number, angleDeg: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x,
      y,
      dx: Math.sin(rad) * speed,
      dy: -Math.cos(rad) * speed,
      active: true,
    };
  };

  if (game.weaponMode === 'double') {
    game.bullets.push(makeBullet(px - cs * 0.2, py, 0));
    game.bullets.push(makeBullet(px + cs * 0.2, py, 0));
  } else if (game.weaponMode === 'triple') {
    game.bullets.push(makeBullet(px, py, 0));
    game.bullets.push(makeBullet(px - cs * 0.15, py, -TRIPLE_ANGLE));
    game.bullets.push(makeBullet(px + cs * 0.15, py, TRIPLE_ANGLE));
  } else {
    game.bullets.push(makeBullet(px, py, 0));
  }

  game.shootCooldown = cooldown;
  game.shotsFired++;
  return true;
}

function addScore(game: GameData, points: number): number {
  const adjustedPoints = Math.floor(points * game.scoreMultiplier);
  game.score += adjustedPoints;
  if (!game.demoMode && game.score > game.highScore) {
    game.highScore = game.score;
    localStorage.setItem('centipede_highscore', String(game.highScore));
  }
  if (game.score >= game.nextLifeScore) {
    game.lives++;
    game.nextLifeScore += EXTRA_LIFE_SCORE;
  }
  return adjustedPoints;
}

function checkMushroomCollision(game: GameData, x: number, y: number, radius: number): Mushroom | null {
  const cs = game.cellSize;
  const col = Math.floor(x / cs);
  const row = Math.floor(y / cs);

  // Check surrounding cells
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const c = col + dc;
      const r = row + dr;
      const m = game.mushrooms.get(mushroomKey(c, r));
      if (m) {
        const mx = c * cs + cs / 2;
        const my = r * cs + cs / 2;
        const dist = Math.hypot(x - mx, y - my);
        if (dist < radius + cs * 0.4) {
          return m;
        }
      }
    }
  }
  return null;
}

function killPlayer(game: GameData): void {
  game.player.alive = false;
  game.deathAnimTimer = GAMEPLAY_CONFIG.player.deathAnimDuration;
  game.shakeAmount = GAMEPLAY_CONFIG.player.deathShake;
  game.lives--;
  game.bullets = [];

  // Restore damaged/poisoned mushrooms
  game.mushrooms.forEach((m) => {
    if (m.hp < MUSHROOM_HP || m.poisoned) {
      addScore(game, SCORE_MUSHROOM_RESTORE);
      m.hp = MUSHROOM_HP;
      m.poisoned = false;
    }
  });

  if (game.lives <= 0) {
    if (game.demoMode) {
      game.lives = 1;
      game.player.respawnTimer = GAMEPLAY_CONFIG.player.respawnDelay;
      return;
    }
    submitHighScore(game);
    game.state = 'gameover';
    game.attractTimer = 0;
  } else {
    game.player.respawnTimer = GAMEPLAY_CONFIG.player.respawnDelay;
  }
}

function updateBullets(game: GameData): void {
  const cs = game.cellSize;

  for (let bi = game.bullets.length - 1; bi >= 0; bi--) {
    const b = game.bullets[bi];
    // Guard: array may have been replaced/cleared by bomb → killPlayer
    if (!b) break;
    if (!b.active) {
      game.bullets.splice(bi, 1);
      continue;
    }

    b.x += b.dx;
    b.y += b.dy;

    if (b.y < 0 || b.x < 0 || b.x > game.canvasWidth) {
      game.bullets.splice(bi, 1);
      continue;
    }

    // Check mushroom collision
    const col = Math.floor(b.x / cs);
    const row = Math.floor(b.y / cs);

    // Check bonus mushroom first (bullet passes through and destroys the bonus)
    const bonusIdx = game.bonusMushrooms.findIndex(bm => bm.col === col && bm.row === row);
    if (bonusIdx !== -1) {
      const bonus = game.bonusMushrooms[bonusIdx];
      game.bonusMushrooms.splice(bonusIdx, 1);
      collectBonus(game, bonus.col, bonus.row, bonus.type);
      // Bullet is consumed
      game.bullets.splice(bi, 1);
      continue;
    }

    const m = game.mushrooms.get(mushroomKey(col, row));
    if (m) {
      if (m.isBomb) {
        game.mushrooms.delete(mushroomKey(col, row));
        detonateBombMushroom(game, col, row);
      } else {
        m.hp--;
        if (m.hp <= 0) {
          game.mushrooms.delete(mushroomKey(col, row));
          addScore(game, SCORE_MUSHROOM);
          const bi2 = game.bonusMushrooms.findIndex(bm => bm.col === col && bm.row === row);
          if (bi2 !== -1) game.bonusMushrooms.splice(bi2, 1);
        }
      }
      game.bullets.splice(bi, 1);
      continue;
    }

    let bulletConsumed = false;

    // Check centipede collision
    centipedeLoop:
    for (let ci = game.centipede.length - 1; ci >= 0; ci--) {
      const chain = game.centipede[ci];
      for (let si = chain.length - 1; si >= 0; si--) {
        const seg = chain[si];
        const dist = Math.hypot(b.x - seg.x, b.y - seg.y);
        if (dist < cs * 0.5) {
          addScore(game, seg.isHead ? SCORE_CENTIPEDE_HEAD : SCORE_CENTIPEDE_BODY);

          // Every destroyed centipede segment becomes a mushroom.
          const mCol = Math.floor(seg.x / cs);
          const mRow = Math.floor(seg.y / cs);
          // Prevent mushroom spawning in the very bottom row (GRID_ROWS - 1)
          if (mRow >= 0 && mRow < GRID_ROWS - 1 && !game.mushrooms.has(mushroomKey(mCol, mRow))) {
            game.mushrooms.set(mushroomKey(mCol, mRow), {
              col: mCol,
              row: mRow,
              hp: MUSHROOM_HP,
              poisoned: false,
              isBomb: Math.random() < GAMEPLAY_CONFIG.mushrooms.bombChance,
            });
          }

          if (chain.length === 1) {
            game.centipede.splice(ci, 1);
          } else if (si === 0) {
            chain.splice(0, 1);
            if (chain.length > 0) {
              chain[0].isHead = true;
              chain[0].speed = CENTIPEDE_HEAD_SPEED;
            }
          } else if (si === chain.length - 1) {
            chain.splice(si, 1);
          } else {
            const newChain = chain.splice(si + 1);
            chain.splice(si, 1);
            if (newChain.length > 0) {
              newChain[0].isHead = true;
              newChain[0].speed = CENTIPEDE_HEAD_SPEED;
              newChain[0].direction = (newChain[0].direction * -1) as 1 | -1;
              game.centipede.push(newChain);
            }
          }

          game.bullets.splice(bi, 1);
          bulletConsumed = true;
          break centipedeLoop;
        }
      }
    }
    if (bulletConsumed) continue;

    // Check spider collision
    if (game.spider && game.spider.active) {
      const dist = Math.hypot(b.x - game.spider.x, b.y - game.spider.y);
      if (dist < cs * 0.6) {
        const playerDist = Math.abs(game.player.y - game.spider.y);
        let points: number;
        if (playerDist < cs * 3) points = SCORE_SPIDER_CLOSE;
        else if (playerDist < cs * 6) points = SCORE_SPIDER_MEDIUM;
        else points = SCORE_SPIDER_FAR;
        addScore(game, points);
        game.spider.active = false;
        game.spider = null;
        game.bullets.splice(bi, 1);
        continue;
      }
    }

    // Check flea collision
    if (game.flea && game.flea.active) {
      const dist = Math.hypot(b.x - game.flea.x, b.y - game.flea.y);
      if (dist < cs * 0.5) {
        game.flea.hp--;
        if (game.flea.hp <= 0) {
          addScore(game, SCORE_FLEA);
          game.flea = null;
        }
        game.bullets.splice(bi, 1);
        continue;
      }
    }

    // Check scorpion collision
    if (game.scorpion && game.scorpion.active) {
      const dist = Math.hypot(b.x - game.scorpion.x, b.y - game.scorpion.y);
      if (dist < cs * 0.5) {
        addScore(game, SCORE_SCORPION);
        game.scorpion = null;
        game.bullets.splice(bi, 1);
      }
    }
  }
}

function updateCentipede(game: GameData): void {
  const cs = game.cellSize;
  const w = game.canvasWidth;
  const h = game.canvasHeight;

  for (const chain of game.centipede) {
    for (let i = 0; i < chain.length; i++) {
      const seg = chain[i];
      const speed = seg.speed * cs; // cells/tick → pixels/tick

      if (seg.descending) {
        // Moving down one row
        const targetY = seg.targetY;
        if (seg.y < targetY) {
          seg.y += speed;
          if (seg.y >= targetY) {
            seg.y = targetY;
            seg.descending = false;
          }
        }
      } else {
        if (i === 0) {
          // Head logic
          seg.x += speed * seg.direction;

          // Check if poisoned - go straight down
          if (seg.poisoned) {
            if (seg.y >= h - cs - cs / 2) {
              // Reached bottom - warp back to top
              seg.poisoned = false;
              seg.y = cs / 2;
              seg.descending = false;
            } else {
              seg.descending = true;
              seg.targetY = seg.y + cs;
              seg.direction = (seg.direction * -1) as 1 | -1;
            }
            // Check player collision even when poisoned
            if (game.player.alive) {
              const playerDist = Math.hypot(seg.x - game.player.x, seg.y - game.player.y);
              if (playerDist < cs * 0.7) {
                killPlayer(game);
              }
            }
            continue;
          }

          // Check wall or mushroom collision
          let shouldDescend = false;
          if (seg.x <= cs / 2 || seg.x >= w - cs / 2) {
            shouldDescend = true;
            seg.x = Math.max(cs / 2, Math.min(w - cs / 2, seg.x));
          } else {
            // Check mushroom ahead
            const aheadX = seg.x + seg.direction * cs * 0.5;
            const col = Math.floor(aheadX / cs);
            const row = Math.floor(seg.y / cs);
            const m = game.mushrooms.get(mushroomKey(col, row));
            if (m) {
              shouldDescend = true;
              if (m.poisoned) {
                seg.poisoned = true;
              }
            }
          }

          if (shouldDescend) {
            const newY = seg.y + cs;
            
            // If centipede reaches bottom, wrap back to top
            if (newY >= h - cs / 2) {
              // Warp to top of screen
              seg.y = cs / 2;
              seg.targetY = cs / 2;
              seg.descending = false;
              // Continue moving in same direction
            } else {
              seg.descending = true;
              seg.targetY = newY;
              seg.direction = (seg.direction * -1) as 1 | -1;
            }
          }
        } else {
          // Body follows the segment ahead
          const prev = chain[i - 1];
          const dx = prev.x - seg.x;
          const dy = prev.y - seg.y;
          const dist = Math.hypot(dx, dy);
          
          // If body segment is at bottom and needs to follow head that warped up
          if (seg.y >= h - cs && prev.y < h - cs * 2 && dist > cs * 3) {
            // Warp to follow the head
            seg.y = prev.y + cs;
            seg.x = prev.x;
          } else if (dist > cs * 0.9) {
            seg.x += (dx / dist) * speed;
            seg.y += (dy / dist) * speed;
          }
          seg.direction = dx > 0 ? 1 : -1;
        }
      }

      // Check player collision
      if (game.player.alive) {
        const playerDist = Math.hypot(seg.x - game.player.x, seg.y - game.player.y);
        if (playerDist < cs * 0.7) {
          killPlayer(game);
        }
      }
    }
  }
}

function updateSpider(game: GameData): void {
  const cs = game.cellSize;
  const h = game.canvasHeight;
  const w = game.canvasWidth;
  const playerZoneTop = h - PLAYER_ZONE_ROWS * cs;

  if (!game.spider) {
    game.spiderTimer--;
    if (game.spiderTimer <= 0) {
      const side = Math.random() < 0.5 ? -1 : 1;
      game.spider = {
        x: side === 1 ? -cs : w + cs,
        y: playerZoneTop + Math.random() * (PLAYER_ZONE_ROWS - 1) * cs,
        dx: side * SPIDER_SPEED * cs,
        dy: (Math.random() - 0.5) * SPIDER_SPEED * 2 * cs,
        active: true,
        timer: 0,
      };
      game.spiderTimer = GAMEPLAY_CONFIG.enemies.spider.spawnBase + Math.random() * GAMEPLAY_CONFIG.enemies.spider.spawnRandom;
    }
    return;
  }

  const spider = game.spider;
  spider.timer++;
  spider.x += spider.dx;

  // Zig-zag movement
  if (spider.timer % 20 === 0) {
    spider.dy = (Math.random() - 0.5) * SPIDER_SPEED * 3 * cs;
  }
  spider.y += spider.dy;

  // Constrain Y
  if (spider.y < playerZoneTop - cs * 3) spider.dy = Math.abs(spider.dy);
  if (spider.y > h - cs) spider.dy = -Math.abs(spider.dy);

  // Remove if off screen
  if (spider.x < -cs * 2 || spider.x > w + cs * 2) {
    game.spider = null;
    return;
  }

  // Eat mushrooms
  const col = Math.floor(spider.x / cs);
  const row = Math.floor(spider.y / cs);
  if (game.mushrooms.has(mushroomKey(col, row)) && Math.random() < GAMEPLAY_CONFIG.enemies.spider.eatMushroomChance) {
    game.mushrooms.delete(mushroomKey(col, row));
  }

  // Hit player
  if (game.player.alive) {
    const dist = Math.hypot(spider.x - game.player.x, spider.y - game.player.y);
    if (dist < cs * 0.7) {
      killPlayer(game);
      game.spider = null;
    }
  }
}

function updateFlea(game: GameData): void {
  const cs = game.cellSize;
  const h = game.canvasHeight;

  if (!game.flea) {
    // Count mushrooms in player zone
    let playerZoneMushrooms = 0;
    const playerZoneTop = GRID_ROWS - PLAYER_ZONE_ROWS;
    game.mushrooms.forEach((m) => {
      if (m.row >= playerZoneTop) playerZoneMushrooms++;
    });

    if (playerZoneMushrooms < GAMEPLAY_CONFIG.enemies.flea.maxMushroomsForSpawn) {
      game.fleaTimer--;
      if (game.fleaTimer <= 0) {
        game.flea = {
          x: Math.floor(Math.random() * GRID_COLS) * cs + cs / 2,
          y: -cs,
          hp: GAMEPLAY_CONFIG.enemies.flea.hp,
          active: true,
        };
        game.fleaTimer = GAMEPLAY_CONFIG.enemies.flea.spawnBase + Math.random() * GAMEPLAY_CONFIG.enemies.flea.spawnRandom;
      }
    }
    return;
  }

  const flea = game.flea;
  flea.y += FLEA_SPEED * cs;

  // Drop mushrooms
  if (Math.random() < GAMEPLAY_CONFIG.enemies.flea.mushroomDropChance) {
    const col = Math.floor(flea.x / cs);
    const row = Math.floor(flea.y / cs);
    if (row >= 0 && row < GRID_ROWS - 1 && !game.mushrooms.has(mushroomKey(col, row))) {
      game.mushrooms.set(mushroomKey(col, row), {
        col,
        row,
        hp: MUSHROOM_HP,
        poisoned: false,
        isBomb: Math.random() < GAMEPLAY_CONFIG.mushrooms.bombChance,
      });
    }
  }

  // Off screen
  if (flea.y > h + cs) {
    game.flea = null;
    return;
  }

  // Hit player
  if (game.player.alive) {
    const dist = Math.hypot(flea.x - game.player.x, flea.y - game.player.y);
    if (dist < cs * 0.6) {
      killPlayer(game);
    }
  }
}

function detonateBombMushroom(game: GameData, col: number, row: number): void {
  const cs = game.cellSize;
  const px = col * cs + cs / 2;
  const py = row * cs + cs / 2;

  game.floatingTexts.push({ x: px, y: py, text: 'BOOM!', color: '#FF3300', ttl: 90 });
  addScore(game, GAMEPLAY_CONFIG.scoring.bombExplosion);
  game.shakeAmount = GAMEPLAY_CONFIG.player.bombShake;

  const radius = 3;

  // Collect keys to delete first, then delete (never mutate Map during forEach)
  const keysToDelete: string[] = [];
  game.mushrooms.forEach((m, key) => {
    const dist = Math.hypot(m.col - col, m.row - row);
    if (dist <= radius) {
      keysToDelete.push(key);
    }
  });

  for (const key of keysToDelete) {
    const m = game.mushrooms.get(key);
    if (m) {
      game.mushrooms.delete(key);
      const bi2 = game.bonusMushrooms.findIndex(bm => bm.col === m.col && bm.row === m.row);
      if (bi2 !== -1) game.bonusMushrooms.splice(bi2, 1);
    }
  }

  // Kill centipede segments caught in the blast
  for (let ci = game.centipede.length - 1; ci >= 0; ci--) {
    const chain = game.centipede[ci];
    for (let si = chain.length - 1; si >= 0; si--) {
      const seg = chain[si];
      const segCol = Math.floor(seg.x / cs);
      const segRow = Math.floor(seg.y / cs);
      if (Math.hypot(segCol - col, segRow - row) <= radius) {
        addScore(game, seg.isHead ? SCORE_CENTIPEDE_HEAD : SCORE_CENTIPEDE_BODY);
        if (chain.length === 1) {
          game.centipede.splice(ci, 1);
          break;
        } else {
          chain.splice(si, 1);
          if (chain.length > 0) {
            chain[0].isHead = true;
            chain[0].speed = CENTIPEDE_HEAD_SPEED;
          }
        }
      }
    }
  }

  // Damage player if too close — defer so we don't corrupt bullet array mid-iteration
  if (game.player.alive) {
    const pDist = Math.hypot(game.player.x - px, game.player.y - py);
    if (pDist <= (radius + 1) * cs) {
      // Mark for deferred kill — handled right after the bullet loop
      game._pendingPlayerKill = true;
    }
  }
}

function collectBonus(game: GameData, col: number, row: number, type: BonusType): void {
  const cs = game.cellSize;
  const px = col * cs + cs / 2;
  const py = row * cs + cs / 2;

  if (type === 'GOLD') {
    const raw = BONUS_SCORE_GOLD_MIN + Math.floor(Math.random() * (BONUS_SCORE_GOLD_MAX - BONUS_SCORE_GOLD_MIN + 1));
    const pts = addScore(game, raw);
    game.floatingTexts.push({ x: px, y: py, text: `+${pts}`, color: '#FFD700', ttl: 90 });
  } else if (type === 'ONEUP') {
    game.lives++;
    game.floatingTexts.push({ x: px, y: py, text: '1-UP!', color: '#00FF88', ttl: 120 });
  } else if (type === 'GEM') {
    addScore(game, BONUS_SCORE_GEM);
    game.scoreMultiplier = SCORE_MULTIPLIER_VALUE;
    game.scoreMultiplierTimer = SCORE_MULTIPLIER_DURATION;
    game.floatingTexts.push({ x: px, y: py, text: '×2 SCORE!', color: '#CC88FF', ttl: 120 });
  } else if (type === 'DOUBLE') {
    game.weaponMode = 'double';
    game.weaponTimer = WEAPON_DURATION;
    game.depowered = false;
    game.depowerTimer = 0;
    game.floatingTexts.push({ x: px, y: py, text: 'DOUBLE SHOT!', color: '#FF4444', ttl: 120 });
  } else if (type === 'TRIPLE') {
    game.weaponMode = 'triple';
    game.weaponTimer = WEAPON_DURATION;
    game.depowered = false;
    game.depowerTimer = 0;
    game.floatingTexts.push({ x: px, y: py, text: 'TRIPLE SHOT!', color: '#FF8800', ttl: 120 });
  } else if (type === 'DEPOWER') {
    game.weaponMode = 'normal';
    game.weaponTimer = 0;
    game.depowered = true;
    game.depowerTimer = DEPOWER_DURATION;
    game.floatingTexts.push({ x: px, y: py, text: 'DEPOWERED!', color: '#FF0000', ttl: 120 });
  } else if (type === 'SPAWN_SPIDER') {
    spawnSpiderFromMushroom(game);
    game.floatingTexts.push({ x: px, y: py, text: 'SPIDER!', color: '#FF00CC', ttl: 100 });
  } else if (type === 'SPAWN_SCORPION') {
    spawnScorpionFromMushroom(game);
    game.floatingTexts.push({ x: px, y: py, text: 'SCORPION!', color: '#FF00CC', ttl: 100 });
  } else if (type === 'SPAWN_CENTIPEDE') {
    spawnCentipedeFromMushroom(game);
    game.floatingTexts.push({ x: px, y: py, text: 'CENTIPEDE!', color: '#FF00CC', ttl: 100 });
  }
  game.shakeAmount = GAMEPLAY_CONFIG.effects.bonusCollectShake;
}

function spawnSpiderFromMushroom(game: GameData): void {
  const cs = game.cellSize;
  const w = game.canvasWidth;
  const h = game.canvasHeight;
  const playerZoneTop = h - PLAYER_ZONE_ROWS * cs;
  // Spiders come from left or right edge, into the lower portion of the screen
  const fromLeft = Math.random() < 0.5;
  game.spider = {
    x: fromLeft ? -cs : w + cs,
    y: playerZoneTop + Math.random() * (PLAYER_ZONE_ROWS - 1) * cs,
    dx: (fromLeft ? 1 : -1) * SPIDER_SPEED * cs,
    dy: (Math.random() - 0.5) * SPIDER_SPEED * 2 * cs,
    active: true,
    timer: 0,
  };
}

function spawnScorpionFromMushroom(game: GameData): void {
  const cs = game.cellSize;
  const w = game.canvasWidth;
  // Scorpions move horizontally through the mushroom field (not player zone)
  const fromLeft = Math.random() < 0.5;
  const topRow = GAMEPLAY_CONFIG.enemies.scorpion.spawnTopRow;
  const rowCount = GRID_ROWS - PLAYER_ZONE_ROWS - GAMEPLAY_CONFIG.enemies.scorpion.spawnBottomPaddingRows;
  const row = Math.floor(Math.random() * rowCount) + topRow;
  game.scorpion = {
    x: fromLeft ? -cs : w + cs,
    y: row * cs + cs / 2,
    direction: (fromLeft ? 1 : -1) as 1 | -1,
    active: true,
  };
}

function spawnCentipedeFromMushroom(game: GameData): void {
  const cs = game.cellSize;
  // Short centipede (3-6 segments) entering from the top
  const scaling = GAMEPLAY_CONFIG.levelScaling.centipede;
  const length = scaling.spawnedMinLength + Math.floor(Math.random() * scaling.spawnedLengthRandom);
  const fromLeft = Math.random() < 0.5;
  const startCol = fromLeft ? 0 : GRID_COLS - 1;
  const direction: 1 | -1 = fromLeft ? 1 : -1;
  const trailDir: 1 | -1 = fromLeft ? -1 : 1; // body trails behind head
  const row = Math.floor(Math.random() * scaling.spawnedStartRows); // first few rows
  const levelSpeedBonus = Math.min(CENTIPEDE_LEVEL_SPEED_CAP, (game.level - 1) * CENTIPEDE_LEVEL_SPEED_BONUS);
  const chain = [];
  for (let i = 0; i < length; i++) {
    chain.push({
      x: (startCol + i * trailDir) * cs + cs / 2,
      y: row * cs + cs / 2,
      isHead: i === 0,
      direction,
      descending: false,
      targetY: row * cs + cs / 2,
      poisoned: false,
      speed: (i === 0 ? CENTIPEDE_HEAD_SPEED : CENTIPEDE_SPEED) + levelSpeedBonus,
    });
  }
  game.centipede.push(chain);
}

function updateBonusMushrooms(game: GameData): void {
  const cs = game.cellSize; void cs; // kept for future pixel-coord helpers

  // Decay score multiplier
  if (game.scoreMultiplierTimer > 0) {
    game.scoreMultiplierTimer--;
    if (game.scoreMultiplierTimer === 0) {
      game.scoreMultiplier = 1;
    }
  }

  // Decay weapon power-up
  if (game.weaponTimer > 0) {
    game.weaponTimer--;
    if (game.weaponTimer === 0) {
      game.weaponMode = 'normal';
    }
  }

  // Decay depower
  if (game.depowerTimer > 0) {
    game.depowerTimer--;
    if (game.depowerTimer === 0) {
      game.depowered = false;
    }
  }

  // Age floating texts
  for (let i = game.floatingTexts.length - 1; i >= 0; i--) {
    game.floatingTexts[i].ttl--;
    game.floatingTexts[i].y -= 0.6;
    if (game.floatingTexts[i].ttl <= 0) game.floatingTexts.splice(i, 1);
  }

  // Age existing bonus mushrooms
  for (let i = game.bonusMushrooms.length - 1; i >= 0; i--) {
    game.bonusMushrooms[i].ttl--;
    if (game.bonusMushrooms[i].ttl <= 0) {
      game.bonusMushrooms.splice(i, 1);
    }
  }

  // Maybe spawn a new bonus mushroom on a random existing mushroom position
  // Spawn chance increases with level (+0.1% per level)
  const spawnChance = BONUS_SPAWN_CHANCE + (game.level - 1) * BONUS_LEVEL_BONUS_CHANCE;
  if (
    game.bonusMushrooms.length < BONUS_MAX_ON_FIELD &&
    Math.random() < spawnChance
  ) {
    const mushroomKeys = Array.from(game.mushrooms.keys());
    if (mushroomKeys.length > 0) {
      const key = mushroomKeys[Math.floor(Math.random() * mushroomKeys.length)];
      const m = game.mushrooms.get(key)!;
      // Don't stack two bonuses on same cell
      const already = game.bonusMushrooms.some(b => b.col === m.col && b.row === m.row);
      if (!already) {
        // DIP SWITCH ARCADE CONFIGURATION (see GAMEPLAY_CONFIG.bonusMushrooms)
        const activeMonsterGens = game.bonusMushrooms.filter(bm =>
          ['SPAWN_SPIDER', 'SPAWN_SCORPION', 'SPAWN_CENTIPEDE'].includes(bm.type)
        ).length;

        const monsterCfg = GAMEPLAY_CONFIG.bonusMushrooms;
        const maxMonsterGens = game.level <= monsterCfg.monsterSpawnerMaxByLevel.lowMidMaxLevel
          ? monsterCfg.monsterSpawnerMaxByLevel.lowMid
          : monsterCfg.monsterSpawnerMaxByLevel.high;

        const MONSTER_GEN_CHANCE =
          game.level <= monsterCfg.monsterSpawnerChanceByLevel.lowMaxLevel ? monsterCfg.monsterSpawnerChanceByLevel.lowLevels :
          game.level <= monsterCfg.monsterSpawnerChanceByLevel.midMaxLevel ? monsterCfg.monsterSpawnerChanceByLevel.midLevels :
          game.level <= monsterCfg.monsterSpawnerChanceByLevel.highMaxLevel ? monsterCfg.monsterSpawnerChanceByLevel.highLevels :
                            monsterCfg.monsterSpawnerChanceByLevel.endgame;

        const isMonsterGen = activeMonsterGens < maxMonsterGens && Math.random() < MONSTER_GEN_CHANCE;

        let type: BonusType;
        if (isMonsterGen) {
          const monsterTypes = monsterCfg.monsterSpawnerTypes as readonly BonusType[];
          type = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];
        } else {
          // Regular items
          const lvl = game.level;
          const powerupScaling = GAMEPLAY_CONFIG.levelScaling.bonusPowerups;
          const extraPowerup = Math.min(
            powerupScaling.maxExtraSlots,
            Math.floor(lvl / powerupScaling.levelsPerExtraSlot)
          );
          const weights = monsterCfg.weights;
          
          type = chooseWeighted<BonusType>([
            { type: 'GOLD', weight: weights.gold },
            { type: 'GEM', weight: weights.gem },
            { type: 'ONEUP', weight: weights.oneUpBase + extraPowerup },
            { type: 'DOUBLE', weight: weights.doubleBase + extraPowerup },
            { type: 'TRIPLE', weight: weights.tripleBase + extraPowerup },
            { type: 'DEPOWER', weight: weights.depower },
          ], 'GOLD');
        }

        game.bonusMushrooms.push({ col: m.col, row: m.row, type, ttl: BONUS_LIFETIME });
      }
    }
  }
}

function updateScorpion(game: GameData): void {
  const cs = game.cellSize;
  const w = game.canvasWidth;

  if (!game.scorpion) {
    game.scorpionTimer--;
    if (game.scorpionTimer <= 0 && game.level >= GAMEPLAY_CONFIG.enemies.scorpion.minLevel) {
      const side = Math.random() < 0.5 ? 1 : -1;
      const topRow = GAMEPLAY_CONFIG.enemies.scorpion.spawnTopRow;
      const rowCount = GRID_ROWS - PLAYER_ZONE_ROWS - GAMEPLAY_CONFIG.enemies.scorpion.spawnBottomPaddingRows;
      const row = Math.floor(Math.random() * rowCount) + topRow;
      game.scorpion = {
        x: side === 1 ? -cs : w + cs,
        y: row * cs + cs / 2,
        direction: side as 1 | -1,
        active: true,
      };
      game.scorpionTimer = GAMEPLAY_CONFIG.enemies.scorpion.spawnBase + Math.random() * GAMEPLAY_CONFIG.enemies.scorpion.spawnRandom;
    }
    return;
  }

  const scorp = game.scorpion;
  scorp.x += SCORPION_SPEED * cs * scorp.direction;

  // Poison mushrooms it touches
  const col = Math.floor(scorp.x / cs);
  const row = Math.floor(scorp.y / cs);
  const m = game.mushrooms.get(mushroomKey(col, row));
  if (m) {
    m.poisoned = true;
  }

  // Off screen
  if (scorp.x < -cs * 2 || scorp.x > w + cs * 2) {
    game.scorpion = null;
  }
}

export function updateGame(
  game: GameData,
  input: { left: boolean; right: boolean; up: boolean; down: boolean; fire: boolean },
  pointerPos: { x: number; y: number } | null
): void {
  if (game.state !== 'playing' && game.state !== 'demo') return;

  game.frameCount++;

  // Shake decay
  if (game.shakeAmount > 0) game.shakeAmount *= GAMEPLAY_CONFIG.effects.shakeDecay;
  if (game.shakeAmount < GAMEPLAY_CONFIG.effects.shakeStopThreshold) game.shakeAmount = 0;

  // Death animation
  if (!game.player.alive) {
    if (game.deathAnimTimer > 0) {
      game.deathAnimTimer--;
      return;
    }
    if (game.lives <= 0) return;
    game.player.respawnTimer--;
    if (game.player.respawnTimer <= 0) {
      game.player.alive = true;
      game.player.x = game.canvasWidth / 2;
      game.player.y = game.canvasHeight - game.cellSize * 2;
      game.spider = null;
      game.flea = null;
      game.scorpion = null;
    }
    return;
  }

  // Level clear
  if (game.centipede.length === 0) {
    game.levelClearTimer++;
    if (game.levelClearTimer > 60) {
      game.level++;
      game.levelClearTimer = 0;
      game.spider = null;
      game.flea = null;
      game.scorpion = null;
      game.bullets = [];
      game.shootCooldown = 0;
      spawnCentipede(game);
    }
    return;
  }

  const cs = game.cellSize;
  const p = game.player;

  if (game.shootCooldown > 0) {
    game.shootCooldown--;
  }

  // Player movement — speeds in cells/tick, convert to pixels via cs
  const playerPx = PLAYER_SPEED * cs;
  let kbMoved = false;
  if (input.left) { p.x -= playerPx; kbMoved = true; }
  if (input.right) { p.x += playerPx; kbMoved = true; }
  if (input.up) { p.y -= playerPx; kbMoved = true; }
  if (input.down) { p.y += playerPx; kbMoved = true; }

  if (!kbMoved && pointerPos) {
    const dx = pointerPos.x - p.x;
    const dy = pointerPos.y - p.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 2) {
      const speed = Math.min(playerPx * 1.5, dist);
      p.x += (dx / dist) * speed;
      p.y += (dy / dist) * speed;
    }
  }

  // Constrain player to player zone
  const playerZoneTop = game.canvasHeight - PLAYER_ZONE_ROWS * cs;
  p.x = Math.max(cs / 2, Math.min(game.canvasWidth - cs / 2, p.x));
  p.y = Math.max(playerZoneTop, Math.min(game.canvasHeight - cs / 2, p.y));

  // Check player-mushroom collision (push away)
  const pm = checkMushroomCollision(game, p.x, p.y, cs * 0.3);
  if (pm) {
    const mx = pm.col * cs + cs / 2;
    const my = pm.row * cs + cs / 2;
    const dx = p.x - mx;
    const dy = p.y - my;
    const dist = Math.hypot(dx, dy);
    if (dist > 0) {
      p.x += (dx / dist) * 2;
      p.y += (dy / dist) * 2;
    }
  }

  // Auto-fire or manual fire
  if (input.fire) {
    shootBullet(game);
  }

  // Update bullets
  updateBullets(game);

  // Handle deferred bomb kill (must happen AFTER bullet loop is done)
  if (game._pendingPlayerKill) {
    game._pendingPlayerKill = false;
    if (game.player.alive) {
      killPlayer(game);
    }
  }

  // Update centipede
  updateCentipede(game);

  // Update enemies
  updateSpider(game);
  updateFlea(game);
  updateScorpion(game);
  updateBonusMushrooms(game);
}
