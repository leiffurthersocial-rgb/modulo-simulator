import { GAME_CONFIG } from "@/data/config";
import { APPEARANCE_DEFAULTS, presentationFor } from "./appearance";
import { unlockAchievement } from "./achievements";
import type { Content } from "./content";
import { createNpc, randomTraits } from "./npc";
import type { Rng } from "./rng";
import type { Country, FriendConfig, FriendDestiny, GameState, Gender, Npc, NpcRole } from "./types";

export const CAMEO_ACHIEVEMENT = "met-a-legend";

/**
 * Friend cameos are decided once, at birth: each friend independently rolls whether
 * they are "destined" to appear in this life. That makes the per-life rate exact and
 * tunable (GAME_CONFIG.friendCameos.baseChancePerLife * rarity) no matter how many
 * NPC slots a life happens to generate.
 */
export function rollDestinies(rng: Rng, friends: readonly FriendConfig[]): FriendDestiny[] {
  const cfg = GAME_CONFIG.friendCameos;
  const out: FriendDestiny[] = [];
  for (const f of friends) {
    if (rng.chance(cfg.baseChancePerLife * f.rarity)) {
      out.push({ friendId: f.id, earliestAge: rng.int(cfg.minAge, cfg.maxDestinyAge) });
    }
  }
  return out;
}

/**
 * Called whenever an event needs a brand-new NPC in `role`. If a destined friend fits
 * the role and their moment has come, they may take the slot. Returns the friend or undefined.
 */
export function claimCameoSlot(state: GameState, rng: Rng, content: Content, role: NpcRole): FriendConfig | undefined {
  const cfg = GAME_CONFIG.friendCameos;
  const age = state.player.age;
  if (age < cfg.minAge) return undefined;
  const candidates = state.cameos.destined
    .filter((d) => d.earliestAge <= age)
    .map((d) => content.friends.find((f) => f.id === d.friendId))
    .filter((f): f is FriendConfig => f !== undefined && f.roles.includes(role))
    .filter((f) => !state.cameos.met.some((m) => m.friendId === f.id));
  if (candidates.length === 0 || !rng.chance(cfg.takeSlotChance)) return undefined;
  return rng.pick(candidates);
}

function genderForFriend(friend: FriendConfig): Gender {
  return friend.pronouns === "he" ? "male" : friend.pronouns === "she" ? "female" : "nonbinary";
}

/** Materialize a friend as an NPC: real first name, pinned appearance, their traits. Records the cameo. */
export function spawnFriendNpc(
  state: GameState,
  rng: Rng,
  country: Country,
  friend: FriendConfig,
  role: NpcRole,
  closeness: number,
): Npc {
  const cfg = GAME_CONFIG.friendCameos;
  const [lo, hi] = cfg.roleAgeOffsets[role] ?? friend.ageOffset ?? cfg.defaultAgeOffset;
  const gender = genderForFriend(friend);
  const npc = createNpc(state, rng, country, {
    role,
    age: state.player.age + rng.int(lo, hi),
    gender,
    firstName: friend.name,
    // A friend's pinned look is used exactly; presentation follows their pronouns unless pinned too.
    appearance: { ...APPEARANCE_DEFAULTS, presentation: presentationFor(gender), ...friend.appearance },
    exactAppearance: true,
    traits: friend.traits.length > 0 ? [...friend.traits] : randomTraits(rng),
    closeness,
  });
  npc.pronouns = friend.pronouns ?? "they";
  npc.friendId = friend.id;
  state.cameos.destined = state.cameos.destined.filter((d) => d.friendId !== friend.id);
  state.cameos.met.push({ friendId: friend.id, npcId: npc.id, age: state.player.age, role });
  unlockAchievement(state, CAMEO_ACHIEVEMENT);
  return npc;
}

/** A believable role for a friend given what the player is doing right now. */
export function cameoRoleFor(state: GameState, friend: FriendConfig): NpcRole | undefined {
  const p = state.player;
  const school = p.education.enrolled?.level;
  const preferences: NpcRole[] = [];
  if (p.crime.prison) preferences.push("cellmate");
  if (school === "college") preferences.push("collegeRoommate", "classmate");
  else if (school) preferences.push("classmate", "teammate");
  if (p.career.job && !p.career.job.partTime) preferences.push("coworker", "boss");
  if (p.age >= 16) preferences.push("gymBuddy", "bandmate", "travelBuddy", "neighbor");
  preferences.push("friend", "neighbor");
  return preferences.find((r) => friend.roles.includes(r)) ?? friend.roles[0];
}

/** Destined friends who are overdue (no NPC slot came along), oldest first. */
export function overdueDestinies(state: GameState, graceYears = 2): FriendDestiny[] {
  return state.cameos.destined.filter((d) => d.earliestAge + graceYears <= state.player.age).sort((a, b) => a.earliestAge - b.earliestAge);
}

/** Debug: bring a friend into this life right now, in a fitting role. Returns the new NPC. */
export function forceCameo(state: GameState, rng: Rng, content: Content, friendId: string): Npc | undefined {
  const friend = content.friends.find((f) => f.id === friendId);
  if (!friend || state.cameos.met.some((m) => m.friendId === friendId)) return undefined;
  const role = cameoRoleFor(state, friend);
  if (!role) return undefined;
  const country = content.countries[state.player.countryId];
  if (!country) return undefined;
  return spawnFriendNpc(state, rng, country, friend, role, 50);
}
