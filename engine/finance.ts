import type { Country, Debt, GameState, TaxBracket } from "./types";

/** Progressive income tax on a gross yearly income. */
export function incomeTax(gross: number, brackets: readonly TaxBracket[]): number {
  if (gross <= 0) return 0;
  let tax = 0;
  for (let i = 0; i < brackets.length; i++) {
    const b = brackets[i]!;
    const next = brackets[i + 1]?.from ?? Infinity;
    if (gross <= b.from) break;
    tax += (Math.min(gross, next) - b.from) * b.rate;
  }
  return Math.round(tax);
}

/** Baseline yearly cost of living on your own (rent, food, bills), before the country index. */
export const BASE_LIVING_COST = 18_000;

export function livingCost(country: Country, ownsHome: boolean): number {
  // Homeowners pay upkeep on the asset instead of rent.
  return Math.round(BASE_LIVING_COST * country.costIndex * (ownsHome ? 0.55 : 1));
}

/** Accrue one year of interest and take the scheduled payment. Returns the amount paid. */
export function payDebtYear(debt: Debt): number {
  const interest = debt.balance * debt.rate;
  const owed = debt.balance + interest;
  const payment = Math.min(debt.yearlyPayment, owed);
  debt.balance = Math.round((owed - payment) * 100) / 100;
  return payment;
}

/** Years to pay off a debt at its scheduled payment, or Infinity if the payment never covers interest. */
export function yearsToPayOff(balance: number, rate: number, yearlyPayment: number): number {
  if (balance <= 0) return 0;
  if (yearlyPayment <= balance * rate) return Infinity;
  let years = 0;
  let b = balance;
  while (b > 0.005 && years < 1000) {
    b = b * (1 + rate) - yearlyPayment;
    years++;
  }
  return years;
}

export interface FinanceSummary {
  income: number;
  salary: number;
  other: number;
  tax: number;
  living: number;
  upkeep: number;
  debtPaid: number;
}

/** Credit rate charged when cash goes negative and gets rolled into debt. */
export const OVERDRAFT_RATE = 0.22;

/** Run one year of money: income, tax, living costs, upkeep, debt service. Mutates state. */
export function runFinanceYear(state: GameState, country: Country): FinanceSummary {
  const { player } = state;
  const fin = player.finance;
  const job = player.career.job;
  const inPrison = player.crime.prison !== undefined;

  const salary = job && !inPrison ? Math.round(job.salary) : 0;
  const hustles = inPrison ? 0 : player.sideHustles.reduce((s, h) => s + h.income, 0);
  const rent = player.assets.filter((a) => a.kind === "house" && a.rentedOut).reduce((s, a) => s + Math.round(a.value * 0.045), 0);
  const businessProfit = player.business ? Math.max(0, player.business.lastProfit) : 0;
  const other = hustles + rent + businessProfit + fin.pension;
  const income = salary + other;
  // Taxes are assessed on USD-equivalent income against the country's brackets (which are in local-scaled USD terms).
  const tax = incomeTax(income, country.taxBrackets);
  // College housing is folded into tuition.
  const inHigherEd = player.education.enrolled !== undefined && !["elementary", "middle", "high"].includes(player.education.enrolled.level);
  const adultOnOwn = player.age >= 18 && !player.livesWithParents && !inPrison && !inHigherEd;
  const ownsHome = player.assets.some((a) => a.kind === "house" && !a.rentedOut);
  const living = adultOnOwn ? livingCost(country, ownsHome) : 0;
  const upkeep = player.assets.reduce((sum, a) => sum + a.yearlyUpkeep, 0);

  let debtPaid = 0;
  for (const d of fin.debts) debtPaid += payDebtYear(d);
  fin.debts = fin.debts.filter((d) => d.balance > 0.01);

  const businessLoss = player.business ? Math.min(0, player.business.lastProfit) : 0;
  const interest = fin.cash > 0 ? Math.round(fin.cash * 0.015) : 0;
  fin.cash = Math.round(fin.cash + income + businessLoss + interest - tax - living - upkeep - debtPaid);
  fin.lastYearIncome = income;
  fin.lastYearTax = tax;

  if (fin.cash < 0) {
    if (player.age < 18) {
      fin.cash = 0;
    } else {
      const shortfall = -fin.cash;
      fin.cash = 0;
      const credit = fin.debts.find((d) => d.kind === "credit");
      if (credit) {
        credit.balance += shortfall;
        credit.yearlyPayment = Math.max(credit.yearlyPayment, Math.round(credit.balance * 0.3));
      } else {
        fin.debts.push({
          id: `debt_credit_${player.age}`,
          kind: "credit",
          label: "Credit card debt",
          balance: shortfall,
          rate: OVERDRAFT_RATE,
          yearlyPayment: Math.max(300, Math.round(shortfall * 0.3)),
        });
      }
    }
  }

  return { income, salary, other, tax, living, upkeep, debtPaid };
}

export function totalDebt(state: GameState): number {
  return state.player.finance.debts.reduce((s, d) => s + d.balance, 0);
}

export function netWorth(state: GameState): number {
  const { finance, assets } = state.player;
  const assetValue = assets.reduce((s, a) => s + a.value, 0);
  return Math.round(finance.cash + assetValue - totalDebt(state));
}
