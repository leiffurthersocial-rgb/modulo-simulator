import { CRIMES, type CrimeDef } from "@/data/crimes";
import { defineActions, roll, trigger } from "@/engine/actionHelpers";
import { killPlayer } from "@/engine/lifecycle/death";
import { inherit } from "@/engine/lifecycle/yearly";
import { adjustKarma, adjustSkill, adjustStat } from "@/engine/stats";
import type { EventContext, GameAction } from "@/engine/types";
import { clamp, formatMoney } from "@/engine/util";
import { release } from "@/engine/crime";

/** Start the arrest -> trial chain for a crime. */
export function arrestFor(ctx: EventContext, noun: string, sentence: readonly [number, number]): void {
  ctx.vars.crime = noun;
  ctx.vars.sMin = sentence[0];
  ctx.vars.sMax = sentence[1];
  trigger(ctx, "crime-arrest");
}

function crimeAction(def: CrimeDef): Omit<GameAction, "section"> {
  return {
    id: `crime-${def.id}`,
    label: def.name,
    icon: def.icon,
    perYear: 2,
    visible: (ctx) => ctx.player.age >= def.minAge && (def.id !== "embezzle" || !!ctx.player.career.job),
    run(ctx) {
      ctx.state.flags.crimesCommitted = Number(ctx.state.flags.crimesCommitted ?? 0) + 1;
      adjustKarma(ctx.player, def.karma);
      if (roll(ctx, def.skill, def.difficulty)) {
        const haul = Math.round(ctx.rng.int(def.reward[0], def.reward[1]) * ctx.country.costIndex);
        ctx.player.finance.cash += haul;
        ctx.player.crime.notoriety = clamp(ctx.player.crime.notoriety + def.notoriety);
        adjustSkill(ctx.player, "streetSmarts", ctx.rng.int(1, 2));
        ctx.vars.amount = haul;
        ctx.vars.car = ctx.rng.pick(["sedan", "pickup truck", "luxury SUV", "sports car"]);
        if (def.id === "bank-robbery") ctx.state.flags.bankRobber = true;
        return { text: ctx.rng.pick(def.success).replace("{amount}", formatMoney(ctx.country, haul)), tone: haul > 0 ? "good" : "neutral" };
      }
      if (ctx.rng.chance(def.arrestOnFail)) {
        arrestFor(ctx, def.noun, def.sentence);
        return;
      }
      return { text: ctx.rng.pick(["It went wrong, but you got away empty-handed.", "You lost your nerve halfway through and ran.", "Someone spotted you. You bolted before anyone got a good look."]), tone: "bad" };
    },
  };
}

export const CRIME_ACTIONS = defineActions("crime", [
  ...CRIMES.map(crimeAction),
  {
    id: "crime-heist",
    label: "Plan a heist",
    description: "Crack the vault. Timing is everything.",
    icon: "Bomb",
    ui: "heist",
    perYear: 1,
    visible: (ctx) => ctx.player.age >= 18,
    run: () => undefined,
  },
  {
    id: "crime-heist-settle",
    label: "Heist result",
    internal: true,
    run(ctx, p) {
      ctx.state.actionsThisYear["crime-heist"] = 1;
      const score = clamp(Math.round(Number(p.score) || 0), 0, 3);
      ctx.state.flags.crimesCommitted = Number(ctx.state.flags.crimesCommitted ?? 0) + 1;
      adjustKarma(ctx.player, -12);
      if (score === 3 || (score === 2 && ctx.rng.chance(0.5))) {
        const haul = Math.round(ctx.rng.int(score === 3 ? 400_000 : 80_000, score === 3 ? 3_000_000 : 400_000) * ctx.country.costIndex);
        ctx.player.finance.cash += haul;
        ctx.player.crime.notoriety = clamp(ctx.player.crime.notoriety + 20);
        ctx.state.flags.heistPulled = true;
        return { title: "Clean getaway", text: `The vault swung open. You and your crew vanished with ${formatMoney(ctx.country, haul)}.`, tone: "major" };
      }
      arrestFor(ctx, "armed robbery", [8, 25]);
      return;
    },
  },
]);

