import { describe, expect, it } from "vitest";
import { COUNTRY_BY_ID } from "@/data/countries";
import { incomeTax, livingCost, netWorth, payDebtYear, runFinanceYear, yearsToPayOff } from "@/engine/finance";
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
    expect(summary.living).toBe(0);
    expect(s.player.finance.cash).toBe(50_000 - incomeTax(50_000, us.taxBrackets));
  });

  it("charges living costs on your own and rolls shortfalls into credit card debt", () => {
    const s = lifeAtAge(25);
    s.player.livesWithParents = false;
    s.player.finance.cash = 1_000;
    runFinanceYear(s, us);
    expect(s.player.finance.cash).toBe(0);
    const credit = s.player.finance.debts.find((d) => d.kind === "credit");
    expect(credit?.balance).toBe(livingCost(us, false) - 1_000);
    expect(netWorth(s)).toBe(-(livingCost(us, false) - 1_000));
  });

  it("never puts a minor into debt", () => {
    const s = lifeAtAge(12);
    s.player.livesWithParents = false;
    runFinanceYear(s, us);
    expect(s.player.finance.cash).toBe(0);
    expect(s.player.finance.debts).toHaveLength(0);
  });
});
