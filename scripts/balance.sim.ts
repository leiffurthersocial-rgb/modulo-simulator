/**
 * Balancing run: `npm run simulate`. Plays 1000 lives with a "typical player" autopilot
 * and prints lifespan, wealth, and life-outcome distributions. Not part of `npm test`.
 */
import { it } from "vitest";
import { DEFAULT_CONTENT } from "@/data";
import { countryOf, netWorth } from "@/engine";
import { simulateLife } from "@/engine/sim";

const LIVES = Number(process.env.LIVES ?? 1000);
const pct = (xs: number[], p: number) => xs[Math.min(xs.length - 1, Math.floor(p * xs.length))]!;
const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

it(`balance: ${LIVES} lives`, () => {
  const ages: number[] = [];
  const worth: number[] = [];
  const causes: Record<string, number> = {};
  let millionaires = 0, jailed = 0, married = 0, parents = 0, college = 0, employed30 = 0, cameos = 0, achievements = 0, events = 0, years = 0;
  const started = Date.now();
  for (let i = 0; i < LIVES; i++) {
    const s = simulateLife(DEFAULT_CONTENT, { seed: `balance-${i}`, year: 2026 }, "bal", "typical");
    const ci = countryOf(DEFAULT_CONTENT, s.player.countryId).costIndex;
    ages.push(s.player.age);
    const w = netWorth(s) / ci;
    worth.push(w);
    causes[s.death!.cause] = (causes[s.death!.cause] ?? 0) + 1;
    if (w >= 1_000_000) millionaires++;
    if (s.flags.everJailed) jailed++;
    if (Number(s.flags.marriages ?? 0) > 0) married++;
    if (Object.values(s.npcs).some((n) => n.role === "child")) parents++;
    if (s.player.education.degrees.some((d) => d.level === "college")) college++;
    if (s.player.career.history.some((h) => h.startAge <= 30 && h.endAge >= 30) || (s.player.career.job && s.player.age >= 30)) employed30++;
    cameos += s.cameos.met.length;
    achievements += s.achievements.length;
    events += s.log.reduce((t, y) => t + y.entries.length, 0);
    years += s.log.length;
  }
  ages.sort((a, b) => a - b);
  worth.sort((a, b) => a - b);
  const share = (n: number) => `${((n / LIVES) * 100).toFixed(1)}%`;
  console.log(`\n${LIVES} lives in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  console.log(`Lifespan   mean ${(ages.reduce((a, b) => a + b) / LIVES).toFixed(1)} | p10 ${pct(ages, 0.1)} | median ${pct(ages, 0.5)} | p90 ${pct(ages, 0.9)} | max ${ages.at(-1)}`);
  console.log(`Net worth at death (US-baseline $): p10 ${fmt(pct(worth, 0.1))} | median ${fmt(pct(worth, 0.5))} | p90 ${fmt(pct(worth, 0.9))} | p99 ${fmt(pct(worth, 0.99))}`);
  console.log(`Millionaires ${share(millionaires)} | jailed ${share(jailed)} | married ${share(married)} | parents ${share(parents)} | college ${share(college)} | employed at 30 ${share(employed30)}`);
  console.log(`Friend cameos per life ${(cameos / LIVES).toFixed(3)} | achievements per life ${(achievements / LIVES).toFixed(1)} | log lines per year ${(events / years).toFixed(2)}`);
  console.log("Causes of death:", Object.entries(causes).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${share(v)}`).join(", "));
}, 3_600_000);
