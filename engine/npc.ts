import { fitAppearanceToGender, randomAppearance } from "./appearance";
import type { Rng } from "./rng";
import {
  PERSONALITY_TRAITS,
  type Appearance,
  type Country,
  type GameState,
  type Gender,
  type Npc,
  type NpcRef,
  type NpcRole,
  type PersonalityTrait,
} from "./types";
import { pronounsFor } from "./util";

export function randomGender(rng: Rng): Gender {
  return rng.chance(0.5) ? "male" : "female";
}

export function randomFirstName(rng: Rng, country: Country, gender: Gender): string {
  const { names } = country;
  if (gender === "male") return rng.pick(names.male);
  if (gender === "female") return rng.pick(names.female);
  return rng.pick([...names.neutral, ...names.neutral, ...names.male, ...names.female]);
}

export function randomTraits(rng: Rng, count = 2): PersonalityTrait[] {
  return rng.shuffle(PERSONALITY_TRAITS).slice(0, count);
}

export interface NpcSpec {
  role: NpcRole;
  age: number;
  gender?: Gender;
  firstName?: string;
  lastName?: string;
  appearance?: Appearance;
  /** Use `appearance` exactly as given (friend cameos). Otherwise it is fitted to the gender. */
  exactAppearance?: boolean;
  traits?: PersonalityTrait[];
  closeness?: number;
  occupation?: string;
  wealth?: number;
  inContact?: boolean;
  tags?: string[];
}

/** Create an NPC and register it in state.npcs. */
export function createNpc(state: GameState, rng: Rng, country: Country, spec: NpcSpec): Npc {
  const gender = spec.gender ?? randomGender(rng);
  let id = rng.id("n_");
  while (state.npcs[id]) id = rng.id("n_");
  const npc: Npc = {
    id,
    firstName: spec.firstName ?? randomFirstName(rng, country, gender),
    lastName: spec.lastName ?? rng.pick(country.names.last),
    gender,
    pronouns: pronounsFor(gender),
    age: Math.max(0, spec.age),
    alive: true,
    appearance: spec.appearance
      ? spec.exactAppearance
        ? spec.appearance
        : fitAppearanceToGender(rng, spec.appearance, gender)
      : randomAppearance(rng, gender),
    traits: spec.traits ?? randomTraits(rng),
    role: spec.role,
    closeness: spec.closeness ?? 50,
    metAtAge: state.player.age,
    occupation: spec.occupation ?? defaultOccupation(spec.age),
    wealth: spec.wealth ?? 0,
    inContact: spec.inContact ?? true,
    tags: spec.tags ?? [],
  };
  state.npcs[id] = npc;
  return npc;
}

function defaultOccupation(age: number): string {
  if (age < 5) return "Toddler";
  if (age < 18) return "Student";
  if (age < 22) return "College Student";
  if (age >= 67) return "Retired";
  return "Employed";
}

/** Living NPCs the player is in contact with, optionally filtered by role. */
export function activeNpcs(state: GameState, roles?: readonly NpcRole[]): Npc[] {
  return Object.values(state.npcs).filter(
    (n) => n.alive && n.inContact && (!roles || roles.includes(n.role)),
  );
}

export function resolveNpcRef(state: GameState, ref: NpcRef, bound?: Npc): Npc | undefined {
  if (ref === "bound") return bound;
  if (typeof ref === "object") return state.npcs[ref.id];
  return activeNpcs(state, [ref])[0];
}
