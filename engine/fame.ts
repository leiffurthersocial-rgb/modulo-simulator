import { addLog } from "./log";
import type { Rng } from "./rng";
import type { GameState } from "./types";
import { clamp } from "./util";

/** Fame implied by a follower count (log scale: 1k ~ 10, 100k ~ 40, 10M ~ 80). */
export function fameFromFollowers(followers: number): number {
  if (followers < 100) return 0;
  return clamp(Math.round((Math.log10(followers) - 2) * 15 + 10 * (followers >= 1000 ? 1 : 0)));
}

/** Yearly fame tick: followers drift, fame fades without fuel. */
export function runFameYear(state: GameState, rng: Rng): void {
  const p = state.player;
  if (p.followers > 0) {
    const active = state.flags.postedAt === p.age - 1;
    const change = active ? rng.float(-0.02, 0.08) : rng.float(-0.12, 0.02);
    p.followers = Math.max(0, Math.round(p.followers * (1 + change)));
  }
  const floor = fameFromFollowers(p.followers);
  if (p.fame > floor) p.fame = clamp(Math.round(p.fame - rng.int(0, 2)));
  if (p.fame < floor) p.fame = floor;
  if (p.fame >= 60 && !state.flags.becameFamous) {
    state.flags.becameFamous = p.age;
    addLog(state, "You're officially famous. Strangers recognize you at the grocery store.", "major");
  }
}
