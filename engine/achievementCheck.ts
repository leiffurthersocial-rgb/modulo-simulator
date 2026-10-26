import { ACHIEVEMENTS, ACHIEVEMENT_BY_ID } from "@/data/achievements";
import { unlockAchievement } from "./achievements";
import { countryOf, type Content } from "./content";
import { addLog } from "./log";
import type { GameState } from "./types";

/** Unlock any achievements whose condition is now true, and announce new ones in the log. */
export function evaluateAchievements(state: GameState, content: Content): void {
  const ci = countryOf(content, state.player.countryId).costIndex;
  const before = new Set(state.achievements);
  for (const a of ACHIEVEMENTS) {
    if (a.check && !before.has(a.id) && a.check(state, ci)) unlockAchievement(state, a.id);
  }
  for (const id of state.achievements) {
    if (before.has(id) || state.flags[`ach:${id}`]) continue;
    state.flags[`ach:${id}`] = true;
    const def = ACHIEVEMENT_BY_ID[id];
    if (def) addLog(state, `🏆 Achievement unlocked: ${def.name}`, "good");
  }
}
