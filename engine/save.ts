import { GAME_CONFIG } from "@/data/config";
import type { GameState } from "./types";

type RawSave = Record<string, unknown> & { version: number };

/**
 * Migrations keyed by the version they upgrade FROM. When GameState changes shape:
 * bump GAME_CONFIG.saveVersion and add `[oldVersion]: (s) => ({ ...s, newField: default })`.
 */
const MIGRATIONS: Record<number, (s: RawSave) => RawSave> = {};

export class SaveError extends Error {}

export function serializeState(state: GameState): string {
  return JSON.stringify(state);
}

function isRawSave(v: unknown): v is RawSave {
  return typeof v === "object" && v !== null && typeof (v as { version?: unknown }).version === "number";
}

/** Parse and upgrade a saved life. Throws SaveError on anything unusable. */
export function deserializeState(json: string): GameState {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new SaveError("Save data is not valid JSON.");
  }
  if (!isRawSave(raw)) throw new SaveError("Save data has no version.");
  let save = raw;
  if (save.version > GAME_CONFIG.saveVersion) {
    throw new SaveError(`Save is from a newer version (${save.version}) of the game.`);
  }
  while (save.version < GAME_CONFIG.saveVersion) {
    const migrate = MIGRATIONS[save.version];
    if (!migrate) throw new SaveError(`No migration from save version ${save.version}.`);
    save = { ...migrate(save), version: save.version + 1 };
  }
  const s = save as unknown as Partial<GameState>;
  if (typeof s.player !== "object" || typeof s.npcs !== "object" || !Array.isArray(s.log)) {
    throw new SaveError("Save data is missing core fields.");
  }
  return save as unknown as GameState;
}
