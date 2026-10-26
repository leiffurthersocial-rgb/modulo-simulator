import { unlockAchievement } from "../achievements";
import { killPlayer } from "../lifecycle/death";
import { addLog } from "../log";
import { resolveNpcRef } from "../npc";
import { adjustKarma, adjustSkill, adjustStat } from "../stats";
import type { Effect, Effects, EventContext } from "../types";
import { clamp, rollAmount } from "../util";
import { renderText } from "./template";

export function resolveEffects(effects: Effects | undefined, ctx: EventContext): readonly Effect[] {
  if (!effects) return [];
  return typeof effects === "function" ? effects(ctx) : effects;
}

export function applyEffect(effect: Effect, ctx: EventContext): void {
  const { state, player, rng } = ctx;
  if (state.status !== "alive") return;
  switch (effect.kind) {
    case "stat":
      adjustStat(player, effect.stat, rollAmount(rng, effect.amount));
      return;
    case "skill":
      adjustSkill(player, effect.skill, rollAmount(rng, effect.amount));
      return;
    case "cash": {
      // Authored in US-baseline money; scaled to the player's country.
      const value = Math.round(rollAmount(rng, effect.amount) * ctx.country.costIndex);
      player.finance.cash += value;
      ctx.vars.amount = value;
      return;
    }
    case "karma":
      adjustKarma(player, rollAmount(rng, effect.amount));
      return;
    case "fame":
      player.fame = clamp(Math.round(player.fame + rollAmount(rng, effect.amount)));
      return;
    case "closeness": {
      const npc = resolveNpcRef(state, effect.who, ctx.npc);
      if (npc) npc.closeness = clamp(Math.round(npc.closeness + rollAmount(rng, effect.amount)));
      return;
    }
    case "npcTag": {
      const npc = resolveNpcRef(state, effect.who, ctx.npc);
      if (npc && !npc.tags.includes(effect.tag)) npc.tags.push(effect.tag);
      return;
    }
    case "loseContact": {
      const npc = resolveNpcRef(state, effect.who, ctx.npc);
      if (npc) npc.inContact = false;
      return;
    }
    case "setFlag":
      state.flags[effect.key] = effect.value;
      return;
    case "incFlag": {
      const cur = state.flags[effect.key];
      state.flags[effect.key] = (typeof cur === "number" ? cur : 0) + (effect.by ?? 1);
      return;
    }
    case "schedule":
      state.scheduled.push({
        eventId: effect.eventId,
        atAge: player.age + Math.max(1, Math.round(rollAmount(rng, effect.inYears))),
        npcId: effect.withNpc ? ctx.npc?.id : undefined,
        vars: { ...ctx.vars },
      });
      return;
    case "achievement":
      unlockAchievement(state, effect.id);
      return;
    case "addiction": {
      const cur = player.health.addictions[effect.addiction] ?? 0;
      player.health.addictions[effect.addiction] = clamp(Math.round(cur + rollAmount(rng, effect.amount)));
      return;
    }
    case "die":
      killPlayer(state, effect.cause, renderText(effect.text, ctx));
      return;
    case "log":
      addLog(state, renderText(effect.text, ctx), effect.tone ?? "neutral");
      return;
    case "custom":
      effect.run(ctx);
      return;
  }
}

export function applyEffects(effects: Effects | undefined, ctx: EventContext): void {
  for (const effect of resolveEffects(effects, ctx)) applyEffect(effect, ctx);
}
