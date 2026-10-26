import { GENERIC_LINES, TRAIT_LINES } from "@/data/dialogue";
import type { Content } from "./content";
import { fillPlaceholders } from "./events/template";
import type { DialogueSituation, EventContext, Npc } from "./types";

/**
 * What an NPC says in a situation. Priority:
 *   1. A friend cameo's custom lines for the situation (then their "any" lines)
 *   2. Lines from the NPC's personality traits for the situation (then "any")
 *   3. Generic lines
 * So filling in a friend's `traits` or `dialogue` in /data/friends.ts changes this automatically.
 */
export function npcLine(ctx: EventContext, npc: Npc, situation: DialogueSituation, content: Content = ctx.content): string | undefined {
  const friend = npc.friendId ? content.friends.find((f) => f.id === npc.friendId) : undefined;
  const pools: (readonly string[] | undefined)[] = [];
  if (friend) pools.push(friend.dialogue[situation], friend.dialogue.any);
  const traitSpecific = npc.traits.flatMap((t) => TRAIT_LINES[t]?.[situation] ?? []);
  const traitAny = npc.traits.flatMap((t) => TRAIT_LINES[t]?.any ?? []);
  pools.push(traitSpecific, GENERIC_LINES[situation], traitAny);
  for (const pool of pools) {
    if (pool && pool.length > 0) return fillPlaceholders(ctx.rng.pick(pool), ctx);
  }
  return undefined;
}

/** `{name}: "line"` or just the fallback text when the NPC has nothing to say. */
export function quote(ctx: EventContext, npc: Npc, situation: DialogueSituation): string {
  const line = npcLine(ctx, npc, situation);
  return line ? ` ${npc.firstName}: "${line}"` : "";
}
