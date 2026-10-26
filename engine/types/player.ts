import type { Appearance } from "./appearance";
import type { CountryId, Gender, Pronouns, Skills, Stats } from "./common";

// ---------------------------------------------------------------- education

export type SchoolLevel =
  | "elementary"
  | "middle"
  | "high"
  | "trade"
  | "college"
  | "grad"
  | "medical"
  | "law"
  | "phd";

export interface Enrollment {
  level: SchoolLevel;
  institution: string;
  major?: string;
  /** 1-based year within this program. */
  year: number;
  /** Total years in this program. */
  length: number;
  /** Grades / standing, 0-100. */
  performance: number;
  tuitionPerYear: number;
  scholarship: boolean;
}

export interface Degree {
  level: SchoolLevel;
  major?: string;
  institution: string;
  graduatedAtAge: number;
  honors: boolean;
}

export interface Education {
  enrolled?: Enrollment;
  degrees: Degree[];
  droppedOut: SchoolLevel[];
}

// ---------------------------------------------------------------- career

export interface JobState {
  careerId: string;
  /** Index into the career's rank ladder. */
  rank: number;
  title: string;
  employer: string;
  /** Yearly gross salary, USD-equivalent. */
  salary: number;
  /** Job performance, 0-100. Drives promotions and firing. */
  performance: number;
  yearsInRole: number;
  yearsAtCompany: number;
  partTime: boolean;
}

export type JobEndReason = "quit" | "fired" | "laidOff" | "retired" | "jailed" | "died" | "newJob";

export interface JobRecord {
  careerId: string;
  title: string;
  employer: string;
  startAge: number;
  endAge: number;
  reason: JobEndReason;
}

export interface Career {
  job?: JobState;
  history: JobRecord[];
  retired: boolean;
}

// ---------------------------------------------------------------- money & assets

export type DebtKind = "student" | "mortgage" | "car" | "personal" | "credit" | "medical";

export interface Debt {
  id: string;
  kind: DebtKind;
  label: string;
  /** Outstanding principal, USD-equivalent. */
  balance: number;
  /** Yearly interest rate, e.g. 0.06. */
  rate: number;
  /** Scheduled payment per year. */
  yearlyPayment: number;
  /** Asset this debt is secured against, if any. */
  assetId?: string;
}

export interface Holding {
  symbol: string;
  units: number;
  costBasis: number;
}

export interface Finance {
  /** Liquid money (bank + wallet), USD-equivalent. Can go negative briefly before debt rolls it over. */
  cash: number;
  debts: Debt[];
  holdings: Holding[];
  /** Gross income received last year, for summaries and taxes. */
  lastYearIncome: number;
  lastYearTax: number;
  /** Yearly pension once retired, USD-equivalent. */
  pension: number;
  bankruptcies: number;
}

export type AssetKind = "house" | "car" | "boat" | "jewelry" | "luxury" | "instrument" | "pet";

export interface Asset {
  id: string;
  kind: AssetKind;
  name: string;
  value: number;
  purchasePrice: number;
  boughtAtAge: number;
  /** Physical condition, 0-100. */
  condition: number;
  yearlyUpkeep: number;
  rentedOut: boolean;
  /** Catalog id in /data/assets, used for flavor and resale rules. */
  catalogId: string;
  /** Pets only: the pet's age. */
  age?: number;
}

// ---------------------------------------------------------------- health

export type AddictionKind = "alcohol" | "drugs" | "gambling" | "smoking";

export interface HealthCondition {
  /** Id in /data/conditions. */
  id: string;
  name: string;
  /** 0-100; higher is worse. */
  severity: number;
  sinceAge: number;
  chronic: boolean;
}

export interface HealthState {
  conditions: HealthCondition[];
  /** Addiction strength 0-100 per kind; absent or 0 means none. */
  addictions: Partial<Record<AddictionKind, number>>;
}

// ---------------------------------------------------------------- crime

export interface CrimeRecord {
  crime: string;
  age: number;
  convicted: boolean;
  sentenceYears: number;
}

export interface PrisonState {
  facility: string;
  yearsLeft: number;
  totalYears: number;
  /** Standing among inmates, 0-100. */
  respect: number;
  paroleEligibleAtAge: number;
}

export interface CrimeState {
  record: CrimeRecord[];
  prison?: PrisonState;
  /** How well-known the player is to police and the underworld, 0-100. */
  notoriety: number;
}

// ---------------------------------------------------------------- goals

export interface LifeGoal {
  /** Id in /data/goals. */
  id: string;
  assignedAtAge: number;
  completedAtAge?: number;
}

// ---------------------------------------------------------------- side systems

export interface PoliticalOffice {
  /** Id in /data/politics. */
  officeId: string;
  title: string;
  termEndsAtAge: number;
  /** 0-100 public approval. */
  approval: number;
  termsServed: number;
}

export interface Business {
  name: string;
  industry: string;
  /** Valuation, USD-equivalent. */
  value: number;
  /** Last year's profit (can be negative). */
  lastProfit: number;
  foundedAtAge: number;
  employees: number;
}

export interface SideHustle {
  id: string;
  label: string;
  /** Yearly income, USD-equivalent (already country-scaled). */
  income: number;
  sinceAge: number;
}

/** A baby on the way, carried by the player or their partner. */
export interface Pregnancy {
  dueAtAge: number;
  otherParentId?: string;
  carriedByPlayer: boolean;
}

// ---------------------------------------------------------------- player

export const WEALTH_TIERS = ["poor", "working", "middle", "upper", "rich"] as const;
export type WealthTier = (typeof WEALTH_TIERS)[number];

export type Attraction = "men" | "women" | "everyone";

export interface Player {
  firstName: string;
  lastName: string;
  gender: Gender;
  pronouns: Pronouns;
  /** Who romance events and dating draw from. */
  attraction: Attraction;
  age: number;
  birthYear: number;
  countryId: CountryId;
  /** Family background at birth; shapes childhood events and inheritance. */
  familyWealth: WealthTier;
  appearance: Appearance;
  stats: Stats;
  skills: Skills;
  /** -100 (wretched) .. 100 (saintly). Nudges event outcomes. */
  karma: number;
  /** 0-100 public recognition. */
  fame: number;
  /** Social media followers, used by the fame system. */
  followers: number;
  livesWithParents: boolean;
  finance: Finance;
  education: Education;
  career: Career;
  assets: Asset[];
  health: HealthState;
  crime: CrimeState;
  goals: LifeGoal[];
  office?: PoliticalOffice;
  business?: Business;
  sideHustles: SideHustle[];
  pregnancy?: Pregnancy;
  /** Highest political office level reached (0 = never held office). */
  highestOfficeLevel: number;
}
