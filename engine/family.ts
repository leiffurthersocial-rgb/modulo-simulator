import { OCCUPATIONS_BY_TIER } from "@/data/people";
import { inheritAppearance } from "./appearance";
import { addLog } from "./log";
import { createNpc, randomFirstName, randomGender } from "./npc";
import type { Rng } from "./rng";
import { adjustStat } from "./stats";
import type { Country, GameState, Gender, Npc } from "./types";
import { clamp, formatMoney } from "./util";

export const ROMANTIC_ROLES = ["partner", "fiance", "spouse"] as const;

export function partnerOf(state: GameState): Npc | undefined {
  return Object.values(state.npcs).find((n) => n.alive && n.inContact && (ROMANTIC_ROLES as readonly string[]).includes(n.role));
}

export function childrenOf(state: GameState, includeDead = false): Npc[] {
  return Object.values(state.npcs).filter((n) => n.role === "child" && (includeDead || n.alive));
}

/** Chance a try for a baby works, by the age of whoever would carry it. */
export function fertility(age: number): number {
  if (age < 15 || age > 47) return 0;
  if (age < 30) return 0.7;
  if (age < 35) return 0.55;
  if (age < 40) return 0.38;
  if (age < 44) return 0.18;
  return 0.06;
}

/** Who could carry a pregnancy in this couple, if anyone. */
export function carrier(state: GameState, partner: Npc): "player" | "partner" | undefined {
  if (state.player.gender === "female") return "player";
  if (partner.gender === "female") return "partner";
  return undefined;
}

export function startPregnancy(state: GameState, partner: Npc | undefined, carriedByPlayer: boolean): void {
  state.player.pregnancy = { dueAtAge: state.player.age + 1, otherParentId: partner?.id, carriedByPlayer };
}

/** Add a child to the family (born or adopted). */
export function addChild(state: GameState, rng: Rng, country: Country, opts: { otherParent?: Npc; adopted?: boolean; age?: number; gender?: Gender; name?: string }): Npc {
  const gender = opts.gender ?? randomGender(rng);
  const parents = opts.adopted ? [] : [state.player.appearance, ...(opts.otherParent ? [opts.otherParent.appearance] : [])];
  const child = createNpc(state, rng, country, {
    role: "child",
    age: opts.age ?? 0,
    gender,
    firstName: opts.name ?? randomFirstName(rng, country, gender),
    lastName: state.player.lastName,
    appearance: opts.adopted ? undefined : inheritAppearance(rng, gender, parents),
    closeness: rng.int(70, 95),
    occupation: (opts.age ?? 0) < 5 ? "Toddler" : "Student",
  });
  if (opts.adopted) child.tags.push("adopted");
  if (opts.otherParent) child.tags.push(`parent:${opts.otherParent.id}`);
  return child;
}

export function marry(state: GameState, npc: Npc, prenup: boolean): void {
  npc.role = "spouse";
  npc.closeness = clamp(npc.closeness + 10);
  state.flags.prenup = prenup;
  state.flags.marriages = Number(state.flags.marriages ?? 0) + 1;
  state.flags.marriedAt = state.player.age;
}

/** End a marriage. Without a prenup your ex takes half your savings and your best home. */
export function divorce(state: GameState, npc: Npc, country: Country): string {
  const { player } = state;
  npc.role = "ex";
  npc.inContact = false;
  state.flags.divorces = Number(state.flags.divorces ?? 0) + 1;
  adjustStat(player, "happiness", -12);
  if (state.flags.prenup === true) {
    delete state.flags.prenup;
    return `Thanks to the prenup, ${npc.firstName} left with only what ${npc.pronouns} brought in.`;
  }
  const half = Math.max(0, Math.round(player.finance.cash / 2));
  player.finance.cash -= half;
  npc.wealth += half;
  const homes = player.assets.filter((a) => a.kind === "house").sort((a, b) => b.value - a.value);
  const home = homes[0];
  let tail = "";
  if (home && homes.length > 1) {
    player.assets = player.assets.filter((a) => a.id !== home.id);
    player.finance.debts = player.finance.debts.filter((d) => d.assetId !== home.id);
    tail = ` and the ${home.name.toLowerCase()}`;
  }
  delete state.flags.prenup;
  return `${npc.firstName} got ${formatMoney(country, half)}${tail} in the divorce.`;
}

