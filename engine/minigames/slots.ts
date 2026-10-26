import type { Rng } from "../rng";

export const SLOT_SYMBOLS = ["🍒", "🍋", "🔔", "⭐", "7", "💎"] as const;
export type SlotSymbol = (typeof SLOT_SYMBOLS)[number];

const WEIGHTS: Record<SlotSymbol, number> = { "🍒": 30, "🍋": 25, "🔔": 18, "⭐": 13, "7": 9, "💎": 5 };
const TRIPLE: Record<SlotSymbol, number> = { "🍒": 5, "🍋": 8, "🔔": 12, "⭐": 20, "7": 50, "💎": 150 };

export function spin(rng: Rng): [SlotSymbol, SlotSymbol, SlotSymbol] {
  const reel = () => rng.weighted(SLOT_SYMBOLS.map((s) => ({ value: s, weight: WEIGHTS[s] }))) ?? "🍒";
  return [reel(), reel(), reel()];
}

const PREMIUM: readonly SlotSymbol[] = ["⭐", "7", "💎"];

/** Payout multiplier on the bet (0 = lose the bet, 1 = get it back). Tuned to ~92% return. */
export function slotMultiplier(r: readonly SlotSymbol[]): number {
  const [a, b, c] = r;
  if (a === b && b === c && a) return TRIPLE[a];
  const pair = a === b || a === c ? a : b === c ? b : undefined;
  if (pair) return PREMIUM.includes(pair) ? 2.5 : 0.75;
  return 0;
}

/** Net winnings for a spin. */
export function slotNet(r: readonly SlotSymbol[], bet: number): number {
  return Math.round(bet * slotMultiplier(r)) - bet;
}
