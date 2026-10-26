/** Shared primitive types used across the engine. */

export type Gender = "male" | "female" | "nonbinary";

/** Pronoun set used by text templates ({he}, {him}, {his}, ...). */
export type Pronouns = "he" | "she" | "they";

/** The four core stats shown as bars at the bottom of the screen (0-100). */
export const STAT_KEYS = ["happiness", "health", "smarts", "looks"] as const;
export type StatKey = (typeof STAT_KEYS)[number];
export type Stats = Record<StatKey, number>;

/** Secondary skills that gate events and careers (0-100). */
export const SKILL_KEYS = ["charisma", "creativity", "athleticism", "streetSmarts"] as const;
export type SkillKey = (typeof SKILL_KEYS)[number];
export type Skills = Record<SkillKey, number>;

/**
 * A numeric amount in data files: either a fixed number or an inclusive
 * [min, max] range that is rolled with the seeded RNG when applied.
 */
export type Amount = number | readonly [number, number];

/** Values that can be stored in persistent life flags. */
export type FlagValue = string | number | boolean;

export type NpcId = string;
export type EventId = string;
export type CountryId = string;
export type FriendId = string;
