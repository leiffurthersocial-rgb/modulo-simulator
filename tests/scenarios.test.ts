import { describe, expect, it } from "vitest";
import "@/data/actions/scenarios";
import { DEFAULT_CONTENT } from "@/data";
import { PURSUIT_REGISTRY, SCENARIO_REGISTRY } from "@/engine/actionHelpers";
import { performAction } from "@/engine/actions";
import { makeContext } from "@/engine/events/context";
import { Rng } from "@/engine/rng";
import type { EventContext, GameState, Outcome } from "@/engine/types";
import { lifeAtAge } from "./fixtures";

const content = DEFAULT_CONTENT;

function richLife(seed: string): GameState {
  const s = lifeAtAge(35, seed);
  s.player.finance.cash = 5_000_000;
  s.player.career.job = { careerId: "software", rank: 1, title: "Engineer", employer: "Bytewave", salary: 90_000, performance: 60, yearsInRole: 2, yearsAtCompany: 3, partTime: false };
  return s;
}

function contextWithNpc(state: GameState, seed: string): EventContext {
  const npc = Object.values(state.npcs).find((n) => n.alive);
  return makeContext(state, Rng.fromSeed(seed), content, npc);
}

describe("scenario content", () => {
  it("registers a healthy number of scenarios and pursuits", () => {
    expect(SCENARIO_REGISTRY.length).toBeGreaterThanOrEqual(50);
    expect(PURSUIT_REGISTRY.length).toBeGreaterThanOrEqual(10);
  });

  it("has unique action ids", () => {
    const ids = content.actions.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("never shows two actions with the same label in one section", () => {
    const seen = new Map<string, string>();
    for (const a of content.actions) {
      if (typeof a.label !== "string" || a.internal) continue;
      const key = `${a.section}:${a.label.toLowerCase()}`;
      expect(seen.get(key), `"${a.label}" in ${a.section} is used by ${seen.get(key)} and ${a.id}`).toBeUndefined();
      seen.set(key, a.id);
    }
  });

  it("only chains into events that exist", () => {
    const outcomes = (list: readonly Outcome[]) => list.map((o) => o.next).filter((n): n is string => !!n);
    const nexts = [
      ...SCENARIO_REGISTRY.flatMap((s) => s.approaches.flatMap((a) => outcomes(a.outcomes))),
      ...PURSUIT_REGISTRY.flatMap((p) => [...outcomes(p.progress), ...outcomes(p.finale)]),
    ];
    for (const id of nexts) expect(content.events.get(id), `missing event ${id}`).toBeDefined();
  });

  it("gives every scenario at least two approaches with outcomes", () => {
    for (const s of SCENARIO_REGISTRY) {
      expect(s.approaches.length, s.id).toBeGreaterThanOrEqual(2);
      for (const a of s.approaches) expect(a.outcomes.length, `${s.id}/${a.id}`).toBeGreaterThan(0);
    }
  });

  it("runs every approach many times without throwing or leaking placeholders", () => {
    for (const def of SCENARIO_REGISTRY) {
      const action = content.actions.find((a) => a.id === def.id)!;
      for (const approach of def.approaches) {
        for (let i = 0; i < 12; i++) {
          const state = richLife(`${def.id}:${approach.id}:${i}`);
          const ctx = contextWithNpc(state, `r${i}`);
          const result = action.run(ctx, { option: approach.id, npcId: ctx.npc?.id ?? "" });
          if (state.status !== "alive" || !result || result.quiet) continue;
          expect(typeof result.text, `${def.id}/${approach.id}`).toBe("string");
          expect(result.text, `${def.id}/${approach.id}`).not.toMatch(/[{}]|undefined|NaN/);
        }
      }
    }
  });

  it("keeps stats and cash finite after scenarios", () => {
    for (const def of SCENARIO_REGISTRY) {
      const action = content.actions.find((a) => a.id === def.id)!;
      const state = richLife(def.id);
      const ctx = contextWithNpc(state, "finite");
      for (const approach of def.approaches) action.run(ctx, { option: approach.id, npcId: ctx.npc?.id ?? "" });
      expect(Number.isFinite(state.player.finance.cash), def.id).toBe(true);
      for (const v of Object.values(state.player.stats)) expect(Number.isFinite(v), def.id).toBe(true);
    }
  });

  it("finishes every pursuit after its steps and records completion", () => {
    for (const def of PURSUIT_REGISTRY) {
      let state = richLife(`pursuit:${def.id}`);
      for (let i = 0; i < def.steps; i++) {
        state.actionsThisYear = {};
        state = performAction(state, content, `pursuit-${def.id}`);
        if (state.status !== "alive") break;
      }
      if (state.status === "alive") expect(state.flags[`pursuit:${def.id}:done`], def.id).toBe(1);
    }
  });

  it("lets a person-targeted scenario move closeness", () => {
    const state = richLife("closeness");
    const npc = Object.values(state.npcs).find((n) => n.alive && n.role === "mother")!;
    const before = npc.closeness;
    let moved = false;
    for (let i = 0; i < 12 && !moved; i++) {
      const s = structuredClone(state);
      const after = performAction(s, content, "sc-heart-to-heart", { npcId: npc.id, option: "honest" });
      moved = after.npcs[npc.id]!.closeness !== before;
    }
    expect(moved).toBe(true);
  });
});
