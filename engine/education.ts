import { CLUB_BY_ID, PROGRAM_BY_ID, type Program } from "@/data/education";
import { SCHOOL_NAME_STEMS } from "@/data/people";
import { addLog } from "./log";
import type { Rng } from "./rng";
import { adjustSkill, adjustStat } from "./stats";
import { STAT_KEYS, type Country, type GameState, type SchoolLevel, type StatKey } from "./types";
import { clamp } from "./util";

interface SchoolStage {
  level: SchoolLevel;
  startAge: number;
  length: number;
  suffix: string;
}

/** Compulsory schooling, entered automatically. Higher education is a choice (see content events). */
export const COMPULSORY_STAGES: readonly SchoolStage[] = [
  { level: "elementary", startAge: 6, length: 5, suffix: "Elementary School" },
  { level: "middle", startAge: 11, length: 3, suffix: "Middle School" },
  { level: "high", startAge: 14, length: 4, suffix: "High School" },
];

export const LEVEL_LABEL: Record<SchoolLevel, string> = {
  elementary: "elementary school",
  middle: "middle school",
  high: "high school",
  trade: "trade school",
  college: "college",
  grad: "graduate school",
  medical: "medical school",
  law: "law school",
  phd: "a PhD program",
};

function enroll(state: GameState, rng: Rng, stage: SchoolStage): void {
  const smarts = state.player.stats.smarts;
  state.player.education.enrolled = {
    level: stage.level,
    institution: `${rng.pick(SCHOOL_NAME_STEMS)} ${stage.suffix}`,
    year: 1,
    length: stage.length,
    performance: clamp(Math.round(rng.normal(smarts, 12))),
    tuitionPerYear: 0,
    scholarship: false,
  };
  addLog(state, `You started at ${state.player.education.enrolled.institution}.`, "neutral");
}

export const HIGHER_LEVELS: readonly SchoolLevel[] = ["trade", "college", "grad", "medical", "law", "phd"];

const UNIVERSITY_STEMS = ["State University", "Polytechnic", "University", "College", "Institute of Technology"];

export function isCompulsory(level: SchoolLevel): boolean {
  return COMPULSORY_STAGES.some((s) => s.level === level);
}

export function hasDegree(state: GameState, level: SchoolLevel): boolean {
  return state.player.education.degrees.some((d) => d.level === level);
}

/** The program a degree came from, if it was a program (college major etc). */
export function degreeProgram(state: GameState, level: SchoolLevel): Program | undefined {
  const d = state.player.education.degrees.find((x) => x.level === level);
  return d?.major ? Object.values(PROGRAM_BY_ID).find((p) => p.name === d.major && p.level === level) : undefined;
}

/** Why the player can't apply to a program, if they can't. */
export function programBlocked(state: GameState, program: Program): string | undefined {
  const { player } = state;
  if (player.education.enrolled) return "You're already enrolled somewhere.";
  if (player.age < 17) return "Too young.";
  if (program.requires && !hasDegree(state, program.requires)) {
    return program.requires === "high" ? "Requires a high school diploma." : "Requires a college degree.";
  }
  if (program.requiresField) {
    const prior = degreeProgram(state, "college");
    if (!prior || !program.requiresField.includes(prior.field)) return "Requires a related undergraduate degree.";
  }
  if (player.education.degrees.some((d) => d.major === program.name)) return "You already have this degree.";
  return undefined;
}

/** Admission odds, 3%-97%. */
export function admissionChance(state: GameState, program: Program): number {
  const { player } = state;
  const last = player.education.degrees[player.education.degrees.length - 1];
  const gpa = last ? (last.honors ? 90 : 65) : 50;
  return clamp(0.5 + (player.stats.smarts - program.minSmarts) / 40 + (gpa - 65) / 200 + player.karma / 1000, 0.03, 0.97);
}

/** Yearly tuition in the player's country (USD-equivalent). */
export function tuitionFor(program: Program, country: Country): number {
  const base = program.tuition * country.costIndex;
  return Math.round(country.freeCollege && program.level !== "trade" ? base * 0.08 : base);
}

