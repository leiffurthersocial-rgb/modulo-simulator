import { addLog } from "../log";
import type { Rng } from "../rng";
import { adjustSkill, adjustStat } from "../stats";
import type { Country, GameState, Npc, NpcRole } from "../types";
import { clamp, formatMoney } from "../util";
import { yearlyDeathChance } from "./death";

const FAMILY_ROLES: readonly NpcRole[] = [
  "mother",
  "father",
  "stepparent",
  "sibling",
  "halfSibling",
  "grandparent",
  "child",
  "grandchild",
  "spouse",
];
const FRIEND_ROLES: readonly NpcRole[] = ["friend", "bestFriend", "classmate", "collegeRoommate", "gymBuddy", "bandmate", "teammate"];

const ROLE_LABEL: Partial<Record<NpcRole, string>> = {
  mother: "mother",
  father: "father",
  stepparent: "stepparent",
  sibling: "sibling",
  halfSibling: "half-sibling",
  grandparent: "grandparent",
  child: "child",
  grandchild: "grandchild",
  spouse: "spouse",
  partner: "partner",
  bestFriend: "best friend",
  friend: "friend",
};

export function isFamily(npc: Npc): boolean {
  return FAMILY_ROLES.includes(npc.role);
}

/** Parents, grandparents and spouses leave you a share of their wealth, unless you were estranged. */
export function inherit(state: GameState, npc: Npc, country: Country): void {
  if (npc.wealth <= 0 || !["mother", "father", "grandparent", "spouse"].includes(npc.role)) return;
  if (npc.closeness < 15) {
    addLog(state, `${npc.firstName} left you out of the will.`, "bad");
    return;
  }
  const heirs = npc.role === "spouse" ? 1 : 1 + Object.values(state.npcs).filter((n) => n.alive && (n.role === "sibling" || n.role === "halfSibling")).length;
  const share = Math.round(npc.wealth / (npc.role === "grandparent" ? heirs * 3 : heirs));
  if (share <= 0) return;
  state.player.finance.cash += share;
  npc.wealth = 0;
  state.flags.inherited = Number(state.flags.inherited ?? 0) + share;
  addLog(state, `You inherited ${formatMoney(country, share)} from ${npc.firstName}.`, "good");
}

/** Rough NPC health by age, since NPCs don't track a full stat block. */
function npcHealth(age: number): number {
  return clamp(80 - Math.max(0, age - 45) * 1.1);
}

/** Age every NPC, roll their mortality, decay relationships. */
export function runNpcYear(state: GameState, rng: Rng, country: Country): void {
  const referenced = new Set<string>([
    ...state.pending.map((p) => p.npcId ?? ""),
    ...state.scheduled.map((s) => s.npcId ?? ""),
  ]);
  for (const npc of Object.values(state.npcs)) {
    // One-off strangers only live as long as something references them.
    if (npc.tags.includes("oneOff") && !referenced.has(npc.id)) {
      delete state.npcs[npc.id];
      continue;
    }
    if (!npc.alive) continue;
    npc.age++;
    if (npc.age >= 67 && npc.occupation !== "Retired" && rng.chance(0.4)) npc.occupation = "Retired";

    if (rng.chance(yearlyDeathChance(npc.age, npcHealth(npc.age), country, state.difficulty))) {
      npc.alive = false;
      npc.deathAge = npc.age;
      inherit(state, npc, country);
      if (npc.inContact && (isFamily(npc) || npc.closeness >= 40)) {
        const label = ROLE_LABEL[npc.role] ?? "friend";
        addLog(state, `Your ${label}, ${npc.firstName}, died at the age of ${npc.age}.`, "bad");
        const grief = isFamily(npc) ? 4 + npc.closeness / 8 : npc.closeness / 10;
        adjustStat(state.player, "happiness", -Math.round(grief));
      }
      continue;
    }

    if (!npc.inContact) continue;
    const family = isFamily(npc);
    npc.closeness = clamp(npc.closeness - rng.int(0, family ? 2 : 4));
    if (!family && FRIEND_ROLES.includes(npc.role) && npc.closeness < 8) {
      npc.inContact = false;
      addLog(state, `You and ${npc.firstName} drifted apart.`, "neutral");
    }
  }
}

/** Natural yearly change in the player's stats and skills: growing up, getting older. */
export function runPlayerDrift(state: GameState, rng: Rng): void {
  const p = state.player;
  const age = p.age;

  // Happiness drifts back toward a personal baseline.
  adjustStat(p, "happiness", (62 - p.stats.happiness) * 0.15 + rng.normal(0, 3));

  // Health: resilient youth, slow decline from middle age, faster in old age.
  const healthDelta =
    age < 30 ? rng.int(-1, 2) : age < 50 ? rng.int(-2, 1) : age < 65 ? rng.int(-2, 0) : age < 80 ? rng.int(-3, 0) : rng.int(-4, 0);
  adjustStat(p, "health", healthDelta);

  // Smarts grow through childhood and school, plateau, and fade late in life.
  const smartsDelta =
    age < 6 ? rng.int(0, 2) : age < 23 ? rng.int(p.education.enrolled ? 0 : -1, 3) : age < 70 ? rng.int(-1, 1) : rng.int(-2, 0);
  adjustStat(p, "smarts", smartsDelta);

  // Looks: puberty is a gamble, then a long slow slide.
  const looksDelta = age >= 12 && age <= 17 ? rng.int(-4, 4) : age < 35 ? rng.int(-1, 1) : age < 60 ? rng.int(-2, 0) : rng.int(-2, 0);
  adjustStat(p, "looks", looksDelta);

  // Skills grow slowly with age until adulthood. Activities and jobs do the rest.
  if (age <= 18) {
    adjustSkill(p, "charisma", rng.int(0, 2));
    adjustSkill(p, "creativity", rng.int(0, 2));
    adjustSkill(p, "athleticism", rng.int(age < 12 ? 0 : -1, 2));
    adjustSkill(p, "streetSmarts", rng.int(0, age < 10 ? 1 : 2));
  } else if (age >= 60) {
    adjustSkill(p, "athleticism", rng.int(-3, 0));
  }

  // Addictions wear you down.
  for (const level of Object.values(p.health.addictions)) {
    if (level && level > 0) {
      adjustStat(p, "health", -level / 25);
      adjustStat(p, "happiness", -level / 30);
    }
  }
  // Chronic conditions too.
  for (const c of p.health.conditions) adjustStat(p, "health", -c.severity / 20);
}

/** Count down a prison sentence and release on completion. */
export function runPrisonYear(state: GameState): void {
  const prison = state.player.crime.prison;
  if (!prison) return;
  prison.yearsLeft--;
  if (prison.yearsLeft <= 0) {
    state.player.crime.prison = undefined;
    addLog(state, `You were released from ${prison.facility} after ${prison.totalYears} years.`, "major");
  }
}
