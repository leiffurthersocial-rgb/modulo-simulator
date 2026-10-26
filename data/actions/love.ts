import { defineActions, pay, roll, trigger } from "@/engine/actionHelpers";
import { addChild, partnerOf, startPregnancy } from "@/engine/family";
import { attractedGender } from "@/engine/npc";
import { spawnNpc } from "@/engine/spawn";
import { adjustKarma, adjustStat } from "@/engine/stats";
import type { EventContext } from "@/engine/types";
import { clamp } from "@/engine/util";

const adult = (ctx: EventContext) => ctx.player.age >= 18 && !ctx.player.crime.prison;

export const LOVE_ACTIONS = defineActions("love", [
  {
    id: "love-dating-app",
    label: "Use a dating app",
    description: "Swipe until something happens",
    icon: "Heart",
    perYear: 2,
    visible: adult,
    run(ctx) {
      const p = clamp(0.25 + ctx.player.stats.looks / 160 + ctx.player.skills.charisma / 300, 0.1, 0.9);
      if (!ctx.rng.chance(p)) {
        adjustStat(ctx.player, "happiness", -2);
        return { text: ctx.rng.pick(["You swiped for hours. Nothing but bots and a guy holding a fish.", "Your matches all stopped replying after \"hey.\"", "You matched with your cousin. You deleted the app."]) };
      }
      const age = clamp(ctx.player.age + ctx.rng.int(-6, 6), 18, 90);
      const date = spawnNpc(ctx.state, ctx.rng, ctx.content, ctx.country, { role: "date", age, gender: attractedGender(ctx.rng, ctx.player.attraction), closeness: ctx.rng.int(35, 55) });
      ctx.npc = date;
      trigger(ctx, "love-first-date", date.id);
    },
  },
  {
    id: "love-blind-date",
    label: "Let a friend set you up",
    icon: "Users",
    perYear: 1,
    visible: (ctx) => adult(ctx) && !partnerOf(ctx.state) && Object.values(ctx.state.npcs).some((n) => (n.role === "friend" || n.role === "bestFriend") && n.alive && n.inContact),
    run(ctx) {
      const age = clamp(ctx.player.age + ctx.rng.int(-4, 4), 18, 90);
      const date = spawnNpc(ctx.state, ctx.rng, ctx.content, ctx.country, { role: "date", age, gender: attractedGender(ctx.rng, ctx.player.attraction), closeness: ctx.rng.int(40, 60) });
      ctx.npc = date;
      trigger(ctx, "love-first-date", date.id);
    },
  },
  {
    id: "love-hookup",
    label: "Hook up",
    icon: "Flame",
    perYear: 2,
    visible: adult,
    run(ctx) {
      const partner = partnerOf(ctx.state);
      if (!roll(ctx, "looks", 45)) return { text: "You struck out at the bar. Even the bartender felt bad for you." };
      const other = spawnNpc(ctx.state, ctx.rng, ctx.content, ctx.country, {
        role: partner ? "affair" : "acquaintance",
        age: clamp(ctx.player.age + ctx.rng.int(-8, 8), 18, 90),
        gender: attractedGender(ctx.rng, ctx.player.attraction),
        closeness: ctx.rng.int(25, 45),
        allowCameo: false,
      });
      adjustStat(ctx.player, "happiness", 4);
      if (partner) {
        adjustKarma(ctx.player, -4);
        ctx.state.flags.cheated = Number(ctx.state.flags.cheated ?? 0) + 1;
        if (ctx.rng.chance(0.3)) {
          ctx.npc = partner;
          trigger(ctx, "love-caught-cheating", partner.id);
          return;
        }
      }
      if (ctx.rng.chance(0.06)) {
        if (ctx.player.gender === "female" && other.gender === "male") {
          startPregnancy(ctx.state, other, true);
          return { text: `You hooked up with ${other.firstName}. A few weeks later, you found out you're pregnant.`, tone: "major" };
        }
        if (ctx.player.gender === "male" && other.gender === "female") {
          ctx.state.scheduled.push({ eventId: "love-surprise-baby", atAge: ctx.player.age + 1, npcId: other.id });
        }
      }
      if (ctx.rng.chance(0.05)) {
        ctx.player.health.conditions.push({ id: "std", name: "STD", severity: 15, sinceAge: ctx.player.age, chronic: false });
        return { text: `You hooked up with ${other.firstName}. A week later, it started to burn.`, tone: "bad" };
      }
      return { text: `You hooked up with ${other.firstName}. ${ctx.rng.pick(["Neither of you called the next day.", "They left before sunrise.", "It was fun. You won't be writing poetry about it."])}` };
    },
  },
  {
    id: "love-adopt",
    label: "Adopt a child",
    icon: "Baby",
    perYear: 1,
    cost: 15_000,
    visible: (ctx) => ctx.player.age >= 25 && !ctx.player.crime.prison,
    options: (ctx) =>
      [
        { id: "baby", label: "A baby", age: 0 },
        { id: "toddler", label: "A toddler", age: 3 },
        { id: "child", label: "A young child", age: 7 },
        { id: "teen", label: "A teenager", age: 13 },
      ].map((o) => ({
        id: o.id,
        label: o.label,
        price: Math.round(15_000 * ctx.country.costIndex),
        blocked: ctx.player.finance.cash < 15_000 * ctx.country.costIndex ? "Adoption fees are steep." : ctx.player.crime.record.some((r) => r.convicted) ? "Your criminal record disqualifies you." : undefined,
        icon: "Baby",
      })),
    run(ctx, p) {
      if (!pay(ctx, 15_000)) return;
      const age = p.option === "baby" ? 0 : p.option === "toddler" ? 3 : p.option === "child" ? 7 : 13;
      const kid = addChild(ctx.state, ctx.rng, ctx.country, { adopted: true, age });
      ctx.state.flags.adopted = true;
      adjustStat(ctx.player, "happiness", 10);
      return { title: "Welcome home", text: `You adopted ${kid.firstName}, ${age === 0 ? "a baby" : `age ${age}`}. ${kid.firstName} looked around the new room for a long time.`, tone: "major" };
    },
  },
  {
    id: "love-ivf",
    label: "Fertility treatment",
    icon: "Syringe",
    perYear: 1,
    cost: 20_000,
    visible: (ctx) => ctx.player.age >= 25 && !ctx.player.pregnancy && !ctx.player.crime.prison,
    blocked: (ctx) => (ctx.player.finance.cash < 20_000 * ctx.country.costIndex ? "Can't afford it." : undefined),
    run(ctx) {
      pay(ctx, 20_000);
      const partner = partnerOf(ctx.state);
      const carrying = ctx.player.gender === "female" && ctx.player.age <= 50;
      if (!ctx.rng.chance(ctx.player.age < 38 ? 0.55 : 0.3)) {
        adjustStat(ctx.player, "happiness", -5);
        return { text: "The treatment didn't work this round. The doctors said not to lose hope.", tone: "bad" };
      }
      startPregnancy(ctx.state, partner, carrying);
      return { title: "It worked", text: carrying ? "The treatment worked. You're pregnant!" : "A surrogate is carrying your baby. Due next year.", tone: "major" };
    },
  },
  {
    id: "love-single-life",
    label: "Celebrate being single",
    icon: "Sparkles",
    perYear: 1,
    visible: (ctx) => adult(ctx) && !partnerOf(ctx.state),
    run(ctx) {
      adjustStat(ctx.player, "happiness", ctx.rng.int(3, 6));
      return { text: ctx.rng.pick(["You took yourself out to dinner. Great company.", "You bought yourself flowers. No notes.", "You spent a whole Sunday answering to no one."]), tone: "good" };
    },
  },
]);
