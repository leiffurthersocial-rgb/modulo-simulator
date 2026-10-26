import { defineActions } from "@/engine/actionHelpers";
import { totalDebt } from "@/engine/finance";
import { adjustStat } from "@/engine/stats";
import type { EventContext } from "@/engine/types";
import { formatMoney } from "@/engine/util";

const LOANS = [5_000, 20_000, 50_000];
const PERSONAL_RATE = 0.12;
const unsecuredDebt = (ctx: EventContext) => ctx.player.finance.debts.filter((d) => !d.assetId).reduce((s, d) => s + d.balance, 0);
const badCredit = (ctx: EventContext) => ctx.state.flags.bankruptUntil !== undefined && Number(ctx.state.flags.bankruptUntil) > ctx.player.age;

export const MONEY_ACTIONS = defineActions("money", [
  {
    id: "money-loan",
    group: "Bank",
    label: "Take out a personal loan",
    icon: "Landmark",
    perYear: 1,
    visible: (ctx) => ctx.player.age >= 18 && !ctx.player.crime.prison,
    blocked: (ctx) => (badCredit(ctx) ? "Your credit is ruined after bankruptcy." : undefined),
    options: (ctx) =>
      LOANS.map((amount) => {
        const local = Math.round(amount * ctx.country.costIndex);
        const yearly = Math.round(local * 0.28);
        const maxAllowed = Math.max(ctx.player.finance.lastYearIncome * 0.8, 3_000 * ctx.country.costIndex);
        return {
          id: String(amount),
          label: formatMoney(ctx.country, local),
          description: `12% interest · ${formatMoney(ctx.country, yearly)}/yr for about 5 years`,
          blocked: local > maxAllowed ? "The bank thinks your income is too low." : undefined,
          icon: "Landmark",
        };
      }),
    run(ctx, p) {
      const local = Math.round(Number(p.option) * ctx.country.costIndex);
      ctx.player.finance.cash += local;
      ctx.player.finance.debts.push({ id: ctx.rng.id("d_"), kind: "personal", label: "Personal loan", balance: local, rate: PERSONAL_RATE, yearlyPayment: Math.round(local * 0.28) });
      return { text: `The bank approved a ${formatMoney(ctx.country, local)} loan. Spend it wisely. (You won't.)` };
    },
  },
  {
    id: "money-pay-debt",
    group: "Bank",
    label: "Pay off a debt",
    icon: "HandCoins",
    visible: (ctx) => ctx.player.finance.debts.length > 0,
    options: (ctx) =>
      ctx.player.finance.debts.map((d) => ({
        id: d.id,
        label: d.label,
        price: Math.round(d.balance),
        blocked: ctx.player.finance.cash < d.balance ? "Not enough cash to pay it off in full." : undefined,
        icon: "HandCoins",
      })),
    run(ctx, p) {
      const debt = ctx.player.finance.debts.find((d) => d.id === p.option);
      if (!debt || ctx.player.finance.cash < debt.balance) return;
      ctx.player.finance.cash -= Math.round(debt.balance);
      ctx.player.finance.debts = ctx.player.finance.debts.filter((d) => d.id !== debt.id);
      adjustStat(ctx.player, "happiness", 5);
      if (totalDebt(ctx.state) === 0) ctx.state.flags.debtFree = true;
      return { text: `You paid off your ${debt.label.toLowerCase()}. What a feeling.`, tone: "good" };
    },
  },
  {
    id: "money-bankruptcy",
    group: "Bank",
    label: "Declare bankruptcy",
    description: "Wipes unsecured debts. Ruins your credit for 7 years.",
    icon: "AlertTriangle",
    visible: (ctx) => unsecuredDebt(ctx) > 20_000 * ctx.country.costIndex && ctx.player.finance.cash < unsecuredDebt(ctx) * 0.2,
    run(ctx) {
      const wiped = unsecuredDebt(ctx);
      const fin = ctx.player.finance;
      fin.debts = fin.debts.filter((d) => d.assetId);
      // The court liquidates luxuries; you keep one car and your home.
      const keep = new Set<string>();
      const car = ctx.player.assets.find((a) => a.kind === "car");
      if (car) keep.add(car.id);
      for (const a of ctx.player.assets) if (a.kind === "house" || a.kind === "pet") keep.add(a.id);
      ctx.player.assets = ctx.player.assets.filter((a) => keep.has(a.id));
      fin.bankruptcies++;
      ctx.state.flags.bankruptUntil = ctx.player.age + 7;
      adjustStat(ctx.player, "happiness", -10);
      return { title: "Bankrupt", text: `A judge discharged ${formatMoney(ctx.country, wiped)} of your debts. Your luxuries were sold and your credit is in ruins.`, tone: "major" };
    },
  },
]);
