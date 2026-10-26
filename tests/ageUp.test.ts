import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT } from "@/data";
import { ageUp, canAgeUp } from "@/engine/lifecycle/ageUp";
import { choose } from "@/engine/game";
import { defineEvents, fx } from "@/engine/events/helpers";
import { newLife } from "@/engine/lifecycle/newLife";
import { simulateLife } from "@/engine/sim";
import { contentWith, freshLife } from "./fixtures";

describe("newLife", () => {
  it("is deterministic for a seed", () => {
    const a = newLife(DEFAULT_CONTENT, { seed: "same", year: 2000 });
    const b = newLife(DEFAULT_CONTENT, { seed: "same", year: 2000 });
    expect(a).toEqual(b);
  });

  it("creates a newborn with parents, stats in range, and a birth log", () => {
    const s = freshLife("family");
    expect(s.player.age).toBe(0);
    expect(Object.values(s.npcs).some((n) => n.role === "mother")).toBe(true);
    for (const v of Object.values(s.player.stats)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
    expect(s.log[0]?.age).toBe(0);
    expect(s.log[0]?.entries[0]?.text).toMatch(/You were born/);
  });

  it("respects explicit options", () => {
    const s = newLife(DEFAULT_CONTENT, {
      seed: "opts",
      year: 1990,
      countryId: "jp",
      gender: "female",
      firstName: "Aiko",
      appearance: { hairStyle: "bun" },
    });
    expect(s.player.countryId).toBe("jp");
    expect(s.player.gender).toBe("female");
    expect(s.player.pronouns).toBe("she");
    expect(s.player.firstName).toBe("Aiko");
    expect(s.player.appearance.hairStyle).toBe("bun");
    expect(s.player.birthYear).toBe(1990);
  });
});

describe("ageUp", () => {
  it("advances age and year and opens a new log section", () => {
    const s0 = freshLife("age");
    const s1 = ageUp(s0, DEFAULT_CONTENT);
    expect(s1.player.age).toBe(1);
    expect(s1.year).toBe(s0.year + 1);
    expect(s1.log[s1.log.length - 1]?.age).toBe(1);
  });

  it("never mutates the previous state", () => {
    const s0 = freshLife("pure");
    const snapshot = structuredClone(s0);
    ageUp(s0, DEFAULT_CONTENT);
    expect(s0).toEqual(snapshot);
  });

  it("ages NPCs alongside the player", () => {
    const s0 = freshLife("npcs");
    const mom0 = Object.values(s0.npcs).find((n) => n.role === "mother")!;
    const s1 = ageUp(s0, DEFAULT_CONTENT);
    const mom1 = s1.npcs[mom0.id]!;
    if (mom1.alive) expect(mom1.age).toBe(mom0.age + 1);
  });

  it("is blocked while a popup is pending, and resumes after choosing", () => {
    const events = defineEvents("random", [
      {
        id: "always",
        ages: [1, 1],
        weight: 1000,
        text: "Pick one.",
        choices: [
          { id: "a", label: "A", outcomes: [{ text: "You picked A.", effects: [fx.flag("picked", "a")] }] },
          { id: "b", label: "B", outcomes: [{ text: "You picked B." }] },
        ],
      },
    ]);
    const content = contentWith(events);
    // Find a seed where the year rolls at least one event (count > 0).
    let s = freshLife("block", content);
    for (let i = 0; i < 50 && s.pending.length === 0; i++) s = ageUp(freshLife(`block${i}`, content), content);
    expect(s.pending).toHaveLength(1);
    expect(canAgeUp(s)).toBe(false);
    expect(ageUp(s, content)).toBe(s);

    const p = s.pending[0]!;
    const after = choose(s, content, p.uid, "a");
    expect(after.pending).toHaveLength(0);
    expect(after.flags.picked).toBe("a");
    expect(after.log.at(-1)?.entries.at(-1)?.text).toBe("You picked A.");
    expect(canAgeUp(after)).toBe(true);
  });

  it("enrolls in school automatically and graduates high school at 18", () => {
    let s = freshLife("school");
    s.difficulty.mortality = 0;
    s.difficulty.eventRate = 0;
    const content = contentWith([]);
    for (let i = 0; i < 6; i++) s = ageUp(s, content);
    expect(s.player.education.enrolled?.level).toBe("elementary");
    for (let i = 0; i < 5; i++) s = ageUp(s, content);
    expect(s.player.education.enrolled?.level).toBe("middle");
    for (let i = 0; i < 3; i++) s = ageUp(s, content);
    expect(s.player.education.enrolled?.level).toBe("high");
    for (let i = 0; i < 4; i++) s = ageUp(s, content);
    expect(s.player.age).toBe(18);
    expect(s.player.education.enrolled).toBeUndefined();
    expect(s.player.education.degrees.map((d) => d.level)).toEqual(["elementary", "middle", "high"]);
  });

  it("fires scheduled callback events with their bound NPC", () => {
    const events = defineEvents("random", [
      {
        id: "plant",
        ages: [0, 0],
        triggeredOnly: true,
        npc: { kind: "existing", roles: ["mother"] },
        text: "Planted.",
        effects: [fx.schedule("payoff", 3, true)],
      },
      { id: "payoff", ages: [0, 120], triggeredOnly: true, text: "{npc} remembers.", effects: [fx.flag("paid")] },
    ]);
    const content = contentWith(events);
    let s = freshLife("callback", content);
    s.difficulty.mortality = 0;
    const mom = Object.values(s.npcs).find((n) => n.role === "mother")!;
    s.scheduled.push({ eventId: "plant", atAge: 1, npcId: mom.id });
    s = ageUp(s, content);
    expect(s.scheduled).toEqual([expect.objectContaining({ eventId: "payoff", atAge: 4, npcId: mom.id })]);
    for (let i = 0; i < 3; i++) s = ageUp(s, content);
    expect(s.flags.paid).toBe(true);
    expect(s.log.at(-1)?.entries.some((e) => e.text === `${mom.firstName} remembers.`)).toBe(true);
  });

  it("is reproducible: same seed and same choices give the same life", () => {
    const a = simulateLife(DEFAULT_CONTENT, { seed: "repro", year: 2000 });
    const b = simulateLife(DEFAULT_CONTENT, { seed: "repro", year: 2000 });
    expect(a).toEqual(b);
    expect(a.status).toBe("dead");
    expect(a.death).toBeDefined();
  });

  it("does nothing after death", () => {
    const dead = simulateLife(DEFAULT_CONTENT, { seed: "afterlife", year: 2000 });
    expect(ageUp(dead, DEFAULT_CONTENT)).toBe(dead);
  });
});
