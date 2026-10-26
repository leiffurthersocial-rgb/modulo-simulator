import type { Rng } from "../rng";

/** European single-zero wheel. */
export const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

export type RouletteBet =
  | { kind: "red" | "black" | "odd" | "even" | "low" | "high" }
  | { kind: "dozen"; dozen: 1 | 2 | 3 }
  | { kind: "number"; number: number };

export function spinWheel(rng: Rng): number {
  return rng.int(0, 36);
}

export function colorOf(n: number): "green" | "red" | "black" {
  return n === 0 ? "green" : RED_NUMBERS.has(n) ? "red" : "black";
}

export function wins(bet: RouletteBet, n: number): boolean {
  if (n === 0) return bet.kind === "number" && bet.number === 0;
  switch (bet.kind) {
    case "red":
      return RED_NUMBERS.has(n);
    case "black":
      return !RED_NUMBERS.has(n);
    case "odd":
      return n % 2 === 1;
    case "even":
      return n % 2 === 0;
    case "low":
      return n <= 18;
    case "high":
      return n >= 19;
    case "dozen":
      return Math.ceil(n / 12) === bet.dozen;
    case "number":
      return bet.number === n;
  }
}

export function payoutRatio(bet: RouletteBet): number {
  return bet.kind === "number" ? 35 : bet.kind === "dozen" ? 2 : 1;
}

export function rouletteNet(bet: RouletteBet, n: number, stake: number): number {
  return wins(bet, n) ? stake * payoutRatio(bet) : -stake;
}
