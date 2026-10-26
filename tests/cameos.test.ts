import { describe, expect, it } from "vitest";
import { GAME_CONFIG } from "@/data/config";
import { FRIENDS } from "@/data/friends";
import { APPEARANCE_DEFAULTS } from "@/engine/appearance";
import { CAMEO_ACHIEVEMENT, claimCameoSlot, rollDestinies, spawnFriendNpc } from "@/engine/cameos";
import { defineEvents } from "@/engine/events/helpers";
import { fireEvent } from "@/engine/events/run";
import { Rng } from "@/engine/rng";
import { simulateLife } from "@/engine/sim";
import { contentWith, freshLife, lifeAtAge } from "./fixtures";

const cfg = GAME_CONFIG.friendCameos;

describe("friend cameo rate", () => {
  it("each friend is destined in roughly baseChancePerLife of lives", () => {
    const rng = Rng.fromSeed("rate");
    const lives = 20_000;
    const counts = new Map<string, number>();
    for (let i = 0; i < lives; i++) {
      for (const d of rollDestinies(rng, FRIENDS)) counts.set(d.friendId, (counts.get(d.friendId) ?? 0) + 1);
    }
    for (const f of FRIENDS) {
      const rate = (counts.get(f.id) ?? 0) / lives;
      const expected = cfg.baseChancePerLife * f.rarity;
      expect(rate).toBeGreaterThan(expected * 0.8);
      expect(rate).toBeLessThan(expected * 1.2);
    }
  });

  it("destiny ages are within configured bounds", () => {
    const rng = Rng.fromSeed("ages");
    for (let i = 0; i < 2_000; i++) {
      for (const d of rollDestinies(rng, FRIENDS)) {
        expect(d.earliestAge).toBeGreaterThanOrEqual(cfg.minAge);
        expect(d.earliestAge).toBeLessThanOrEqual(cfg.maxDestinyAge);
      }
    }
  });
});

describe("cameo slots", () => {
  const leo = FRIENDS.find((f) => f.id === "leo")!;
  const content = contentWith([], FRIENDS);

  function claimRepeatedly(age: number, role: Parameters<typeof claimCameoSlot>[3]) {
    const s = lifeAtAge(age, "slots", content);
    s.cameos.destined = [{ friendId: "leo", earliestAge: 10 }];
    const rng = Rng.fromSeed("claim");
    for (let i = 0; i < 50; i++) {
      const f = claimCameoSlot(s, rng, content, role);
      if (f) return f;
    }
    return undefined;
  }

  it("only fills a slot once the destined age is reached", () => {
    expect(claimRepeatedly(9, "classmate")).toBeUndefined();
    expect(claimRepeatedly(10, "classmate")?.id).toBe("leo");
  });

  it("only fills roles the friend allows", () => {
    expect(claimRepeatedly(20, "date")).toBeUndefined();
    expect(claimRepeatedly(20, "boss")?.id).toBe("leo");
    expect(claimRepeatedly(20, "gymBuddy")?.id).toBe("leo");
  });

  it("spawns with the exact configured appearance and consumes the destiny", () => {
    const s = lifeAtAge(20, "spawn", content);
    s.cameos.destined = [{ friendId: "leo", earliestAge: 10 }];
    const rng = Rng.fromSeed("spawn");
    const npc = spawnFriendNpc(s, rng, content.countries.us!, leo, "gymBuddy", 50);
    expect(npc.firstName).toBe("Leo");
    expect(npc.friendId).toBe("leo");
    expect(npc.appearance).toEqual({ ...APPEARANCE_DEFAULTS, presentation: "masculine", ...leo.appearance });
    expect(npc.gender).toBe("male");
    expect(npc.pronouns).toBe("he");
    expect(npc.appearance.hairStyle).toBe("sweptBack");
    expect(Math.abs(npc.age - 20)).toBeLessThanOrEqual(1);
    expect(s.cameos.destined).toHaveLength(0);
    expect(s.cameos.met).toEqual([{ friendId: "leo", npcId: npc.id, age: 20, role: "gymBuddy" }]);
    expect(s.achievements).toContain(CAMEO_ACHIEVEMENT);
    expect(claimCameoSlot(s, rng, content, "gymBuddy")).toBeUndefined();
  });

  it("all friends are male and keep their pinned look exactly", () => {
    const s = lifeAtAge(20, "all", content);
    const rng = Rng.fromSeed("all");
    for (const f of FRIENDS) {
      const npc = spawnFriendNpc(s, rng, content.countries.us!, f, "friend", 50);
      expect(npc.gender).toBe("male");
      expect(npc.appearance.presentation).toBe("masculine");
      expect(npc.appearance).toMatchObject(f.appearance);
    }
  });

  it("gets a plausible age in older-person roles", () => {
    const s = lifeAtAge(12, "teacher", content);
    const rng = Rng.fromSeed("teacher");
    const [lo, hi] = cfg.roleAgeOffsets.teacher!;
    const npc = spawnFriendNpc(s, rng, content.countries.us!, leo, "teacher", 50);
    expect(npc.age).toBeGreaterThanOrEqual(12 + lo);
    expect(npc.age).toBeLessThanOrEqual(12 + hi);
  });

  it("appears through a normal new-NPC event binding", () => {
    const events = defineEvents("friends", [
      { id: "meet", ages: [0, 120], npc: { kind: "new", role: "gymBuddy" }, text: "You met {npc} at the gym." },
    ]);
    const c = contentWith(events, FRIENDS);
    const s = lifeAtAge(25, "bind", c);
    s.cameos.destined = [{ friendId: "erim", earliestAge: 20 }];
    const rng = Rng.fromSeed("bind");
    for (let i = 0; i < 30 && s.cameos.met.length === 0; i++) fireEvent(s, rng, c, c.events.get("meet")!);
    expect(s.cameos.met[0]?.friendId).toBe("erim");
    expect(s.log.at(-1)?.entries.some((e) => e.text === "You met Erim at the gym.")).toBe(true);
  });

  it("a friend never appears twice in one life", () => {
    // Crank rarity so nearly every friend is destined, and give them plenty of slots to fill.
    const eager = FRIENDS.map((f) => ({ ...f, rarity: 20 }));
    const events = defineEvents("friends", [
      { id: "meet", ages: [5, 120], weight: 50, npc: { kind: "new", role: "classmate" }, text: "You met {npc}." },
    ]);
    const c = contentWith(events, eager);
    let total = 0;
    for (let i = 0; i < 40; i++) {
      const s = simulateLife(c, { seed: `once${i}`, year: 2000 });
      const ids = s.cameos.met.map((m) => m.friendId);
      expect(new Set(ids).size).toBe(ids.length);
      total += ids.length;
    }
    expect(total).toBeGreaterThan(40);
  });

  it("newLife rolls destinies from content friends", () => {
    let destined = 0;
    for (let i = 0; i < 400; i++) destined += freshLife(`d${i}`, content).cameos.destined.length;
    const expected = 400 * FRIENDS.length * cfg.baseChancePerLife;
    expect(destined).toBeGreaterThan(expected * 0.5);
    expect(destined).toBeLessThan(expected * 1.5);
  });
});
