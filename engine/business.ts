import { addLog } from "./log";
import type { Rng } from "./rng";
import { adjustStat } from "./stats";
import type { GameState } from "./types";

export interface Industry {
  id: string;
  name: string;
  /** Minimum investment, US baseline. */
  cost: number;
  /** Mean yearly return on value and its spread. */
  mean: number;
  spread: number;
  skill: "smarts" | "charisma" | "creativity" | "streetSmarts";
  names: readonly string[];
}

export const INDUSTRIES: readonly Industry[] = [
  { id: "food-truck", name: "Food truck", cost: 40_000, mean: 0.12, spread: 0.3, skill: "creativity", names: ["Taco Tuesday Everyday", "Rolling Dumpling", "Grill Seeker"] },
  { id: "coffee", name: "Coffee shop", cost: 90_000, mean: 0.08, spread: 0.25, skill: "charisma", names: ["Modulo Coffee", "The Daily Grind", "Bean Counter"] },
  { id: "landscaping", name: "Landscaping company", cost: 25_000, mean: 0.15, spread: 0.2, skill: "streetSmarts", names: ["Green Thumb Co.", "Mow Better", "Lawn & Order"] },
  { id: "clothing", name: "Clothing brand", cost: 60_000, mean: 0.1, spread: 0.45, skill: "creativity", names: ["Off By One Apparel", "Threadbare", "Loose Ends"] },
  { id: "app", name: "Tech startup", cost: 120_000, mean: 0.15, spread: 0.8, skill: "smarts", names: ["Remaindr", "Loopwise", "Stackful", "Nimbly"] },
  { id: "restaurant", name: "Restaurant", cost: 250_000, mean: 0.07, spread: 0.35, skill: "creativity", names: ["The Common Table", "Salt & Smoke", "Little Fig"] },
  { id: "gym", name: "Gym", cost: 180_000, mean: 0.09, spread: 0.25, skill: "charisma", names: ["Iron Modulo", "Rep Count", "Sweat Equity"] },
];

/** Yearly business tick: profit, valuation swings, possible collapse. */
export function runBusinessYear(state: GameState, rng: Rng): void {
  const biz = state.player.business;
  if (!biz) return;
  const industry = INDUSTRIES.find((i) => i.name === biz.industry);
  const mean = industry?.mean ?? 0.08;
  const spread = industry?.spread ?? 0.3;
  const skill = !industry ? 50 : industry.skill === "smarts" ? state.player.stats.smarts : state.player.skills[industry.skill];
  const skillBonus = (skill - 50) / 400;
  const ret = rng.normal(mean + skillBonus, spread);
  biz.lastProfit = Math.round(biz.value * Math.max(-0.6, Math.min(1.5, ret)) * 0.5);
  biz.value = Math.max(0, Math.round(biz.value * (1 + ret)));
  biz.employees = Math.max(0, Math.round(biz.employees * (1 + ret / 2) + (ret > 0.2 ? rng.int(0, 3) : 0)));
  if (biz.value < 2_000 || (ret < -0.5 && rng.chance(0.5))) {
    addLog(state, `${biz.name} went under. You closed the doors for good.`, "bad");
    adjustStat(state.player, "happiness", -12);
    state.flags.businessFailed = Number(state.flags.businessFailed ?? 0) + 1;
    state.player.business = undefined;
  } else if (ret > 0.6) {
    addLog(state, `${biz.name} had a breakout year.`, "good");
  }
}
