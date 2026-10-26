import { describe, expect, it } from "vitest";
import { ALL_EVENTS } from "@/data/events";
import { defineEvents, fx, when } from "@/engine/events/helpers";
import { EventRegistry, validateEvents } from "@/engine/events/registry";
import { isEligible } from "@/engine/events/select";
import { fillPlaceholders, renderText } from "@/engine/events/template";
import { createNpc } from "@/engine/npc";
import { applyEffects } from "@/engine/events/effects";
import type { GameEvent, TextTemplate } from "@/engine/types";
import { ctxFor, lifeAtAge } from "./fixtures";

const base: GameEvent = { id: "e", category: "random", ages: [5, 10], text: "Hi." };

describe("event eligibility", () => {
  it("filters by age range", () => {
    expect(isEligible(base, ctxFor(lifeAtAge(4)))).toBe(false);
    expect(isEligible(base, ctxFor(lifeAtAge(5)))).toBe(true);
    expect(isEligible(base, ctxFor(lifeAtAge(10)))).toBe(true);
    expect(isEligible(base, ctxFor(lifeAtAge(11)))).toBe(false);
  });

  it("applies conditions", () => {
    const s = lifeAtAge(7);
    const e = { ...base, condition: when.flag("rich") };
    expect(isEligible(e, ctxFor(s))).toBe(false);
    s.flags.rich = true;
    expect(isEligible(e, ctxFor(s))).toBe(true);
  });

  it("honors once, cooldown, and never repeats within a year", () => {
    const s = lifeAtAge(8);
    s.fired.e = [6];
    expect(isEligible({ ...base, once: true }, ctxFor(s))).toBe(false);
    expect(isEligible({ ...base, cooldown: 3 }, ctxFor(s))).toBe(false);
    expect(isEligible({ ...base, cooldown: 2 }, ctxFor(s))).toBe(true);
    s.fired.e = [8];
    expect(isEligible(base, ctxFor(s))).toBe(false);
  });

  it("separates free and prison events", () => {
    const s = lifeAtAge(30);
    const adult = { ...base, ages: [18, 80] as const };
    expect(isEligible(adult, ctxFor(s))).toBe(true);
    expect(isEligible({ ...adult, where: "prison" }, ctxFor(s))).toBe(false);
    s.player.crime.prison = { facility: "State Pen", yearsLeft: 2, totalYears: 3, respect: 10, paroleEligibleAtAge: 31 };
    expect(isEligible(adult, ctxFor(s))).toBe(false);
    expect(isEligible({ ...adult, where: "prison" }, ctxFor(s))).toBe(true);
    expect(isEligible({ ...adult, where: "any" }, ctxFor(s))).toBe(true);
  });

  it("excludes triggered-only events from the random pool", () => {
    expect(isEligible({ ...base, triggeredOnly: true }, ctxFor(lifeAtAge(7)))).toBe(false);
    const reg = new EventRegistry([{ ...base, triggeredOnly: true }]);
    expect(reg.forAge(7)).toHaveLength(0);
    expect(reg.get("e")).toBeDefined();
  });
});

describe("event validation", () => {
  it("rejects duplicate ids, bad ages, bad choice counts, and dangling references", () => {
    const problems = validateEvents([
      base,
      base,
      { ...base, id: "ages", ages: [10, 5] },
      { ...base, id: "one", choices: [{ label: "Only", outcomes: [{}] }] },
      { ...base, id: "ref", effects: [fx.schedule("nope", 2)] },
    ]);
    expect(problems.some((p) => p.includes("Duplicate"))).toBe(true);
    expect(problems.some((p) => p.includes("invalid ages"))).toBe(true);
    expect(problems.some((p) => p.includes("2-4 choices"))).toBe(true);
    expect(problems.some((p) => p.includes('unknown event "nope"'))).toBe(true);
  });

  it("all shipped content is valid", () => {
    expect(validateEvents(ALL_EVENTS)).toEqual([]);
  });
});

describe("templates", () => {
  it("fills player, money, and pronoun placeholders", () => {
    const s = lifeAtAge(30);
    const ctx = ctxFor(s);
    ctx.npc = createNpc(s, ctx.rng, ctx.country, { role: "friend", age: 30, gender: "female", firstName: "Dana" });
    expect(fillPlaceholders("{first} met {npc}. {npc.He} {npc.is} {npc.age}.", ctx)).toBe(
      `${s.player.firstName} met Dana. She is 30.`,
    );
    expect(fillPlaceholders("It cost {money:1500}.", ctx)).toBe("It cost $1,500.");
    ctx.npc.pronouns = "they";
    expect(fillPlaceholders("{npc.He} like{npc.s} {npc.his} cat.", ctx)).toBe("They like their cat.");
  });

  it("formats money in the local currency", () => {
    const s = lifeAtAge(30);
    s.player.countryId = "de";
    expect(fillPlaceholders("{money:100}", ctxFor(s))).toBe("74 €");
  });

  it("leaves unknown placeholders intact", () => {
    expect(fillPlaceholders("{nonsense}", ctxFor(lifeAtAge(5)))).toBe("{nonsense}");
  });

  it("every shipped event renders without leftover placeholders", () => {
    // Mirror the real order: an event's effects run before its text, an outcome's effects before its text.
    const base = lifeAtAge(30);
    base.player.education.enrolled = { level: "college", institution: "Test U", major: "History", year: 1, length: 4, performance: 50, tuitionPerYear: 0, scholarship: false };
    for (const e of ALL_EVENTS) {
      const s = structuredClone(base);
      const ctx = ctxFor(s);
      ctx.npc = createNpc(s, ctx.rng, ctx.country, { role: "friend", age: 30 });
      ctx.vars.amount = 100;
      Object.assign(ctx.vars, e.expects);
      applyEffects(e.effects, ctx);
      const check = (t: TextTemplate | undefined) => {
        if (t === undefined) return;
        const variants = typeof t === "string" || typeof t === "function" ? [t] : t;
        for (const v of variants) expect(renderText(v, ctx), `${e.id}: ${String(v)}`).not.toMatch(/[{}]/);
      };
      check(e.text);
      check(e.title);
      for (const c of e.choices ?? []) {
        check(c.label);
        for (const o of c.outcomes) {
          applyEffects(o.effects, ctx);
          check(o.text);
        }
      }
    }
  });
});

describe("defineEvents", () => {
  it("stamps categories without overriding explicit ones", () => {
    const evs = defineEvents("school", [
      { id: "a", ages: [6, 10], text: "a" },
      { id: "b", ages: [6, 10], text: "b", category: "callback" },
    ]);
    expect(evs.map((e) => e.category)).toEqual(["school", "callback"]);
  });
});
