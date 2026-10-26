import type { GameState } from "./types";

/** Unlock an achievement for this life. Returns true if it was newly unlocked. */
export function unlockAchievement(state: GameState, id: string): boolean {
  if (state.achievements.includes(id)) return false;
  state.achievements.push(id);
  return true;
}
