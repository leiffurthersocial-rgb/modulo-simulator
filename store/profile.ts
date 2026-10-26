import { netWorth, type GameState } from "@/engine";

/** Cross-life progress kept on this device. */
export interface GraveEntry {
  name: string;
  age: number;
  cause: string;
  netWorth: number;
  countryId: string;
  year: number;
  achievements: number;
}

export interface Profile {
  lives: number;
  /** Achievement id -> number of lives it was earned in. */
  achievements: Record<string, number>;
  graveyard: GraveEntry[];
  bestNetWorth: number;
  oldestAge: number;
}

export const EMPTY_PROFILE: Profile = { lives: 0, achievements: {}, graveyard: [], bestNetWorth: 0, oldestAge: 0 };

/** Fold a finished life into the profile. */
export function recordDeath(profile: Profile, state: GameState): Profile {
  const worth = netWorth(state);
  const achievements = { ...profile.achievements };
  for (const id of state.achievements) achievements[id] = (achievements[id] ?? 0) + 1;
  const entry: GraveEntry = {
    name: `${state.player.firstName} ${state.player.lastName}`,
    age: state.player.age,
    cause: state.death?.text ?? "",
    netWorth: worth,
    countryId: state.player.countryId,
    year: state.year,
    achievements: state.achievements.length,
  };
  return {
    lives: profile.lives + 1,
    achievements,
    graveyard: [entry, ...profile.graveyard].slice(0, 50),
    bestNetWorth: Math.max(profile.bestNetWorth, worth),
    oldestAge: Math.max(profile.oldestAge, state.player.age),
  };
}