export function breakUp(state: GameState, npc: Npc): void {
  npc.role = "ex";
  npc.inContact = false;
  adjustStat(state.player, "happiness", -6);
}

function childOccupation(rng: Rng, child: Npc, state: GameState): string {
  if (child.age < 5) return "Toddler";
  if (child.age < 18) return "Student";
  if (child.age < 22 && rng.chance(0.6)) return "College Student";
  if (child.age >= 67) return "Retired";
  return rng.pick(OCCUPATIONS_BY_TIER[state.player.familyWealth === "poor" ? "working" : "middle"]);
}

/** Yearly family tick: births, kids growing up, grandkids, partners drifting away. */
export function runFamilyYear(state: GameState, rng: Rng, country: Country): void {
  const { player } = state;
  const preg = player.pregnancy;
  if (preg && player.age >= preg.dueAtAge) {
    player.pregnancy = undefined;
    const other = preg.otherParentId ? state.npcs[preg.otherParentId] : undefined;
    const twins = rng.chance(0.03);
    const kids = [addChild(state, rng, country, { otherParent: other })];
    if (twins) kids.push(addChild(state, rng, country, { otherParent: other }));
    for (const kid of kids) {
      const word = kid.gender === "male" ? "son" : kid.gender === "female" ? "daughter" : "child";
      addLog(state, `${preg.carriedByPlayer ? "You gave birth to" : `${other?.firstName ?? "Your partner"} gave birth to`} a ${word}, ${kid.firstName}.`, "major");
    }
    if (twins) state.flags.twins = true;
    adjustStat(player, "happiness", 10);
    if (preg.carriedByPlayer) adjustStat(player, "health", -rng.int(2, 8));
    state.scheduled.push({ eventId: "family-name-baby", atAge: player.age, npcId: kids[0]!.id });
  }

  for (const kid of childrenOf(state)) {
    if (kid.age <= 25 || kid.occupation === "Toddler" || kid.occupation === "Student" || rng.chance(0.15)) {
      kid.occupation = childOccupation(rng, kid, state);
    }
    if (kid.age >= 24 && !kid.tags.includes("married") && rng.chance(0.09)) {
      kid.tags.push("married");
      if (kid.inContact) addLog(state, `Your ${kid.gender === "male" ? "son" : kid.gender === "female" ? "daughter" : "child"} ${kid.firstName} got married.`, "good");
    }
    const grandkids = Object.values(state.npcs).filter((n) => n.role === "grandchild" && n.tags.includes(`parent:${kid.id}`)).length;
    if (kid.tags.includes("married") && kid.age >= 24 && kid.age <= 42 && grandkids < 3 && rng.chance(0.13)) {
      const gender = randomGender(rng);
      const g = createNpc(state, rng, country, { role: "grandchild", age: 0, gender, lastName: kid.lastName, appearance: inheritAppearance(rng, gender, [kid.appearance]), closeness: rng.int(55, 85), occupation: "Toddler" });
      g.tags.push(`parent:${kid.id}`);
      if (kid.inContact) {
        addLog(state, `${kid.firstName} had a baby, ${g.firstName}. You're a grandparent!`, "major");
        adjustStat(player, "happiness", 6);
        state.flags.grandparent = true;
      }
    }
  }
  for (const g of Object.values(state.npcs).filter((n) => n.role === "grandchild" && n.alive)) {
    g.occupation = g.age < 5 ? "Toddler" : g.age < 18 ? "Student" : g.occupation === "Student" || g.occupation === "Toddler" ? childOccupation(rng, g, state) : g.occupation;
  }

  const partner = partnerOf(state);
  if (partner) {
    partner.closeness = clamp(partner.closeness - rng.int(1, partner.role === "spouse" ? 3 : 5));
    if (partner.closeness < 12 && rng.chance(0.5)) {
      if (partner.role === "spouse") {
        state.scheduled.push({ eventId: "family-spouse-divorce", atAge: player.age, npcId: partner.id });
      } else {
        breakUp(state, partner);
        addLog(state, `${partner.firstName} broke up with you. "It's not you," ${partner.pronouns} said. It was a little bit you.`, "bad");
      }
    }
  }
}
