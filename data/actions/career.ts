import { careerOf } from "@/engine/content";
import { defineActions, pay, roll } from "@/engine/actionHelpers";
import { INDUSTRIES } from "@/engine/business";
import { careerBlocked, hire, hireChance, leaveJob, promote, retire, startingRank } from "@/engine/career";
import { adjustStat } from "@/engine/stats";
import type { ActionOption, CareerDef, EventContext } from "@/engine/types";
import { clamp, formatMoney } from "@/engine/util";

const employed = (ctx: EventContext) => ctx.player.career.job !== undefined;

function jobOptions(ctx: EventContext, defs: readonly CareerDef[]): ActionOption[] {
  return defs
    .map((def) => {
      const blocked = careerBlocked(ctx.state, def);
      const rank = startingRank(ctx.state, def);
      const salary = def.ranks[rank]!.salary * ctx.country.salaryIndex * ctx.state.difficulty.economy;
      return {
        id: def.id,
        label: def.ranks[rank]!.title,
        description: blocked ?? `${def.name} · ${formatMoney(ctx.country, salary)}/yr · ${Math.round(hireChance(ctx.state, def) * 100)}% odds`,
        blocked,
        icon: def.icon,
        sort: blocked ? 1 : 0,
      };
    })
    .sort((a, b) => a.sort - b.sort)
    .map(({ sort: _sort, ...o }) => o);
}

function apply(ctx: EventContext, def: CareerDef | undefined) {
  if (!def) return;
  const title = def.ranks[startingRank(ctx.state, def)]!.title;
  if (!ctx.rng.chance(hireChance(ctx.state, def))) {
    adjustStat(ctx.player, "happiness", -2);
    const line = ctx.rng.pick([
      "They went with a candidate who had \"more synergy.\"",
      "The interviewer asked where you see yourself in five years. You said \"here, but rich.\"",
      "You never heard back. Not even a rejection email.",
      "They said you were overqualified. You were not.",
    ]);
    return { title: "No offer", text: `You applied to be a ${title}. ${line}`, tone: "bad" as const };
  }
  hire(ctx.state, ctx.rng, ctx.content, ctx.country, def, startingRank(ctx.state, def));
  const job = ctx.player.career.job!;
  adjustStat(ctx.player, "happiness", 6);
  return {
    title: "Hired!",
    text: `You were hired as a ${job.title} at ${job.employer}, earning ${formatMoney(ctx.country, job.salary)} a year.`,
    tone: "major" as const,
  };
}

const SIDE_HUSTLES = [
  { id: "rideshare", label: "Rideshare driver", income: 9_000, needs: "license" },
  { id: "reselling", label: "Online reselling", income: 5_000 },
  { id: "pet-sitting", label: "Pet sitting", income: 4_000 },
  { id: "tutoring", label: "Private tutoring", income: 7_000, smarts: 65 },
  { id: "crafts", label: "Handmade crafts shop", income: 3_500, creativity: 45 },
  { id: "delivery-app", label: "Food delivery app", income: 7_500 },
  { id: "photography-gigs", label: "Event photography", income: 6_000, creativity: 50 },
  { id: "dropshipping", label: "Dropshipping store", income: 6_000 },
  { id: "print-on-demand", label: "Print-on-demand designs", income: 4_500, creativity: 40 },
  { id: "freelance-writing", label: "Freelance writing", income: 8_000, smarts: 55 },
  { id: "freelance-web", label: "Freelance web work", income: 11_000, smarts: 65 },
  { id: "music-lessons", label: "Music lessons", income: 6_500, creativity: 55 },
  { id: "house-cleaning", label: "House cleaning", income: 8_000 },
  { id: "lawn-care", label: "Lawn care round", income: 6_500 },
  { id: "handyman", label: "Handyman jobs", income: 10_000 },
  { id: "translation", label: "Freelance translation", income: 9_000, smarts: 70 },
  { id: "mobile-dj", label: "Mobile DJ", income: 7_000, creativity: 45 },
  { id: "catering", label: "Small-scale catering", income: 9_500, creativity: 45 },
  { id: "baking-orders", label: "Custom baking orders", income: 5_000, creativity: 40 },
  { id: "dog-training", label: "Dog training", income: 7_500 },
  { id: "vintage-store", label: "Vintage online store", income: 6_500 },
  { id: "stock-photos", label: "Stock photography", income: 3_000, creativity: 45 },
  { id: "game-coaching", label: "Game coaching", income: 5_500, smarts: 55 },
  { id: "moving-help", label: "Moving help", income: 5_500 },
] as const;

