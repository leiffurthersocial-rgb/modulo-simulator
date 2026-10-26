import { GAME_CONFIG } from "@/data/config";
import { OCCUPATIONS_BY_TIER, WEALTH_BY_TIER, WEALTH_TIER_WEIGHTS } from "@/data/people";
import { inheritAppearance, presentationFor, randomAppearance } from "../appearance";
import { rollDestinies } from "../cameos";
import type { Content } from "../content";
import { addLog, startLogYear } from "../log";
import { createNpc, randomFirstName, randomGender } from "../npc";
import { Rng, randomSeed } from "../rng";
import type {
  Appearance,
  Country,
  Difficulty,
  GameMode,
  GameState,
  Gender,
  Npc,
  Player,
  WealthTier,
} from "../types";
import { pronounsFor, rollAmount } from "../util";

export interface NewLifeOptions {
  seed?: string;
  mode?: GameMode;
  /** Calendar year of birth. Defaults to the current year. */
  year?: number;
  countryId?: string;
  gender?: Gender;
  firstName?: string;
  lastName?: string;
  appearance?: Partial<Appearance>;
  familyWealth?: WealthTier;
  difficulty?: Partial<Difficulty>;
}

const SIBLING_COUNT_WEIGHTS = [35, 38, 18, 9];

function rollStat(rng: Rng, mean: number, sd: number): number {
  return rng.normalInt(mean, sd, 5, 100);
}

function createFamily(state: GameState, rng: Rng, country: Country, tier: WealthTier): Npc[] {
  const lastName = state.player.lastName;
  const [wLo, wHi] = WEALTH_BY_TIER[tier];
  const householdWealth = Math.round(rollAmount(rng, [wLo, wHi]) * country.costIndex);
  const motherAge = rng.normalInt(29, 5, 17, 45);
  const occupation = () => rng.pick(OCCUPATIONS_BY_TIER[tier]);
  const family: Npc[] = [];

  const mother = createNpc(state, rng, country, {
    role: "mother",
    age: motherAge,
    gender: "female",
    lastName,
    closeness: rng.int(55, 95),
    occupation: occupation(),
    wealth: Math.round(householdWealth / 2),
  });
  family.push(mother);

  // Some kids grow up without their father in the picture.
  if (rng.chance(0.85)) {
    family.push(
      createNpc(state, rng, country, {
        role: "father",
        age: Math.max(18, motherAge + rng.int(-3, 7)),
        gender: "male",
        lastName,
        closeness: rng.int(45, 90),
        occupation: occupation(),
        wealth: Math.round(householdWealth / 2),
      }),
    );
  }

  const parents = family.map((n) => n.appearance);
  const siblings = rng.weighted(SIBLING_COUNT_WEIGHTS.map((weight, value) => ({ value, weight }))) ?? 0;
  const maxOlder = Math.max(0, motherAge - 18);
  for (let i = 0; i < siblings && maxOlder > 0; i++) {
    const gender = randomGender(rng);
    family.push(
      createNpc(state, rng, country, {
        role: "sibling",
        age: rng.int(1, Math.min(12, maxOlder)),
        gender,
        lastName,
        appearance: inheritAppearance(rng, gender, parents),
        closeness: rng.int(35, 85),
      }),
    );
  }
  return family;
}

function describeBirth(state: GameState, country: Country, family: readonly Npc[]): void {
  const p = state.player;
  const baby = p.gender === "male" ? "boy" : p.gender === "female" ? "girl" : "baby";
  addLog(state, `You were born a ${baby} in ${country.name}. Your name is ${p.firstName} ${p.lastName}.`, "major");
  const mother = family.find((n) => n.role === "mother");
  const father = family.find((n) => n.role === "father");
  if (mother) addLog(state, `Your mother is ${mother.firstName}, a ${mother.age}-year-old ${mother.occupation.toLowerCase()}.`);
  if (father) addLog(state, `Your father is ${father.firstName}, a ${father.age}-year-old ${father.occupation.toLowerCase()}.`);
  else addLog(state, "Your father is not in the picture.");
  for (const s of family.filter((n) => n.role === "sibling")) {
    const word = s.gender === "male" ? "brother" : s.gender === "female" ? "sister" : "sibling";
    addLog(state, `You have an older ${word}, ${s.firstName}, who is ${s.age}.`);
  }
}

/** Create a brand-new life. Deterministic for a given seed and options (except the default year). */
export function newLife(content: Content, options: NewLifeOptions = {}): GameState {
  const seed = options.seed ?? randomSeed();
  const rng = Rng.fromSeed(seed);
  const countryIds = Object.keys(content.countries);
  const countryId = options.countryId ?? rng.pick(countryIds);
  const country = content.countries[countryId];
  if (!country) throw new Error(`Unknown country "${countryId}"`);

  const gender = options.gender ?? randomGender(rng);
  const familyWealth = options.familyWealth ?? rng.weighted(WEALTH_TIER_WEIGHTS) ?? "middle";
  const year = options.year ?? new Date().getFullYear();

  const player: Player = {
    firstName: options.firstName ?? randomFirstName(rng, country, gender),
    lastName: options.lastName ?? rng.pick(country.names.last),
    gender,
    pronouns: pronounsFor(gender),
    attraction: gender === "male" ? "women" : gender === "female" ? "men" : "everyone",
    age: 0,
    birthYear: year,
    countryId,
    familyWealth,
    appearance: randomAppearance(rng, gender),
    stats: {
      happiness: rollStat(rng, 75, 15),
      health: rollStat(rng, 82, 12),
      smarts: rollStat(rng, 50, 20),
      looks: rollStat(rng, 50, 20),
    },
    skills: {
      charisma: rng.normalInt(10, 6, 0, 40),
      creativity: rng.normalInt(10, 6, 0, 40),
      athleticism: rng.normalInt(10, 6, 0, 40),
      streetSmarts: rng.normalInt(5, 4, 0, 30),
    },
    karma: 0,
    fame: 0,
    followers: 0,
    livesWithParents: true,
    finance: { cash: 0, debts: [], holdings: [], lastYearIncome: 0, bankruptcies: 0 },
    education: { degrees: [], droppedOut: [] },
    career: { history: [], retired: false },
    assets: [],
    health: { conditions: [], addictions: {} },
    crime: { record: [], notoriety: 0 },
    goals: [],
    sideHustles: [],
    highestOfficeLevel: 0,
  };

  const state: GameState = {
    version: GAME_CONFIG.saveVersion,
    seed,
    rngState: 0,
    mode: options.mode ?? "normal",
    difficulty: { ...GAME_CONFIG.defaultDifficulty, ...options.difficulty },
    generation: 1,
    year,
    player,
    npcs: {},
    log: [],
    pending: [],
    scheduled: [],
    flags: {},
    fired: {},
    achievements: [],
    cameos: { destined: [], met: [] },
    status: "alive",
    notices: [],
    actionsThisYear: {},
    market: { prices: {}, history: {} },
    timeline: [],
    rewindsLeft: options.mode === "casual" ? GAME_CONFIG.casualRewinds : 0,
  };

  startLogYear(state);
  const family = createFamily(state, rng, country, familyWealth);
  player.appearance = {
    ...inheritAppearance(
      rng,
      gender,
      family.filter((n) => n.role === "mother" || n.role === "father").map((n) => n.appearance),
    ),
    presentation: presentationFor(gender),
    ...options.appearance,
  };
  state.cameos.destined = rollDestinies(rng, content.friends);
  describeBirth(state, country, family);

  state.rngState = rng.state;
  return state;
}
