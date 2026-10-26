import type { EventContext, GameEvent } from "../types";

export function weightOf(event: GameEvent, ctx: EventContext): number {
  const w = event.weight;
  if (w === undefined) return 1;
  return typeof w === "function" ? w(ctx) : w;
}

/** Whether an event may fire right now from the random pool (ignores NPC binding, checked at fire time). */
export function isEligible(event: GameEvent, ctx: EventContext): boolean {
  if (event.triggeredOnly) return false;
  const { player, state } = ctx;
  if (player.age < event.ages[0] || player.age > event.ages[1]) return false;
  const where = event.where ?? "free";
  const inPrison = player.crime.prison !== undefined;
  if (where === "free" && inPrison) return false;
  if (where === "prison" && !inPrison) return false;
  const history = state.fired[event.id];
  if (history && history.length > 0) {
    if (event.once) return false;
    const last = history[history.length - 1] ?? -Infinity;
    if (event.cooldown !== undefined && player.age - last < event.cooldown) return false;
    // Never the same random event twice in one year.
    if (last === player.age) return false;
  }
  if (event.condition && !event.condition(ctx)) return false;
  return true;
}
