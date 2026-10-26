import { CONDITION_BY_ID } from "@/data/conditions";
import { defineActions, pay, roll } from "@/engine/actionHelpers";
import { treat } from "@/engine/health";
import { adjustKarma, adjustSkill, adjustStat } from "@/engine/stats";
import type { ActionOption, AddictionKind, EventContext } from "@/engine/types";
import { clamp } from "@/engine/util";

const minAge = (n: number) => (ctx: EventContext) => ctx.player.age >= n;
const price = (ctx: EventContext, usd: number) => Math.round(usd * ctx.country.costIndex);
const cantAfford = (usd: number) => (ctx: EventContext) => (ctx.player.finance.cash < usd * ctx.country.costIndex ? "Can't afford it." : undefined);
const markFit = (ctx: EventContext) => {
  ctx.state.flags.fit = ctx.player.age;
};

const DESTINATIONS = [
  { id: "beach", label: "Beach resort", usd: 2500, line: "You spent a week doing absolutely nothing on a beach. Perfect." },
  { id: "city", label: "City break", usd: 1800, line: "You walked twenty miles a day through museums and ate everything." },
  { id: "safari", label: "Safari", usd: 7000, line: "You saw a lion yawn from twenty feet away. Life-changing." },
  { id: "ski", label: "Ski trip", usd: 3500, line: "You skied like a fawn on ice and loved every second." },
  { id: "cruise", label: "Cruise", usd: 3000, line: "You ate at a buffet nine times a day and saw some islands." },
  { id: "backpacking", label: "Backpacking trip", usd: 1200, line: "You slept in hostels and met people from twenty countries." },
  { id: "world-tour", label: "Round-the-world trip", usd: 25000, line: "Three months, eleven countries, one lost suitcase. Unforgettable." },
];

const HOBBIES = [
  { id: "painting", label: "Painting", skill: "creativity" as const },
  { id: "gardening", label: "Gardening", skill: "creativity" as const },
  { id: "cooking", label: "Cooking", skill: "creativity" as const },
  { id: "gaming", label: "Video games", skill: "smarts" as const },
  { id: "chess", label: "Chess", skill: "smarts" as const },
  { id: "photography", label: "Photography", skill: "creativity" as const },
  { id: "woodworking", label: "Woodworking", skill: "creativity" as const },
  { id: "knitting", label: "Knitting", skill: "creativity" as const },
  { id: "fishing", label: "Fishing", skill: "streetSmarts" as const },
  { id: "improv", label: "Improv comedy", skill: "charisma" as const },
];

const SURGERIES = [
  { id: "nose", label: "Nose job", usd: 7000 },
  { id: "face", label: "Facelift", usd: 12000 },
  { id: "lipo", label: "Liposuction", usd: 6000 },
  { id: "botox", label: "Botox", usd: 600 },
  { id: "teeth", label: "Veneers", usd: 15000 },
];

const DRUGS = [
  { id: "weed", label: "Smoke weed", addiction: 3, risk: 0 },
  { id: "pills", label: "Take pills", addiction: 10, risk: 0.01 },
  { id: "cocaine", label: "Do cocaine", addiction: 14, risk: 0.015 },
  { id: "heroin", label: "Try heroin", addiction: 30, risk: 0.04 },
];

