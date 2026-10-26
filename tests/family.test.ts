import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT } from "@/data";
import { performAction } from "@/engine/actions";
import { npcLine } from "@/engine/dialogue";
import { divorce, marry, runFamilyYear, startPregnancy } from "@/engine/family";
import { createNpc } from "@/engine/npc";
import { Rng } from "@/engine/rng";
import type { FriendConfig } from "@/engine/types";
import { contentWith, ctxFor, lifeAtAge } from "./fixtures";

const us = DEFAULT_CONTENT.countries.us!;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? sourceFiles(p) : p.endsWith(".ts") ? [p] : [];
  });
}

describe("event references in code", () => {
  it("every event id triggered or scheduled from code exists", () => {
    const ids = new Set<string>();
    for (const file of [...sourceFiles("engine"), ...sourceFiles("data")]) {
      const src = readFileSync(file, "utf8");
      for (const m of src.matchAll(/trigger\(ctx, "([^"]+)"/g)) ids.add(m[1]!);
      for (const m of src.matchAll(/eventId: "([^"]+)"/g)) ids.add(m[1]!);
    }
    expect(ids.size).toBeGreaterThan(3);
    for (const id of ids) expect(DEFAULT_CONTENT.events.get(id), id).toBeDefined();
  });
});

describe("marriage and divorce", () => {
  it("divorce without a prenup costs half your savings", () => {
    const s = lifeAtAge(35);
    const rng = Rng.fromSeed("div");
    const spouse = createNpc(s, rng, us, { role: "partner", age: 35 });
    marry(s, spouse, false);
    expect(spouse.role).toBe("spouse");
    s.player.finance.cash = 100_000;
    divorce(s, spouse, us);
    expect(s.player.finance.cash).toBe(50_000);
    expect(spouse.role).toBe("ex");
  });

  it("a prenup protects your savings", () => {
    const s = lifeAtAge(35);
    const spouse = createNpc(s, Rng.fromSeed("pre"), us, { role: "partner", age: 35 });
    marry(s, spouse, true);
    s.player.finance.cash = 100_000;
    divorce(s, spouse, us);
    expect(s.player.finance.cash).toBe(100_000);
  });
});

describe("children", () => {
  it("a pregnancy turns into a child the next year", () => {
    const s = lifeAtAge(30);
    s.player.gender = "female";
    const rng = Rng.fromSeed("baby");
    const partner = createNpc(s, rng, us, { role: "spouse", age: 31, gender: "male" });
    startPregnancy(s, partner, true);
    s.player.age++;
    runFamilyYear(s, rng, us);
    const kids = Object.values(s.npcs).filter((n) => n.role === "child");
    expect(kids.length).toBeGreaterThanOrEqual(1);
    expect(kids[0]!.age).toBe(0);
    expect(kids[0]!.lastName).toBe(s.player.lastName);
    expect(s.player.pregnancy).toBeUndefined();
    expect(s.scheduled.some((e) => e.eventId === "family-name-baby")).toBe(true);
  });

  it("adoption adds a child of the chosen age", () => {
    let s = lifeAtAge(35);
    s.player.finance.cash = 50_000;
    s = performAction(s, DEFAULT_CONTENT, "love-adopt", { option: "child" });
    const kid = Object.values(s.npcs).find((n) => n.role === "child");
    expect(kid?.age).toBe(7);
    expect(kid?.tags).toContain("adopted");
  });
});

describe("people actions", () => {
  it("are limited per person per year", () => {
    let s = lifeAtAge(20);
    const mom = Object.values(s.npcs).find((n) => n.role === "mother")!;
    s = performAction(s, DEFAULT_CONTENT, "people-compliment", { npcId: mom.id });
    expect(s.notices).toHaveLength(1);
    const again = performAction(s, DEFAULT_CONTENT, "people-compliment", { npcId: mom.id });
    expect(again).toBe(s);
  });
});

describe("dialogue", () => {
  it("prefers a friend's custom lines, then traits, then generic", () => {
    const friend: FriendConfig = {
      id: "f",
      name: "Fred",
      appearance: { hairStyle: "mod", hairColor: "brown", eyeColor: "blue" },
      traits: ["funny"],
      dialogue: { compliment: ["Custom line!"] },
      roles: ["friend"],
      rarity: 1,
    };
    const content = contentWith([], [friend]);
    const s = lifeAtAge(30, "dlg", content);
    const ctx = ctxFor(s, content);
    const npc = createNpc(s, ctx.rng, ctx.country, { role: "friend", age: 30, traits: ["funny"] });
    npc.friendId = "f";
    expect(npcLine(ctx, npc, "compliment")).toBe("Custom line!");
    const plain = createNpc(s, ctx.rng, ctx.country, { role: "friend", age: 30, traits: ["mean"] });
    expect(["I know.", "Took you long enough to notice."]).toContain(npcLine(ctx, plain, "compliment"));
    const generic = createNpc(s, ctx.rng, ctx.country, { role: "friend", age: 30, traits: [] });
    expect(npcLine(ctx, generic, "compliment")).toBeTruthy();
  });
});
