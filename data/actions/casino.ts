import { SECURITY_BY_SYMBOL } from "@/data/market";
import { defineActions, pay } from "@/engine/actionHelpers";
import { buy, sell } from "@/engine/market";
import { adjustStat } from "@/engine/stats";
import type { EventContext } from "@/engine/types";
import { clamp, formatMoney } from "@/engine/util";

const gamblingAge = (ctx: EventContext) => ctx.player.age >= 18;
const feedHabit = (ctx: EventContext, amount: number) => {
  const add = ctx.player.health.addictions;
  add.gambling = clamp((add.gambling ?? 0) + amount);
};

/** Max multiple of the stake any casino game can pay (slots jackpot). */
const MAX_MULTIPLE = 150;

const HORSES = [
  { id: "favorite", label: "Lucky Remainder (favorite)", odds: 2, chance: 0.42 },
  { id: "steady", label: "Modular Arithmetic", odds: 4, chance: 0.22 },
  { id: "longshot", label: "Carry the One", odds: 9, chance: 0.1 },
  { id: "hopeless", label: "Divide By Zero", odds: 30, chance: 0.03 },
];

export const CASINO_ACTIONS = defineActions("casino", [
  { id: "casino-blackjack", label: "Blackjack", description: "Beat the dealer to 21", icon: "Dice5", ui: "blackjack", visible: gamblingAge, run: () => undefined },
  { id: "casino-slots", label: "Slot machines", description: "Pull the lever", icon: "Dice5", ui: "slots", visible: gamblingAge, run: () => undefined },
  { id: "casino-roulette", label: "Roulette", description: "Red or black?", icon: "Dice5", ui: "roulette", visible: gamblingAge, run: () => undefined },
  {
    id: "casino-horses",
    label: "Bet on the horses",
    icon: "Target",
    perYear: 3,
    visible: gamblingAge,
    options: (ctx) => HORSES.map((h) => ({ id: h.id, label: h.label, description: `Pays ${h.odds}:1 on a ${formatMoney(ctx.country, 100 * ctx.country.costIndex)} bet`, blocked: ctx.player.finance.cash < 100 * ctx.country.costIndex ? "Can't afford the bet." : undefined, icon: "Target" })),
    run(ctx, p) {
      const h = HORSES.find((x) => x.id === p.option);
      if (!h || !pay(ctx, 100)) return;
      feedHabit(ctx, 2);
      if (ctx.rng.chance(h.chance)) {
        const win = Math.round(100 * ctx.country.costIndex * (h.odds + 1));
        ctx.player.finance.cash += win;
        return { text: `${h.label.replace(/ \(.*\)/, "")} won by a nose! You collected ${formatMoney(ctx.country, win)}.`, tone: "good" };
      }
      return { text: `${h.label.replace(/ \(.*\)/, "")} finished ${ctx.rng.pick(["fourth", "dead last", "second, agonizingly", "after stopping to eat grass"])}.`, tone: "bad" };
    },
  },
  {
    id: "casino-settle",
    label: "Settle a casino round",
    internal: true,
    run(ctx, p) {
      // Internal: minigame UIs report their result here. Clamp to what the game could plausibly pay.
      const bet = Math.max(0, Number(p.bet) || 0);
      const net = clamp(Number(p.net) || 0, -bet, bet * MAX_MULTIPLE);
      if (bet <= 0 || bet > ctx.player.finance.cash) return { text: "", quiet: true };
      ctx.player.finance.cash += Math.round(net);
      feedHabit(ctx, 1);
      if (net > 0) adjustStat(ctx.player, "happiness", 1);
      ctx.state.flags.casinoNet = Number(ctx.state.flags.casinoNet ?? 0) + Math.round(net);
      if (net >= 100_000 * ctx.country.costIndex) ctx.state.flags.casinoJackpot = true;
      return { text: "", quiet: true };
    },
  },
  {
    id: "casino-log",
    label: "Leave the casino",
    internal: true,
    run(ctx, p) {
      const net = Number(p.net) || 0;
      if (net === 0) return { text: "", quiet: true };
      return { text: net > 0 ? `You walked out of the casino ${formatMoney(ctx.country, net)} richer.` : `You lost ${formatMoney(ctx.country, -net)} at the casino.`, tone: net > 0 ? "good" : "bad", log: true };
    },
  },
  // ------------------------------------------------------------ money: lottery, market
  {
    id: "money-lottery",
    section: "money",
    group: "Luck",
    label: "Buy lottery tickets",
    icon: "Sparkles",
    perYear: 3,
    cost: 20,
    visible: gamblingAge,
    blocked: (ctx) => (ctx.player.finance.cash < 20 * ctx.country.costIndex ? "Can't afford it." : undefined),
    run(ctx) {
      pay(ctx, 20);
      feedHabit(ctx, 1);
      const roll = ctx.rng.next();
      if (roll < 1 / 400_000) {
        const jackpot = Math.round(ctx.rng.int(5, 80) * 1_000_000 * ctx.country.costIndex);
        ctx.player.finance.cash += jackpot;
        ctx.state.flags.lotteryWinner = true;
        return { title: "JACKPOT", text: `You won the lottery jackpot: ${formatMoney(ctx.country, jackpot)}. Your hands haven't stopped shaking.`, tone: "major" };
      }
      if (roll < 1 / 2000) {
        const prize = Math.round(10_000 * ctx.country.costIndex);
        ctx.player.finance.cash += prize;
        return { text: `You matched five numbers and won ${formatMoney(ctx.country, prize)}!`, tone: "good" };
      }
      if (roll < 1 / 40) {
        const prize = Math.round(50 * ctx.country.costIndex);
        ctx.player.finance.cash += prize;
        return { text: `You won ${formatMoney(ctx.country, prize)} on a scratch-off. You bought more tickets with it.` };
      }
      return { text: ctx.rng.pick(["None of your numbers came up.", "You were one number off. Every number.", "Not a winner. Try again!"]), log: false };
    },
  },
  {
    id: "money-market",
    section: "money",
    group: "Invest",
    label: "Stocks & crypto",
    description: "Buy and sell on the market",
    icon: "TrendingUp",
    ui: "market",
    visible: (ctx) => ctx.player.age >= 18,
    run: () => undefined,
  },
  {
    id: "market-buy",
    section: "money",
    label: "Buy",
    internal: true,
    run(ctx, p) {
      const sec = SECURITY_BY_SYMBOL[String(p.symbol)];
      const amount = Math.min(Number(p.amount) || 0, ctx.player.finance.cash);
      if (!sec || amount <= 0) return { text: "", quiet: true };
      buy(ctx.state, sec.symbol, amount);
      ctx.state.flags.investor = true;
      return { text: "", quiet: true };
    },
  },
  {
    id: "market-sell",
    section: "money",
    label: "Sell",
    internal: true,
    run(ctx, p) {
      const proceeds = sell(ctx.state, String(p.symbol), Number(p.fraction) || 0);
      if (proceeds >= 1_000_000 * ctx.country.costIndex) ctx.state.flags.bigTrade = true;
      return { text: "", quiet: true };
    },
  },
  // ------------------------------------------------------------ special
  {
    id: "special-gameshow",
    section: "special",
    label: "Go on a game show",
    description: "Answer trivia for cash",
    icon: "Tv",
    ui: "trivia",
    perYear: 1,
    visible: (ctx) => ctx.player.age >= 16,
    run: () => undefined,
  },
  {
    id: "special-gameshow-settle",
    section: "special",
    label: "Game show result",
    internal: true,
    run(ctx, p) {
      const correct = clamp(Math.round(Number(p.correct) || 0), 0, 5);
      const ladder = [0, 500, 2_000, 10_000, 50_000, 250_000];
      const prize = Math.round(ladder[correct]! * ctx.country.costIndex);
      ctx.player.finance.cash += prize;
      ctx.player.fame = clamp(ctx.player.fame + 2);
      ctx.state.actionsThisYear["special-gameshow"] = 1;
      if (correct === 5) ctx.state.flags.gameShowChampion = true;
      return {
        title: correct === 5 ? "Champion!" : "Game show",
        text: correct === 5 ? `You answered every question and won ${formatMoney(ctx.country, prize)}!` : prize > 0 ? `You went home with ${formatMoney(ctx.country, prize)}.` : "You went home with a novelty mug.",
        tone: correct >= 3 ? "good" : "neutral",
      };
    },
  },
]);
