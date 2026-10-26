import { countryOf, type Content } from "../content";
import type { Rng } from "../rng";
import type { EventContext, GameState, Npc, TemplateVars } from "../types";

export function makeContext(
  state: GameState,
  rng: Rng,
  content: Content,
  npc?: Npc,
  vars: TemplateVars = {},
): EventContext {
  return { state, player: state.player, country: countryOf(content, state.player.countryId), rng, content, npc, vars };
}
