import type { Effect, EventId, GameEvent } from "../types";

const MAX_AGE = 130;

function staticEffects(effects: GameEvent["effects"]): readonly Effect[] {
  return Array.isArray(effects) ? effects : [];
}

/** Returns a list of human-readable problems; empty means valid. */
export function validateEvents(events: readonly GameEvent[]): string[] {
  const problems: string[] = [];
  const ids = new Set<EventId>();
  for (const e of events) {
    if (ids.has(e.id)) problems.push(`Duplicate event id "${e.id}"`);
    ids.add(e.id);
  }
  const checkRef = (from: string, to: EventId) => {
    if (!ids.has(to)) problems.push(`${from} references unknown event "${to}"`);
  };
  for (const e of events) {
    const [lo, hi] = e.ages;
    if (lo < 0 || hi > MAX_AGE || lo > hi) problems.push(`Event "${e.id}" has invalid ages [${lo}, ${hi}]`);
    if (typeof e.weight === "number" && e.weight < 0) problems.push(`Event "${e.id}" has negative weight`);
    if (e.choices) {
      if (e.choices.length < 2 || e.choices.length > 4) {
        problems.push(`Event "${e.id}" must have 2-4 choices (has ${e.choices.length})`);
      }
      const choiceIds = new Set<string>();
      e.choices.forEach((c, i) => {
        const cid = c.id ?? String(i);
        if (choiceIds.has(cid)) problems.push(`Event "${e.id}" has duplicate choice id "${cid}"`);
        choiceIds.add(cid);
        if (c.outcomes.length === 0) problems.push(`Event "${e.id}" choice "${cid}" has no outcomes`);
        for (const o of c.outcomes) {
          if (o.next) checkRef(`Event "${e.id}"`, o.next);
          for (const fx of staticEffects(o.effects)) if (fx.kind === "schedule") checkRef(`Event "${e.id}"`, fx.eventId);
        }
      });
    }
    for (const fx of staticEffects(e.effects)) if (fx.kind === "schedule") checkRef(`Event "${e.id}"`, fx.eventId);
  }
  return problems;
}

/** Indexed, validated event collection. Random-pool events are pre-bucketed by age for fast selection. */
export class EventRegistry {
  readonly all: readonly GameEvent[];
  private readonly byId = new Map<EventId, GameEvent>();
  private readonly byAge: GameEvent[][] = [];

  constructor(events: readonly GameEvent[]) {
    const problems = validateEvents(events);
    if (problems.length > 0) throw new Error(`Invalid events:\n- ${problems.join("\n- ")}`);
    this.all = events;
    for (const e of events) {
      this.byId.set(e.id, e);
      if (e.triggeredOnly) continue;
      for (let age = e.ages[0]; age <= Math.min(e.ages[1], MAX_AGE); age++) {
        (this.byAge[age] ??= []).push(e);
      }
    }
  }

  get(id: EventId): GameEvent | undefined {
    return this.byId.get(id);
  }

  /** Random-pool events whose age range includes `age`. */
  forAge(age: number): readonly GameEvent[] {
    return this.byAge[age] ?? [];
  }
}
