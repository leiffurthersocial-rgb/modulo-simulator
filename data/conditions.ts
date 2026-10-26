import type { AddictionKind, DeathCause } from "@/engine/types";

export interface ConditionDef {
  id: string;
  name: string;
  /** Inclusive age range for onset. */
  ages: readonly [number, number];
  /** Base yearly onset probability. */
  chance: number;
  /** Multiply onset chance by (1 + addiction/100 * factor) for these addictions. */
  addictionFactors?: Partial<Record<AddictionKind, number>>;
  /** Onset chance multiplier when health is poor (below 40). */
  poorHealthFactor?: number;
  /** Initial severity range, 0-100. */
  severity: readonly [number, number];
  /** Yearly severity change when untreated. */
  progression: number;
  chronic: boolean;
  /** Chance per treatment that it's cured (non-chronic) or knocked back (chronic). */
  treatability: number;
  /** Treatment level needed: a doctor visit handles "clinic", a hospital stay handles "hospital". */
  care: "clinic" | "hospital";
  /** Death cause if it kills you. */
  deathCause: DeathCause;
  /** Severity at which it starts threatening your life. Omit for non-lethal. */
  lethalAt?: number;
  /** Which stat it wears down each year (default health). */
  affects?: "health" | "happiness";
}

export const CONDITIONS: readonly ConditionDef[] = [
  { id: "flu", name: "Flu", ages: [0, 120], chance: 0.04, severity: [10, 30], progression: -15, chronic: false, treatability: 0.9, care: "clinic", deathCause: "illness", lethalAt: 95 },
  { id: "pneumonia", name: "Pneumonia", ages: [0, 120], chance: 0.006, poorHealthFactor: 3, severity: [30, 60], progression: 4, chronic: false, treatability: 0.75, care: "hospital", deathCause: "illness", lethalAt: 80 },
  { id: "std", name: "STD", ages: [14, 90], chance: 0, severity: [10, 25], progression: 5, chronic: false, treatability: 0.95, care: "clinic", deathCause: "illness" },
  { id: "migraines", name: "Migraines", ages: [12, 70], chance: 0.006, severity: [15, 35], progression: 0, chronic: true, treatability: 0.5, care: "clinic", deathCause: "illness" , affects: "happiness" },
  { id: "asthma", name: "Asthma", ages: [2, 60], chance: 0.004, addictionFactors: { smoking: 2 }, severity: [15, 35], progression: 1, chronic: true, treatability: 0.6, care: "clinic", deathCause: "illness", lethalAt: 97 },
  { id: "depression", name: "Depression", ages: [12, 110], chance: 0.008, poorHealthFactor: 2, severity: [25, 50], progression: 3, chronic: true, treatability: 0.55, care: "clinic", deathCause: "misadventure" , affects: "happiness" },
  { id: "anxiety", name: "Anxiety", ages: [10, 110], chance: 0.01, severity: [20, 40], progression: 1, chronic: true, treatability: 0.6, care: "clinic", deathCause: "misadventure" , affects: "happiness" },
  { id: "diabetes", name: "Diabetes", ages: [25, 110], chance: 0.006, poorHealthFactor: 2.5, severity: [25, 45], progression: 3, chronic: true, treatability: 0.5, care: "clinic", deathCause: "complications", lethalAt: 92 },
  { id: "hypertension", name: "High blood pressure", ages: [30, 110], chance: 0.012, addictionFactors: { smoking: 1.5, alcohol: 1 }, severity: [20, 40], progression: 3, chronic: true, treatability: 0.6, care: "clinic", deathCause: "heartDisease", lethalAt: 95 },
  { id: "heart-disease", name: "Heart disease", ages: [40, 120], chance: 0.004, addictionFactors: { smoking: 2.5, alcohol: 1 }, poorHealthFactor: 2, severity: [30, 55], progression: 3, chronic: true, treatability: 0.45, care: "hospital", deathCause: "heartDisease", lethalAt: 82 },
  { id: "lung-cancer", name: "Lung cancer", ages: [35, 120], chance: 0.0008, addictionFactors: { smoking: 12 }, severity: [45, 70], progression: 12, chronic: false, treatability: 0.35, care: "hospital", deathCause: "cancer", lethalAt: 75 },
  { id: "cancer", name: "Cancer", ages: [25, 120], chance: 0.0016, severity: [35, 60], progression: 7, chronic: false, treatability: 0.45, care: "hospital", deathCause: "cancer", lethalAt: 75 },
  { id: "liver-disease", name: "Liver disease", ages: [30, 110], chance: 0.0005, addictionFactors: { alcohol: 14 }, severity: [40, 60], progression: 8, chronic: true, treatability: 0.35, care: "hospital", deathCause: "illness", lethalAt: 80 },
  { id: "arthritis", name: "Arthritis", ages: [50, 120], chance: 0.02, severity: [20, 40], progression: 2, chronic: true, treatability: 0.4, care: "clinic", deathCause: "illness" },
  { id: "hearing-loss", name: "Hearing loss", ages: [60, 120], chance: 0.025, severity: [15, 30], progression: 2, chronic: true, treatability: 0.5, care: "clinic", deathCause: "illness" },
  { id: "osteoporosis", name: "Osteoporosis", ages: [55, 120], chance: 0.012, severity: [20, 40], progression: 3, chronic: true, treatability: 0.4, care: "clinic", deathCause: "accident" },
  { id: "dementia", name: "Dementia", ages: [68, 120], chance: 0.012, severity: [30, 50], progression: 6, chronic: true, treatability: 0.2, care: "hospital", deathCause: "complications", lethalAt: 95 },
  { id: "kidney-stones", name: "Kidney stones", ages: [20, 90], chance: 0.006, severity: [30, 50], progression: -10, chronic: false, treatability: 0.95, care: "hospital", deathCause: "illness" },
  { id: "broken-bone", name: "Broken bone", ages: [3, 120], chance: 0.006, severity: [25, 45], progression: -20, chronic: false, treatability: 0.95, care: "hospital", deathCause: "accident" },
];

export const CONDITION_BY_ID: Readonly<Record<string, ConditionDef>> = Object.fromEntries(CONDITIONS.map((c) => [c.id, c]));
