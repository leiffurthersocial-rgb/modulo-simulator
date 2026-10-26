import type { Content } from "./content";
import { resolvePending } from "./events/run";
import { forceCameo } from "./cameos";
import { addLog } from "./log";
import { postProcess } from "./postProcess";
import { ROLE_LABELS } from "./selectors";
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

/** Debug: spawn a friend cameo into the current life right now. Pure. */
export function debugForceCameo(prev: GameState, content: Content, friendId: string): GameState {
  const state = structuredClone(prev);
  const rng = new Rng(state.rngState);
  const npc = forceCameo(state, rng, content, friendId);
  if (!npc) return prev;
  addLog(state, `${npc.firstName} entered your life as your ${ROLE_LABELS[npc.role].toLowerCase()}.`, "good");
  state.rngState = rng.state;
  return state;
}
