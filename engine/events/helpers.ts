/**
 * Authoring helpers for content in /data/events. Keep event files terse:
 *
 *   defineEvents("childhood", [
 *     { id: "lost-tooth", ages: [5, 8], text: "You lost a tooth.", effects: [fx.happy(3)] },
 *   ]);
 */
import type {
  Amount,
  DeathCause,
  Dyn,
  Effect,
  EventCategory,
  EventContext,
  EventId,
  FlagValue,
  GameEvent,
  Gender,
  NpcRef,
  NpcRole,
  Predicate,
  SchoolLevel,
  SkillKey,
  StatKey,
  TextTemplate,
  Tone,
  WealthTier,
  AddictionKind,
} from "../types";
import { STAT_KEYS } from "../types";
import { clamp } from "../util";

export type EventDraft = Omit<GameEvent, "category"> & { category?: EventCategory };

/** Stamp a category onto a list of events. */
export function defineEvents(category: EventCategory, events: readonly EventDraft[]): GameEvent[] {
  return events.map((e) => ({ ...e, category: e.category ?? category }));
}

/**
 * Generate one event per item from a template, e.g. one "favorite subject" event per subject.
 * The factory must give each event a unique id.
 */
export function expand<T>(items: readonly T[], make: (item: T) => EventDraft): EventDraft[] {
  return items.map(make);
}

// ------------------------------------------------------------------ effects

export const fx = {
  stat: (stat: StatKey, amount: Amount): Effect => ({ kind: "stat", stat, amount }),
  happy: (amount: Amount): Effect => ({ kind: "stat", stat: "happiness", amount }),
  health: (amount: Amount): Effect => ({ kind: "stat", stat: "health", amount }),
  smarts: (amount: Amount): Effect => ({ kind: "stat", stat: "smarts", amount }),
  looks: (amount: Amount): Effect => ({ kind: "stat", stat: "looks", amount }),
  skill: (skill: SkillKey, amount: Amount): Effect => ({ kind: "skill", skill, amount }),
  cash: (amount: Amount): Effect => ({ kind: "cash", amount }),
  karma: (amount: Amount): Effect => ({ kind: "karma", amount }),
  fame: (amount: Amount): Effect => ({ kind: "fame", amount }),
  close: (amount: Amount, who: NpcRef = "bound"): Effect => ({ kind: "closeness", who, amount }),
  tag: (tag: string, who: NpcRef = "bound"): Effect => ({ kind: "npcTag", who, tag }),
  loseContact: (who: NpcRef = "bound"): Effect => ({ kind: "loseContact", who }),
  flag: (key: string, value: FlagValue = true): Effect => ({ kind: "setFlag", key, value }),
  inc: (key: string, by = 1): Effect => ({ kind: "incFlag", key, by }),
  schedule: (eventId: EventId, inYears: Amount, withNpc = false): Effect => ({ kind: "schedule", eventId, inYears, withNpc }),
  achieve: (id: string): Effect => ({ kind: "achievement", id }),
  addiction: (addiction: AddictionKind, amount: Amount): Effect => ({ kind: "addiction", addiction, amount }),
  die: (cause: DeathCause, text: TextTemplate): Effect => ({ kind: "die", cause, text }),
  log: (text: TextTemplate, tone?: Tone): Effect => ({ kind: "log", text, tone }),
  custom: (run: (ctx: EventContext) => void): Effect => ({ kind: "custom", run }),
};

// ------------------------------------------------------------------ odds

function valueOf(ctx: EventContext, key: StatKey | SkillKey): number {
  return (STAT_KEYS as readonly string[]).includes(key) ? ctx.player.stats[key as StatKey] : ctx.player.skills[key as SkillKey];
}

/** Probability (5%-95%) of passing a check against `difficulty` (0-100). Good karma helps a little. */
export function successChance(ctx: EventContext, key: StatKey | SkillKey, difficulty: number): number {
  return clamp(0.5 + (valueOf(ctx, key) - difficulty) / 60 + ctx.player.karma / 800, 0.05, 0.95);
}

/** Outcome weights for a stat/skill check: put `pass(...)` on the success outcome and `fail(...)` on the failure. */
export const pass =
  (key: StatKey | SkillKey, difficulty = 50): Dyn<number> =>
  (ctx) =>
    successChance(ctx, key, difficulty);
export const fail =
  (key: StatKey | SkillKey, difficulty = 50): Dyn<number> =>
  (ctx) =>
    1 - successChance(ctx, key, difficulty);

// ------------------------------------------------------------------ conditions

export const when = {
  all:
    (...preds: Predicate[]): Predicate =>
    (ctx) =>
      preds.every((p) => p(ctx)),
  any:
    (...preds: Predicate[]): Predicate =>
    (ctx) =>
      preds.some((p) => p(ctx)),
  not:
    (pred: Predicate): Predicate =>
    (ctx) =>
      !pred(ctx),
  inSchool:
    (...levels: SchoolLevel[]): Predicate =>
    ({ player }) =>
      player.education.enrolled !== undefined && (levels.length === 0 || levels.includes(player.education.enrolled.level)),
  graduated:
    (level: SchoolLevel): Predicate =>
    ({ player }) =>
      player.education.degrees.some((d) => d.level === level),
  employed: ((ctx) => ctx.player.career.job !== undefined) as Predicate,
  unemployed: ((ctx) => ctx.player.career.job === undefined) as Predicate,
  livesWithParents: ((ctx) => ctx.player.livesWithParents) as Predicate,
  flag:
    (key: string, value: FlagValue = true): Predicate =>
    ({ state }) =>
      state.flags[key] === value,
  hasFlag:
    (key: string): Predicate =>
    ({ state }) =>
      state.flags[key] !== undefined,
  noFlag:
    (key: string): Predicate =>
    ({ state }) =>
      state.flags[key] === undefined,
  statAtLeast:
    (key: StatKey | SkillKey, n: number): Predicate =>
    (ctx) =>
      valueOf(ctx, key) >= n,
  statBelow:
    (key: StatKey | SkillKey, n: number): Predicate =>
    (ctx) =>
      valueOf(ctx, key) < n,
  hasLiving:
    (...roles: NpcRole[]): Predicate =>
    ({ state }) =>
      Object.values(state.npcs).some((n) => n.alive && n.inContact && roles.includes(n.role)),
  gender:
    (...genders: Gender[]): Predicate =>
    ({ player }) =>
      genders.includes(player.gender),
  wealth:
    (...tiers: WealthTier[]): Predicate =>
    ({ player }) =>
      tiers.includes(player.familyWealth),
  countryTag:
    (tag: string): Predicate =>
    ({ country }) =>
      country.tags.includes(tag),
  karmaAtLeast:
    (n: number): Predicate =>
    ({ player }) =>
      player.karma >= n,
  cashAtLeast:
    (usd: number): Predicate =>
    ({ player, country }) =>
      player.finance.cash >= usd * country.costIndex,
};
