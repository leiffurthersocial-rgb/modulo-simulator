import { GOALS, GOAL_BY_ID } from "@/data/goals";
import { countryOf, type Content } from "./content";
import { addLog } from "./log";
import type { Rng } from "./rng";
import { adjustKarma, adjustStat } from "./stats";
import type { GameState } from "./types";

/** Give the player new bucket-list goals they don't already have and haven't completed. */
export function assignGoals(state: GameState, rng: Rng, count: number): void {
  const taken = new Set(state.player.goals.map((g) => g.id));
  const pool = GOALS.filter((g) => !taken.has(g.id) && (g.assignFrom ?? 0) <= Math.max(state.player.age, 16));
  for (const g of rng.shuffle(pool).slice(0, count)) state.player.goals.push({ id: g.id, assignedAtAge: state.player.age });
}

/** Check goals after any change; completing one is a little celebration. */
export function evaluateGoals(state: GameState, content: Content): void {
  if (state.player.goals.length === 0) return;
  const ci = countryOf(content, state.player.countryId).costIndex;
  for (const goal of state.player.goals) {
    if (goal.completedAtAge !== undefined) continue;
    const def = GOAL_BY_ID[goal.id];
    if (def && def.check(state, ci)) {
      goal.completedAtAge = state.player.age;
      adjustStat(state.player, "happiness", 8);
      adjustKarma(state.player, 2);
      state.flags.goalsCompleted = Number(state.flags.goalsCompleted ?? 0) + 1;
      addLog(state, `Life goal complete: ${def.title}.`, "major");
    }
  }
}

/** New goals at milestones: 18 and 40. */
export function goalMilestones(state: GameState, rng: Rng): void {
  const age = state.player.age;
  if (age === 18 || age === 40) assignGoals(state, rng, 2);
}
