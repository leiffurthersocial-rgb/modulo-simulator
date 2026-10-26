import type { Appearance } from "./appearance";
import type { FriendId, Gender, NpcId, Pronouns } from "./common";

/** How an NPC relates to the player. Also used as "contexts" a friend cameo may appear in. */
export const NPC_ROLES = [
  // family
  "mother",
  "father",
  "stepparent",
  "sibling",
  "halfSibling",
  "grandparent",
  "child",
  "grandchild",
  // romance
  "spouse",
  "partner",
  "fiance",
  "ex",
  "date",
  "affair",
  // social
  "friend",
  "bestFriend",
  "acquaintance",
  "classmate",
  "teacher",
  "collegeRoommate",
  "roommate",
  "neighbor",
  "coworker",
  "boss",
  "employee",
  "gymBuddy",
  "bandmate",
  "teammate",
  "cellmate",
  "rival",
  "nemesis",
  "travelBuddy",
  "therapist",
  "lawyer",
  "stranger",
] as const;
export type NpcRole = (typeof NPC_ROLES)[number];

/**
 * Mechanical personality traits. Events and dialogue react to these, so giving
 * an NPC (or a friend cameo) a trait changes how they behave automatically.
 */
export const PERSONALITY_TRAITS = [
  "kind",
  "mean",
  "funny",
  "serious",
  "ambitious",
  "lazy",
  "jealous",
  "loyal",
  "flaky",
  "generous",
  "greedy",
  "shy",
  "outgoing",
  "nerdy",
  "sporty",
  "artsy",
  "dramatic",
  "chill",
  "honest",
  "sneaky",
  "romantic",
  "grumpy",
  "adventurous",
  "cautious",
  "party",
  "religious",
  "musical",
  "competitive",
] as const;
export type PersonalityTrait = (typeof PERSONALITY_TRAITS)[number];

export interface Npc {
  id: NpcId;
  firstName: string;
  lastName: string;
  gender: Gender;
  pronouns: Pronouns;
  age: number;
  alive: boolean;
  deathAge?: number;
  appearance: Appearance;
  traits: PersonalityTrait[];
  /** Relationship to the player. */
  role: NpcRole;
  /** Relationship meter with the player, 0-100. */
  closeness: number;
  /** Player age when they met (0 for family at birth). */
  metAtAge: number;
  /** Free-text job/status label, e.g. "Nurse", "Unemployed", "Student". */
  occupation: string;
  /** Rough personal wealth in USD-equivalent units, used by "ask for money". */
  wealth: number;
  /** False once the NPC drops out of the player's life (moved away, cut off). Kept for history. */
  inContact: boolean;
  /** Free-form markers events can test ("bully", "firstLove", "rival"). */
  tags: string[];
  /** Set only when this NPC is a friend cameo. Never shown directly in the UI. */
  friendId?: FriendId;
}
