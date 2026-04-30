// ─────────────────────────────────────────────────────────────────────────────
// GAMEPLAY CONFIG
// Single source of truth for tuning the game.
// All numbers that affect balance / pacing live here.
//
// Notes on units:
//   - All speeds are CELLS PER TICK at 60 fps. Multiplied by `cellSize`
//     at runtime, so they remain consistent across screen sizes.
//   - All timers are FRAMES at 60 fps (60 = 1 second).
//   - Probabilities are per-frame unless stated otherwise.
// ─────────────────────────────────────────────────────────────────────────────

export const GAMEPLAY_CONFIG = {
  // Playfield grid
  grid: {
    columns: 30,
    rows: 31,
    /** Bottom rows where the player can move. */
    playerRows: 6,
  },

  // Player ship
  player: {
    /** Movement speed in cells per tick. */
    speed: 0.17,
    /** Frames the death animation plays before respawn timer starts. */
    deathAnimDuration: 60,
    /** Frames after death before the player reappears. 120 = 2 seconds of safety. */
    respawnDelay: 120,
    /** Screen shake on death (visual only). */
    deathShake: 8,
    /** Extra screen shake on bomb explosion. */
    bombShake: 15,
  },

  // Short-lived arcade feedback effects
  effects: {
    /** Small shake when collecting a bonus mushroom. */
    bonusCollectShake: 4,
    /** Per-frame decay factor for screen shake. */
    shakeDecay: 0.9,
    /** Shake values below this are rounded to zero. */
    shakeStopThreshold: 0.1,
  },

  // Bullets / fire control
  bullets: {
    /** Bullet speed in cells per tick. */
    speed: 0.42,
    /** Maximum bullets on screen with normal cannon. */
    maxOnScreen: 4,
    /** Frames between auto-fire shots. */
    cooldown: 8,
    /** Side-shot angle for the triple cannon, in degrees from vertical. */
    tripleAngle: 30,
  },

  // Enemy tuning
  enemies: {
    centipede: {
      /** Body segment speed in cells per tick. */
      bodySpeed: 0.08,
      /** Head segment speed in cells per tick. */
      headSpeed: 0.12,
      /** Initial centipede length (segments). */
      initialLength: 12,
      /** Extra speed (cells/tick) gained per level. */
      levelSpeedBonus: 0.008,
      /** Cap on level-based speed bonus (cells/tick). */
      levelSpeedCap: 0.10,
    },
    spider: {
      /** Speed in cells per tick. */
      speed: 0.10,
      /** Recurring spawn timer base / random window (frames). */
      spawnBase: 300,
      spawnRandom: 400,
      /** First spawn after game start (frames). Delayed to give level-1 breathing room. */
      firstSpawnBase: 400,
      firstSpawnRandom: 200,
      /** Per-frame chance that the spider eats the mushroom under it. */
      eatMushroomChance: 0.05,
    },
    flea: {
      /** Speed in cells per tick. */
      speed: 0.12,
      /** Shots required to destroy a flea. */
      hp: 2,
      /** Recurring spawn timer base / random window (frames). */
      spawnBase: 300,
      spawnRandom: 300,
      /** First spawn after game start (frames). Delayed to avoid overlap with early spider. */
      firstSpawnBase: 600,
      firstSpawnRandom: 300,
      /** Only spawn when the player zone has fewer mushrooms than this. Lowered for early readability. */
      maxMushroomsForSpawn: 4,
      /** Per-frame chance to drop a mushroom while falling. */
      mushroomDropChance: 0.08,
    },
    scorpion: {
      /** Speed in cells per tick. */
      speed: 0.06,
      /** Recurring spawn timer base / random window (frames). */
      spawnBase: 600,
      spawnRandom: 600,
      /** First spawn after game start (frames). Does not appear in level 1. */
      firstSpawnBase: 600,
      firstSpawnRandom: 400,
      /** Minimum level required for scorpion spawns. 2 = no scorpions in level 1. */
      minLevel: 2,
      /** Top row used for horizontal scorpion entry. */
      spawnTopRow: 1,
      /** Keep scorpions this many rows above the player zone. */
      spawnBottomPaddingRows: 2,
    },
  },

  // Mushrooms
  mushrooms: {
    /** Hit points before the mushroom is destroyed. */
    hp: 4,
    /** Probability per cell when generating the initial field. */
    initialSpawnChance: 0.06,
    /** Chance that a newly-placed mushroom is a bomb. Lowered from 0.05 for early-game fairness. */
    bombChance: 0.04,
    /** Prevent mushrooms from spawning in the very bottom row. */
    forbidBottomRow: true,
  },

  // Bonus mushrooms (power-ups, malus, monster-spawners)
  bonusMushrooms: {
    /** Per-frame base spawn chance. */
    spawnChanceBase: 0.008,
    /** Extra per-frame spawn chance per level above 1. */
    spawnChancePerLevel: 0.001,
    /** Maximum bonus mushrooms active at once. */
    maxActive: 2,
    /** Frames a bonus mushroom stays alive (~7 s @ 60 fps). */
    duration: 420,

    // Reward values
    goldScoreMin: 500,
    goldScoreMax: 2000,
    gemScore: 1000,

    // Power-up timers
    /** Frames the score multiplier stays active (~10 s). */
    scoreMultiplierDuration: 600,
    /** Multiplier value when GEM is collected. */
    scoreMultiplierValue: 2,
    /** Frames a weapon power-up stays active (~15 s). */
    weaponDuration: 900,
    /** Frames a depower stays active (~10 s). */
    depowerDuration: 600,
    /** Extra cooldown (frames) added to fire rate while depowered. */
    depowerCooldownPenalty: 20,

    /**
     * Probability that a newly-spawned bonus is a monster-spawner
     * (instead of a normal item / power-up). Indexed by the player's level.
     */
    monsterSpawnerChanceByLevel: {
      lowMaxLevel: 2,
      lowLevels: 0.05,    // levels 1–2
      midMaxLevel: 5,
      midLevels: 0.15,    // levels 3–5
      highMaxLevel: 8,
      highLevels: 0.30,   // levels 6–8
      endgame: 0.40,      // levels 9+
    },

    /** Cap on simultaneously-active monster-spawners. */
    monsterSpawnerMaxByLevel: {
      lowMidMaxLevel: 5,
      lowMid: 1,  // levels 1–5
      high: 2,    // levels 6+
    },

    /** Weighted table for normal bonus items. */
    weights: {
      gold: 3,
      gem: 1,
      oneUpBase: 5,
      doubleBase: 1,
      tripleBase: 1,
      depower: 1,
    },

    /** Monster-spawner bonus types use equal weight. */
    monsterSpawnerTypes: ['SPAWN_SPIDER', 'SPAWN_SCORPION', 'SPAWN_CENTIPEDE'],
  },

  // Level progression rules
  levelScaling: {
    centipede: {
      /** Main centipede length never drops below this. */
      minMainLength: 8,
      /** Main length is reduced by 1 every N levels. */
      mainLengthReductionEveryLevels: 3,
      /** Maximum helper chains that can accompany later levels. */
      helperMaxChains: 3,
      /** Add one helper chain every N levels. */
      helperChainEveryLevels: 4,
      /** Starting length for helper chains. */
      helperLengthBase: 3,
      /** Maximum helper chain length. */
      helperLengthMax: 6,
      /** Increase helper chain length every N levels. */
      helperLengthIncreaseEveryLevels: 5,
      /** Helper chains enter within the first few rows. */
      helperStartMaxRow: 3,
      /** Spawned mini-centipedes use length in this inclusive range. */
      spawnedMinLength: 3,
      spawnedLengthRandom: 4,
      spawnedStartRows: 4,
    },
    bonusPowerups: {
      /** Maximum extra weight slots added to ONEUP/DOUBLE/TRIPLE. */
      maxExtraSlots: 3,
      /** Add one extra slot every N levels. */
      levelsPerExtraSlot: 3,
    },
  },

  // Scoring
  scoring: {
    centipedeHead: 100,
    centipedeBody: 10,
    spiderClose: 900,
    spiderMedium: 600,
    spiderFar: 300,
    flea: 200,
    scorpion: 1000,
    mushroom: 1,
    /** Bonus per restored mushroom on death. */
    mushroomRestore: 5,
    /** Score awarded for a bomb chain reaction. */
    bombExplosion: 500,
    /** Score threshold for an extra life. Awarded repeatedly. */
    extraLifeEvery: 12000,
  },

  // Attract mode (title / demo / high-scores rotation)
  attract: {
    titleFrames: 600,
    demoFrames: 1200,
    scoresFrames: 600,
    gameOverFrames: 600,
  },
} as const;