export const ACTIVITY_ACTIONS = defineActions("activities", [
  {
    id: "act-gym",
    group: "Fitness",
    label: "Go to the gym",
    icon: "Dumbbell",
    perYear: 2,
    visible: minAge(13),
    run(ctx) {
      adjustStat(ctx.player, "health", ctx.rng.int(2, 5));
      adjustStat(ctx.player, "looks", ctx.rng.int(0, 2));
      adjustSkill(ctx.player, "athleticism", ctx.rng.int(1, 3));
      adjustStat(ctx.player, "happiness", 1);
      markFit(ctx);
      if (ctx.rng.chance(0.03)) {
        adjustStat(ctx.player, "health", -8);
        return { text: "You tried to deadlift way too much and hurt your back.", tone: "bad" };
      }
      return { text: ctx.rng.pick(["You hit the gym hard. You feel great.", "You did leg day. You could not do stairs for two days.", "You found a gym routine you actually like."]), tone: "good" };
    },
  },
  {
    id: "act-run",
    group: "Fitness",
    label: "Go for a run",
    icon: "Zap",
    perYear: 2,
    visible: minAge(8),
    run(ctx) {
      adjustStat(ctx.player, "health", ctx.rng.int(1, 4));
      adjustSkill(ctx.player, "athleticism", ctx.rng.int(1, 2));
      adjustStat(ctx.player, "happiness", 2);
      markFit(ctx);
      return { text: ctx.rng.pick(["You went for a long run at sunrise.", "You ran a 5K and didn't stop once.", "You got chased by a goose mid-run. Personal best."]), tone: "good" };
    },
  },
  {
    id: "act-yoga",
    group: "Fitness",
    label: "Yoga class",
    icon: "Flower2",
    perYear: 1,
    visible: minAge(12),
    run(ctx) {
      adjustStat(ctx.player, "health", ctx.rng.int(1, 3));
      adjustStat(ctx.player, "happiness", ctx.rng.int(2, 4));
      return { text: "You did yoga. You can now almost touch your toes.", tone: "good" };
    },
  },
  {
    id: "act-martial-arts",
    group: "Fitness",
    label: "Martial arts",
    icon: "Swords",
    perYear: 1,
    visible: minAge(6),
    run(ctx) {
      adjustSkill(ctx.player, "athleticism", ctx.rng.int(2, 4));
      adjustSkill(ctx.player, "streetSmarts", 1);
      ctx.state.flags.beltRank = Number(ctx.state.flags.beltRank ?? 0) + 1;
      const belts = ["white", "yellow", "orange", "green", "blue", "brown", "black"];
      const belt = belts[Math.min(belts.length - 1, Number(ctx.state.flags.beltRank) - 1)];
      return { text: `You trained all year and earned your ${belt} belt.`, tone: "good" };
    },
  },
  {
    id: "act-diet",
    group: "Fitness",
    label: "Go on a diet",
    icon: "Utensils",
    perYear: 1,
    visible: minAge(14),
    options: () => [
      { id: "mediterranean", label: "Mediterranean diet" },
      { id: "vegan", label: "Go vegan" },
      { id: "keto", label: "Keto" },
      { id: "juice", label: "Juice cleanse" },
    ],
    run(ctx, p) {
      if (p.option === "juice") {
        adjustStat(ctx.player, "happiness", -3);
        return { text: "You did a juice cleanse. You were hungry and furious for a week. No measurable benefit.", tone: "bad" };
      }
      adjustStat(ctx.player, "health", ctx.rng.int(2, 5));
      adjustStat(ctx.player, "looks", ctx.rng.int(0, 2));
      markFit(ctx);
      if (p.option === "vegan") adjustKarma(ctx.player, 1);
      return { text: `You stuck to the ${String(p.option)} diet${roll(ctx, "smarts", 30) ? " and felt better than you have in years" : ", mostly"}.`, tone: "good" };
    },
  },
  {
    id: "act-sports-league",
    group: "Fun",
    label: "Join a sports league",
    icon: "Target",
    perYear: 1,
    visible: minAge(18),
    run(ctx) {
      adjustSkill(ctx.player, "athleticism", 2);
      adjustSkill(ctx.player, "charisma", 1);
      adjustStat(ctx.player, "happiness", 3);
      return { text: `You joined a ${ctx.rng.pick(["kickball", "softball", "volleyball", "five-a-side football"])} league. Your team is called ${ctx.rng.pick(["Remainder Squad", "The Mod Squad", "Net Results", "Kick Assets"])}.`, tone: "good" };
    },
  },
  {
    id: "act-vacation",
    group: "Fun",
    label: "Take a vacation",
    icon: "Plane",
    perYear: 1,
    visible: (ctx) => ctx.player.age >= 18,
    options: (ctx) => DESTINATIONS.map((d) => ({ id: d.id, label: d.label, price: price(ctx, d.usd), blocked: cantAfford(d.usd)(ctx), icon: "Plane" })),
    run(ctx, p) {
      const d = DESTINATIONS.find((x) => x.id === p.option);
      if (!d || !pay(ctx, d.usd)) return;
      adjustStat(ctx.player, "happiness", ctx.rng.int(6, 12));
      ctx.state.flags.countriesVisited = Number(ctx.state.flags.countriesVisited ?? 0) + (d.id === "world-tour" ? 11 : 1);
      if (ctx.rng.chance(0.05)) {
        adjustStat(ctx.player, "health", -6);
        return { text: `${d.line} You also got food poisoning on the last day.` };
      }
      return { text: d.line, tone: "good" };
    },
  },
  {
    id: "act-hobby",
    group: "Fun",
    label: "Pick up a hobby",
    icon: "Palette",
    perYear: 1,
    visible: minAge(6),
    options: () => HOBBIES.map((h) => ({ id: h.id, label: h.label })),
    run(ctx, p) {
      const h = HOBBIES.find((x) => x.id === p.option);
      if (!h) return;
      if (h.skill === "smarts") adjustStat(ctx.player, "smarts", ctx.rng.int(1, 3));
      else adjustSkill(ctx.player, h.skill, ctx.rng.int(1, 4));
      adjustStat(ctx.player, "happiness", ctx.rng.int(2, 5));
      ctx.state.flags[`hobby:${h.id}`] = true;
      return { text: `You spent the year getting into ${h.label.toLowerCase()}.`, tone: "good" };
    },
  },
  {
    id: "act-volunteer",
    group: "Fun",
    label: "Volunteer",
    icon: "HandHeart",
    perYear: 1,
    visible: minAge(12),
    run(ctx) {
      adjustKarma(ctx.player, ctx.rng.int(3, 6));
      adjustStat(ctx.player, "happiness", ctx.rng.int(2, 5));
      ctx.state.flags.volunteerYears = Number(ctx.state.flags.volunteerYears ?? 0) + 1;
      return { text: `You volunteered at ${ctx.rng.pick(["a soup kitchen", "an animal shelter", "a literacy program", "a hospice", "a community garden"])}.`, tone: "good" };
    },
  },
  {
    id: "act-language",
    group: "Fun",
    label: "Learn a language",
    icon: "MessageCircle",
    perYear: 1,
    visible: minAge(8),
    run(ctx) {
      adjustStat(ctx.player, "smarts", ctx.rng.int(1, 3));
      ctx.state.flags.languages = Number(ctx.state.flags.languages ?? 0) + (roll(ctx, "smarts", 50) ? 1 : 0);
      const lang = ctx.rng.pick(["Spanish", "Japanese", "Portuguese", "Italian", "Korean", "Swahili", "German"]);
      return { text: `You studied ${lang} every day. You can now order coffee and apologize fluently.` };
    },
  },
  // ------------------------------------------------------------ health
  {
    id: "health-doctor",
    section: "health",
    label: "Visit the doctor",
    icon: "Stethoscope",
    perYear: 2,
    cost: 150,
    visible: minAge(0),
    blocked: cantAfford(150),
    run(ctx) {
      pay(ctx, 150);
      const conditions = ctx.player.health.conditions;
      if (conditions.length === 0) {
        adjustStat(ctx.player, "health", 1);
        return { text: "The doctor gave you a clean bill of health and a lollipop." };
      }
      const target = [...conditions].sort((a, b) => b.severity - a.severity)[0]!;
      const result = treat(ctx.state, ctx.rng, target.id, "clinic");
      if (result === "cured") return { text: `The doctor treated your ${target.name.toLowerCase()}. It's gone.`, tone: "good" };
      if (result === "improved") return { text: `The doctor adjusted your treatment for ${target.name.toLowerCase()}. It's under better control.`, tone: "good" };
      const def = CONDITION_BY_ID[target.id];
      return { text: `The doctor couldn't do much about your ${target.name.toLowerCase()}.${def?.care === "hospital" ? " They recommended a hospital." : ""}`, tone: "bad" };
    },
  },
  {
    id: "health-hospital",
    section: "health",
    label: "Check into the hospital",
    icon: "HeartPulse",
    perYear: 1,
    cost: 4000,
    visible: (ctx) => ctx.player.health.conditions.length > 0 || ctx.player.stats.health < 40,
    blocked: cantAfford(4000),
    run(ctx) {
      pay(ctx, 4000);
      adjustStat(ctx.player, "health", ctx.rng.int(5, 15));
      const results = ctx.player.health.conditions.map((c) => ({ c, r: treat(ctx.state, ctx.rng, c.id, "hospital") }));
      const cured = results.filter((x) => x.r === "cured").map((x) => x.c.name.toLowerCase());
      return { text: cured.length > 0 ? `You spent a week in the hospital. They cured your ${cured.join(" and ")}.` : "You spent a week in the hospital. You feel a little better.", tone: "good" };
    },
  },
  {
    id: "health-checkup",
    section: "health",
    label: "Full health screening",
    icon: "Eye",
    perYear: 1,
    cost: 600,
    visible: minAge(30),
    blocked: cantAfford(600),
    run(ctx) {
      pay(ctx, 600);
      const serious = ctx.player.health.conditions.filter((c) => c.severity > 30);
      for (const c of serious) c.severity = clamp(c.severity - 10);
      adjustStat(ctx.player, "health", 2);
      return { text: serious.length > 0 ? "The screening caught things early. Your doctor adjusted your care." : "The screening came back clear. You celebrated with a salad, briefly." };
    },
  },
  {
    id: "health-surgery",
    section: "health",
    label: "Plastic surgery",
    icon: "Scissors",
    perYear: 1,
    visible: minAge(18),
    options: (ctx): ActionOption[] => SURGERIES.map((s) => ({ id: s.id, label: s.label, price: price(ctx, s.usd), blocked: cantAfford(s.usd)(ctx), icon: "Scissors" })),
    run(ctx, p) {
      const s = SURGERIES.find((x) => x.id === p.option);
      if (!s || !pay(ctx, s.usd)) return;
      ctx.state.flags.surgeries = Number(ctx.state.flags.surgeries ?? 0) + 1;
      if (ctx.rng.chance(0.12)) {
        adjustStat(ctx.player, "looks", -ctx.rng.int(8, 18));
        adjustStat(ctx.player, "happiness", -8);
        return { text: `Your ${s.label.toLowerCase()} was botched. You avoid mirrors now.`, tone: "bad" };
      }
      adjustStat(ctx.player, "looks", ctx.rng.int(5, 12));
      adjustStat(ctx.player, "happiness", 4);
      return { text: `Your ${s.label.toLowerCase()} turned out great. People keep asking if you've been sleeping more.`, tone: "good" };
    },
  },
  {
    id: "health-tattoo",
    section: "health",
    label: "Get a tattoo",
    icon: "PenTool",
    perYear: 2,
    cost: 250,
    visible: minAge(18),
    blocked: cantAfford(250),
    run(ctx) {
      pay(ctx, 250);
      ctx.state.flags.tattoos = Number(ctx.state.flags.tattoos ?? 0) + 1;
      const design = ctx.rng.pick(["a tiny %", "a wolf howling at a moon", "your mother's name", "an anchor", "a quote misspelled in Latin", "a minimalist mountain"]);
      if (design.includes("misspelled")) return { text: `You got ${design}. You didn't notice for a year.`, tone: "bad" };
      adjustStat(ctx.player, "happiness", 3);
      return { text: `You got a tattoo of ${design}.`, tone: "good" };
    },
  },
  {
    id: "health-rehab",
    section: "health",
    label: "Go to rehab",
    icon: "Pill",
    perYear: 1,
    cost: 8000,
    visible: (ctx) => Object.values(ctx.player.health.addictions).some((v) => (v ?? 0) > 15),
    blocked: cantAfford(8000),
    options: (ctx) =>
      (Object.entries(ctx.player.health.addictions) as [AddictionKind, number][]).filter(([, v]) => v > 15).map(([k]) => ({ id: k, label: `${k[0]!.toUpperCase()}${k.slice(1)} addiction`, price: price(ctx, 8000), icon: "Pill" })),
    run(ctx, p) {
      const kind = p.option as AddictionKind;
      pay(ctx, 8000);
      const add = ctx.player.health.addictions;
      if (roll(ctx, "happiness", 40) || ctx.rng.chance(0.45)) {
        add[kind] = 0;
        ctx.state.flags.rehabSuccess = true;
        adjustStat(ctx.player, "health", 8);
        return { title: "Clean", text: `You completed rehab and beat your ${kind} addiction. One day at a time.`, tone: "major" };
      }
      add[kind] = clamp((add[kind] ?? 0) - 20);
      return { text: `Rehab helped, but you relapsed a few weeks after getting out.`, tone: "bad" };
    },
  },
  {
    id: "health-quit",
    section: "health",
    label: "Try to quit cold turkey",
    icon: "Cigarette",
    perYear: 1,
    visible: (ctx) => Object.values(ctx.player.health.addictions).some((v) => (v ?? 0) > 0),
    run(ctx) {
      const add = ctx.player.health.addictions;
      const worst = (Object.entries(add) as [AddictionKind, number][]).sort((a, b) => b[1] - a[1])[0];
      if (!worst) return;
      const [kind, level] = worst;
      if (ctx.rng.chance(clamp(0.75 - level / 120, 0.1, 0.75))) {
        add[kind] = 0;
        return { text: `You quit ${kind === "smoking" ? "smoking" : kind} cold turkey. The first month was hell.`, tone: "good" };
      }
      return { text: `You lasted ${ctx.rng.int(2, 19)} days before relapsing.`, tone: "bad" };
    },
  },
  // ------------------------------------------------------------ mind
  {
    id: "mind-meditate",
    section: "mind",
    label: "Meditate",
    icon: "Flower2",
    perYear: 2,
    visible: minAge(10),
    run(ctx) {
      adjustStat(ctx.player, "happiness", ctx.rng.int(2, 5));
      adjustStat(ctx.player, "health", 1);
      return { text: ctx.rng.pick(["You meditated every morning. Your mind is slightly quieter.", "You tried to meditate. You mostly thought about lunch. Still helped.", "You went on a silent retreat. You lasted four days."]), tone: "good" };
    },
  },
  {
    id: "mind-therapy",
    section: "mind",
    label: "See a therapist",
    icon: "Brain",
    perYear: 1,
    cost: 1200,
    visible: minAge(12),
    blocked: cantAfford(1200),
    run(ctx) {
      pay(ctx, 1200);
      adjustStat(ctx.player, "happiness", ctx.rng.int(5, 12));
      for (const id of ["depression", "anxiety"]) {
        const c = ctx.player.health.conditions.find((x) => x.id === id);
        if (c) c.severity = clamp(c.severity - ctx.rng.int(10, 20));
      }
      return { text: ctx.rng.pick(["Your therapist helped you untangle some things from childhood.", "You cried in therapy. It was a breakthrough.", "Your therapist asked how that made you feel. You actually answered."]), tone: "good" };
    },
  },
  {
    id: "mind-library",
    section: "mind",
    label: "Read at the library",
    icon: "BookOpen",
    perYear: 2,
    visible: minAge(6),
    run(ctx) {
      adjustStat(ctx.player, "smarts", ctx.rng.int(1, 3));
      ctx.state.flags.booksRead = Number(ctx.state.flags.booksRead ?? 0) + ctx.rng.int(5, 20);
      return { text: `You read ${ctx.rng.pick(["a stack of mystery novels", "a history of salt", "every book by one author", "philosophy you only half understood"])}.` };
    },
  },
  {
    id: "mind-class",
    section: "mind",
    label: "Take a night class",
    icon: "GraduationCap",
    perYear: 1,
    cost: 400,
    visible: minAge(18),
    blocked: cantAfford(400),
    run(ctx) {
      pay(ctx, 400);
      adjustStat(ctx.player, "smarts", ctx.rng.int(2, 4));
      return { text: `You took a night class in ${ctx.rng.pick(["astronomy", "pottery", "public speaking", "accounting", "creative writing"])}.`, tone: "good" };
    },
  },
  {
    id: "mind-worship",
    section: "mind",
    label: "Attend a religious service",
    icon: "Church",
    perYear: 1,
    visible: minAge(5),
    run(ctx) {
      adjustStat(ctx.player, "happiness", ctx.rng.int(1, 4));
      adjustKarma(ctx.player, 1);
      return { text: "You attended a service. The singing was lovely, the sermon was long." };
    },
  },
  // ------------------------------------------------------------ nightlife
  {
    id: "night-club",
    section: "nightlife",
    label: "Go clubbing",
    icon: "Music",
    perYear: 2,
    cost: 80,
    visible: minAge(18),
    blocked: cantAfford(80),
    run(ctx) {
      pay(ctx, 80);
      adjustStat(ctx.player, "happiness", ctx.rng.int(3, 7));
      if (ctx.rng.chance(0.08)) {
        adjustStat(ctx.player, "health", -5);
        return { text: "Someone threw a punch at the club. It landed on you.", tone: "bad" };
      }
      return { text: ctx.rng.pick(["You danced until 4 a.m. Your feet have filed a complaint.", "The DJ played your song. You lost your mind.", "You lost your friends, found new ones, and got a kebab."]), tone: "good" };
    },
  },
  {
    id: "night-bar",
    section: "nightlife",
    label: "Hit the bar",
    icon: "Wine",
    perYear: 3,
    cost: 50,
    visible: minAge(18),
    blocked: cantAfford(50),
    run(ctx) {
      pay(ctx, 50);
      const add = ctx.player.health.addictions;
      add.alcohol = clamp((add.alcohol ?? 0) + ctx.rng.int(1, 5));
      adjustStat(ctx.player, "happiness", ctx.rng.int(2, 5));
      if (ctx.rng.chance(0.06) && ctx.state.flags.license) {
        ctx.state.scheduled.push({ eventId: "crime-dui", atAge: ctx.player.age });
        return { text: "You had a few too many and decided to drive home anyway." };
      }
      return { text: ctx.rng.pick(["You had a few drinks and a great conversation with a stranger.", "You won bar trivia. The prize was a free drink, which you drank.", "You sang along to the jukebox. Loudly."]) };
    },
  },
  {
    id: "night-smoke",
    section: "nightlife",
    label: "Buy cigarettes",
    icon: "Cigarette",
    perYear: 1,
    cost: 300,
    visible: minAge(16),
    run(ctx) {
      pay(ctx, 300);
      const add = ctx.player.health.addictions;
      add.smoking = clamp((add.smoking ?? 0) + ctx.rng.int(8, 15));
      adjustStat(ctx.player, "health", -2);
      adjustStat(ctx.player, "happiness", 1);
      return { text: "You bought a year's worth of cigarettes, one pack at a time." };
    },
  },
  {
    id: "night-drugs",
    section: "nightlife",
    label: "Do drugs",
    icon: "Pill",
    perYear: 2,
    visible: minAge(15),
    options: () => DRUGS.map((d) => ({ id: d.id, label: d.label, icon: "Pill" })),
    run(ctx, p) {
      const d = DRUGS.find((x) => x.id === p.option);
      if (!d) return;
      const add = ctx.player.health.addictions;
      add.drugs = clamp((add.drugs ?? 0) + d.addiction + ctx.rng.int(0, 5));
      adjustKarma(ctx.player, -1);
      if (ctx.rng.chance(d.risk)) {
        ctx.state.scheduled.push({ eventId: "health-overdose", atAge: ctx.player.age });
        return { text: "Something about this batch was wrong. Very wrong." };
      }
      adjustStat(ctx.player, "happiness", ctx.rng.int(2, 8));
      adjustStat(ctx.player, "health", -ctx.rng.int(1, d.addiction > 10 ? 6 : 2));
      if (ctx.player.age < 18 && ctx.rng.chance(0.15)) {
        adjustStat(ctx.player, "happiness", -6);
        return { text: "Your parents found out. There was a family meeting with a pamphlet.", tone: "bad" };
      }
      return { text: d.id === "weed" ? "You got high and ate an entire pizza while watching documentaries about bees." : "You had a wild night you mostly can't remember." };
    },
  },
  {
    id: "night-party",
    section: "nightlife",
    label: "Throw a house party",
    icon: "Sparkles",
    perYear: 1,
    cost: 300,
    visible: (ctx) => ctx.player.age >= 18 && !ctx.player.livesWithParents,
    blocked: cantAfford(300),
    run(ctx) {
      pay(ctx, 300);
      adjustStat(ctx.player, "happiness", ctx.rng.int(4, 8));
      adjustSkill(ctx.player, "charisma", 1);
      if (ctx.rng.chance(0.12)) return { text: "Your party got so loud the police shut it down. Someone stole your toaster." };
      return { text: "You threw a legendary party. People are still talking about the playlist.", tone: "good" };
    },
  },
]);
