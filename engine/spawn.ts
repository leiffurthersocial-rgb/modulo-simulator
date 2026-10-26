import { claimCameoSlot, spawnFriendNpc } from "./cameos";
import type { Content } from "./content";
import { createNpc } from "./npc";
import type { Rng } from "./rng";
import type { Country, GameState, Gender, Npc, NpcRole } from "./types";

export interface SpawnSpec {
  role: NpcRole;
  age: number;
  gender?: Gender;
  closeness: number;
  /** Joins the relationship list (default true). */
  keep?: boolean;
  /** May be filled by a destined friend cameo (default true). */
  allowCameo?: boolean;
  occupation?: string;
}

/** The single entry point for "a new person enters your life". Friend cameos hook in here. */
export function spawnNpc(state: GameState, rng: Rng, content: Content, country: Country, spec: SpawnSpec): Npc {
  const keep = spec.keep ?? true;
  if (keep && (spec.allowCameo ?? true) && (spec.gender === undefined || spec.gender === "male")) {
    const friend = claimCameoSlot(state, rng, content, spec.role);
    if (friend) {
      const npc = spawnFriendNpc(state, rng, country, friend, spec.role, spec.closeness);
      if (spec.occupation) npc.occupation = spec.occupation;
      return npc;
    }
  }
  return createNpc(state, rng, country, {
    role: spec.role,
    age: spec.age,
    gender: spec.gender,
    closeness: spec.closeness,
    inContact: keep,
    tags: keep ? [] : ["oneOff"],
    occupation: spec.occupation,
  });
}
