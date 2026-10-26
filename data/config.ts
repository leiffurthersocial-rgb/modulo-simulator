import type { Difficulty, NpcRole } from "@/engine/types";

/** Global tunables. Everything balance-related that is not per-event lives here. */
export const GAME_CONFIG = {
  /** Bump when GameState's shape changes and add a migration in engine/save.ts. */
  saveVersion: 1,

  /** Weights for how many random events fire in a year (index = count). */
  eventsPerYear: [30, 42, 21, 7] as readonly number[],
  /** Babies and toddlers get quieter years. */
  eventsPerYearInfant: [60, 35, 5, 0] as readonly number[],

  /** "What if?" rewinds per life in casual mode. */
  casualRewinds: 3,

  defaultDifficulty: { mortality: 1, eventRate: 1, economy: 1 } satisfies Difficulty,

  mortality: {
    /** Gompertz hazard: a * e^(b * age). Tuned against real-world life tables. */
    gompertzA: 0.000045,
    gompertzB: 0.09,
    /** Flat yearly risk of accidents and bad luck at any age. */
    background: 0.0004,
    /** Extra risk in the first year of life. */
    infant: 0.004,
    /** Hard cap so even the healthiest person eventually goes. */
    maxAge: 122,
  },

  friendCameos: {
    /** Chance, per life, that a given friend is destined to appear (before their rarity multiplier). */
    baseChancePerLife: 0.04,
    /** Earliest player age a cameo can happen (no newborn classmates). */
    minAge: 5,
    /** Latest player age the "destined" moment can be scheduled for. */
    maxDestinyAge: 45,
    /** When a destined friend could fill a new NPC slot, chance they take it (spreads cameos out). */
    takeSlotChance: 0.5,
    /** Default age relative to the player (peer roles). */
    defaultAgeOffset: [-1, 1] as readonly [number, number],
    /** Age relative to the player for roles where a peer would make no sense. Wins over a friend's ageOffset. */
    roleAgeOffsets: {
      teacher: [18, 35],
      boss: [6, 20],
      therapist: [8, 30],
      lawyer: [5, 25],
      employee: [-15, -2],
    } as Readonly<Partial<Record<NpcRole, readonly [number, number]>>>,
  },
} as const;