export const CAREER_ACTIONS = defineActions("career", [
  {
    id: "career-find-job",
    group: "Job market",
    label: "Find a job",
    description: "Full-time positions",
    icon: "Briefcase",
    perYear: 5,
    visible: (ctx) => ctx.player.age >= 16 && !ctx.player.crime.prison,
    options: (ctx) => jobOptions(ctx, ctx.content.careers.filter((c) => !c.partTime)),
    run: (ctx, params) => apply(ctx, careerOf(ctx.content, String(params.option))),
  },
  {
    id: "career-part-time",
    group: "Job market",
    label: "Part-time jobs",
    description: "Pocket money while you study",
    icon: "Clock",
    perYear: 5,
    visible: (ctx) => ctx.player.age >= 12 && !ctx.player.crime.prison,
    options: (ctx) => jobOptions(ctx, ctx.content.careers.filter((c) => c.partTime)),
    run: (ctx, params) => apply(ctx, careerOf(ctx.content, String(params.option))),
  },
  {
    id: "career-work-hard",
    group: "Your job",
    label: "Work harder",
    icon: "Zap",
    perYear: 1,
    visible: employed,
    run(ctx) {
      const job = ctx.player.career.job!;
      job.performance = clamp(job.performance + ctx.rng.int(6, 14));
      adjustStat(ctx.player, "happiness", -2);
      adjustStat(ctx.player, "health", -1);
      return { text: ctx.rng.pick(["You stayed late every night this year. Your boss noticed.", "You put in extra hours and volunteered for everything.", "You worked weekends. Your performance soared; your social life did not."]), tone: "good" };
    },
  },
  {
    id: "career-raise",
    group: "Your job",
    label: "Ask for a raise",
    icon: "HandCoins",
    perYear: 1,
    visible: (ctx) => employed(ctx) && !ctx.player.career.job!.partTime,
    run(ctx) {
      const job = ctx.player.career.job!;
      if (job.performance >= 55 && roll(ctx, "charisma", 45)) {
        const pct = ctx.rng.int(4, 12);
        job.salary = Math.round(job.salary * (1 + pct / 100));
        return { title: "Raise", text: `Your boss gave you a ${pct}% raise. You're now making ${formatMoney(ctx.country, job.salary)} a year.`, tone: "good" };
      }
      job.performance = clamp(job.performance - 4);
      return { text: "Your boss said \"now's not a great time\" and changed the subject to quarterly targets.", tone: "bad" };
    },
  },
  {
    id: "career-promotion",
    group: "Your job",
    label: "Ask for a promotion",
    icon: "TrendingUp",
    perYear: 1,
    visible: (ctx) => {
      const job = ctx.player.career.job;
      const def = job && careerOf(ctx.content, job.careerId);
      return !!job && !!def && job.rank < def.ranks.length - 1;
    },
    run(ctx) {
      const job = ctx.player.career.job!;
      const def = careerOf(ctx.content, job.careerId)!;
      if (job.yearsInRole >= 1 && job.performance >= 65 && roll(ctx, "charisma", 40)) {
        promote(ctx.state, ctx.rng, ctx.country, def);
        adjustStat(ctx.player, "happiness", 6);
        return { title: "Promoted!", text: `You were promoted to ${job.title}.`, tone: "major" };
      }
      job.performance = clamp(job.performance - 3);
      return { text: "Your boss said you \"aren't quite ready yet.\" Same time next year.", tone: "bad" };
    },
  },
  {
    id: "career-quit",
    group: "Your job",
    label: "Quit your job",
    icon: "X",
    visible: employed,
    run(ctx) {
      const job = ctx.player.career.job!;
      leaveJob(ctx.state, "quit");
      adjustStat(ctx.player, "happiness", 3);
      return { text: `You quit your job as ${job.title} at ${job.employer}. ${ctx.rng.pick(["You did not give two weeks' notice.", "Your farewell email was gracious.", "You took a stapler."])}` };
    },
  },
  {
    id: "career-retire",
    group: "Your job",
    label: "Retire",
    icon: "Sun",
    visible: (ctx) => ctx.player.age >= 55 && !ctx.player.career.retired,
    run(ctx) {
      const pension = retire(ctx.state);
      ctx.state.flags.retiredAt = ctx.player.age;
      adjustStat(ctx.player, "happiness", 8);
      return {
        title: "Retired",
        text: pension > 0 ? `You retired. Your pension will pay ${formatMoney(ctx.country, pension)} a year.` : "You retired. There's no pension, so your savings will have to do.",
        tone: "major",
      };
    },
  },
  {
    id: "career-freelance",
    group: "Side income",
    label: "Take a freelance gig",
    icon: "Laptop",
    perYear: 2,
    visible: (ctx) => ctx.player.age >= 16 && !ctx.player.crime.prison,
    run(ctx) {
      const skills = ctx.player.skills;
      const best = Math.max(ctx.player.stats.smarts, skills.creativity, skills.charisma);
      const pay = Math.round(ctx.rng.int(200, 600) * (1 + best / 25) * ctx.country.salaryIndex);
      ctx.player.finance.cash += pay;
      const gig = best === ctx.player.stats.smarts ? "fixed a small business's website" : best === skills.creativity ? "designed a logo for a local bakery" : "emceed a corporate event";
      return { text: `You ${gig} and earned ${formatMoney(ctx.country, pay)}.`, tone: "good" };
    },
  },
  {
    id: "career-side-hustle",
    group: "Side income",
    label: "Start a side hustle",
    icon: "Rocket",
    perYear: 1,
    visible: (ctx) => ctx.player.age >= 16 && ctx.player.sideHustles.length < 3 && !ctx.player.crime.prison,
    options: (ctx) =>
      SIDE_HUSTLES.filter((h) => !ctx.player.sideHustles.some((x) => x.id === h.id)).map((h) => ({
        id: h.id,
        label: h.label,
        description: `About ${formatMoney(ctx.country, h.income * ctx.country.salaryIndex)}/yr`,
        blocked:
          "needs" in h && h.needs === "license" && !ctx.state.flags.license
            ? "Requires a driver's license."
            : "smarts" in h && ctx.player.stats.smarts < h.smarts
              ? "Requires more smarts."
              : "creativity" in h && ctx.player.skills.creativity < h.creativity
                ? "Requires more creativity."
                : undefined,
      })),
    run(ctx, params) {
      const h = SIDE_HUSTLES.find((x) => x.id === params.option);
      if (!h) return;
      const income = Math.round(h.income * ctx.country.salaryIndex * ctx.rng.float(0.7, 1.3));
      ctx.player.sideHustles.push({ id: h.id, label: h.label, income, sinceAge: ctx.player.age });
      return { text: `You started a side hustle: ${h.label.toLowerCase()}. It should bring in about ${formatMoney(ctx.country, income)} a year.`, tone: "good" };
    },
  },
  {
    id: "career-quit-hustle",
    group: "Side income",
    label: "Drop a side hustle",
    icon: "X",
    visible: (ctx) => ctx.player.sideHustles.length > 0,
    options: (ctx) => ctx.player.sideHustles.map((h) => ({ id: h.id, label: h.label, description: `${formatMoney(ctx.country, h.income)}/yr` })),
    run(ctx, params) {
      ctx.player.sideHustles = ctx.player.sideHustles.filter((h) => h.id !== params.option);
      return { text: "You dropped the side hustle. Your evenings are yours again." };
    },
  },
  {
    id: "career-start-business",
    group: "Business",
    label: "Start a business",
    icon: "Building2",
    perYear: 1,
    visible: (ctx) => ctx.player.age >= 18 && !ctx.player.business && !ctx.player.crime.prison,
    options: (ctx) =>
      INDUSTRIES.map((i) => ({
        id: i.id,
        label: i.name,
        price: Math.round(i.cost * ctx.country.costIndex),
        blocked: ctx.player.finance.cash < i.cost * ctx.country.costIndex ? "Not enough cash to start." : undefined,
      })),
    run(ctx, params) {
      const industry = INDUSTRIES.find((i) => i.id === params.option);
      if (!industry || !pay(ctx, industry.cost)) return;
      ctx.player.business = {
        name: ctx.rng.pick(industry.names),
        industry: industry.name,
        value: Math.round(industry.cost * ctx.country.costIndex),
        lastProfit: 0,
        foundedAtAge: ctx.player.age,
        employees: ctx.rng.int(1, 4),
      };
      ctx.state.flags.founder = true;
      return { title: "Open for business", text: `You founded ${ctx.player.business.name}, a ${industry.name.toLowerCase()}. Your savings are now a business.`, tone: "major" };
    },
  },
  {
    id: "career-sell-business",
    group: "Business",
    label: "Sell your business",
    icon: "HandCoins",
    visible: (ctx) => ctx.player.business !== undefined,
    run(ctx) {
      const biz = ctx.player.business!;
      const price = Math.round(biz.value * ctx.rng.float(0.8, 1.1));
      ctx.player.finance.cash += price;
      ctx.player.business = undefined;
      if (price >= 1_000_000) ctx.state.flags.soldForMillions = true;
      return { title: "Sold", text: `You sold ${biz.name} for ${formatMoney(ctx.country, price)}.`, tone: "major" };
    },
  },
  {
    id: "career-invest-business",
    group: "Business",
    label: "Invest in your business",
    icon: "TrendingUp",
    perYear: 1,
    cost: 10_000,
    visible: (ctx) => ctx.player.business !== undefined,
    blocked: (ctx) => (ctx.player.finance.cash < 10_000 * ctx.country.costIndex ? "Not enough cash." : undefined),
    run(ctx) {
      pay(ctx, 10_000);
      const biz = ctx.player.business!;
      biz.value += Math.round(10_000 * ctx.country.costIndex * ctx.rng.float(0.8, 1.6));
      biz.employees += 1;
      return { text: `You put more money into ${biz.name} and hired another employee.` };
    },
  },
]);
