import type { Appearance } from "./appearance";
import type { FriendId, Pronouns } from "./common";
import type { NpcRole, PersonalityTrait } from "./npc";

/** Situations in which an NPC might say something. Custom friend lines override the generic pools. */
export const DIALOGUE_SITUATIONS = [
  "any",
  "greeting",
  "compliment",
  "insult",
  "spendTime",
  "gift",
  "argue",
  "askMoney",
  "congratulate",
  "console",
  "farewell",
] as const;
export type DialogueSituation = (typeof DIALOGUE_SITUATIONS)[number];

export type DialogueLines = Partial<Record<DialogueSituation, readonly string[]>>;

/** The appearance fields that must be pinned for a friend; the rest fall back to sensible defaults. */
export type FriendAppearance = Pick<Appearance, "hairStyle" | "hairColor" | "eyeColor"> & Partial<Appearance>;

/** A real person who may (rarely) show up as an NPC. Lives in /data/friends.ts. */
export interface FriendConfig {
  id: FriendId;
  /** Real first name, used as-is. Last name is generated from the player's country. */
  name: string;
  appearance: FriendAppearance;
  /** Pronouns used in event text. Omitted means "they". */
  pronouns?: Pronouns;
  /** Mechanical traits: they shape dialogue and event outcomes automatically. */
  traits: readonly PersonalityTrait[];
  /** Custom lines. Any situation listed here takes priority over generic trait-based lines. */
  dialogue: DialogueLines;
  /** Contexts the friend can appear in. Only roles that make sense for a peer of the player. */
  roles: readonly NpcRole[];
  /** Multiplier on the base per-life cameo chance (1 = default). */
  rarity: number;
  /** Age relative to the player when they appear, inclusive range. Defaults to the config value. */
  ageOffset?: readonly [number, number];
}

/** Rolled at birth: this friend is "destined" to show up in this life, no earlier than `earliestAge`. */
export interface FriendDestiny {
  friendId: FriendId;
  earliestAge: number;
}

export interface CameoRecord {
  friendId: FriendId;
  npcId: string;
  age: number;
  role: NpcRole;
}