const METHODS = [
  { id: "poison", label: "Poison them", difficulty: 55, caught: 0.35 },
  { id: "accident", label: "Stage an accident", difficulty: 60, caught: 0.3 },
  { id: "hitman", label: "Hire a hitman", difficulty: 35, caught: 0.25, usd: 50_000 },
  { id: "confront", label: "Do it with your own hands", difficulty: 45, caught: 0.6 },
];

export const DARK_ACTIONS = defineActions("people", [
  {
    id: "people-murder",
    group: "Dark",
    label: "Murder",
    icon: "Skull",
    perYear: 1,
    visible: (ctx) => ctx.player.age >= 16 && !!ctx.npc && ctx.npc.alive && ctx.npc.inContact,
    options: (ctx) =>
      METHODS.map((m) => ({
        id: m.id,
        label: m.label,
        price: m.usd ? Math.round(m.usd * ctx.country.costIndex) : undefined,
        blocked: m.usd && ctx.player.finance.cash < m.usd * ctx.country.costIndex ? "Can't afford a hitman." : undefined,
        icon: "Skull",
      })),
    run(ctx, p) {
      const npc = ctx.npc!;
      const m = METHODS.find((x) => x.id === p.option);
      if (!m) return;
      if (m.usd) ctx.player.finance.cash -= Math.round(m.usd * ctx.country.costIndex);
      adjustKarma(ctx.player, -40);
      ctx.state.flags.attemptedMurder = true;
      if (!roll(ctx, "streetSmarts", m.difficulty)) {
        npc.closeness = 0;
        npc.role = "nemesis";
        if (ctx.rng.chance(0.6)) {
          arrestFor(ctx, "attempted murder", [8, 20]);
          return;
        }
        return { text: `Your attempt on ${npc.firstName}'s life failed. ${npc.firstName} knows it was you.`, tone: "bad" };
      }
      npc.alive = false;
      npc.deathAge = npc.age;
      ctx.state.flags.murders = Number(ctx.state.flags.murders ?? 0) + 1;
      adjustStat(ctx.player, "happiness", -10);
      inherit(ctx.state, npc, ctx.country);
      if (ctx.rng.chance(m.caught)) {
        arrestFor(ctx, "murder", [20, 50]);
        return;
      }
      return { text: `${npc.firstName} is dead. The police called it ${m.id === "hitman" ? "a robbery gone wrong" : m.id === "poison" ? "natural causes" : "a tragic accident"}. You went to the funeral.`, tone: "major" };
    },
  },
]);

