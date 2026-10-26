import { PROGRAM_BY_ID } from "@/data/education";
import { careerOf, type Content } from "./content";
import { killPlayer } from "./lifecycle/death";
import { addLog } from "./log";
import type { Rng } from "./rng";
import { spawnNpc } from "./spawn";
import { adjustSkill, adjustStat } from "./stats";
import { STAT_KEYS, type CareerDef, type Country, type GameState, type JobEndReason, type SkillKey, type StatKey } from "./types";
import { clamp } from "./util";

function statValue(state: GameState, key: StatKey | SkillKey): number {
  return (STAT_KEYS as readonly string[]).includes(key) ? state.player.stats[key as StatKey] : state.player.skills[key as SkillKey];
}

const STAT_LABEL: Record<StatKey | SkillKey, string> = {
  happiness: "happiness",
  health: "health",
  smarts: "smarts",
  looks: "looks",
  charisma: "charisma",
  creativity: "creativity",
  athleticism: "athleticism",
  streetSmarts: "street smarts",
};

/** Total years worked in any of these careers, including the current job. */
export function yearsInCareers(state: GameState, ids: readonly string[]): number {
  const { career } = state.player;
  const past = career.history.filter((h) => ids.includes(h.careerId)).reduce((s, h) => s + (h.endAge - h.startAge), 0);
  const current = career.job && ids.includes(career.job.careerId) ? career.job.yearsAtCompany : 0;
  return past + current;
}

export function hasConviction(state: GameState): boolean {
  return state.player.crime.record.some((r) => r.convicted);
}

/** Why the player doesn't qualify, or undefined if they do. */
export function careerBlocked(state: GameState, def: CareerDef): string | undefined {
  const { player } = state;
  const r = def.requires;
  if (player.crime.prison) return "You're in prison.";
  if (player.age < (r.minAge ?? 18)) return `Must be at least ${r.minAge ?? 18}.`;
  if (r.maxAge !== undefined && player.age > r.maxAge) return `Only hiring people ${r.maxAge} and under.`;
  if (!def.partTime && player.education.enrolled && ["elementary", "middle", "high"].includes(player.education.enrolled.level)) {
    return "Finish school first.";
  }
  if (r.degree && !player.education.degrees.some((d) => r.degree!.includes(d.level))) {
    return r.degree.includes("high") ? "Requires a high school diploma." : "Requires a college degree.";
  }
  if (r.programs) {
    const names = r.programs.map((id) => PROGRAM_BY_ID[id]?.name);
    if (!player.education.degrees.some((d) => d.major && names.includes(d.major))) {
      const first = PROGRAM_BY_ID[r.programs[0]!];
      return `Requires a degree such as ${first?.name ?? "a related field"}.`;
    }
  }
  if (r.cleanRecord && hasConviction(state)) return "Requires a clean criminal record.";
  if (r.followers !== undefined && player.followers < r.followers) return `Requires ${r.followers.toLocaleString("en-US")} followers.`;
  if (r.experience && yearsInCareers(state, r.experience.careers) < r.experience.years) {
    return `Requires ${r.experience.years} years of relevant experience.`;
  }
  for (const [key, min] of Object.entries(r.stats ?? {}) as [StatKey | SkillKey, number][]) {
    if (statValue(state, key) < min - 15) return `Requires more ${STAT_LABEL[key]}.`;
  }
  if (player.career.job?.careerId === def.id) return "You already work here.";
  return undefined;
}

/** Odds of being hired when qualified, 5%-95%. */
export function hireChance(state: GameState, def: CareerDef): number {
  const { player } = state;
  let p = 0.85 - (def.difficulty ?? 40) / 110;
  p += (player.stats.smarts - 50) / 250 + (player.skills.charisma - 30) / 250 + (player.stats.looks - 50) / 400;
  for (const [key, min] of Object.entries(def.requires.stats ?? {}) as [StatKey | SkillKey, number][]) {
    p += Math.min(0.15, (statValue(state, key) - min) / 100);
  }
  const last = player.education.degrees[player.education.degrees.length - 1];
  if (last?.honors) p += 0.08;
  if (state.flags.internship) p += 0.05;
  p -= player.crime.notoriety / 300;
  return clamp(p, 0.05, 0.95);
}

export function salaryFor(def: CareerDef, rank: number, country: Country, state: GameState, rng: Rng): number {
  const base = def.ranks[Math.min(rank, def.ranks.length - 1)]!.salary;
  return Math.round(base * country.salaryIndex * state.difficulty.economy * rng.float(0.92, 1.08));
}

/** End the current job, recording it in history. Work contacts fade unless you're close. */
export function leaveJob(state: GameState, reason: JobEndReason): void {
  const job = state.player.career.job;
  if (!job) return;
  state.player.career.history.push({
    careerId: job.careerId,
    title: job.title,
    employer: job.employer,
    startAge: state.player.age - job.yearsAtCompany,
    endAge: state.player.age,
    reason,
  });
  state.player.career.job = undefined;
  for (const npc of Object.values(state.npcs)) {
    if ((npc.role === "boss" || npc.role === "coworker" || npc.role === "employee") && npc.inContact) {
      if (npc.role === "coworker" && npc.closeness >= 60) npc.role = "friend";
      else npc.inContact = false;
    }
  }
}

