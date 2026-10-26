import type { Content } from "./content";
import { resolvePending } from "./events/run";
import { postProcess } from "./postProcess";
import { Rng } from "./rng";
import type { GameState } from "./types";

/** Answer a popup. Pure: returns a new state. */
export function choose(prev: GameState, content: Content, pendingUid: string, choiceId: string): GameState {
  const state = structuredClone(prev);
  const rng = new Rng(state.rngState);
  resolvePending(state, rng, content, pendingUid, choiceId);
  postProcess(state, rng, content);
  state.rngState = rng.state;
  return state;
}
