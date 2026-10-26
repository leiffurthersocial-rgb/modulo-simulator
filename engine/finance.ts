import { addLog } from "./log";
import { portfolioValue } from "./market";
import { officeSalary } from "./politics";
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

/** Share of take-home pay above the basics that goes to lifestyle (people spend more as they earn more). */
export const LIFESTYLE_SHARE = 0.8;
/** Yearly cost of raising a child under 18, US baseline. */
export const CHILD_COST = 9_000;

/**
 * Accrue one year of interest and pay up to the scheduled amount from what's available.
 * Returns the amount paid. Unpaid amounts stay on the balance.
 */
export function payDebtYear(debt: Debt, available = Infinity): number {
  const interest = debt.balance * debt.rate;
  const owed = debt.balance + interest;
  const payment = Math.max(0, Math.min(debt.yearlyPayment, owed, available));
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

/** Credit you can run up: a fraction of income, with a floor. */
export function creditLimit(state: GameState, country: Country): number {
  return Math.round(Math.max(8_000 * country.costIndex, state.player.finance.lastYearIncome * 0.6));
}

/** Basic state pension from 67 for everyone, on top of any job pension. */
export const STATE_PENSION = 9_000;

/**
 * Cover a cash shortfall with credit up to your limit. Beyond that you simply go without:
 * no new debt, but it costs you happiness and health.
 */
function coverShortfall(state: GameState, country: Country, shortfall: number): void {
  const fin = state.player.finance;
  fin.cash = 0;
  let credit = fin.debts.find((d) => d.kind === "credit");
  const room = Math.max(0, creditLimit(state, country) - (credit?.balance ?? 0));
  const borrow = Math.min(shortfall, room);
  if (borrow > 0) {
    if (!credit) {
      credit = { id: `debt_credit_${state.player.age}`, kind: "credit", label: "Credit card debt", balance: 0, rate: OVERDRAFT_RATE, yearlyPayment: 0 };
      fin.debts.push(credit);
    }
    credit.balance += borrow;
    credit.yearlyPayment = Math.max(300, Math.round(credit.balance * 0.3));
  }
  if (shortfall > borrow) {
    state.player.stats.happiness = Math.max(0, state.player.stats.happiness - 5);
    state.player.stats.health = Math.max(0, state.player.stats.health - 1);
    state.flags.strapped = state.player.age;
    addLog(state, "You couldn't make ends meet this year. Something always had to give.", "bad");
  }
}

/**
 * Two missed years on a secured loan and the lender takes the asset: it's sold at a
 * discount, the loan is settled, and anything left over comes back to you.
 */
function foreclose(state: GameState): void {
  const { player } = state;
  for (const debt of [...player.finance.debts]) {
    if (!debt.assetId || (debt.missed ?? 0) < 2) continue;
    const asset = player.assets.find((a) => a.id === debt.assetId);
    player.finance.debts = player.finance.debts.filter((d) => d !== debt);
    if (!asset) continue;
    player.assets = player.assets.filter((a) => a !== asset);
    const proceeds = Math.round(asset.value * 0.8);
    if (proceeds > debt.balance) player.finance.cash += Math.round(proceeds - debt.balance);
    player.stats.happiness = Math.max(0, player.stats.happiness - 10);
    state.flags.foreclosed = true;
    addLog(state, `The bank ${asset.kind === "house" ? "foreclosed on" : "repossessed"} your ${asset.name.toLowerCase()} after you missed too many payments.`, "bad");
  }
}

/** When unsecured debt is hopeless, a court steps in. */
function maybeForcedBankruptcy(state: GameState, country: Country): void {
  const fin = state.player.finance;
  const unsecured = fin.debts.filter((d) => !d.assetId).reduce((s, d) => s + d.balance, 0);
  if (unsecured <= Math.max(60_000 * country.costIndex, fin.lastYearIncome * 2.5)) return;
  fin.debts = fin.debts.filter((d) => d.assetId);
  fin.bankruptcies++;
  state.flags.bankruptUntil = state.player.age + 7;
  addLog(state, "Your creditors took you to court. You were declared bankrupt and your unsecured debts were wiped out.", "major");
}

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
  const office = inPrison ? 0 : officeSalary(state, country);
  const statePension = player.age >= 67 ? Math.round(STATE_PENSION * country.costIndex) : 0;
  const other = hustles + rent + businessProfit + fin.pension + office + statePension;
  const income = salary + other;
  // Taxes are assessed on USD-equivalent income against the country's brackets (which are in local-scaled USD terms).
  const tax = incomeTax(income, country.taxBrackets);
  // College housing is folded into tuition.
  const inHigherEd = player.education.enrolled !== undefined && !["elementary", "middle", "high"].includes(player.education.enrolled.level);
  const adultOnOwn = player.age >= 18 && !player.livesWithParents && !inPrison && !inHigherEd;
  const ownsHome = player.assets.some((a) => a.kind === "house" && !a.rentedOut);
  const living = adultOnOwn ? livingCost(country, ownsHome) : 0;
  const upkeep = player.assets.reduce((sum, a) => sum + a.yearlyUpkeep, 0);
  // Lifestyle creep: a share of take-home pay above the basics gets spent, not saved.
  const takeHome = income - tax;
  const lifestyle = player.age >= 18 ? Math.round(Math.max(0, takeHome - living) * LIFESTYLE_SHARE) : 0;
  const kids = Object.values(state.npcs).filter((n) => n.role === "child" && n.alive && n.age < 18).length;
  const childCosts = Math.round(kids * CHILD_COST * country.costIndex);

  const businessLoss = player.business ? Math.min(0, player.business.lastProfit) : 0;
  const interest = fin.cash > 0 ? Math.round(fin.cash * 0.015) : 0;
  fin.cash = Math.round(fin.cash + income + businessLoss + interest - tax - living - lifestyle - childCosts - upkeep);
  fin.lastYearIncome = income;
  fin.lastYearTax = tax;

  // Debts get paid from what's left; whatever can't be paid keeps accruing interest.
  let debtPaid = 0;
  for (const d of fin.debts) {
    const due = Math.min(d.yearlyPayment, d.balance * (1 + d.rate));
    const paid = payDebtYear(d, player.age < 18 ? 0 : Math.max(0, fin.cash));
    fin.cash -= paid;
    debtPaid += paid;
    d.missed = paid + 1 < due ? (d.missed ?? 0) + 1 : 0;
  }
  fin.debts = fin.debts.filter((d) => d.balance > 0.01);
  foreclose(state);
  fin.cash = Math.round(fin.cash);

  if (fin.cash < 0) {
    if (player.age < 18) fin.cash = 0;
    else coverShortfall(state, country, -fin.cash);
  }
  maybeForcedBankruptcy(state, country);

  return { income, salary, other, tax, living: living + lifestyle + childCosts, upkeep, debtPaid };
}

export function totalDebt(state: GameState): number {
  return state.player.finance.debts.reduce((s, d) => s + d.balance, 0);
}

export function netWorth(state: GameState): number {
  const { finance, assets } = state.player;
  const assetValue = assets.reduce((s, a) => s + a.value, 0);
  const business = state.player.business?.value ?? 0;
  return Math.round(finance.cash + assetValue + business + portfolioValue(state) - totalDebt(state));
}
