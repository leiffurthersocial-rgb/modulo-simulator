import { GAME_CONFIG } from "@/data/config";
import { countryOf, type Content } from "../content";
import { makeContext } from "../events/context";
import { fireEvent } from "../events/run";
import { isEligible, weightOf } from "../events/select";
import { runEducationYear } from "../education";
import { runFinanceYear } from "../finance";
import { startLogYear } from "../log";
import { Rng } from "../rng";
import type { GameState } from "../types";
import { rollMortality } from "./death";
import { runCareerYear, runNpcYear, runPlayerDrift, runPrisonYear } from "./yearly";

export function canAgeUp(state: GameState): boolean {
  return state.status === "alive" && state.pending.length === 0;
}

function rollEventCount(state: GameState, rng: Rng): number {
  const weights = state.player.age < 3 ? GAME_CONFIG.eventsPerYearInfant : GAME_CONFIG.eventsPerYear;
  const rate = state.difficulty.eventRate;
  return rng.weighted(weights.map((w, count) => ({ value: count, weight: count === 0 ? w : w * rate }))) ?? 0;
}

/** Fire scheduled events that are due, then a random handful from the pool. */
function runEvents(state: GameState, rng: Rng, content: Content): void {
  const age = state.player.age;
  const due = state.scheduled.filter((s) => s.atAge <= age);
  state.scheduled = state.scheduled.filter((s) => s.atAge > age);
  for (const s of due) {
    const event = content.events.get(s.eventId);
    if (event && state.status === "alive") fireEvent(state, rng, content, event, { npcId: s.npcId, vars: s.vars });
  }

  const count = rollEventCount(state, rng);
  if (count === 0 || state.status !== "alive") return;
  const ctx = makeContext(state, rng, content);
  const pool = content.events
    .forAge(age)
    .filter((e) => isEligible(e, ctx))
    .map((e) => ({ value: e, weight: weightOf(e, ctx) }));
  for (const event of rng.weightedMany(pool, count)) {
    if (state.status !== "alive") break;
    fireEvent(state, rng, content, event);
  }
}

/**
 * Advance the life by one year. Pure: returns a new state and never mutates `prev`.
 * Order: birthday -> NPCs -> stat drift -> school -> work -> money -> prison -> mortality -> events.
 */
export function ageUp(prev: GameState, content: Content): GameState {
  if (!canAgeUp(prev)) return prev;
  const state = structuredClone(prev);
  const rng = new Rng(state.rngState);
  const country = countryOf(content, state.player.countryId);

  state.player.age++;
  state.year++;
  startLogYear(state);

  runNpcYear(state, rng, country);
  runPlayerDrift(state, rng);
  runEducationYear(state, rng);
  runCareerYear(state, rng);
  runFinanceYear(state, country);
  runPrisonYear(state);

  if (!rollMortality(state, rng, country)) runEvents(state, rng, content);

  state.rngState = rng.state;
  return state;
}
