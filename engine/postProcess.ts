import type { Content } from "./content";
import { evaluateGoals } from "./goals";
import type { Rng } from "./rng";
import type { GameState } from "./types";

/**
 * Runs after every state change (age up, choice, action): bookkeeping that should
 * react to anything that happened. Systems register here as they are added.
 */
export function postProcess(state: GameState, _rng: Rng, content: Content): void {
  evaluateGoals(state, content);
  const job = state.player.career.job;
  if (job) {
    const def = content.careers.find((c) => c.id === job.careerId);
    if (def && job.rank === def.ranks.length - 1 && def.ranks.length > 1) state.flags.topOfCareer = true;
  }
}
