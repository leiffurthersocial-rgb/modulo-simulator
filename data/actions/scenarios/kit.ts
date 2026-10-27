import { leaveJob } from "@/engine/career";
import { fx } from "@/engine/events/helpers";
import type { Dyn, Effect, EventContext, Outcome, Tone } from "@/engine/types";
import { clamp } from "@/engine/util";

/** Shorthand for a weighted outcome: out(weight, text, tone, ...effects). */
export const out = (weight: Dyn<number>, text: string, tone: Tone, ...effects: Effect[]): Outcome => ({ weight, text, tone, effects });

/** Same, but chains into a triggered event afterwards. */
export const outThen = (weight: Dyn<number>, text: string, tone: Tone, next: string, ...effects: Effect[]): Outcome => ({ weight, text, tone, effects, next });

export const minAge = (n: number) => (ctx: EventContext) => ctx.player.age >= n && !ctx.player.crime.prison;
export const between = (lo: number, hi: number) => (ctx: EventContext) => ctx.player.age >= lo && ctx.player.age <= hi && !ctx.player.crime.prison;
export const flagIs = (key: string) => (ctx: EventContext) => ctx.state.flags[key] !== undefined && ctx.state.flags[key] !== false;
export const needs = (cond: (ctx: EventContext) => boolean, reason: string) => (ctx: EventContext) => (cond(ctx) ? undefined : reason);

/** Job performance +/-n (no-op if unemployed). */
export const perf = (n: number): Effect =>
  fx.custom((ctx) => {
    const job = ctx.player.career.job;
    if (job) job.performance = clamp(job.performance + n);
  });

/** Permanent pay change in percent. */
export const payChange = (pct: number): Effect =>
  fx.custom((ctx) => {
    const job = ctx.player.career.job;
    if (job) job.salary = Math.max(1000, Math.round(job.salary * (1 + pct / 100)));
  });

/** A one-off bonus worth a fraction of yearly salary. */
export const bonus = (fractionOfSalary: number): Effect =>
  fx.custom((ctx) => {
    const job = ctx.player.career.job;
    if (job) ctx.player.finance.cash += Math.round(job.salary * fractionOfSalary);
  });

/** Lose the job outright. */
export const sacked = (): Effect =>
  fx.custom((ctx) => {
    if (ctx.player.career.job) leaveJob(ctx.state, "fired");
  });

/** Currently in one of these careers (optionally at least at a rank). */
export const employedIn =
  (ids: readonly string[], minRank = 0) =>
  (ctx: EventContext) => {
    const job = ctx.player.career.job;
    return !!job && ids.includes(job.careerId) && job.rank >= minRank && !ctx.player.crime.prison;
  };

/** Currently in any career of these categories. */
export const inCategory =
  (...cats: string[]) =>
  (ctx: EventContext) => {
    const job = ctx.player.career.job;
    if (!job || ctx.player.crime.prison) return false;
    const def = ctx.content.careers.find((c) => c.id === job.careerId);
    return !!def && cats.includes(def.category);
  };
