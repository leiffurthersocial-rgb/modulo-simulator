import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT } from "@/data";
import { yearlyDeathChance } from "@/engine/lifecycle/death";
import { simulateLife } from "@/engine/sim";

describe("mortality", () => {
  const us = DEFAULT_CONTENT.countries.us!;
  const d = { mortality: 1, eventRate: 1, economy: 1 };

  it("risk rises with age and falls with health", () => {
    expect(yearlyDeathChance(30, 70, us, d)).toBeLessThan(yearlyDeathChance(60, 70, us, d));
    expect(yearlyDeathChance(60, 70, us, d)).toBeLessThan(yearlyDeathChance(90, 70, us, d));
    expect(yearlyDeathChance(70, 90, us, d)).toBeLessThan(yearlyDeathChance(70, 30, us, d));
  });

  it("is certain at the max age", () => {
    expect(yearlyDeathChance(122, 100, us, d)).toBe(1);
  });
});

describe("simulated lives", () => {
  it("death ages look like a real population", () => {
    const ages: number[] = [];
    for (let i = 0; i < 300; i++) {
      const s = simulateLife(DEFAULT_CONTENT, { seed: `pop${i}`, year: 2000, countryId: "us" });
      ages.push(s.death!.age);
    }
    ages.sort((a, b) => a - b);
    const mean = ages.reduce((a, b) => a + b, 0) / ages.length;
    const median = ages[Math.floor(ages.length / 2)]!;
    const under40 = ages.filter((a) => a < 40).length / ages.length;
    expect(mean).toBeGreaterThan(68);
    expect(mean).toBeLessThan(85);
    expect(median).toBeGreaterThan(70);
    expect(under40).toBeLessThan(0.12);
    expect(ages.at(-1)!).toBeLessThanOrEqual(122);
  });
});
