import { PRISON_NAMES } from "@/data/crimes";
import { leaveJob } from "./career";
import { addLog } from "./log";
import type { Rng } from "./rng";
import { adjustStat } from "./stats";
import type { GameState } from "./types";
import { clamp } from "./util";

/** Convict and imprison. Ends your job and school, starts the clock. */
export function sendToPrison(state: GameState, rng: Rng, crime: string, years: number): void {
  const { player } = state;
  player.crime.record.push({ crime, age: player.age, convicted: true, sentenceYears: years });
  if (years <= 0) return;
  if (player.career.job) leaveJob(state, "jailed");
  if (player.education.enrolled) {
    player.education.droppedOut.push(player.education.enrolled.level);
    player.education.enrolled = undefined;
  }
  player.sideHustles = [];
  player.crime.prison = {
    facility: rng.pick(PRISON_NAMES),
    yearsLeft: years,
    totalYears: years,
    respect: rng.int(5, 25),
    paroleEligibleAtAge: player.age + Math.max(1, Math.ceil(years * 0.5)),
  };
  state.flags.everJailed = true;
  adjustStat(player, "happiness", -15);
}

/** Record an arrest that didn't lead to conviction. */
export function recordArrest(state: GameState, crime: string): void {
  state.player.crime.record.push({ crime, age: state.player.age, convicted: false, sentenceYears: 0 });
}

export function release(state: GameState, how: "served" | "parole" | "escaped" | "appeal"): void {
  const prison = state.player.crime.prison;
  if (!prison) return;
  state.player.crime.prison = undefined;
  const text =
    how === "served"
      ? `You were released from ${prison.facility} after serving ${prison.totalYears} years.`
      : how === "parole"
        ? `You were granted parole and walked out of ${prison.facility}.`
        : how === "appeal"
          ? `Your conviction was overturned on appeal. You walked out of ${prison.facility} a free person.`
          : `You escaped from ${prison.facility}.`;
  addLog(state, text, "major");
  if (how === "escaped") {
    state.flags.fugitive = true;
    state.player.crime.notoriety = clamp(state.player.crime.notoriety + 20);
  }
}

/** Yearly crime tick: serve time, notoriety fades. */
export function runCrimeYear(state: GameState): void {
  const { player } = state;
  player.crime.notoriety = clamp(player.crime.notoriety - 2);
  const prison = player.crime.prison;
  if (!prison) return;
  prison.yearsLeft--;
  if (prison.yearsLeft <= 0) release(state, "served");
}
