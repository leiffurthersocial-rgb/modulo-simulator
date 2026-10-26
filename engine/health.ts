import { CONDITIONS, CONDITION_BY_ID, type ConditionDef } from "@/data/conditions";
import { killPlayer } from "./lifecycle/death";
import { addLog } from "./log";
import type { Rng } from "./rng";
import { adjustStat } from "./stats";
import type { AddictionKind, GameState, HealthCondition } from "./types";
import { clamp } from "./util";

export function hasCondition(state: GameState, id: string): boolean {
  return state.player.health.conditions.some((c) => c.id === id);
}

export function addCondition(state: GameState, rng: Rng, def: ConditionDef): HealthCondition | undefined {
  if (hasCondition(state, def.id)) return undefined;
  const c: HealthCondition = { id: def.id, name: def.name, severity: rng.int(def.severity[0], def.severity[1]), sinceAge: state.player.age, chronic: def.chronic };
  state.player.health.conditions.push(c);
  return c;
}

/** Try to treat a condition. Returns "cured", "improved", or "failed". */
export function treat(state: GameState, rng: Rng, conditionId: string, level: "clinic" | "hospital"): "cured" | "improved" | "failed" {
  const c = state.player.health.conditions.find((x) => x.id === conditionId);
  const def = CONDITION_BY_ID[conditionId];
  if (!c || !def) return "failed";
  const levelOk = level === "hospital" || def.care === "clinic";
  const p = def.treatability * (levelOk ? 1 : 0.35);
  if (!rng.chance(p)) return "failed";
  if (!def.chronic) {
    state.player.health.conditions = state.player.health.conditions.filter((x) => x.id !== conditionId);
    return "cured";
  }
  c.severity = clamp(c.severity - rng.int(10, 25), 5, 100);
  return "improved";
}

function onsetChance(state: GameState, def: ConditionDef): number {
  const { player } = state;
  if (player.age < def.ages[0] || player.age > def.ages[1]) return 0;
  let p = def.chance;
  for (const [kind, factor] of Object.entries(def.addictionFactors ?? {}) as [AddictionKind, number][]) {
    p *= 1 + ((player.health.addictions[kind] ?? 0) / 100) * factor;
  }
  if (player.stats.health < 40) p *= def.poorHealthFactor ?? 1.3;
  // Healthy habits (gym, diet) earn a flag that trims risk.
  if (state.flags.fit === player.age - 1 || state.flags.fit === player.age) p *= 0.7;
  return p;
}

/** Yearly health tick: new conditions, progression, life-threatening illness, addictions. */
export function runHealthYear(state: GameState, rng: Rng): void {
  const { player } = state;
  if (state.status !== "alive") return;

  for (const def of CONDITIONS) {
    if (rng.chance(onsetChance(state, def))) {
      const c = addCondition(state, rng, def);
      if (c) addLog(state, `You were diagnosed with ${c.name.toLowerCase()}.`, "bad");
    }
  }

  for (const c of [...player.health.conditions]) {
    const def = CONDITION_BY_ID[c.id];
    if (!def) continue;
    if (def.chronic) {
      // Chronic conditions settle around a set point instead of worsening forever; vices push it up.
      let target = def.severity[1] + 10;
      for (const [kind, factor] of Object.entries(def.addictionFactors ?? {}) as [AddictionKind, number][]) {
        target += ((player.health.addictions[kind] ?? 0) / 100) * factor * 10;
      }
      c.severity = clamp(Math.round(c.severity + (Math.min(95, target) - c.severity) * 0.25 + rng.int(-4, 4)));
      if (def.lethalAt === undefined && rng.chance(0.06)) {
        player.health.conditions = player.health.conditions.filter((x) => x !== c);
        addLog(state, `Your ${c.name.toLowerCase()} went into remission.`, "good");
        continue;
      }
    } else {
      c.severity = clamp(Math.round(c.severity + def.progression * rng.float(0, 1.4) + rng.int(-6, 3)));
    }
    // Bodies fight back: acute illnesses sometimes just resolve.
    if (!def.chronic && (c.severity <= 0 || rng.chance(0.15))) {
      player.health.conditions = player.health.conditions.filter((x) => x !== c);
      addLog(state, `Your ${c.name.toLowerCase()} cleared up.`, "good");
      continue;
    }
    if (def.lethalAt !== undefined && c.severity >= def.lethalAt && rng.chance(0.05 + (c.severity - def.lethalAt) / 100)) {
      killPlayer(state, def.deathCause, `You died of ${c.name.toLowerCase()} at ${player.age}.`);
      return;
    }
  }

  // Addictions: they grow on their own unless you're fighting them.
  const add = player.health.addictions;
  for (const kind of Object.keys(add) as AddictionKind[]) {
    const level = add[kind] ?? 0;
    if (level <= 0) continue;
    // Light habits fade on their own; heavy ones feed themselves.
    add[kind] = clamp(level + (level < 30 ? rng.int(-6, 2) : level < 60 ? rng.int(-3, 3) : rng.int(-2, 4)));
    if (kind === "drugs" && rng.chance((add[kind] ?? 0) / 900)) {
      killPlayer(state, "overdose", `You died of an overdose at ${player.age}.`);
      return;
    }
    if (kind === "gambling" && (add[kind] ?? 0) > 30) {
      const loss = Math.round(player.finance.cash * rng.float(0.05, 0.25));
      if (loss > 0) {
        player.finance.cash -= loss;
        addLog(state, "Your gambling habit ate a chunk of your savings again.", "bad");
      }
    }
    if (kind === "alcohol" && (add[kind] ?? 0) > 50 && rng.chance(0.08)) {
      adjustStat(player, "health", -8);
      addLog(state, "You blacked out drinking and woke up in the emergency room.", "bad");
    }
  }
}
