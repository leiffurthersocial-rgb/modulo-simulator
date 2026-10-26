import { describe, expect, it } from "vitest";
import { DEFAULT_CONTENT } from "@/data";
import { OFFICE_BY_ID } from "@/data/politics";
import { performAction } from "@/engine/actions";
import { fameFromFollowers } from "@/engine/fame";
import { evaluateGoals } from "@/engine/goals";
import { buy, portfolioValue, priceOf, runMarketYear, sell } from "@/engine/market";
import { handValue, settleHand, type Card } from "@/engine/minigames/blackjack";
import { heistRounds, hit, markerAt } from "@/engine/minigames/heist";
import { colorOf, rouletteNet, wins } from "@/engine/minigames/roulette";
import { slotMultiplier, spin } from "@/engine/minigames/slots";
import { campaignBlocked, electionOdds, takeOffice } from "@/engine/politics";
import { Rng } from "@/engine/rng";
import { lifeAtAge } from "./fixtures";

const us = DEFAULT_CONTENT.countries.us!;
const c = (rank: Card["rank"]): Card => ({ rank, suit: "♠" });

describe("content targets", () => {
  it("ships 400+ events, 60+ careers, 20+ countries", () => {
    expect(DEFAULT_CONTENT.events.all.length).toBeGreaterThanOrEqual(400);
    expect(DEFAULT_CONTENT.careers.length).toBeGreaterThanOrEqual(60);
    expect(Object.keys(DEFAULT_CONTENT.countries).length).toBeGreaterThanOrEqual(20);
  });
});

describe("blackjack", () => {
  it("counts aces flexibly", () => {
    expect(handValue([c("A"), c("K")])).toBe(21);
    expect(handValue([c("A"), c("A"), c("9")])).toBe(21);
    expect(handValue([c("A"), c("9"), c("5")])).toBe(15);
    expect(handValue([c("K"), c("Q"), c("5")])).toBe(25);
  });

  it("settles hands", () => {
    expect(settleHand([c("A"), c("K")], [c("10"), c("9")], 100)).toBe(150);
    expect(settleHand([c("10"), c("9")], [c("10"), c("8")], 100)).toBe(100);
    expect(settleHand([c("10"), c("9")], [c("10"), c("9")], 100)).toBe(0);
    expect(settleHand([c("K"), c("Q"), c("5")], [c("10"), c("8")], 100)).toBe(-100);
    expect(settleHand([c("10"), c("8")], [c("K"), c("Q"), c("5")], 100)).toBe(100);
  });
});

describe("slots and roulette", () => {
  it("slots have a house edge", () => {
    const rng = Rng.fromSeed("slots");
    let total = 0;
    const n = 50_000;
    for (let i = 0; i < n; i++) total += slotMultiplier(spin(rng));
    expect(total / n).toBeLessThan(1);
    expect(total / n).toBeGreaterThan(0.6);
  });

  it("roulette pays correctly and zero beats outside bets", () => {
    expect(colorOf(0)).toBe("green");
    expect(wins({ kind: "red" }, 1)).toBe(true);
    expect(wins({ kind: "red" }, 0)).toBe(false);
    expect(rouletteNet({ kind: "number", number: 17 }, 17, 10)).toBe(350);
    expect(rouletteNet({ kind: "dozen", dozen: 2 }, 13, 10)).toBe(20);
    expect(rouletteNet({ kind: "even" }, 13, 10)).toBe(-10);
  });

  it("the casino settle action clamps impossible winnings", () => {
    let s = lifeAtAge(30);
    s.player.finance.cash = 1_000;
    s = performAction(s, DEFAULT_CONTENT, "casino-settle", { bet: 100, net: 1e12 });
    expect(s.player.finance.cash).toBe(1_000 + 100 * 150);
  });
});

describe("heist", () => {
  it("marker ping-pongs within the bar", () => {
    const r = heistRounds(0.5, () => 0.3)[0]!;
    for (let t = 0; t < 10; t += 0.13) {
      const p = markerAt(r, t);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
    expect(hit(r, r.zoneStart + r.zoneWidth / 2)).toBe(true);
    expect(hit(r, r.zoneStart - 0.01)).toBe(false);
  });
});

describe("market", () => {
  it("buys and sells, tracking value", () => {
    const s = lifeAtAge(30);
    s.player.finance.cash = 10_000;
    buy(s, "MODX", 5_000);
    expect(s.player.finance.cash).toBe(5_000);
    expect(portfolioValue(s)).toBeCloseTo(5_000);
    s.market.prices.MODX = priceOf(s, "MODX") * 2;
    expect(sell(s, "MODX", 1)).toBe(10_000);
    expect(s.player.finance.holdings).toHaveLength(0);
  });

  it("prices stay positive over a long simulation", () => {
    const s = lifeAtAge(30);
    const rng = Rng.fromSeed("mkt");
    for (let i = 0; i < 80; i++) runMarketYear(s, rng);
    for (const p of Object.values(s.market.prices)) expect(p).toBeGreaterThan(0);
    expect(s.market.history.MODX!.length).toBeLessThanOrEqual(30);
  });
});

describe("politics", () => {
  it("gates offices by age, fame, and money", () => {
    const s = lifeAtAge(25);
    expect(campaignBlocked(s, OFFICE_BY_ID.head!, us)).toMatch(/at least 35/);
    expect(campaignBlocked(s, OFFICE_BY_ID.council!, us)).toMatch(/fund/);
    s.player.finance.cash = 10_000;
    expect(campaignBlocked(s, OFFICE_BY_ID.council!, us)).toBeUndefined();
  });

  it("taking office raises your ceiling and pays a salary", () => {
    const s = lifeAtAge(40);
    takeOffice(s, OFFICE_BY_ID.mayor!, us);
    expect(s.player.office?.title).toBe("Mayor");
    expect(s.player.highestOfficeLevel).toBe(2);
    const odds = electionOdds(s, OFFICE_BY_ID.legislator!);
    expect(odds).toBeGreaterThan(0);
    expect(odds).toBeLessThan(1);
  });
});

describe("goals and fame", () => {
  it("completes goals when their condition is met", () => {
    const s = lifeAtAge(30);
    s.player.goals = [{ id: "college", assignedAtAge: 0 }];
    evaluateGoals(s, DEFAULT_CONTENT);
    expect(s.player.goals[0]!.completedAtAge).toBeUndefined();
    s.player.education.degrees.push({ level: "college", institution: "U", graduatedAtAge: 22, honors: false });
    evaluateGoals(s, DEFAULT_CONTENT);
    expect(s.player.goals[0]!.completedAtAge).toBe(30);
  });

  it("new lives get three goals", () => {
    expect(lifeAtAge(0).player.goals).toHaveLength(3);
  });

  it("fame grows with followers on a log scale", () => {
    expect(fameFromFollowers(0)).toBe(0);
    expect(fameFromFollowers(1_000)).toBeLessThan(fameFromFollowers(100_000));
    expect(fameFromFollowers(10_000_000)).toBeLessThanOrEqual(100);
  });
});
