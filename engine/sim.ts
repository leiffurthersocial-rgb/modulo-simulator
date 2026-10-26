import type { Content } from "./content";
import { choose } from "./game";
import { ageUp } from "./lifecycle/ageUp";
import { newLife, type NewLifeOptions } from "./lifecycle/newLife";
import { Rng } from "./rng";
import type { GameState } from "./types";

/**
 * Headless auto-play: ages a life to death, answering every popup at random.
 * Used by tests and balancing runs. `pickRng` is separate from the game RNG so
 * the life itself stays reproducible from its seed.
 */
export function simulateLife(content: Content, options: NewLifeOptions, pickSeed = "auto"): GameState {
  const pickRng = Rng.fromSeed(pickSeed + (options.seed ?? ""));
  let state = newLife(content, options);
  let guard = 0;
  while (state.status === "alive" && guard++ < 1000) {
    const pending = state.pending[0];
    if (pending) {
      const choice = pickRng.pick(pending.choices);
      state = choose(state, content, pending.uid, choice.id);
    } else {
      state = ageUp(state, content);
    }
  }
  return state;
}
