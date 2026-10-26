import type { Content } from "../content";
import { addLog } from "../log";
import { activeNpcs, attractedGender } from "../npc";
import { spawnNpc } from "../spawn";
import type { Rng } from "../rng";
import type { EventContext, GameEvent, GameState, Npc, NpcBinding, NpcId, TemplateVars } from "../types";
import { rollAmount } from "../util";
import { makeContext } from "./context";
import { applyEffects } from "./effects";
import { renderText } from "./template";

function bindNpc(binding: NpcBinding, ctx: EventContext, content: Content): Npc | undefined {
  const { state, rng, player, country } = ctx;
  if (binding.kind === "existing") {
    const candidates = activeNpcs(state, binding.roles).filter((n) => !binding.filter || binding.filter(n, ctx));
    return candidates.length > 0 ? rng.pick(candidates) : undefined;
  }
  const closeness = Math.round(rollAmount(rng, binding.closeness ?? 50));
  const gender = binding.gender === "attracted" ? attractedGender(rng, player.attraction) : binding.gender;
  const [lo, hi] = binding.age ?? (binding.ageOffset ?? [0, 0]).map((o) => player.age + o);
  return spawnNpc(state, rng, content, country, {
    role: binding.role,
    age: rng.int(lo ?? 0, hi ?? 0),
    gender,
    closeness,
    keep: binding.keep,
    allowCameo: binding.allowCameo,
  });
}

export interface FireOptions {
  /** Bind this NPC instead of using the event's binding rule (used by chains and schedules). */
  npcId?: NpcId;
  vars?: TemplateVars;
  /** Put a resulting popup at the front of the queue (chains continue immediately). */
  front?: boolean;
}

/**
 * Fire an event: bind its NPC, apply its effects, then either log its text or queue a choice popup.
 * Returns false if it could not fire (e.g. no NPC matched the binding).
 */
export function fireEvent(
  state: GameState,
  rng: Rng,
  content: Content,
  event: GameEvent,
  opts: FireOptions = {},
): boolean {
  const ctx = makeContext(state, rng, content, undefined, { ...opts.vars });
  if (opts.npcId) {
    const npc = state.npcs[opts.npcId];
    if (!npc || !npc.alive) return false;
    ctx.npc = npc;
  } else if (event.npc) {
    ctx.npc = bindNpc(event.npc, ctx, content);
    if (!ctx.npc) return false;
  }

  (state.fired[event.id] ??= []).push(state.player.age);
  applyEffects(event.effects, ctx);
  if (state.status !== "alive") return true;

  const text = renderText(event.text, ctx);
  const choices = (event.choices ?? [])
    .map((c, i) => ({ c, id: c.id ?? String(i) }))
    .filter(({ c }) => !c.condition || c.condition(ctx));

  if (choices.length === 0) {
    addLog(state, text, event.tone ?? "neutral");
    return true;
  }

  const pending = {
    uid: rng.id("p_"),
    eventId: event.id,
    title: event.title ? renderText(event.title, ctx) : undefined,
    text,
    choices: choices.map(({ c, id }) => ({ id, label: renderText(c.label, ctx) })),
    npcId: ctx.npc?.id,
    vars: ctx.vars,
  };
  if (opts.front) state.pending.unshift(pending);
  else state.pending.push(pending);
  return true;
}

/** Apply the player's answer to a queued popup. Mutates state. */
export function resolvePending(
  state: GameState,
  rng: Rng,
  content: Content,
  uid: string,
  choiceId: string,
): void {
  const index = state.pending.findIndex((p) => p.uid === uid);
  const pending = state.pending[index];
  if (!pending) throw new Error(`No pending event "${uid}"`);
  const event = content.events.get(pending.eventId);
  if (!event?.choices) throw new Error(`Event "${pending.eventId}" has no choices`);
  const choice = event.choices.find((c, i) => (c.id ?? String(i)) === choiceId);
  if (!choice || !pending.choices.some((c) => c.id === choiceId)) {
    throw new Error(`Choice "${choiceId}" is not available for "${pending.eventId}"`);
  }

  state.pending.splice(index, 1);
  const npc = pending.npcId ? state.npcs[pending.npcId] : undefined;
  const ctx = makeContext(state, rng, content, npc, { ...pending.vars });
  const outcome = rng.weighted(
    choice.outcomes.map((o) => ({
      value: o,
      weight: o.weight === undefined ? 1 : typeof o.weight === "function" ? o.weight(ctx) : o.weight,
    })),
  );
  if (!outcome) return;

  applyEffects(outcome.effects, ctx);
  if (state.status !== "alive") {
    state.pending = [];
    return;
  }
  if (outcome.text) addLog(state, renderText(outcome.text, ctx), outcome.tone ?? "neutral");
  if (outcome.next) {
    const next = content.events.get(outcome.next);
    if (next) fireEvent(state, rng, content, next, { npcId: npc?.id, vars: ctx.vars, front: true });
  }
}