/** Enroll in a higher-education program. Scholarship odds come from smarts and athleticism. */
export function enrollProgram(state: GameState, rng: Rng, country: Country, program: Program): { scholarship: boolean } {
  const { player } = state;
  const scholarship =
    (player.stats.smarts >= 85 && rng.chance(0.55)) || (program.level === "college" && player.skills.athleticism >= 80 && rng.chance(0.45));
  player.education.enrolled = {
    level: program.level,
    institution: `${rng.pick(SCHOOL_NAME_STEMS)} ${program.level === "trade" ? "Technical College" : rng.pick(UNIVERSITY_STEMS)}`,
    major: program.name,
    year: 1,
    length: program.years,
    performance: clamp(Math.round(rng.normal(player.stats.smarts, 10))),
    tuitionPerYear: scholarship ? 0 : tuitionFor(program, country),
    scholarship,
  };
  delete state.flags.club;
  chargeTuition(state);
  return { scholarship };
}

/** Pay this year's tuition: wealthy parents cover college; otherwise it goes on a student loan. */
function chargeTuition(state: GameState): void {
  const { player } = state;
  const e = player.education.enrolled;
  if (!e || e.tuitionPerYear <= 0) return;
  const parentsPay =
    e.level === "college" &&
    (player.familyWealth === "upper" || player.familyWealth === "rich") &&
    Object.values(state.npcs).some((n) => (n.role === "mother" || n.role === "father") && n.alive && n.closeness >= 30);
  if (parentsPay) return;
  const fin = player.finance;
  let loan = fin.debts.find((d) => d.kind === "student");
  if (!loan) {
    loan = { id: `debt_student_${player.age}`, kind: "student", label: "Student loans", balance: 0, rate: 0.055, yearlyPayment: 0 };
    fin.debts.push(loan);
  }
  loan.balance += e.tuitionPerYear;
}

/** Student loans are deferred while enrolled and repaid over ~10 years afterwards. */
function startLoanRepayment(state: GameState): void {
  const loan = state.player.finance.debts.find((d) => d.kind === "student");
  if (loan && loan.yearlyPayment === 0) loan.yearlyPayment = Math.max(600, Math.round(loan.balance / 9));
}

export function dropOut(state: GameState): void {
  const e = state.player.education.enrolled;
  if (!e) return;
  state.player.education.droppedOut.push(e.level);
  state.player.education.enrolled = undefined;
  delete state.flags.club;
  startLoanRepayment(state);
  addLog(state, `You dropped out of ${e.institution}.`, "bad");
}

/** Yearly boost from an extracurricular club. */
function runClubYear(state: GameState, rng: Rng): void {
  const id = state.flags.club;
  const club = typeof id === "string" ? CLUB_BY_ID[id] : undefined;
  if (!club) return;
  if ((STAT_KEYS as readonly string[]).includes(club.skill)) adjustStat(state.player, club.skill as StatKey, rng.int(1, 3));
  else adjustSkill(state.player, club.skill as Exclude<typeof club.skill, StatKey>, rng.int(1, 4));
  adjustStat(state.player, "happiness", 1);
}

/** Advance school by a year: grades drift toward smarts, graduation, auto-enrollment in the next stage. */
export function runEducationYear(state: GameState, rng: Rng): void {
  const { player } = state;
  if (player.crime.prison) return;
  const edu = player.education;
  const current = edu.enrolled;
  runClubYear(state, rng);

  if (current) {
    current.performance = clamp(Math.round(current.performance * 0.6 + player.stats.smarts * 0.4 + rng.normal(0, 6)));
    current.year++;
    if (current.year > current.length) {
      const honors = current.performance >= 85;
      edu.degrees.push({
        level: current.level,
        major: current.major,
        institution: current.institution,
        graduatedAtAge: player.age,
        honors,
      });
      edu.enrolled = undefined;
      if (!isCompulsory(current.level)) {
        startLoanRepayment(state);
        delete state.flags.club;
      }
      addLog(
        state,
        `You graduated from ${current.institution}${honors ? " with honors" : ""}.`,
        current.level === "high" || !isCompulsory(current.level) ? "major" : "good",
      );
    } else if (!isCompulsory(current.level)) {
      if (current.performance < 18 && rng.chance(0.5)) {
        addLog(state, `Your grades were so bad that ${current.institution} expelled you.`, "bad");
        dropOut(state);
      } else {
        chargeTuition(state);
      }
    }
  }

  if (!edu.enrolled) {
    const next = COMPULSORY_STAGES.find(
      (s) => player.age >= s.startAge && !edu.degrees.some((d) => d.level === s.level) && !edu.droppedOut.includes(s.level),
    );
    if (next && player.age < 19 && !(next.level === "high" && edu.droppedOut.includes("high"))) enroll(state, rng, next);
  }
}
