import { describe, expect, it } from "vitest";
import { Rng, hashSeed } from "@/engine/rng";

describe("Rng", () => {
  it("is deterministic for the same seed", () => {
    const a = Rng.fromSeed("hello");
    const b = Rng.fromSeed("hello");
    for (let i = 0; i < 100; i++) expect(a.next()).toBe(b.next());
  });

  it("differs across seeds", () => {
    expect(Rng.fromSeed("a").next()).not.toBe(Rng.fromSeed("b").next());
  });

  it("resumes from a saved state", () => {
    const a = Rng.fromSeed("resume");
    a.next();
    a.next();
    const b = new Rng(a.state);
    expect(b.next()).toBe(a.next());
  });

  it("int stays within inclusive bounds and hits both ends", () => {
    const r = Rng.fromSeed("ints");
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const v = r.int(1, 6);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
      seen.add(v);
    }
    expect(seen.size).toBe(6);
  });

  it("weighted respects weights and ignores zero weights", () => {
    const r = Rng.fromSeed("weights");
    const counts = { a: 0, b: 0, c: 0 };
    for (let i = 0; i < 10_000; i++) {
      const v = r.weighted([
        { value: "a" as const, weight: 3 },
        { value: "b" as const, weight: 1 },
        { value: "c" as const, weight: 0 },
      ]);
      if (v) counts[v]++;
    }
    expect(counts.c).toBe(0);
    expect(counts.a / counts.b).toBeGreaterThan(2.6);
    expect(counts.a / counts.b).toBeLessThan(3.4);
  });

  it("weightedMany returns distinct items", () => {
    const r = Rng.fromSeed("many");
    const out = r.weightedMany(
      [1, 2, 3, 4].map((v) => ({ value: v, weight: 1 })),
      3,
    );
    expect(new Set(out).size).toBe(3);
  });

  it("hashes seeds stably", () => {
    expect(hashSeed("abc")).toBe(hashSeed("abc"));
    expect(hashSeed("abc")).not.toBe(hashSeed("abd"));
  });
});
