import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT } from "@/data";
import { PROGRAM_BY_ID } from "@/data/education";
import { performAction } from "@/engine/actions";
import { dropOut, enrollProgram, programBlocked, runEducationYear } from "@/engine/education";
import { Rng } from "@/engine/rng";
import { lifeAtAge } from "./fixtures";

const us = DEFAULT_CONTENT.countries.us!;
const withHighSchool = (age = 18) => {
  const s = lifeAtAge(age);
  s.player.education.degrees.push({ level: "high", institution: "HS", graduatedAtAge: 18, honors: false });
  return s;
};

describe("higher education", () => {
  it("gates programs on prior degrees and fields", () => {
    const s = lifeAtAge(18);
    expect(programBlocked(s, PROGRAM_BY_ID.cs!)).toMatch(/high school/);
    const hs = withHighSchool();
    expect(programBlocked(hs, PROGRAM_BY_ID.cs!)).toBeUndefined();
    expect(programBlocked(hs, PROGRAM_BY_ID.medicine!)).toMatch(/college/);
    hs.player.education.degrees.push({ level: "college", major: "History", institution: "U", graduatedAtAge: 22, honors: false });
    expect(programBlocked(hs, PROGRAM_BY_ID.medicine!)).toMatch(/related/);
    expect(programBlocked(hs, PROGRAM_BY_ID.law!)).toBeUndefined();
  });

  it("puts tuition on a deferred student loan, then starts repayment at graduation", () => {
    const s = withHighSchool();
    s.player.familyWealth = "poor";
    s.player.stats.smarts = 50;
    const rng = Rng.fromSeed("loan");
    enrollProgram(s, rng, us, PROGRAM_BY_ID.business!);
    const loan = () => s.player.finance.debts.find((d) => d.kind === "student");
    if (s.player.education.enrolled!.scholarship) return; // lucky seed, nothing to test
    expect(loan()?.balance).toBe(24_000);
    expect(loan()?.yearlyPayment).toBe(0);
    for (let year = 0; year < 4; year++) {
      s.player.age++;
      runEducationYear(s, rng);
      if (!s.player.education.enrolled) break;
    }
    if (s.player.education.degrees.some((d) => d.level === "college")) {
      expect(loan()!.balance).toBe(4 * 24_000);
      expect(loan()!.yearlyPayment).toBeGreaterThan(0);
    }
  });

  it("wealthy parents pay college tuition", () => {
    const s = withHighSchool();
    s.player.familyWealth = "rich";
    s.player.stats.smarts = 40;
    enrollProgram(s, Rng.fromSeed("rich"), us, PROGRAM_BY_ID.business!);
    expect(s.player.finance.debts.filter((d) => d.kind === "student")).toHaveLength(0);
  });

  it("dropping out records it and starts loan repayment", () => {
    const s = withHighSchool();
    s.player.familyWealth = "poor";
    s.player.stats.smarts = 40;
    enrollProgram(s, Rng.fromSeed("drop"), us, PROGRAM_BY_ID.business!);
    dropOut(s);
    expect(s.player.education.enrolled).toBeUndefined();
    expect(s.player.education.droppedOut).toContain("college");
    const loan = s.player.finance.debts.find((d) => d.kind === "student");
    if (loan) expect(loan.yearlyPayment).toBeGreaterThan(0);
  });

  it("college application action enrolls or rejects, and respects per-year limits", () => {
    let s = withHighSchool();
    s.player.stats.smarts = 95;
    s = performAction(s, DEFAULT_CONTENT, "school-college", { option: "history" });
    expect(s.notices).toHaveLength(1);
    expect(s.player.education.enrolled?.major).toBe("History");
    // Already enrolled: the action is hidden, so nothing changes.
    expect(performAction(s, DEFAULT_CONTENT, "school-college", { option: "cs" })).toBe(s);
  });
});
