import type { Difficulty, GameMode } from "@/engine";

export type Theme = "system" | "light" | "dark";
export type DifficultyPreset = "easy" | "normal" | "hard";

export interface Settings {
  theme: Theme;
  difficulty: DifficultyPreset;
  mode: GameMode;
  reduceMotion: boolean;
}

export const DEFAULT_SETTINGS: Settings = { theme: "system", difficulty: "normal", mode: "normal", reduceMotion: false };

export const DIFFICULTY_PRESETS: Record<DifficultyPreset, Difficulty> = {
  easy: { mortality: 0.7, eventRate: 1, economy: 1.25 },
  normal: { mortality: 1, eventRate: 1, economy: 1 },
  hard: { mortality: 1.35, eventRate: 1.15, economy: 0.8 },
};
