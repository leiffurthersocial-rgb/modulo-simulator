import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT } from "@/data";
import { CAREERS } from "@/data/careers";
import { amortizedPayment, buyListing, financing, listingsFor, sellAsset } from "@/engine/assets";
import { careerBlocked, hire, hireChance, leaveJob, promote, retire, runCareerYear } from "@/engine/career";
import { careerOf } from "@/engine/content";
import { performAction } from "@/engine/actions";
import { Rng } from "@/engine/rng";
import { lifeAtAge } from "./fixtures";

const us = DEFAULT_CONTENT.countries.us!;
const def = (id: string) => careerOf(DEFAULT_CONTENT, id)!;

describe("career catalog", () => {
  it("has 60+ careers with unique ids and ladders", () => {
    expect(CAREERS.length).toBeGreaterThanOrEqual(60);
    expect(new Set(CAREERS.map((c) => c.id)).size).toBe(CAREERS.length);
    for (const c of CAREERS) {
      expect(c.ranks.length).toBeGreaterThan(0);
      for (let i = 1; i < c.ranks.length; i++) expect(c.ranks[i]!.salary).toBeGreaterThan(c.ranks[i - 1]!.salary);
    }
  });
});

describe("hiring", () => {
  it("checks degrees, programs, age, and record", () => {
    const s = lifeAtAge(25);
    expect(careerBlocked(s, def("software"))).toMatch(/degree/);
    expect(careerBlocked(s, def("fast-food"))).toBeUndefined();
    s.player.education.degrees.push({ level: "college", major: "Computer Science", institution: "U", graduatedAtAge: 22, honors: false });
    expect(careerBlocked(s, def("software"))).toBeUndefined();
    s.player.crime.record.push({ crime: "Theft", age: 20, convicted: true, sentenceYears: 1 });
    expect(careerBlocked(s, def("police"))).toMatch(/record/);
    expect(careerBlocked(lifeAtAge(12), def("fast-food"))).toMatch(/at least/);
  });

  it("odds are bounded and harder for competitive careers", () => {
    const s = lifeAtAge(25);
    expect(hireChance(s, def("fast-food"))).toBeGreaterThan(hireChance(s, def("banker")));
    for (const c of CAREERS) {
      expect(hireChance(s, c)).toBeGreaterThanOrEqual(0.05);
      expect(hireChance(s, c)).toBeLessThanOrEqual(0.95);
    }
  });

  it("hiring creates a job, a boss and a coworker; leaving records history", () => {
    const s = lifeAtAge(25);
    hire(s, Rng.fromSeed("hire"), DEFAULT_CONTENT, us, def("retail"));
    expect(s.player.career.job?.title).toBe("Sales Associate");
    expect(Object.values(s.npcs).some((n) => n.role === "boss")).toBe(true);
    leaveJob(s, "quit");
    expect(s.player.career.job).toBeUndefined();
    expect(s.player.career.history[0]?.reason).toBe("quit");
    expect(Object.values(s.npcs).filter((n) => n.role === "boss" && n.inContact)).toHaveLength(0);
  });

  it("promotes high performers over time", () => {
    const s = lifeAtAge(25);
    const rng = Rng.fromSeed("promo");
    hire(s, rng, DEFAULT_CONTENT, us, def("accountant"));
    expect(promote(s, rng, us, def("accountant"))).toBe(true);
    expect(s.player.career.job?.title).toBe("Staff Accountant");
    let promotions = 0;
    for (let i = 0; i < 20; i++) {
      s.player.career.job!.performance = 95;
      const before = s.player.career.job!.rank;
      runCareerYear(s, rng, DEFAULT_CONTENT, us);
      if (s.player.career.job && s.player.career.job.rank > before) promotions++;
      if (!s.player.career.job) break;
    }
    expect(promotions).toBeGreaterThan(0);
  });

  it("retiring grants a pension based on salary and years", () => {
    const s = lifeAtAge(60);
    hire(s, Rng.fromSeed("ret"), DEFAULT_CONTENT, us, def("teacher"));
    s.player.career.job!.yearsAtCompany = 30;
    const salary = s.player.career.job!.salary;
    expect(retire(s)).toBe(Math.round(salary * 0.45));
    expect(s.player.career.retired).toBe(true);
  });

  it("find-a-job action hires or rejects", () => {
    let s = lifeAtAge(20);
    s.player.stats.smarts = 90;
    s.player.skills.charisma = 80;
    s = performAction(s, DEFAULT_CONTENT, "career-find-job", { option: "fast-food" });
    expect(s.notices[0]?.title).toMatch(/Hired|No offer/);
  });
});

describe("assets", () => {
  it("amortizes loans correctly", () => {
    // 100k over 30 years at 6.5% is ~7,658/yr.
    expect(amortizedPayment(100_000, 0.065, 30)).toBeGreaterThan(7_600);
    expect(amortizedPayment(100_000, 0.065, 30)).toBeLessThan(7_700);
    expect(amortizedPayment(10_000, 0, 5)).toBe(2_000);
  });

  it("buys a house with a mortgage when cash covers the down payment, and selling clears the loan", () => {
    const s = lifeAtAge(35);
    s.player.finance.lastYearIncome = 200_000;
    const listing = listingsFor(s, us, ["house"], 7).sort((a, b) => a.price - b.price)[0]!;
    s.player.finance.cash = Math.round(listing.price * 0.25);
    const plan = financing(s, listing);
    expect(plan.kind).toBe("loan");
    const asset = buyListing(s, Rng.fromSeed("buy"), us, listing)!;
    expect(s.player.finance.debts.find((d) => d.assetId === asset.id)?.kind).toBe("mortgage");
    sellAsset(s, asset.id);
    expect(s.player.finance.debts.find((d) => d.assetId === asset.id)).toBeUndefined();
    expect(s.player.assets).toHaveLength(0);
  });

  it("listings are stable within a year", () => {
    const s = lifeAtAge(30);
    expect(listingsFor(s, us, ["car"], 5)).toEqual(listingsFor(s, us, ["car"], 5));
  });
});
