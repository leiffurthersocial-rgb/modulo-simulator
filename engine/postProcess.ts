import type { Content } from "./content";
import type { Rng } from "./rng";
import type { GameState } from "./types";

/**
 * Runs after every state change (age up, choice, action): bookkeeping that should
 * react to anything that happened. Systems register here as they are added.
 */
export function postProcess(_state: GameState, _rng: Rng, _content: Content): void {}
