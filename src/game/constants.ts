// ─────────────────────────────────────────────────────────────────────────────
// constants.ts
//
// All gameplay-tuning numbers live in `gameplay-config.ts` (GAMEPLAY_CONFIG).
// This file re-exports them as named constants so that the rest of the codebase
// (engine, renderer) can keep using the existing import names unchanged.
//
// Add or rename gameplay numbers ONLY in `gameplay-config.ts`.
// Visual colors are kept here in the COLORS palette.
// ─────────────────────────────────────────────────────────────────────────────

import { GAMEPLAY_CONFIG } from './gameplay-config';

// Grid -----------------------------------------------------------------------
export const GRID_COLS        = GAMEPLAY_CONFIG.grid.columns;
export const GRID_ROWS        = GAMEPLAY_CONFIG.grid.rows;
export const PLAYER_ZONE_ROWS = GAMEPLAY_CONFIG.grid.playerRows;

// Player / bullets / enemy speeds (cells per tick) ---------------------------
export const PLAYER_SPEED         = GAMEPLAY_CONFIG.player.speed;
export const BULLET_SPEED         = GAMEPLAY_CONFIG.bullets.speed;
export const MAX_BULLETS          = GAMEPLAY_CONFIG.bullets.maxOnScreen;
export const AUTO_FIRE_INTERVAL   = GAMEPLAY_CONFIG.bullets.cooldown;
export const TRIPLE_ANGLE         = GAMEPLAY_CONFIG.bullets.tripleAngle;
export const CENTIPEDE_SPEED      = GAMEPLAY_CONFIG.enemies.centipede.bodySpeed;
export const CENTIPEDE_HEAD_SPEED = GAMEPLAY_CONFIG.enemies.centipede.headSpeed;
export const SPIDER_SPEED         = GAMEPLAY_CONFIG.enemies.spider.speed;
export const FLEA_SPEED           = GAMEPLAY_CONFIG.enemies.flea.speed;
export const SCORPION_SPEED       = GAMEPLAY_CONFIG.enemies.scorpion.speed;

export const CENTIPEDE_LEVEL_SPEED_BONUS = GAMEPLAY_CONFIG.enemies.centipede.levelSpeedBonus;
export const CENTIPEDE_LEVEL_SPEED_CAP   = GAMEPLAY_CONFIG.enemies.centipede.levelSpeedCap;
export const CENTIPEDE_LENGTH            = GAMEPLAY_CONFIG.enemies.centipede.initialLength;

// Scoring --------------------------------------------------------------------
export const SCORE_CENTIPEDE_HEAD  = GAMEPLAY_CONFIG.scoring.centipedeHead;
export const SCORE_CENTIPEDE_BODY  = GAMEPLAY_CONFIG.scoring.centipedeBody;
export const SCORE_SPIDER_CLOSE    = GAMEPLAY_CONFIG.scoring.spiderClose;
export const SCORE_SPIDER_MEDIUM   = GAMEPLAY_CONFIG.scoring.spiderMedium;
export const SCORE_SPIDER_FAR      = GAMEPLAY_CONFIG.scoring.spiderFar;
export const SCORE_FLEA            = GAMEPLAY_CONFIG.scoring.flea;
export const SCORE_SCORPION        = GAMEPLAY_CONFIG.scoring.scorpion;
export const SCORE_MUSHROOM        = GAMEPLAY_CONFIG.scoring.mushroom;
export const SCORE_MUSHROOM_RESTORE = GAMEPLAY_CONFIG.scoring.mushroomRestore;
export const EXTRA_LIFE_SCORE      = GAMEPLAY_CONFIG.scoring.extraLifeEvery;

// Mushrooms ------------------------------------------------------------------
export const MUSHROOM_HP = GAMEPLAY_CONFIG.mushrooms.hp;

// Bonus mushrooms ------------------------------------------------------------
export const BONUS_SPAWN_CHANCE         = GAMEPLAY_CONFIG.bonusMushrooms.spawnChanceBase;
export const BONUS_LEVEL_BONUS_CHANCE   = GAMEPLAY_CONFIG.bonusMushrooms.spawnChancePerLevel;
export const BONUS_MAX_ON_FIELD         = GAMEPLAY_CONFIG.bonusMushrooms.maxActive;
export const BONUS_LIFETIME             = GAMEPLAY_CONFIG.bonusMushrooms.duration;
export const BONUS_SCORE_GOLD_MIN       = GAMEPLAY_CONFIG.bonusMushrooms.goldScoreMin;
export const BONUS_SCORE_GOLD_MAX       = GAMEPLAY_CONFIG.bonusMushrooms.goldScoreMax;
export const BONUS_SCORE_GEM            = GAMEPLAY_CONFIG.bonusMushrooms.gemScore;
export const SCORE_MULTIPLIER_DURATION  = GAMEPLAY_CONFIG.bonusMushrooms.scoreMultiplierDuration;
export const SCORE_MULTIPLIER_VALUE     = GAMEPLAY_CONFIG.bonusMushrooms.scoreMultiplierValue;
export const WEAPON_DURATION            = GAMEPLAY_CONFIG.bonusMushrooms.weaponDuration;
export const DEPOWER_DURATION           = GAMEPLAY_CONFIG.bonusMushrooms.depowerDuration;
export const DEPOWER_COOLDOWN_PENALTY   = GAMEPLAY_CONFIG.bonusMushrooms.depowerCooldownPenalty;

// Attract mode ---------------------------------------------------------------
export const ATTRACT_TITLE_FRAMES     = GAMEPLAY_CONFIG.attract.titleFrames;
export const ATTRACT_DEMO_FRAMES      = GAMEPLAY_CONFIG.attract.demoFrames;
export const ATTRACT_SCORES_FRAMES    = GAMEPLAY_CONFIG.attract.scoresFrames;
export const GAME_OVER_ATTRACT_FRAMES = GAMEPLAY_CONFIG.attract.gameOverFrames;

// Re-export the master config for places that prefer the grouped object
export { GAMEPLAY_CONFIG };

// Colors (visual palette - not gameplay tuning) -----------------------------
export const COLORS = {
  bg: '#000000',
  player: '#00FF00',
  bullet: '#FFFF00',
  centipedeHead: '#FF0000',
  centipedeBody: '#FF6600',
  mushroom: '#00CC66',
  mushroomDamaged1: '#00AA55',
  mushroomDamaged2: '#008844',
  mushroomDamaged3: '#006633',
  mushroomPoison: '#CC00CC',
  mushroomPoisonDamaged1: '#AA00AA',
  mushroomPoisonDamaged2: '#880088',
  mushroomPoisonDamaged3: '#660066',
  spider: '#FFFF00',
  flea: '#FF00FF',
  scorpion: '#FF8800',
  bonusGold: '#FFD700',
  bonusOneUp: '#00FF88',
  bonusGem: '#AA44FF',
  bonusDouble: '#FF4444',
  bonusTriple: '#FF8800',
  bonusDepower: '#880000',
  depowerFlash: '#FF0000',
  bonusSpiderSpawn: '#FFDD00',
  bonusScorpionSpawn: '#FF8800',
  bonusCentispawn: '#FF4444',
  text: '#FFFFFF',
  hud: '#CCCCCC',
};
