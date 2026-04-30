export interface Point {
  x: number;
  y: number;
}

export interface Player {
  x: number;
  y: number;
  alive: boolean;
  respawnTimer: number;
}

export interface Bullet {
  x: number;
  y: number;
  dx: number;
  dy: number;
  active: boolean;
}

export interface CentipedeSegment {
  x: number;
  y: number;
  isHead: boolean;
  direction: 1 | -1; // 1 = right, -1 = left
  descending: boolean;
  targetY: number;
  poisoned: boolean;
  speed: number;
}

export interface Mushroom {
  col: number;
  row: number;
  hp: number; // 1-4
  poisoned: boolean;
  isBomb?: boolean;
}

export interface Spider {
  x: number;
  y: number;
  dx: number;
  dy: number;
  active: boolean;
  timer: number;
}

export interface Flea {
  x: number;
  y: number;
  hp: number;
  active: boolean;
}

export interface Scorpion {
  x: number;
  y: number;
  direction: 1 | -1;
  active: boolean;
}

// ── Bonus mushrooms ──────────────────────────────────────────────────────────
export type BonusType =
  | 'GOLD' | 'ONEUP' | 'GEM' | 'DOUBLE' | 'TRIPLE' | 'DEPOWER'
  | 'SPAWN_SPIDER' | 'SPAWN_SCORPION' | 'SPAWN_CENTIPEDE';

export type WeaponMode = 'normal' | 'double' | 'triple';

export interface BonusMushroom {
  col: number;
  row: number;
  type: BonusType;
  /** Countdown frames before the bonus disappears (starts at BONUS_LIFETIME) */
  ttl: number;
}

/** Floating score/label that appears briefly when a bonus is collected */
export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  ttl: number;
}

export interface HighScoreEntry {
  initials: string;
  score: number;
}

export type GameState = 'menu' | 'playing' | 'demo' | 'scores' | 'gameover' | 'paused' | 'levelclear';

export interface GameData {
  state: GameState;
  score: number;
  highScore: number;
  highScores: HighScoreEntry[];
  lives: number;
  level: number;
  player: Player;
  bullets: Bullet[];
  shootCooldown: number;
  shotsFired: number;
  centipede: CentipedeSegment[][];
  mushrooms: Map<string, Mushroom>;
  spider: Spider | null;
  flea: Flea | null;
  scorpion: Scorpion | null;
  bonusMushrooms: BonusMushroom[];
  bonusMushroomTimer: number;
  floatingTexts: FloatingText[];
  scoreMultiplier: number;
  scoreMultiplierTimer: number;
  weaponMode: WeaponMode;
  weaponTimer: number;
  depowered: boolean;
  depowerTimer: number;
  depowerCooldownPenalty: number;
  demoMode: boolean;
  attractTimer: number;
  cellSize: number;
  canvasWidth: number;
  canvasHeight: number;
  nextLifeScore: number;
  frameCount: number;
  spiderTimer: number;
  fleaTimer: number;
  scorpionTimer: number;
  levelClearTimer: number;
  deathAnimTimer: number;
  shakeAmount: number;
  _pendingPlayerKill: boolean;
}
