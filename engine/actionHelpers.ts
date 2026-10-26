/**
 * Authoring helpers for actions in /data/actions.
 */
import { applyEffects } from "./events/effects";
import { fireEvent } from "./events/run";
import { successChance } from "./events/helpers";
import type { ActionSection, Effects, EventContext, GameAction, SkillKey, StatKey } from "./types";

export function defineActions(section: ActionSection, actions: readonly (Omit<GameAction, "section"> & { section?: ActionSection })[]): GameAction[] {
  return actions.map((a) => ({ ...a, section: a.section ?? section }));
}

/** Apply a list of effects from inside an action's run(). */
export function apply(ctx: EventContext, effects: Effects): void {
  applyEffects(effects, ctx);
}

/** Roll a stat/skill check (same odds as events' pass/fail). */
export function roll(ctx: EventContext, key: StatKey | SkillKey, difficulty: number): boolean {
  return ctx.rng.chance(successChance(ctx, key, difficulty));
}

/** Fire an event (usually triggeredOnly) right now, e.g. a police chase after a crime. Keeps ctx.npc if set. */
export function trigger(ctx: EventContext, eventId: string, npcId?: string): void {
  const event = ctx.content.events.get(eventId);
  if (event) fireEvent(ctx.state, ctx.rng, ctx.content, event, { npcId: npcId ?? ctx.npc?.id, vars: ctx.vars, front: true });
}

/** Pay a US-baseline price in local terms. Returns false (and charges nothing) if you can't afford it. */
export function pay(ctx: EventContext, usd: number): boolean {
  const cost = Math.round(usd * ctx.country.costIndex);
  if (ctx.player.finance.cash < cost) return false;
  ctx.player.finance.cash -= cost;
  ctx.vars.amount = cost;
  return true;
}

export function canAfford(ctx: EventContext, usd: number): boolean {
  return ctx.player.finance.cash >= usd * ctx.country.costIndex;
}
