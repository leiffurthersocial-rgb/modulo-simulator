/**
 * Authoring helpers for actions in /data/actions.
 */
import { applyEffects } from "./events/effects";
import { fireEvent } from "./events/run";
import { renderText } from "./events/template";
import { successChance } from "./events/helpers";
import type { ActionSection, Effects, EventContext, GameAction, Outcome, SkillKey, StatKey, TextTemplate } from "./types";

export function defineActions(section: ActionSection, actions: readonly (Omit<GameAction, "section"> & { section?: ActionSection })[]): GameAction[] {
  return actions.map((a) => ({ ...a, section: a.section ?? section }));
}

/** Apply a list of effects from inside an action's run(). */
export function apply(ctx: EventContext, effects: Effects): void {
  applyEffects(effects, ctx);
}

/** Roll a stat/skill check (same odds as events' pass/fail). */
export function roll(ctx: EventContext, key: StatKey | SkillKey, difficulty: number): boolean {
  return ctx.rng.chance(successChance(ctx, key, difficulty));
}

/** Fire an event (usually triggeredOnly) right now, e.g. a police chase after a crime. Keeps ctx.npc if set. */
export function trigger(ctx: EventContext, eventId: string, npcId?: string): void {
  const event = ctx.content.events.get(eventId);
  if (event) fireEvent(ctx.state, ctx.rng, ctx.content, event, { npcId: npcId ?? ctx.npc?.id, vars: ctx.vars, front: true });
}

/** Pay a US-baseline price in local terms. Returns false (and charges nothing) if you can't afford it. */
export function pay(ctx: EventContext, usd: number): boolean {
  const cost = Math.round(usd * ctx.country.costIndex);
  if (ctx.player.finance.cash < cost) return false;
  ctx.player.finance.cash -= cost;
  ctx.vars.amount = cost;
  return true;
}

export function canAfford(ctx: EventContext, usd: number): boolean {
  return ctx.player.finance.cash >= usd * ctx.country.costIndex;
}

// ------------------------------------------------------------------ scenarios

/** One way of tackling a scenario, with its own price tag and its own spread of consequences. */
export interface Approach {
  id: string;
  label: string;
  description?: string;
  /** US-baseline money, charged up front. */
  cost?: number;
  /** Return a reason to show the approach disabled. */
  requires?: (ctx: EventContext) => string | undefined;
  outcomes: readonly Outcome[];
}

export interface ScenarioDef {
  id: string;
  section: ActionSection;
  group?: string;
  label: TextTemplate;
  description?: TextTemplate;
  icon?: string;
  title?: string;
  perYear?: number;
  /** For people actions: uses per year per person (replaces the default overall cap). */
  perYearPerPerson?: number;
  visible?: (ctx: EventContext) => boolean;
  approaches: readonly Approach[];
}

/** Every scenario and pursuit defined so far, kept so content tests can check them. */
export const SCENARIO_REGISTRY: ScenarioDef[] = [];
export const PURSUIT_REGISTRY: PursuitDef[] = [];

function pickOutcome(ctx: EventContext, outcomes: readonly Outcome[]): Outcome | undefined {
  return ctx.rng.weighted(outcomes.map((o) => ({ value: o, weight: o.weight === undefined ? 1 : typeof o.weight === "function" ? o.weight(ctx) : o.weight })));
}

/**
 * A "choose how to do it" action: the player picks an approach, pays its cost, and one of that
 * approach's weighted outcomes happens. Different approaches carry different risks and rewards.
 */
