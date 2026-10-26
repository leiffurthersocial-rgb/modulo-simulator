import { actionOptions, listActions, performAction } from "./actions";
import type { Content } from "./content";
import { partnerOf } from "./family";
import { choose } from "./game";
import { ageUp } from "./lifecycle/ageUp";
import { newLife, type NewLifeOptions } from "./lifecycle/newLife";
import { Rng } from "./rng";
import type { ActionSection, GameState } from "./types";

export type Policy = "passive" | "typical";

function available(state: GameState, content: Content, section: ActionSection, id: string, params = {}): boolean {
  return listActions(state, content, section, params).some((v) => v.action.id === id && !v.blocked);
}

function tryAction(state: GameState, content: Content, section: ActionSection, id: string, params: Record<string, string | number> = {}): GameState {
  return available(state, content, section, id, params) ? performAction(state, content, id, params) : state;
}

/** Pick the first unblocked option, preferring ones the ranking scores highest. */
function bestOption(state: GameState, content: Content, id: string, score: (label: string, desc: string) => number, params = {}): string | undefined {
  const opts = actionOptions(state, content, id, params).filter((o) => !o.blocked);
  opts.sort((a, b) => score(b.label, b.description ?? "") - score(a.label, a.description ?? ""));
  return opts[0]?.id;
}

/** People mostly take jobs they can get, with a mild pull toward better pay. */
function jobScorer(rng: Rng) {
  return (_label: string, desc: string): number => {
    const salary = Number((desc.match(/([\d,]+)(?:[^\d]*)\/yr/)?.[1] ?? "0").replace(/,/g, ""));
    const odds = Number(desc.match(/(\d+)% odds/)?.[1] ?? "0") / 100;
    return odds * Math.pow(Math.max(1, salary), 0.25) * rng.float(0.2, 1);
  };
}

/**
 * A plausible, unexciting player: studies, gets the best job available, moves out,
 * dates, settles down, buys a home, sees a doctor, retires. Used for balancing.
 */
function typicalTurn(prev: GameState, content: Content, rng: Rng): GameState {
  let s = prev;
  const p = () => s.player;
  const age = p().age;
  if (p().crime.prison) return tryAction(s, content, "prison", "prison-library");

  if (p().education.enrolled) s = tryAction(s, content, "school", "school-study");
  if (age === 18 && !p().education.enrolled && p().stats.smarts >= 40 && rng.chance(0.55)) {
    const program = bestOption(s, content, "school-college", (_l, d) => Number(d.match(/(\d+)% admission/)?.[1] ?? 0) + rng.int(0, 30));
    if (program) s = tryAction(s, content, "school", "school-college", { option: program });
  }
  if (age >= 18 && !p().education.enrolled && !p().career.job && !p().career.retired && age < 65) {
    for (let i = 0; i < 3 && !s.player.career.job; i++) {
      const job = bestOption(s, content, "career-find-job", jobScorer(rng));
      if (!job) break;
      s = tryAction(s, content, "career", "career-find-job", { option: job });
    }
  }
  if (p().career.job && rng.chance(0.25)) s = tryAction(s, content, "career", "career-work-hard");
  if (p().career.job && rng.chance(0.3)) s = tryAction(s, content, "career", "career-raise");
  if (age >= 65 && p().career.job && rng.chance(0.5)) s = tryAction(s, content, "career", "career-retire");
  if (age >= 22 && p().livesWithParents && rng.chance(0.4)) s = tryAction(s, content, "assets", "assets-move-out");

  if (age >= 20 && !partnerOf(s) && rng.chance(0.5)) s = tryAction(s, content, "love", "love-dating-app");
  const partner = partnerOf(s);
  if (partner && partner.role === "partner" && age >= 24 && rng.chance(0.3)) s = tryAction(s, content, "people", "people-propose", { npcId: partner.id });
  if (partner && partner.role === "fiance") s = tryAction(s, content, "people", "people-wedding", { npcId: partner.id, option: "small" });
  if (partner && rng.chance(0.5)) s = tryAction(s, content, "people", "people-spend-time", { npcId: partner.id });
  const kids = Object.values(s.npcs).filter((n) => n.role === "child").length;
  if (partner && age >= 22 && age <= 42 && kids < 3 && rng.chance(0.45)) s = tryAction(s, content, "people", "people-baby", { npcId: partner.id });

  if (age >= 28 && !p().assets.some((a) => a.kind === "house") && p().career.job && rng.chance(0.4)) {
    const home = bestOption(s, content, "assets-home", () => rng.next());
    if (home) s = tryAction(s, content, "assets", "assets-home", { option: home });
  }
  if (p().health.conditions.length > 0) s = tryAction(s, content, "health", "health-doctor");
  if (rng.chance(0.3)) s = tryAction(s, content, "activities", "act-gym");
  if (age >= 25 && p().finance.cash > 30_000 && rng.chance(0.3)) s = tryAction(s, content, "money", "market-buy", { symbol: "MODX", amount: Math.round(p().finance.cash * 0.3) });
  // A little vice, as people do.
  if (age >= 18 && rng.chance(0.15)) s = tryAction(s, content, "nightlife", "night-bar");
  if (age >= 18 && rng.chance(0.05)) s = tryAction(s, content, "casino", "money-lottery");
  return s;
}

/**
 * Headless auto-play: ages a life to death, answering every popup at random.
 * `typical` also takes sensible actions each year. `pickSeed` drives the autopilot
 * separately from the game RNG so the life itself stays reproducible from its seed.
 */
export function simulateLife(content: Content, options: NewLifeOptions, pickSeed = "auto", policy: Policy = "passive"): GameState {
  const pickRng = Rng.fromSeed(pickSeed + (options.seed ?? ""));
  let state = newLife(content, options);
  let guard = 0;
  while (state.status === "alive" && guard++ < 2000) {
    const pending = state.pending[0];
    if (pending) {
      const choice = pickRng.pick(pending.choices);
      state = choose(state, content, pending.uid, choice.id);
      continue;
    }
    state = { ...state, notices: [] };
    if (policy === "typical") state = typicalTurn(state, content, pickRng);
    if (state.pending.length === 0 && state.status === "alive") state = ageUp(state, content);
  }
  return state;
}
