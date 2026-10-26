"use client";

import { create } from "zustand";
import { DEFAULT_CONTENT } from "@/data";
import {
  ageUp as engineAgeUp,
  choose as engineChoose,
  debugForceCameo,
  deserializeState,
  dismissNotice as engineDismiss,
  newLife,
  performAction,
  serializeState,
  type ActionParams,
  type GameState,
  type NewLifeOptions,
} from "@/engine";
import { deleteSlot, loadSlot, readJson, saveSlot, writeJson } from "./persistence";
import { EMPTY_PROFILE, recordDeath, type Profile } from "./profile";
import { DEFAULT_SETTINGS, DIFFICULTY_PRESETS, type Settings } from "./settings";

export type Screen = "title" | "create" | "game";

/** How many past years we keep in memory for "What if?" rewinds. */
const UNDO_DEPTH = 3;

interface GameStore {
  hydrated: boolean;
  screen: Screen;
  slot: number;
  game: GameState | null;
  undo: GameState[];
  settings: Settings;
  profile: Profile;

  hydrate(): void;
  goTo(screen: Screen): void;
  newGame(options: NewLifeOptions): void;
  replaceGame(state: GameState): void;
  ageUp(): void;
  choose(uid: string, choiceId: string): void;
  act(actionId: string, params?: ActionParams): void;
  dismissNotice(id: string): void;
  /** Debug only: spawn a friend cameo into the current life. */
  forceCameo(friendId: string): void;
  rewind(): void;
  openSlot(slot: number): void;
  deleteSlot(slot: number): void;
  exportSave(): string | undefined;
  importSave(json: string): string | undefined;
  setSettings(patch: Partial<Settings>): void;
  resetEverything(): void;
}

export const useGame = create<GameStore>((set, get) => {
  /** Store a new game state, persist it, and record a death once. */
  const commit = (next: GameState, opts: { pushUndo?: GameState } = {}) => {
    const { game, profile, slot, undo } = get();
    if (next === game) return;
    let nextProfile = profile;
    if (next.status === "dead" && game?.status === "alive") {
      nextProfile = recordDeath(profile, next);
      writeJson("profile", nextProfile);
    }
    saveSlot(slot, next);
    writeJson("lastSlot", slot);
    set({
      game: next,
      profile: nextProfile,
      undo: opts.pushUndo ? [...undo, opts.pushUndo].slice(-UNDO_DEPTH) : undo,
    });
  };

  return {
    hydrated: false,
    screen: "title",
    slot: 0,
    game: null,
    undo: [],
    settings: DEFAULT_SETTINGS,
    profile: EMPTY_PROFILE,

    hydrate() {
      if (get().hydrated) return;
      const settings = { ...DEFAULT_SETTINGS, ...readJson<Partial<Settings>>("settings") };
      const profile = { ...EMPTY_PROFILE, ...readJson<Partial<Profile>>("profile") };
      const slot = readJson<number>("lastSlot") ?? 0;
      set({ hydrated: true, settings, profile, slot, game: loadSlot(slot) ?? null });
    },

    goTo(screen) {
      set({ screen });
    },

    newGame(options) {
      const { settings } = get();
      const state = newLife(DEFAULT_CONTENT, {
        mode: settings.mode,
        difficulty: DIFFICULTY_PRESETS[settings.difficulty],
        ...options,
      });
      set({ undo: [], game: null });
      commit(state);
      set({ screen: "game" });
    },

    replaceGame(state) {
      set({ undo: [], game: null });
      commit(state);
      set({ screen: "game" });
    },

    ageUp() {
      const { game } = get();
      if (!game) return;
      commit(engineAgeUp(game, DEFAULT_CONTENT), { pushUndo: game });
    },

    choose(uid, choiceId) {
      const { game } = get();
      if (game) commit(engineChoose(game, DEFAULT_CONTENT, uid, choiceId));
    },

    act(actionId, params) {
      const { game } = get();
      if (game) commit(performAction(game, DEFAULT_CONTENT, actionId, params));
    },

    forceCameo(friendId) {
      const { game } = get();
      if (game) commit(debugForceCameo(game, DEFAULT_CONTENT, friendId));
    },

    dismissNotice(id) {
      const { game } = get();
      if (game) commit(engineDismiss(game, id));
    },

    rewind() {
      const { game, undo, slot } = get();
      const previous = undo[undo.length - 1];
      if (!game || !previous || game.rewindsLeft <= 0) return;
      const restored: GameState = { ...previous, rewindsLeft: game.rewindsLeft - 1 };
      saveSlot(slot, restored);
      set({ game: restored, undo: undo.slice(0, -1) });
    },

    openSlot(slot) {
      const game = loadSlot(slot) ?? null;
      writeJson("lastSlot", slot);
      set({ slot, game, undo: [], screen: game ? "game" : "create" });
    },

    deleteSlot(slot) {
      deleteSlot(slot);
      if (get().slot === slot) set({ game: null, undo: [] });
    },

    exportSave() {
      const { game } = get();
      return game ? serializeState(game) : undefined;
    },

    importSave(json) {
      try {
        get().replaceGame(deserializeState(json));
        return undefined;
      } catch (e) {
        return e instanceof Error ? e.message : "Could not import that save.";
      }
    },

    setSettings(patch) {
      const settings = { ...get().settings, ...patch };
      writeJson("settings", settings);
      set({ settings });
    },

    resetEverything() {
      try {
        const keys = Object.keys(window.localStorage).filter((k) => k.startsWith("modulo:"));
        for (const k of keys) window.localStorage.removeItem(k);
      } catch {
        // ignore
      }
      set({ game: null, undo: [], profile: EMPTY_PROFILE, settings: DEFAULT_SETTINGS, slot: 0, screen: "title" });
    },
  };
});
