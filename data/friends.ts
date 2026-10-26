import type { FriendConfig, NpcRole } from "@/engine/types";

/**
 * Real friends who may show up, rarely, as ordinary-looking NPCs.
 *
 * - `traits`: mechanical personality traits (see PERSONALITY_TRAITS in engine/types/npc.ts).
 *   Filling these in changes how the friend behaves in events and what they say.
 * - `dialogue`: custom lines per situation; these win over generic trait-based lines.
 * - `roles`: contexts they may appear in. Peer roles use the friend's age (about the
 *   player's); older-person roles like boss or teacher use GAME_CONFIG.friendCameos.roleAgeOffsets.
 * - `rarity`: multiplier on GAME_CONFIG.friendCameos.baseChancePerLife.
 * - `pronouns`: drives event text, gender, and the avatar's presentation.
 */

const PEER_ROLES: readonly NpcRole[] = [
  "classmate",
  "friend",
  "collegeRoommate",
  "roommate",
  "coworker",
  "neighbor",
  "gymBuddy",
  "bandmate",
  "teammate",
  "travelBuddy",
  "rival",
  "nemesis",
  "cellmate",
];

/** Roles where the friend is older or younger than the player (see roleAgeOffsets in config). */
const NON_PEER_ROLES: readonly NpcRole[] = ["teacher", "boss", "employee", "therapist", "lawyer"];

const ALL_ROLES: readonly NpcRole[] = [...PEER_ROLES, ...NON_PEER_ROLES];

export const FRIENDS: readonly FriendConfig[] = [
  {
    id: "leif",
    name: "Leif",
    appearance: { hairStyle: "mod", hairColor: "brown", eyeColor: "blue" },
    traits: [],
    dialogue: {},
    pronouns: "he",
    roles: ALL_ROLES,
    rarity: 1,
  },
  {
    id: "jovan",
    name: "Jovan",
    appearance: { hairStyle: "mod", hairColor: "brown", eyeColor: "brown" },
    traits: [],
    dialogue: {},
    pronouns: "he",
    roles: ALL_ROLES,
    rarity: 1,
  },
  {
    id: "robin",
    name: "Robin",
    appearance: { hairStyle: "short", hairColor: "blonde", eyeColor: "brown" },
    traits: [],
    dialogue: {},
    pronouns: "he",
    roles: ALL_ROLES,
    rarity: 1,
  },
  {
    id: "lenni",
    name: "Lenni",
    appearance: { hairStyle: "middlePart", hairColor: "brown", eyeColor: "green", glasses: "round" },
    traits: [],
    dialogue: {},
    pronouns: "he",
    roles: ALL_ROLES,
    rarity: 1,
  },
  {
    id: "erim",
    name: "Erim",
    appearance: {
      hairStyle: "curly",
      hairColor: "black",
      eyeColor: "brown",
      glasses: "square",
      facialHair: "goatee",
    },
    traits: [],
    dialogue: {},
    pronouns: "he",
    roles: ALL_ROLES,
    rarity: 1,
  },
  {
    id: "tusya",
    name: "Tusya",
    appearance: { hairStyle: "short", hairColor: "black", eyeColor: "brown", skinTone: "brown" },
    traits: [],
    dialogue: {},
    pronouns: "he",
    roles: ALL_ROLES,
    rarity: 1,
  },
  {
    id: "till",
    name: "Till",
    appearance: { hairStyle: "mod", hairColor: "blonde", eyeColor: "blue" },
    traits: [],
    dialogue: {},
    pronouns: "he",
    roles: ALL_ROLES,
    rarity: 1,
  },
  {
    id: "leo",
    name: "Leo",
    appearance: { hairStyle: "sweptBack", hairColor: "brown", eyeColor: "brown" },
    traits: [],
    dialogue: {},
    pronouns: "he",
    roles: ALL_ROLES,
    rarity: 1,
  },
];
