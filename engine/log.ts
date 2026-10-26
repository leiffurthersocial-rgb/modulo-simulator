import type { GameState, LogYear, Tone } from "./types";

/** Open a new log section for the player's current age. */
export function startLogYear(state: GameState): LogYear {
  const entry: LogYear = { age: state.player.age, year: state.year, entries: [] };
  state.log.push(entry);
  return entry;
}

export function addLog(state: GameState, text: string, tone: Tone = "neutral"): void {
  const current = state.log[state.log.length - 1] ?? startLogYear(state);
  current.entries.push({ text, tone });
}
