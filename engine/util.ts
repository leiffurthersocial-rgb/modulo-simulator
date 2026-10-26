import type { Rng } from "./rng";
import type { Amount, Country, Gender, Pronouns } from "./types";

export function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

/** Resolve an Amount: fixed numbers pass through, [min, max] ranges are rolled (integers if both ends are). */
export function rollAmount(rng: Rng, amount: Amount): number {
  if (typeof amount === "number") return amount;
  const [min, max] = amount;
  return Number.isInteger(min) && Number.isInteger(max) ? rng.int(min, max) : rng.float(min, max);
}

export function pronounsFor(gender: Gender): Pronouns {
  return gender === "male" ? "he" : gender === "female" ? "she" : "they";
}

/** Format a USD-equivalent amount in the country's local currency, in whole units. */
export function formatMoney(country: Country, usd: number): string {
  const local = Math.round(usd * country.currency.perUsd);
  const digits = Math.abs(local).toLocaleString("en-US");
  const sign = local < 0 ? "-" : "";
  return country.currency.symbolAfter
    ? `${sign}${digits} ${country.currency.symbol}`
    : `${sign}${country.currency.symbol}${digits}`;
}

export function capitalize(s: string): string {
  return s.length === 0 ? s : s[0]!.toUpperCase() + s.slice(1);
}
