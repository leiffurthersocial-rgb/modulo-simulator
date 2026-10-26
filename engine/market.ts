import { SECURITIES, SECURITY_BY_SYMBOL } from "@/data/market";
import type { Rng } from "./rng";
import type { GameState } from "./types";

export function priceOf(state: GameState, symbol: string): number {
  return state.market.prices[symbol] ?? SECURITY_BY_SYMBOL[symbol]?.price ?? 0;
}

export function portfolioValue(state: GameState): number {
  return state.player.finance.holdings.reduce((s, h) => s + h.units * priceOf(state, h.symbol), 0);
}

/** Buy `amount` (USD-equivalent) of a security. Returns units bought. */
export function buy(state: GameState, symbol: string, amount: number): number {
  const price = priceOf(state, symbol);
  if (price <= 0 || amount <= 0 || state.player.finance.cash < amount) return 0;
  const units = amount / price;
  state.player.finance.cash -= amount;
  const h = state.player.finance.holdings.find((x) => x.symbol === symbol);
  if (h) {
    h.units += units;
    h.costBasis += amount;
  } else {
    state.player.finance.holdings.push({ symbol, units, costBasis: amount });
  }
  return units;
}

/** Sell a fraction (0-1] of a holding. Returns proceeds. */
export function sell(state: GameState, symbol: string, fraction: number): number {
  const fin = state.player.finance;
  const h = fin.holdings.find((x) => x.symbol === symbol);
  if (!h) return 0;
  const f = Math.min(1, Math.max(0, fraction));
  const units = h.units * f;
  const proceeds = Math.round(units * priceOf(state, symbol));
  h.units -= units;
  h.costBasis *= 1 - f;
  if (h.units <= 1e-9) fin.holdings = fin.holdings.filter((x) => x !== h);
  fin.cash += proceeds;
  return proceeds;
}

/**
 * One year of the market. Everything shares a common economic shock, so crashes hit
 * stocks together; crypto adds its own wild swings and the occasional collapse.
 */
export function runMarketYear(state: GameState, rng: Rng): void {
  const economy = rng.normal(0, 1);
  for (const s of SECURITIES) {
    const prev = priceOf(state, s.symbol);
    const idio = rng.normal(0, 1);
    const shared = s.kind === "crypto" ? 0.3 : 0.6;
    let ret = s.drift + s.vol * (shared * economy + Math.sqrt(1 - shared * shared) * idio);
    if (s.kind === "crypto" && rng.chance(0.04)) ret = -0.85;
    const next = Math.max(0.01, prev * Math.exp(ret - (s.vol * s.vol) / 2));
    state.market.prices[s.symbol] = Math.round(next * 100) / 100;
    (state.market.history[s.symbol] ??= []).push(state.market.prices[s.symbol]!);
    const hist = state.market.history[s.symbol]!;
    if (hist.length > 30) hist.splice(0, hist.length - 30);
  }
}
