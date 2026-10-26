/**
 * Seeded, serializable PRNG (mulberry32).
 *
 * The whole generator state is a single uint32, stored on GameState.rngState,
 * so a life is fully reproducible from its seed plus the player's choices.
 */

/** Hash an arbitrary string seed into a uint32 (cyrb53, truncated). */
export function hashSeed(seed: string): number {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h1 ^ h2) >>> 0;
}

/** A seed string for "today" (UTC), shared by every player: the daily challenge. */
export function dailySeed(date: Date = new Date()): string {
  return `daily-${date.toISOString().slice(0, 10)}`;
}

/** A fresh random seed string for a new, non-daily life. */
export function randomSeed(): string {
  return Math.random().toString(36).slice(2, 10);
}

export interface Weighted<T> {
  value: T;
  weight: number;
}

export class Rng {
  private s: number;

  constructor(state: number) {
    this.s = state >>> 0;
  }

  static fromSeed(seed: string): Rng {
    return new Rng(hashSeed(seed));
  }

  /** Current internal state; persist this to resume the sequence later. */
  get state(): number {
    return this.s;
  }

  /** Uniform float in [0, 1). */
  next(): number {
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Uniform float in [min, max). */
  float(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** Uniform integer in [min, max] (inclusive). */
  int(min: number, max: number): number {
    return Math.floor(this.float(min, max + 1));
  }

  /** True with probability p. */
  chance(p: number): boolean {
    return this.next() < p;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error("Rng.pick on empty array");
    return items[Math.floor(this.next() * items.length)] as T;
  }

  /** Pick by weight. Non-positive weights are never chosen. Returns undefined if nothing is pickable. */
  weighted<T>(items: readonly Weighted<T>[]): T | undefined {
    let total = 0;
    for (const it of items) if (it.weight > 0) total += it.weight;
    if (total <= 0) return undefined;
    let roll = this.next() * total;
    for (const it of items) {
      if (it.weight <= 0) continue;
      roll -= it.weight;
      if (roll < 0) return it.value;
    }
    // Floating point fallthrough: return the last positive-weight item.
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      if (it && it.weight > 0) return it.value;
    }
    return undefined;
  }

  /** Pick up to `count` distinct items by weight (without replacement). */
  weightedMany<T>(items: readonly Weighted<T>[], count: number): T[] {
    const pool = items.filter((it) => it.weight > 0).slice();
    const out: T[] = [];
    while (out.length < count && pool.length > 0) {
      const idx = this.weighted(pool.map((it, i) => ({ value: i, weight: it.weight })));
      if (idx === undefined) break;
      const [taken] = pool.splice(idx, 1);
      if (taken) out.push(taken.value);
    }
    return out;
  }

  shuffle<T>(items: readonly T[]): T[] {
    const arr = items.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const tmp = arr[i] as T;
      arr[i] = arr[j] as T;
      arr[j] = tmp;
    }
    return arr;
  }

  /** Normally distributed sample (Box-Muller). */
  normal(mean: number, sd: number): number {
    const u = 1 - this.next();
    const v = this.next();
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /** Integer sample from a normal distribution, clamped to [min, max]. */
  normalInt(mean: number, sd: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, Math.round(this.normal(mean, sd))));
  }

  /** Short random id, deterministic for this generator. */
  id(prefix = ""): string {
    return prefix + Math.floor(this.next() * 0x7fffffff).toString(36) + Math.floor(this.next() * 0xffff).toString(36);
  }
}
