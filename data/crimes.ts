import type { SkillKey, StatKey } from "@/engine/types";

export interface CrimeDef {
  id: string;
  name: string;
  /** What the log calls it when you're caught ("shoplifting"). */
  noun: string;
  minAge: number;
  skill: StatKey | SkillKey;
  difficulty: number;
  /** Payout on success, US baseline. */
  reward: readonly [number, number];
  notoriety: number;
  sentence: readonly [number, number];
  karma: number;
  /** Chance of arrest when it goes wrong (otherwise you just get away empty-handed). */
  arrestOnFail: number;
  icon: string;
  /** Success line(s). {amount} is the haul. */
  success: readonly string[];
}

export const CRIMES: readonly CrimeDef[] = [
  { id: "shoplift", name: "Shoplift", noun: "shoplifting", minAge: 10, skill: "streetSmarts", difficulty: 25, reward: [20, 200], notoriety: 1, sentence: [0, 1], karma: -2, arrestOnFail: 0.6, icon: "ShoppingBag", success: ["You walked out of the store with {amount} worth of stuff in your jacket.", "You slipped {amount} of merchandise past the security tags."] },
  { id: "pickpocket", name: "Pickpocket", noun: "pickpocketing", minAge: 12, skill: "streetSmarts", difficulty: 35, reward: [30, 400], notoriety: 2, sentence: [0, 1], karma: -3, arrestOnFail: 0.55, icon: "HandCoins", success: ["You lifted a wallet on a crowded train. {amount} inside.", "A tourist never felt a thing. You got {amount}."] },
  { id: "vandalism", name: "Vandalize property", noun: "vandalism", minAge: 12, skill: "streetSmarts", difficulty: 20, reward: [0, 0], notoriety: 1, sentence: [0, 1], karma: -2, arrestOnFail: 0.5, icon: "Palette", success: ["You spray-painted something unflattering about the mayor on a bridge."] },
  { id: "burglary", name: "Burglary", noun: "burglary", minAge: 15, skill: "streetSmarts", difficulty: 45, reward: [500, 6000], notoriety: 4, sentence: [1, 5], karma: -6, arrestOnFail: 0.65, icon: "Home", success: ["You broke into a house while the owners were at dinner and left with {amount} in valuables.", "You cleaned out a vacation home. The haul was worth {amount}."] },
  { id: "car-theft", name: "Grand theft auto", noun: "grand theft auto", minAge: 16, skill: "streetSmarts", difficulty: 50, reward: [3000, 25000], notoriety: 5, sentence: [2, 6], karma: -6, arrestOnFail: 0.7, icon: "Car", success: ["You hot-wired a {car} and sold it to a chop shop for {amount}."] },
  { id: "mugging", name: "Mug someone", noun: "armed robbery", minAge: 15, skill: "athleticism", difficulty: 45, reward: [50, 800], notoriety: 5, sentence: [2, 7], karma: -10, arrestOnFail: 0.6, icon: "Swords", success: ["You cornered a stranger in an alley. They handed over {amount}."] },
  { id: "fraud", name: "Run a scam", noun: "fraud", minAge: 18, skill: "smarts", difficulty: 55, reward: [2000, 40000], notoriety: 4, sentence: [2, 8], karma: -8, arrestOnFail: 0.6, icon: "Laptop", success: ["Your fake charity raised {amount} before anyone asked questions.", "Your phishing emails netted {amount}."] },
  { id: "embezzle", name: "Embezzle from work", noun: "embezzlement", minAge: 18, skill: "smarts", difficulty: 60, reward: [10000, 120000], notoriety: 3, sentence: [3, 10], karma: -8, arrestOnFail: 0.7, icon: "Briefcase", success: ["You quietly moved {amount} from the company accounts into yours."] },
  { id: "deal-drugs", name: "Deal drugs", noun: "drug trafficking", minAge: 16, skill: "streetSmarts", difficulty: 45, reward: [1500, 20000], notoriety: 6, sentence: [3, 12], karma: -7, arrestOnFail: 0.55, icon: "Pill", success: ["You moved product all year. Profit: {amount}."] },
  { id: "arson", name: "Commit arson", noun: "arson", minAge: 14, skill: "streetSmarts", difficulty: 45, reward: [0, 0], notoriety: 6, sentence: [3, 12], karma: -12, arrestOnFail: 0.65, icon: "Flame", success: ["You set fire to an abandoned warehouse and watched it burn from a distance."] },
  { id: "bank-robbery", name: "Rob a bank", noun: "bank robbery", minAge: 18, skill: "streetSmarts", difficulty: 75, reward: [40000, 400000], notoriety: 15, sentence: [8, 25], karma: -15, arrestOnFail: 0.85, icon: "Landmark", success: ["You walked into a bank with a note and walked out with {amount}."] },
];

export const CRIME_BY_ID: Readonly<Record<string, CrimeDef>> = Object.fromEntries(CRIMES.map((c) => [c.id, c]));

export const PRISON_NAMES = ["State Penitentiary", "County Correctional Facility", "Federal Correctional Institution", "Blackwater Prison", "Ironwood Detention Center"];
