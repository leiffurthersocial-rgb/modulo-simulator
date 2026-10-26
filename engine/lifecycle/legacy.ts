import { GAME_CONFIG } from "@/data/config";
import { SCHOOL_NAME_STEMS } from "@/data/people";
import { rollDestinies } from "../cameos";
import { countryOf, type Content } from "../content";
import { COMPULSORY_STAGES } from "../education";
import { netWorth } from "../finance";
import { assignGoals } from "../goals";
import { addLog, startLogYear } from "../log";
import { Rng, hashSeed } from "../rng";
import type { GameState, Npc, Player, WealthTier } from "../types";
import { clamp, formatMoney, pronounsFor } from "../util";

function tierFor(worth: number, costIndex: number): WealthTier {
  const w = worth / costIndex;
  if (w >= 2_000_000) return "rich";
  if (w >= 250_000) return "upper";
  if (w >= 40_000) return "middle";
  if (w >= 5_000) return "working";
  return "poor";
}

/** Living children who could carry on the family line. */
export function heirs(state: GameState): Npc[] {
  return Object.values(state.npcs).filter((n) => n.role === "child" && n.alive);
}

/**
 * Legacy mode: start a new life as one of your children, with an inheritance and
 * their family carried over. Pure: returns a new state.
 */
export function continueAsChild(prev: GameState, content: Content, childId: string): GameState {
  const child = prev.npcs[childId];
  if (!child || child.role !== "child" || !child.alive) throw new Error("No such living child");
  const rng = new Rng(hashSeed(`${prev.seed}:gen${prev.generation + 1}:${childId}`));
  const country = countryOf(content, prev.player.countryId);
  const old = prev.player;

  const spouse = Object.values(prev.npcs).find((n) => n.role === "spouse" && n.alive);
  const siblings = heirs(prev).filter((n) => n.id !== childId);
  const estate = Math.max(0, netWorth(prev));
  const shares = 1 + siblings.length + (spouse ? 1 : 0);
  const inheritance = prev.flags.petHeir === true ? 0 : Math.round(estate / shares);

  const age = child.age;
  const parentRole = (p: { gender: string }) => (p.gender === "female" ? "mother" : "father");
  const player: Player = {
    firstName: child.firstName,
    lastName: child.lastName,
    gender: child.gender,
    pronouns: pronounsFor(child.gender),
    attraction: child.gender === "male" ? "women" : child.gender === "female" ? "men" : "everyone",
    age,
    birthYear: prev.year - age,
    countryId: old.countryId,
    familyWealth: tierFor(estate, country.costIndex),
    appearance: { ...child.appearance },
    stats: {
      happiness: rng.normalInt(55, 12, 20, 95),
      health: clamp(Math.round(86 - Math.max(0, age - 35) * 0.8 + rng.int(-8, 4))),
      smarts: clamp(Math.round((old.stats.smarts + rng.normalInt(50, 18, 5, 100)) / 2)),
      looks: rng.normalInt(50, 18, 5, 100),
    },
    skills: {
      charisma: clamp(Math.round(10 + Math.min(age, 25) * 1.4 + rng.int(-5, 5))),
      creativity: clamp(Math.round(10 + Math.min(age, 25) * 1.4 + rng.int(-5, 5))),
      athleticism: clamp(Math.round(10 + Math.min(age, 25) * 1.4 + rng.int(-5, 5))),
      streetSmarts: clamp(Math.round(5 + Math.min(age, 25) * 1.2 + rng.int(-5, 5))),
    },
    karma: 0,
    fame: Math.round(old.fame / 4),
    followers: 0,
    livesWithParents: age < 18,
    finance: { cash: inheritance, debts: [], holdings: [], lastYearIncome: 0, lastYearTax: 0, pension: 0, bankruptcies: 0 },
    education: { degrees: [], droppedOut: [] },
    career: { history: [], retired: false },
    assets: [],
    health: { conditions: [], addictions: {} },
    crime: { record: [], notoriety: 0 },
    goals: [],
    sideHustles: [],
    highestOfficeLevel: 0,
  };

  // School matching their age.
  for (const stage of COMPULSORY_STAGES) {
    const end = stage.startAge + stage.length;
    if (age >= end) {
      player.education.degrees.push({ level: stage.level, institution: `${rng.pick(SCHOOL_NAME_STEMS)} ${stage.level === "high" ? "High School" : stage.level === "middle" ? "Middle School" : "Elementary School"}`, graduatedAtAge: end, honors: false });
    } else if (age >= stage.startAge) {
      player.education.enrolled = { level: stage.level, institution: `${rng.pick(SCHOOL_NAME_STEMS)} ${stage.level === "high" ? "High School" : stage.level === "middle" ? "Middle School" : "Elementary School"}`, year: age - stage.startAge + 1, length: stage.length, performance: clamp(Math.round(rng.normal(player.stats.smarts, 12))), tuitionPerYear: 0, scholarship: false };
    }
  }

  const npcs: GameState["npcs"] = {};
  const carry = (n: Npc, patch: Partial<Npc>) => {
    npcs[n.id] = { ...structuredClone(n), ...patch };
  };
  // The parent you just played, now remembered.
  const parentId = `legacy_parent_${prev.generation}`;
  npcs[parentId] = {
    id: parentId,
    firstName: old.firstName,
    lastName: old.lastName,
    gender: old.gender,
    pronouns: old.pronouns,
    age: old.age,
    alive: false,
    deathAge: old.age,
    appearance: { ...old.appearance },
    traits: [],
    role: parentRole(old),
    closeness: child.closeness,
    metAtAge: 0,
    occupation: old.career.job?.title ?? (old.career.retired ? "Retired" : "Unemployed"),
    wealth: 0,
    inContact: false,
    tags: [],
  };
  const otherParentId = child.tags.find((t) => t.startsWith("parent:"))?.slice(7);
  const otherParent = (otherParentId && prev.npcs[otherParentId]) || spouse;
  if (otherParent) carry(otherParent, { role: parentRole(otherParent), closeness: clamp(otherParent.closeness + 20), inContact: otherParent.alive, wealth: otherParent.wealth + (spouse?.id === otherParent.id ? inheritance : 0) });
  for (const s of siblings) carry(s, { role: "sibling", closeness: clamp(Math.round((s.closeness + 50) / 2)), wealth: s.wealth + inheritance });
  for (const g of Object.values(prev.npcs)) {
    if (g.role === "grandchild" && g.tags.includes(`parent:${childId}`)) carry(g, { role: "child", tags: g.tags.filter((t) => !t.startsWith("parent:")), closeness: clamp(g.closeness + 15) });
  }

  const state: GameState = {
    version: GAME_CONFIG.saveVersion,
    seed: `${prev.seed}-g${prev.generation + 1}`,
    rngState: rng.state,
    mode: prev.mode,
    difficulty: { ...prev.difficulty },
    generation: prev.generation + 1,
    year: prev.year,
    player,
    npcs,
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
    market: structuredClone(prev.market),
    timeline: [],
    rewindsLeft: prev.mode === "casual" ? GAME_CONFIG.casualRewinds : 0,
    legacy: { parentName: `${old.firstName} ${old.lastName}`, inheritance },
  };
  state.cameos.destined = rollDestinies(rng, content.friends).map((d) => ({ ...d, earliestAge: Math.max(d.earliestAge, age) }));
  assignGoals(state, rng, 3);
  startLogYear(state);
  addLog(state, `You are ${player.firstName} ${player.lastName}, ${age}. Your ${parentRole(old) === "mother" ? "mother" : "father"}, ${old.firstName}, has died.`, "major");
  addLog(state, inheritance > 0 ? `You inherited ${formatMoney(country, inheritance)}.` : "There was nothing left to inherit.", inheritance > 0 ? "good" : "neutral");
  state.rngState = rng.state;
  return state;
}