export function scenario(def: ScenarioDef): GameAction {
  SCENARIO_REGISTRY.push(def);
  const find = (id: unknown) => def.approaches.find((a) => a.id === id);
  return {
    id: def.id,
    section: def.section,
    group: def.group,
    label: def.label,
    description: def.description,
    icon: def.icon,
    perYear: def.perYearPerPerson === undefined ? (def.perYear ?? 1) : def.perYear,
    perYearPerPerson: def.perYearPerPerson,
    visible: def.visible,
    options: (ctx) =>
      def.approaches.map((a) => {
        const blocked = a.requires?.(ctx) ?? (a.cost && ctx.player.finance.cash < a.cost * ctx.country.costIndex ? "Can't afford it." : undefined);
        return { id: a.id, label: a.label, description: a.description, price: a.cost ? Math.round(a.cost * ctx.country.costIndex) : undefined, blocked };
      }),
    run(ctx, params) {
      const approach = find(params.option);
      if (!approach) return;
      if (approach.cost && !pay(ctx, approach.cost)) return { text: "You can't afford that.", tone: "bad" };
      const outcome = pickOutcome(ctx, approach.outcomes);
      if (!outcome) return;
      const flags = ctx.state.flags;
      flags.scenariosRun = Number(flags.scenariosRun ?? 0) + 1;
      flags[`scn:${def.id}:${approach.id}`] = true;
      applyEffects(outcome.effects, ctx);
      if (ctx.state.status !== "alive") return { quiet: true, text: "" };
      if (outcome.next) trigger(ctx, outcome.next);
      return { title: def.title, text: renderText(outcome.text ?? "Nothing much came of it.", ctx), tone: outcome.tone };
    },
  };
}

export function defineScenarios(defs: readonly ScenarioDef[]): GameAction[] {
  return defs.map(scenario);
}

// ------------------------------------------------------------------ pursuits

export interface PursuitDef {
  id: string;
  section: ActionSection;
  group?: string;
  label: string;
  description?: string;
  icon?: string;
  /** Sessions needed to finish. */
  steps: number;
  /** US-baseline money per session. */
  cost?: number;
  visible?: (ctx: EventContext) => boolean;
  /** Each session: what happened along the way. */
  progress: readonly Outcome[];
  /** The finale, rolled once the last step is done. */
  finale: readonly Outcome[];
  /** Can be taken up again after finishing. */
  repeatable?: boolean;
}

/**
 * A long-running project (a novel, a marathon, a restoration) that takes several sessions across
 * several years. Progress lives in a flag so it survives saves and ageing.
 */
export function pursuit(def: PursuitDef): GameAction {
  PURSUIT_REGISTRY.push(def);
  const key = `pursuit:${def.id}`;
  const done = (ctx: EventContext) => Number(ctx.state.flags[`${key}:done`] ?? 0);
  const stepOf = (ctx: EventContext) => Number(ctx.state.flags[key] ?? 0);
  return {
    id: `pursuit-${def.id}`,
    section: def.section,
    group: def.group ?? "Projects",
    label: (ctx) => {
      const n = stepOf(ctx);
      return n > 0 ? `${def.label} (${n}/${def.steps})` : def.label;
    },
    description: def.description,
    icon: def.icon,
    perYear: 1,
    cost: def.cost,
    visible: (ctx) => (def.repeatable || done(ctx) === 0) && (def.visible?.(ctx) ?? true),
    blocked: (ctx) => (def.cost && ctx.player.finance.cash < def.cost * ctx.country.costIndex ? "Can't afford it." : undefined),
    run(ctx) {
      if (def.cost && !pay(ctx, def.cost)) return { text: "You can't afford that.", tone: "bad" };
      const n = stepOf(ctx) + 1;
      const last = n >= def.steps;
      const outcome = pickOutcome(ctx, last ? def.finale : def.progress);
      ctx.state.flags[key] = last ? 0 : n;
      if (last) ctx.state.flags[`${key}:done`] = done(ctx) + 1;
      if (!outcome) return;
      applyEffects(outcome.effects, ctx);
      if (ctx.state.status !== "alive") return { quiet: true, text: "" };
      if (outcome.next) trigger(ctx, outcome.next);
      return { title: last ? "Finished!" : undefined, text: renderText(outcome.text ?? "You made progress.", ctx), tone: last ? (outcome.tone ?? "major") : outcome.tone };
    },
  };
}

export function definePursuits(defs: readonly PursuitDef[]): GameAction[] {
  return defs.map(pursuit);
}
