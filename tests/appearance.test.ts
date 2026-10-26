import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT } from "@/data";
import { HAIR_BY_PRESENTATION, fitAppearanceToGender, inheritAppearance, randomAppearance } from "@/engine/appearance";
import { newLife } from "@/engine/lifecycle/newLife";
import { createNpc } from "@/engine/npc";
import { Rng } from "@/engine/rng";
import type { Appearance, Gender } from "@/engine/types";
import { lifeAtAge } from "./fixtures";

function expectFits(a: Appearance, gender: Gender) {
  if (gender === "female") {
    expect(a.presentation).toBe("feminine");
    expect(a.facialHair).toBe("none");
    expect(HAIR_BY_PRESENTATION.feminine).toContain(a.hairStyle);
  } else if (gender === "male") {
    expect(a.presentation).toBe("masculine");
    expect(HAIR_BY_PRESENTATION.masculine).toContain(a.hairStyle);
  }
}

describe("gender-accurate appearances", () => {
  it("random appearances always match the gender", () => {
    const rng = Rng.fromSeed("looks");
    for (let i = 0; i < 3_000; i++) {
      const g: Gender = i % 2 ? "male" : "female";
      expectFits(randomAppearance(rng, g), g);
    }
  });

  it("children inherit coloring but still match their own gender", () => {
    const rng = Rng.fromSeed("inherit");
    for (let i = 0; i < 1_000; i++) {
      const mom = randomAppearance(rng, "female");
      const dad = randomAppearance(rng, "male");
      const g: Gender = i % 2 ? "male" : "female";
      expectFits(inheritAppearance(rng, g, [mom, dad]), g);
    }
  });

  it("fitting fixes a mismatched appearance", () => {
    const rng = Rng.fromSeed("fit");
    const bearded = { ...randomAppearance(rng, "male"), hairStyle: "buzz" as const, facialHair: "beard" as const };
    expectFits(fitAppearanceToGender(rng, bearded, "female"), "female");
    const ponytail = { ...randomAppearance(rng, "female"), hairStyle: "ponytail" as const };
    expectFits(fitAppearanceToGender(rng, ponytail, "male"), "male");
  });

  it("every generated NPC and family member looks like their gender", () => {
    for (let i = 0; i < 200; i++) {
      const s = newLife(DEFAULT_CONTENT, { seed: `fam${i}`, year: 2000 });
      expectFits(s.player.appearance, s.player.gender);
      for (const n of Object.values(s.npcs)) expectFits(n.appearance, n.gender);
    }
    const s = lifeAtAge(30);
    const rng = Rng.fromSeed("npcs");
    for (let i = 0; i < 1_000; i++) {
      const npc = createNpc(s, rng, DEFAULT_CONTENT.countries.us!, { role: "coworker", age: 30 });
      expectFits(npc.appearance, npc.gender);
    }
  });

  it("parents are a woman and a man", () => {
    for (let i = 0; i < 100; i++) {
      const s = newLife(DEFAULT_CONTENT, { seed: `par${i}`, year: 2000 });
      const npcs = Object.values(s.npcs);
      expect(npcs.find((n) => n.role === "mother")?.gender).toBe("female");
      const dad = npcs.find((n) => n.role === "father");
      if (dad) expect(dad.gender).toBe("male");
    }
  });
});
