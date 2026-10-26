import { GAME_CONFIG } from "@/data/config";
import { DEATH_TEXTS } from "@/data/deaths";
import { addLog } from "../log";
import type { Rng } from "../rng";
import type { Country, DeathCause, Difficulty, GameState, Player } from "../types";

/** Probability of dying during the year the player turns `age`. */
export function yearlyDeathChance(age: number, health: number, country: Country, difficulty: Difficulty): number {
  const m = GAME_CONFIG.mortality;
  if (age >= m.maxAge) return 1;
  let hazard = m.background + m.gompertzA * Math.exp(m.gompertzB * age);
  if (age === 0) hazard += m.infant;
  // Health 100 -> 0.5x, 70 -> 0.75x, 50 -> ~1.2x, 30 -> ~1.9x, 0 -> ~3.3x.
  const healthFactor = 0.5 + ((100 - health) / 60) ** 2;
  return Math.min(1, hazard * healthFactor * country.mortalityFactor * difficulty.mortality);
}

export function pickDeathCause(rng: Rng, player: Player): DeathCause {
  const age = player.age;
  const old = age >= 70;
  const mid = age >= 40 && age < 70;
  const young = age < 40;
  return (
    rng.weighted<DeathCause>([
      { value: "oldAge", weight: age >= 80 ? 50 : old ? 15 : 0 },
      { value: "heartDisease", weight: old ? 20 : mid ? 25 : 2 },
      { value: "cancer", weight: old ? 15 : mid ? 25 : 4 },
      { value: "stroke", weight: old ? 10 : mid ? 8 : 1 },
      { value: "illness", weight: age < 2 ? 40 : old ? 10 : 8 },
      { value: "complications", weight: age < 2 ? 40 : 2 },
      { value: "accident", weight: young ? 20 : 8 },
      { value: "carCrash", weight: young && age >= 16 ? 20 : mid ? 6 : 1 },
      { value: "drowning", weight: young && age >= 3 ? 5 : 1 },
      { value: "misadventure", weight: young && age >= 10 ? 4 : 1 },
      { value: "animal", weight: age >= 5 ? 1 : 0 },
      { value: "murdered", weight: age >= 14 ? 2 : 0 },
    ]) ?? "illness"
  );
}

export function deathText(rng: Rng, cause: DeathCause, age: number): string {
  return rng.pick(DEATH_TEXTS[cause]).replace("{age}", String(age));
}

/** End the life. Idempotent. */
export function killPlayer(state: GameState, cause: DeathCause, text: string): void {
  if (state.status === "dead") return;
  state.status = "dead";
  state.death = { age: state.player.age, year: state.year, cause, text };
  state.pending = [];
  state.scheduled = [];
  const job = state.player.career.job;
  if (job) {
    state.player.career.history.push({
      careerId: job.careerId,
      title: job.title,
      employer: job.employer,
      startAge: state.player.age - job.yearsAtCompany,
      endAge: state.player.age,
      reason: "died",
    });
    state.player.career.job = undefined;
  }
  addLog(state, text, "major");
}

/** Roll this year's natural mortality. Returns true if the player died. */
export function rollMortality(state: GameState, rng: Rng, country: Country): boolean {
  const { player } = state;
  const p = player.stats.health <= 0 ? 1 : yearlyDeathChance(player.age, player.stats.health, country, state.difficulty);
  if (!rng.chance(p)) return false;
  const cause = pickDeathCause(rng, player);
  killPlayer(state, cause, deathText(rng, cause, player.age));
  return true;
}
