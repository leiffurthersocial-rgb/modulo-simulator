import { describe, expect, it } from "vitest";
import { COUNTRY_BY_ID } from "@/data/countries";
import { LIFESTYLE_SHARE, STATE_PENSION, creditLimit, incomeTax, livingCost, payDebtYear, runFinanceYear, yearsToPayOff } from "@/engine/finance";
import type { Debt } from "@/engine/types";
import { lifeAtAge } from "./fixtures";

const us = COUNTRY_BY_ID.us!;

describe("incomeTax", () => {
  it("is zero for no income", () => {
    expect(incomeTax(0, us.taxBrackets)).toBe(0);
  });

  it("applies progressive brackets", () => {
    // 11,600 * 10% + (47,150 - 11,600) * 12% + (50,000 - 47,150) * 22%
    expect(incomeTax(50_000, us.taxBrackets)).toBe(Math.round(1_160 + 4_266 + 627));
  });

  it("only taxes income above a zero-rate bracket", () => {
    const uk = COUNTRY_BY_ID.uk!;
    expect(incomeTax(16_000, uk.taxBrackets)).toBe(0);
    expect(incomeTax(26_000, uk.taxBrackets)).toBe(2_000);
  });

  it("effective rate rises with income", () => {
    const rate = (g: number) => incomeTax(g, us.taxBrackets) / g;
    expect(rate(30_000)).toBeLessThan(rate(100_000));
    expect(rate(100_000)).toBeLessThan(rate(1_000_000));
  });
});

describe("debt", () => {
  it("accrues interest then subtracts the payment", () => {
    const d: Debt = { id: "d", kind: "student", label: "Loan", balance: 10_000, rate: 0.05, yearlyPayment: 2_000 };
    expect(payDebtYear(d)).toBe(2_000);
    expect(d.balance).toBe(8_500);
  });

  it("never overpays the final balance", () => {
    const d: Debt = { id: "d", kind: "car", label: "Car", balance: 500, rate: 0.1, yearlyPayment: 2_000 };
    expect(payDebtYear(d)).toBeCloseTo(550);
    expect(d.balance).toBe(0);
  });

  it("computes payoff time, or Infinity when payments don't cover interest", () => {
    expect(yearsToPayOff(10_000, 0, 2_500)).toBe(4);
    expect(yearsToPayOff(10_000, 0.1, 1_000)).toBe(Infinity);
  });
});

describe("runFinanceYear", () => {
  it("pays salary minus tax to an employed adult living at home", () => {
    const s = lifeAtAge(25);
    s.player.career.job = {
      careerId: "test",
      rank: 0,
      title: "Analyst",
      employer: "Acme",
      salary: 50_000,
      performance: 50,
      yearsInRole: 0,
      yearsAtCompany: 0,
      partTime: false,
    };
    const summary = runFinanceYear(s, us);
    expect(summary.income).toBe(50_000);
    // Living at home there's no rent, but lifestyle spending eats most of the surplus.
    const takeHome = 50_000 - incomeTax(50_000, us.taxBrackets);
    expect(summary.living).toBe(Math.round(takeHome * LIFESTYLE_SHARE));
    expect(s.player.finance.cash).toBe(takeHome - Math.round(takeHome * LIFESTYLE_SHARE));
  });

  it("charges living costs on your own and covers shortfalls with credit, up to a limit", () => {
    const s = lifeAtAge(25);
    s.player.livesWithParents = false;
    s.player.finance.cash = 1_000;
    runFinanceYear(s, us);
    expect(s.player.finance.cash).toBe(0);
    const credit = s.player.finance.debts.find((d) => d.kind === "credit");
    // 1.5% interest on the 1,000 in savings softens the blow slightly.
    const shortfall = livingCost(us, false) - 1_000 - 15;
    const limit = creditLimit(s, us);
    expect(credit?.balance).toBe(Math.min(shortfall, limit));
    // Beyond the limit you go without instead of borrowing more.
    if (shortfall > limit) expect(s.log.at(-1)?.entries.some((e) => e.text.includes("make ends meet"))).toBe(true);
  });

  it("debt can't spiral forever: hopeless debt triggers bankruptcy", () => {
    const s = lifeAtAge(70);
    s.player.livesWithParents = false;
    s.player.finance.debts.push({ id: "c", kind: "credit", label: "Card", balance: 200_000, rate: 0.22, yearlyPayment: 60_000 });
    runFinanceYear(s, us);
    expect(s.player.finance.debts).toHaveLength(0);
    expect(s.player.finance.bankruptcies).toBe(1);
  });

  it("everyone gets a basic state pension from 67", () => {
    const s = lifeAtAge(67);
    expect(runFinanceYear(s, us).other).toBe(STATE_PENSION);
  });

  it("never puts a minor into debt", () => {
    const s = lifeAtAge(12);
    s.player.livesWithParents = false;
    runFinanceYear(s, us);
    expect(s.player.finance.cash).toBe(0);
    expect(s.player.finance.debts).toHaveLength(0);
  });
});

describe("other income", () => {
  it("adds side hustles, pension, and rent to taxable income", () => {
    const s = lifeAtAge(40);
    s.player.sideHustles.push({ id: "x", label: "Reselling", income: 5_000, sinceAge: 30 });
    s.player.finance.pension = 10_000;
    s.player.assets.push({ id: "h", kind: "house", name: "House", value: 200_000, purchasePrice: 200_000, boughtAtAge: 30, condition: 80, yearlyUpkeep: 0, rentedOut: true, catalogId: "starter-home" });
    const summary = runFinanceYear(s, us);
    expect(summary.other).toBe(5_000 + 10_000 + 9_000);
    expect(summary.other).toBeGreaterThan(0);
    expect(summary.tax).toBe(incomeTax(24_000, us.taxBrackets));
    expect(s.player.finance.lastYearTax).toBe(summary.tax);
  });
});

describe("foreclosure", () => {
  it("repossesses a house after two years of missed payments", () => {
    const s = lifeAtAge(40);
    s.player.livesWithParents = false;
    s.player.assets.push({ id: "h", kind: "house", name: "Starter Home", value: 300_000, purchasePrice: 300_000, boughtAtAge: 35, condition: 80, yearlyUpkeep: 0, rentedOut: false, catalogId: "starter-home" });
    s.player.finance.debts.push({ id: "m", kind: "mortgage", label: "Mortgage", balance: 250_000, rate: 0.065, yearlyPayment: 19_000, assetId: "h" });
    runFinanceYear(s, us);
    expect(s.player.assets).toHaveLength(1);
    runFinanceYear(s, us);
    expect(s.player.assets).toHaveLength(0);
    expect(s.player.finance.debts.find((d) => d.kind === "mortgage")).toBeUndefined();
  });
});