/** Start a job at a given rank, with a boss and a coworker. */
export function hire(state: GameState, rng: Rng, content: Content, country: Country, def: CareerDef, rank = 0): void {
  if (state.player.career.job) leaveJob(state, "newJob");
  const employer = rng.pick(def.employers);
  state.player.career.job = {
    careerId: def.id,
    rank,
    title: def.ranks[rank]!.title,
    employer,
    salary: salaryFor(def, rank, country, state, rng),
    performance: clamp(Math.round(rng.normal(55, 10))),
    yearsInRole: 0,
    yearsAtCompany: 0,
    partTime: def.partTime ?? false,
  };
  state.player.career.retired = false;
  if (def.partTime || employer === "Self-employed" || employer === "Self-released" || employer === "Self-published") return;
  const age = state.player.age;
  spawnNpc(state, rng, content, country, { role: "boss", age: rng.int(Math.max(age + 3, 28), Math.max(age + 15, 50)), closeness: rng.int(35, 55), occupation: `Manager at ${employer}` });
  spawnNpc(state, rng, content, country, { role: "coworker", age: rng.int(Math.max(18, age - 6), age + 8), closeness: rng.int(35, 55), occupation: def.ranks[0]!.title });
}

/** Rank to start at when re-entering a career you have history in. */
export function startingRank(state: GameState, def: CareerDef): number {
  const prior = state.player.career.history.filter((h) => h.careerId === def.id);
  if (prior.length === 0) return 0;
  const best = Math.max(...prior.map((h) => def.ranks.findIndex((r) => r.title === h.title)));
  return Math.max(0, best - 1);
}

export function promote(state: GameState, rng: Rng, country: Country, def: CareerDef): boolean {
  const job = state.player.career.job;
  if (!job || job.rank >= def.ranks.length - 1) return false;
  job.rank++;
  job.title = def.ranks[job.rank]!.title;
  job.salary = Math.max(job.salary, salaryFor(def, job.rank, country, state, rng));
  job.yearsInRole = 0;
  job.performance = clamp(job.performance - 15);
  return true;
}

/** Yearly work tick: tenure, performance, training, fame, promotions, raises, firing, hazards. */
export function runCareerYear(state: GameState, rng: Rng, content: Content, country: Country): void {
  const { player } = state;
  const job = player.career.job;
  if (!job || player.crime.prison) return;
  const def = careerOf(content, job.careerId);
  job.yearsInRole++;
  job.yearsAtCompany++;
  job.performance = clamp(Math.round(job.performance + rng.normal(0, 5) + (player.stats.smarts - 50) / 25 + (player.stats.happiness - 50) / 30));
  if (!def) return;

  if (def.trains) {
    if ((STAT_KEYS as readonly string[]).includes(def.trains)) adjustStat(player, def.trains as StatKey, rng.int(0, 1));
    else adjustSkill(player, def.trains as SkillKey, rng.int(0, 2));
  }
  if (def.fame) player.fame = clamp(Math.round(player.fame + def.fame * (job.rank + 1) * rng.float(0.5, 1.2)));

  if (def.hazard && rng.chance(def.hazard * state.difficulty.mortality)) {
    const cause = def.category === "military" ? "killed in action" : "killed in an accident on the job";
    killPlayer(state, def.category === "military" || def.id === "police" ? "murdered" : "accident", `You were ${cause} at ${player.age}.`);
    return;
  }

  const promoteYears = def.promoteYears ?? 2;
  if (job.yearsInRole >= promoteYears && job.performance >= 72 && job.rank < def.ranks.length - 1 && rng.chance(0.55)) {
    promote(state, rng, country, def);
    addLog(state, `You were promoted to ${job.title}!`, "major");
    adjustStat(player, "happiness", 6);
    return;
  }
  if (job.performance < 22 && rng.chance(0.55)) {
    addLog(state, `You were fired from your job as ${job.title}.`, "bad");
    leaveJob(state, "fired");
    adjustStat(player, "happiness", -10);
    state.flags.firedCount = Number(state.flags.firedCount ?? 0) + 1;
    return;
  }
  if (!def.partTime && rng.chance(0.02)) {
    addLog(state, `${job.employer} announced layoffs. You were let go along with ${rng.int(12, 400)} others.`, "bad");
    leaveJob(state, "laidOff");
    adjustStat(player, "happiness", -8);
    return;
  }
  if (job.yearsInRole > 0 && job.performance >= 50) job.salary = Math.round(job.salary * rng.float(1.01, 1.04));
}

/** Retire with a pension based on your final salary and years worked. */
export function retire(state: GameState): number {
  const { player } = state;
  const job = player.career.job;
  const yearsWorked = player.career.history.reduce((s, h) => s + (h.endAge - h.startAge), 0) + (job?.yearsAtCompany ?? 0);
  const lastSalary = job?.salary ?? 0;
  if (job) leaveJob(state, "retired");
  player.career.retired = true;
  player.finance.pension = Math.round(lastSalary * Math.min(0.6, yearsWorked * 0.015));
  return player.finance.pension;
}