export const PRISON_ACTIONS = defineActions("prison", [
  {
    id: "prison-workout",
    label: "Work out in the yard",
    icon: "Dumbbell",
    perYear: 2,
    run(ctx) {
      adjustSkill(ctx.player, "athleticism", ctx.rng.int(2, 4));
      adjustStat(ctx.player, "health", ctx.rng.int(1, 3));
      const pr = ctx.player.crime.prison!;
      pr.respect = clamp(pr.respect + ctx.rng.int(1, 4));
      return { text: "You did pull-ups until your arms gave out. The other inmates noticed." };
    },
  },
  {
    id: "prison-library",
    label: "Study in the prison library",
    icon: "BookOpen",
    perYear: 2,
    run(ctx) {
      adjustStat(ctx.player, "smarts", ctx.rng.int(1, 3));
      return { text: ctx.rng.pick(["You read every law book in the library.", "You got through the classics. All of them.", "You started studying for a degree by correspondence."]) };
    },
  },
  {
    id: "prison-job",
    label: "Work a prison job",
    icon: "Hammer",
    perYear: 1,
    run(ctx) {
      const pay = Math.round(ctx.rng.int(100, 400) * ctx.country.costIndex);
      ctx.player.finance.cash += pay;
      return { text: `You worked in the ${ctx.rng.pick(["laundry", "kitchen", "license plate shop", "library"])} all year and earned ${formatMoney(ctx.country, pay)}.` };
    },
  },
  {
    id: "prison-fight",
    label: "Pick a fight",
    icon: "Swords",
    perYear: 1,
    run(ctx) {
      const pr = ctx.player.crime.prison!;
      if (roll(ctx, "athleticism", 50)) {
        pr.respect = clamp(pr.respect + ctx.rng.int(8, 15));
        return { text: "You picked a fight with the yard's loudest inmate and won. Nobody bothers you now.", tone: "good" };
      }
      adjustStat(ctx.player, "health", -ctx.rng.int(8, 18));
      pr.yearsLeft += ctx.rng.chance(0.4) ? 1 : 0;
      if (ctx.player.stats.health <= 0) killPlayer(ctx.state, "prisonFight", `You were killed in a prison fight at ${ctx.player.age}.`);
      return { text: "You lost the fight badly and spent a month in the infirmary.", tone: "bad" };
    },
  },
  {
    id: "prison-gang",
    label: "Join a gang",
    icon: "Users",
    perYear: 1,
    visible: (ctx) => !ctx.state.flags.prisonGang,
    run(ctx) {
      const pr = ctx.player.crime.prison!;
      if (pr.respect < 30 && !roll(ctx, "streetSmarts", 45)) return { text: "The gang laughed you out of the cafeteria. Earn some respect first.", tone: "bad" };
      ctx.state.flags.prisonGang = ctx.rng.pick(["the Kings", "the Eastside Crew", "the Brotherhood", "the Ghosts"]);
      pr.respect = clamp(pr.respect + 20);
      adjustKarma(ctx.player, -3);
      return { text: `You were jumped into ${String(ctx.state.flags.prisonGang)}. You have protection now. And obligations.` };
    },
  },
  {
    id: "prison-parole",
    label: "Apply for parole",
    icon: "Gavel",
    perYear: 1,
    visible: (ctx) => ctx.player.age >= (ctx.player.crime.prison?.paroleEligibleAtAge ?? Infinity),
    run(ctx) {
      const p = clamp(0.25 + ctx.player.karma / 200 - (ctx.state.flags.prisonGang ? 0.15 : 0) + ctx.player.skills.charisma / 300, 0.05, 0.8);
      if (ctx.rng.chance(p)) {
        release(ctx.state, "parole");
        return { title: "Parole granted", text: "The parole board voted to release you.", tone: "major", log: false };
      }
      return { text: "The parole board denied your request. Maybe next year.", tone: "bad" };
    },
  },
  {
    id: "prison-appeal",
    label: "Appeal your conviction",
    icon: "Scale",
    perYear: 1,
    cost: 15000,
    blocked: (ctx) => (ctx.player.finance.cash < 15000 * ctx.country.costIndex ? "You can't afford a lawyer." : undefined),
    run(ctx) {
      ctx.player.finance.cash -= Math.round(15000 * ctx.country.costIndex);
      if (ctx.rng.chance(0.15)) {
        release(ctx.state, "appeal");
        return { title: "Overturned", text: "Your lawyer found a procedural error. Conviction overturned.", tone: "major", log: false };
      }
      return { text: "The appeals court upheld your conviction.", tone: "bad" };
    },
  },
  {
    id: "prison-escape",
    label: "Attempt an escape",
    icon: "Rocket",
    perYear: 1,
    run(ctx) {
      const pr = ctx.player.crime.prison!;
      if (roll(ctx, "streetSmarts", 75)) {
        release(ctx.state, "escaped");
        return { title: "Escaped!", text: "You slipped out through a laundry truck. You're free, and very wanted.", tone: "major", log: false };
      }
      pr.yearsLeft += ctx.rng.int(2, 5);
      adjustStat(ctx.player, "health", -ctx.rng.int(3, 10));
      return { text: "The guards caught you at the fence. Extra years added to your sentence.", tone: "bad" };
    },
  },
  {
    id: "prison-riot",
    label: "Start a riot",
    icon: "Flame",
    perYear: 1,
    run(ctx) {
      const pr = ctx.player.crime.prison!;
      if (ctx.rng.chance(0.3)) {
        pr.respect = clamp(pr.respect + 25);
        return { text: "Your riot made the evening news. The warden promised better food. The inmates see you as a leader.", tone: "good" };
      }
      pr.yearsLeft += ctx.rng.int(1, 3);
      adjustStat(ctx.player, "health", -ctx.rng.int(5, 15));
      return { text: "The riot was crushed in minutes. You were identified as the instigator.", tone: "bad" };
    },
  },
]);
