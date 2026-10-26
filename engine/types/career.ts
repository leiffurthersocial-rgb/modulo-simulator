import type { SkillKey, StatKey } from "./common";
import type { SchoolLevel } from "./player";

export type CareerCategory =
  | "service"
  | "trades"
  | "corporate"
  | "finance"
  | "tech"
  | "medical"
  | "law"
  | "public"
  | "military"
  | "education"
  | "science"
  | "creative"
  | "entertainment"
  | "sports"
  | "partTime";

export interface CareerRank {
  title: string;
  /** Yearly salary, US baseline (scaled by country salary index). */
  salary: number;
}

export interface CareerRequirements {
  minAge?: number;
  maxAge?: number;
  /** Any of these degree levels qualifies. */
  degree?: readonly SchoolLevel[];
  /** Program ids (data/education) that qualify; checked against any degree's major. */
  programs?: readonly string[];
  stats?: Partial<Record<StatKey | SkillKey, number>>;
  /** Must have worked this many years in one of these careers. */
  experience?: { careers: readonly string[]; years: number };
  /** No criminal convictions. */
  cleanRecord?: boolean;
  /** Minimum social media followers. */
  followers?: number;
}

export interface CareerDef {
  id: string;
  name: string;
  category: CareerCategory;
  icon: string;
  requires: CareerRequirements;
  ranks: readonly CareerRank[];
  /** Years in a rank before promotion is likely (default 2). */
  promoteYears?: number;
  partTime?: boolean;
  /** Stat or skill that slowly improves while working here. */
  trains?: StatKey | SkillKey;
  /** Extra yearly chance of dying on the job. */
  hazard?: number;
  /** Fame gained per year, multiplied by (rank + 1). */
  fame?: number;
  /** How competitive hiring is, 0-100 (default 40). */
  difficulty?: number;
  employers: readonly string[];
}
