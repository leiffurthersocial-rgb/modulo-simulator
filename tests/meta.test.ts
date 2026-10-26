import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT } from "@/data";
import { ACHIEVEMENTS, ACHIEVEMENT_BY_ID } from "@/data/achievements";
import { evaluateAchievements } from "@/engine/achievementCheck";
import { addChild, marry } from "@/engine/family";
import { continueAsChild } from "@/engine/lifecycle/legacy";
import { createNpc } from "@/engine/npc";
import { lifeRibbons } from "@/engine/ribbons";
import { Rng } from "@/engine/rng";
import { SaveError, deserializeState, serializeState } from "@/engine/save";
import { simulateLife } from "@/engine/sim";
import { CAMEO_ACHIEVEMENT } from "@/engine/cameos";
import { lifeAtAge } from "./fixtures";

const us = DEFAULT_CONTENT.countries.us!;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? sourceFiles(p) : p.endsWith(".ts") ? [p] : [];
  });
}

describe("achievements", () => {
  it("has 100+ with unique ids", () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(100);
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
  });

  it("every achievement unlocked by content is defined", () => {
    const ids = new Set<string>([CAMEO_ACHIEVEMENT]);
    for (const file of [...sourceFiles("engine"), ...sourceFiles("data")]) {
      for (const m of readFileSync(file, "utf8").matchAll(/achieve\("([^"]+)"\)/g)) ids.add(m[1]!);
    }
    for (const id of ids) expect(ACHIEVEMENT_BY_ID[id], id).toBeDefined();
  });

  it("unlocks checked achievements and announces them once", () => {
    const s = lifeAtAge(18);
    evaluateAchievements(s, DEFAULT_CONTENT);
    expect(s.achievements).toContain("adult");
    const logged = s.log.flatMap((y) => y.entries).filter((e) => e.text.includes("Legally an Adult")).length;
    evaluateAchievements(s, DEFAULT_CONTENT);
    expect(s.log.flatMap((y) => y.entries).filter((e) => e.text.includes("Legally an Adult")).length).toBe(logged);
  });

  it("whole simulated lives earn achievements", () => {
    const s = simulateLife(DEFAULT_CONTENT, { seed: "ach", year: 2000 });
    expect(s.achievements.length).toBeGreaterThan(3);
  });
});

describe("ribbons", () => {
  it("an unremarkable life is Ordinary", () => {
    const s = lifeAtAge(25);
    s.player.karma = 0;
    expect(lifeRibbons(s, DEFAULT_CONTENT).primary.id).toBe("average");
  });

  it("picks the highest-priority ribbon and gendered labels", () => {
    const s = lifeAtAge(60);
    s.player.gender = "female";
    const rng = Rng.fromSeed("rib");
    const spouse = createNpc(s, rng, us, { role: "partner", age: 60 });
    marry(s, spouse, false);
    for (let i = 0; i < 3; i++) addChild(s, rng, us, { otherParent: spouse, age: 30 });
    expect(lifeRibbons(s, DEFAULT_CONTENT).primary.label).toBe("Family Woman");
    s.player.finance.cash = 3_000_000;
    expect(lifeRibbons(s, DEFAULT_CONTENT).primary.id).toBe("wealthy");
  });
});

describe("legacy mode", () => {
  it("continues as a child with an inheritance and family carried over", () => {
    const s = lifeAtAge(70);
    const rng = Rng.fromSeed("legacy");
    const spouse = createNpc(s, rng, us, { role: "partner", age: 68, gender: s.player.gender === "male" ? "female" : "male" });
    marry(s, spouse, false);
    const heir = addChild(s, rng, us, { otherParent: spouse, age: 40 });
    addChild(s, rng, us, { otherParent: spouse, age: 37 });
    s.player.finance.cash = 300_000;
    s.status = "dead";
    const next = continueAsChild(s, DEFAULT_CONTENT, heir.id);
    expect(next.generation).toBe(2);
    expect(next.player.firstName).toBe(heir.firstName);
    expect(next.player.age).toBe(40);
    expect(next.player.finance.cash).toBe(100_000);
    expect(next.legacy?.inheritance).toBe(100_000);
    const roles = Object.values(next.npcs).map((n) => n.role);
    expect(roles).toContain("sibling");
    expect(roles.filter((r) => r === "mother" || r === "father")).toHaveLength(2);
    expect(next.player.education.degrees.map((d) => d.level)).toEqual(["elementary", "middle", "high"]);
  });
});

describe("saves", () => {
  it("round-trips a life through JSON", () => {
    const s = simulateLife(DEFAULT_CONTENT, { seed: "save", year: 2000 });
    expect(deserializeState(serializeState(s))).toEqual(s);
  });

  it("rejects garbage and saves from the future", () => {
    expect(() => deserializeState("not json")).toThrow(SaveError);
    expect(() => deserializeState("{}")).toThrow(SaveError);
    expect(() => deserializeState(JSON.stringify({ version: 999, player: {}, npcs: {}, log: [] }))).toThrow(/newer/);
  });
});
