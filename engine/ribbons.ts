import { RIBBONS, type RibbonDef } from "@/data/ribbons";
import { countryOf, type Content } from "./content";
import type { GameState } from "./types";

export interface Ribbon {
  id: string;
  label: string;
  description: string;
  color: string;
}

function toRibbon(def: RibbonDef, state: GameState): Ribbon {
  return { id: def.id, label: typeof def.label === "function" ? def.label(state) : def.label, description: def.description, color: def.color };
}

/** The headline ribbon plus up to three more, for the death screen and life summary. */
export function lifeRibbons(state: GameState, content: Content): { primary: Ribbon; others: Ribbon[] } {
  const ci = countryOf(content, state.player.countryId).costIndex;
  const earned = RIBBONS.filter((r) => r.check(state, ci)).sort((a, b) => b.priority - a.priority);
  const primary = earned[0] ?? RIBBONS[RIBBONS.length - 1]!;
  return { primary: toRibbon(primary, state), others: earned.slice(1, 4).filter((r) => r.priority > 0).map((r) => toRibbon(r, state)) };
}
