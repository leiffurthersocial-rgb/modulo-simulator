import { SCHOOL_NAME_STEMS } from "@/data/people";
import { addLog } from "./log";
import type { Rng } from "./rng";
import type { GameState, SchoolLevel } from "./types";
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

/** Advance school by a year: grades drift toward smarts, graduation, auto-enrollment in the next stage. */
export function runEducationYear(state: GameState, rng: Rng): void {
  const { player } = state;
  if (player.crime.prison) return;
  const edu = player.education;
  const current = edu.enrolled;

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
      addLog(
        state,
        `You graduated from ${current.institution}${honors ? " with honors" : ""}.`,
        current.level === "high" || !COMPULSORY_STAGES.some((s) => s.level === current.level) ? "major" : "good",
      );
    }
  }

  if (!edu.enrolled) {
    const next = COMPULSORY_STAGES.find(
      (s) => player.age >= s.startAge && !edu.degrees.some((d) => d.level === s.level) && !edu.droppedOut.includes(s.level),
    );
    if (next && player.age < 19) enroll(state, rng, next);
  }
}
