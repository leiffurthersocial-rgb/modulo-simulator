import { deserializeState, serializeState, type GameState } from "@/engine";

/** All localStorage access goes through here, guarded for SSR and private mode. */

const PREFIX = "modulo:v1:";
export const SLOT_COUNT = 3;

function storage(): Storage | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

export function readJson<T>(key: string): T | undefined {
  const raw = storage()?.getItem(PREFIX + key);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    storage()?.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Quota exceeded or storage disabled: the game keeps running in memory.
  }
}

export function removeKey(key: string): void {
  storage()?.removeItem(PREFIX + key);
}

export function loadSlot(slot: number): GameState | undefined {
  const raw = storage()?.getItem(`${PREFIX}slot:${slot}`);
  if (!raw) return undefined;
  try {
    return deserializeState(raw);
  } catch {
    return undefined;
  }
}

export function saveSlot(slot: number, state: GameState): void {
  try {
    storage()?.setItem(`${PREFIX}slot:${slot}`, serializeState(state));
  } catch {
    // ignore
  }
}

export function deleteSlot(slot: number): void {
  removeKey(`slot:${slot}`);
}

export interface SlotSummary {
  slot: number;
  name: string;
  age: number;
  alive: boolean;
  countryId: string;
}

export function slotSummaries(): (SlotSummary | undefined)[] {
  return Array.from({ length: SLOT_COUNT }, (_, slot) => {
    const s = loadSlot(slot);
    return s
      ? { slot, name: `${s.player.firstName} ${s.player.lastName}`, age: s.player.age, alive: s.status === "alive", countryId: s.player.countryId }
      : undefined;
  });
}
