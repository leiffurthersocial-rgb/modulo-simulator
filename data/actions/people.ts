import { defineActions, pay, roll } from "@/engine/actionHelpers";
import { quote } from "@/engine/dialogue";
import { breakUp, carrier, divorce, fertility, marry, partnerOf, startPregnancy } from "@/engine/family";
import { adjustKarma, adjustStat } from "@/engine/stats";
import type { EventContext, Npc, NpcRole } from "@/engine/types";
import { clamp, formatMoney } from "@/engine/util";

const npcOf = (ctx: EventContext): Npc => ctx.npc!;
const is =
  (...roles: NpcRole[]) =>
  (ctx: EventContext) =>
    !!ctx.npc && ctx.npc.alive && ctx.npc.inContact && roles.includes(ctx.npc.role);
const notRole =
  (...roles: NpcRole[]) =>
  (ctx: EventContext) =>
    !!ctx.npc && ctx.npc.alive && ctx.npc.inContact && !roles.includes(ctx.npc.role);
const close = (npc: Npc, delta: number) => {
  npc.closeness = clamp(Math.round(npc.closeness + delta));
};
const ROMANTIC: NpcRole[] = ["partner", "fiance", "spouse", "date", "affair"];
const FAMILY_UP: NpcRole[] = ["mother", "father", "stepparent", "grandparent"];
const adult = (ctx: EventContext) => ctx.player.age >= 18;

export const PEOPLE_ACTIONS = defineActions("people", [
  {
    id: "people-spend-time",
    group: "Interact",
    label: "Spend time together",
    icon: "Heart",
    perYearPerPerson: 2,
    visible: (ctx) => !!ctx.npc?.alive && ctx.npc.inContact && ctx.player.age >= 3,
    run(ctx) {
      const npc = npcOf(ctx);
      const delta = ctx.rng.int(4, 10) + (npc.traits.includes("flaky") ? -3 : 0);
      close(npc, delta);
      adjustStat(ctx.player, "happiness", ctx.rng.int(1, 4));
      const what = ctx.player.age < 13 ? ctx.rng.pick(["played board games", "built a pillow fort", "went to the park"]) : ctx.rng.pick(["went out for dinner", "watched a movie", "went for a long walk", "got coffee", "went to a concert", "cooked together"]);
      return { text: `You and ${npc.firstName} ${what}.${quote(ctx, npc, "spendTime")}`, tone: "good" };
    },
  },
  {
    id: "people-conversation",
    group: "Interact",
    label: "Have a conversation",
    icon: "MessageCircle",
    perYearPerPerson: 2,
    visible: (ctx) => !!ctx.npc?.alive && ctx.npc.inContact && ctx.player.age >= 4,
    run(ctx) {
      const npc = npcOf(ctx);
      const topic = ctx.rng.pick(["the weather", "work", "old memories", "the meaning of life", "a show you both watch", "family drama", "politics, briefly and regrettably"]);
      if (topic.startsWith("politics") && ctx.rng.chance(0.4)) {
        close(npc, -4);
        return { text: `You and ${npc.firstName} talked about ${topic}. It got heated.`, tone: "bad" };
      }
      close(npc, ctx.rng.int(2, 6));
      return { text: `You and ${npc.firstName} talked about ${topic}.${quote(ctx, npc, "any")}` };
    },
  },
  {
    id: "people-compliment",
    group: "Interact",
    label: "Compliment",
    icon: "ThumbsUp",
    perYearPerPerson: 1,
    visible: (ctx) => !!ctx.npc?.alive && ctx.npc.inContact && ctx.player.age >= 5,
    run(ctx) {
      const npc = npcOf(ctx);
      const thing = ctx.rng.pick(["smile", "cooking", "sense of humor", "shoes", "taste in music", "work ethic", "laugh"]);
      close(npc, npc.traits.includes("mean") ? 1 : ctx.rng.int(3, 7));
      return { text: `You complimented ${npc.firstName}'s ${thing}.${quote(ctx, npc, "compliment")}`, tone: "good" };
    },
  },
  {
    id: "people-insult",
    group: "Interact",
    label: "Insult",
    icon: "ThumbsDown",
    perYearPerPerson: 1,
    visible: (ctx) => !!ctx.npc?.alive && ctx.npc.inContact && ctx.player.age >= 5,
    run(ctx) {
      const npc = npcOf(ctx);
      const thing = ctx.rng.pick(["haircut", "driving", "cooking", "life choices", "laugh", "taste in partners"]);
      close(npc, -ctx.rng.int(6, 14));
      adjustKarma(ctx.player, -1);
      return { text: `You mocked ${npc.firstName}'s ${thing}.${quote(ctx, npc, "insult")}`, tone: "bad" };
    },
  },
  {
    id: "people-gift",
    group: "Interact",
    label: "Give a gift",
    icon: "Gift",
    perYearPerPerson: 1,
    visible: (ctx) => !!ctx.npc?.alive && ctx.npc.inContact && ctx.player.age >= 6,
    options: (ctx) =>
      [
        { id: "small", label: "Something small", usd: 25 },
        { id: "nice", label: "Something nice", usd: 150 },
        { id: "lavish", label: "Something lavish", usd: 1500 },
      ].map((g) => ({
        id: g.id,
        label: g.label,
        price: Math.round(g.usd * ctx.country.costIndex),
        blocked: ctx.player.finance.cash < g.usd * ctx.country.costIndex ? "Can't afford it." : undefined,
        icon: "Gift",
      })),
    run(ctx, p) {
      const npc = npcOf(ctx);
      const usd = p.option === "small" ? 25 : p.option === "nice" ? 150 : 1500;
      if (!pay(ctx, usd)) return;
      const delta = p.option === "small" ? ctx.rng.int(2, 6) : p.option === "nice" ? ctx.rng.int(6, 12) : ctx.rng.int(12, 20);
      close(npc, npc.traits.includes("greedy") ? delta + 3 : delta);
      const what = p.option === "small" ? ctx.rng.pick(["a candle", "a mug", "socks"]) : p.option === "nice" ? ctx.rng.pick(["a sweater", "concert tickets", "a nice bottle of wine"]) : ctx.rng.pick(["a designer watch", "a weekend getaway", "a vintage guitar"]);
      return { text: `You gave ${npc.firstName} ${what}.${quote(ctx, npc, "gift")}`, tone: "good" };
    },
  },
  {
    id: "people-argue",
    group: "Interact",
    label: "Start an argument",
    icon: "Swords",
    perYearPerPerson: 1,
    visible: (ctx) => !!ctx.npc?.alive && ctx.npc.inContact && ctx.player.age >= 6,
    run(ctx) {
      const npc = npcOf(ctx);
      const topic = ctx.rng.pick(["money", "the dishes", "something from years ago", "who's right about a movie plot", "your mother"]);
      if (roll(ctx, "charisma", 55)) {
        close(npc, -ctx.rng.int(2, 6));
        return { text: `You argued with ${npc.firstName} about ${topic}. You won, technically.${quote(ctx, npc, "argue")}` };
      }
      close(npc, -ctx.rng.int(8, 16));
      if (ctx.rng.chance(0.08) && ctx.player.age >= 14) {
        adjustStat(ctx.player, "health", -ctx.rng.int(4, 10));
        return { text: `The argument with ${npc.firstName} about ${topic} turned into a shoving match. You got the worst of it.`, tone: "bad" };
      }
      return { text: `You argued with ${npc.firstName} about ${topic}. Nobody won.${quote(ctx, npc, "argue")}`, tone: "bad" };
    },
  },
  {
    id: "people-apologize",
    group: "Interact",
    label: "Apologize",
    icon: "HandHeart",
    perYearPerPerson: 1,
    visible: (ctx) => !!ctx.npc?.alive && ctx.npc.inContact && ctx.npc.closeness < 45,
    run(ctx) {
      const npc = npcOf(ctx);
      if (npc.traits.includes("kind") || roll(ctx, "charisma", 35)) {
        close(npc, ctx.rng.int(8, 15));
        adjustKarma(ctx.player, 1);
        return { text: `You apologized to ${npc.firstName}. ${npc.firstName} accepted.`, tone: "good" };
      }
      return { text: `You apologized to ${npc.firstName}, who said "okay" in a tone that meant it wasn't.` };
    },
  },
  {
    id: "people-ask-money",
    group: "Interact",
    label: "Ask for money",
    icon: "HandCoins",
    perYearPerPerson: 1,
    visible: (ctx) => is(...FAMILY_UP, "spouse", "sibling", "friend", "bestFriend", "child")(ctx) && ctx.player.age >= 8,
    run(ctx) {
      const npc = npcOf(ctx);
      const generous = npc.traits.includes("generous") ? 0.25 : npc.traits.includes("greedy") || npc.traits.includes("mean") ? -0.3 : 0;
      const chance = clamp(npc.closeness / 130 + generous, 0.05, 0.9);
      const max = Math.max(20, npc.wealth * 0.05);
      if (!ctx.rng.chance(chance) || npc.wealth <= 0) {
        close(npc, -3);
        return { text: `You asked ${npc.firstName} for money. The answer was no.${quote(ctx, npc, "askMoney")}`, tone: "bad" };
      }
      const amount = Math.round(ctx.rng.float(0.2, 1) * Math.min(max, ctx.player.age < 18 ? 100 * ctx.country.costIndex : max));
      npc.wealth -= amount;
      ctx.player.finance.cash += amount;
      close(npc, -1);
      return { text: `${npc.firstName} gave you ${formatMoney(ctx.country, amount)}.${quote(ctx, npc, "askMoney")}`, tone: "good" };
    },
  },
  {
    id: "people-prank",
    group: "Interact",
    label: "Play a prank",
    icon: "Smile",
    perYearPerPerson: 1,
    visible: (ctx) => !!ctx.npc?.alive && ctx.npc.inContact && ctx.player.age >= 6 && !ROMANTIC.includes(ctx.npc.role),
    run(ctx) {
      const npc = npcOf(ctx);
      const prank = ctx.rng.pick(["filled their shoes with shaving cream", "put googly eyes on everything in their fridge", "set their phone language to Finnish", "hid a speaker that meows every hour"]);
      if (npc.traits.includes("funny") || npc.traits.includes("chill") || ctx.rng.chance(0.5)) {
        close(npc, ctx.rng.int(2, 6));
        return { text: `You ${prank}. ${npc.firstName} laughed and vowed revenge.`, tone: "good" };
      }
      close(npc, -ctx.rng.int(5, 10));
      return { text: `You ${prank}. ${npc.firstName} did not find it funny at all.`, tone: "bad" };
    },
  },
  // -------------------------------------------------------------- family
  {
    id: "people-hug-parent",
    group: "Family",
    label: "Ask for a hug",
    icon: "Heart",
    perYearPerPerson: 1,
    visible: (ctx) => is(...FAMILY_UP)(ctx) && ctx.player.age <= 12,
    run(ctx) {
      const npc = npcOf(ctx);
      close(npc, ctx.rng.int(3, 7));
      adjustStat(ctx.player, "happiness", 3);
      return { text: `${npc.firstName} gave you a big hug.`, tone: "good" };
    },
  },
  {
    id: "people-child-teach",
    group: "Family",
    label: "Teach a life lesson",
    icon: "BookOpen",
    perYearPerPerson: 1,
    visible: (ctx) => is("child", "grandchild")(ctx) && ctx.npc!.age >= 4 && ctx.npc!.age <= 25,
    run(ctx) {
      const npc = npcOf(ctx);
      const lesson = ctx.rng.pick(["always tip your server", "never trust a man with two first names", "how to change a tire", "how to make a decent omelet", "the value of a dollar", "how to apologize properly"]);
      close(npc, ctx.rng.int(2, 7));
      adjustKarma(ctx.player, 1);
      return { text: `You taught ${npc.firstName} ${lesson}. ${npc.age < 13 ? "They listened intently." : "They rolled their eyes but listened."}`, tone: "good" };
    },
  },
  {
    id: "people-child-allowance",
    group: "Family",
    label: "Give money",
    icon: "Coins",
    perYearPerPerson: 1,
    cost: 500,
    visible: (ctx) => is("child", "grandchild", "sibling")(ctx) && ctx.player.age >= 18,
    blocked: (ctx) => (ctx.player.finance.cash < 500 * ctx.country.costIndex ? "Not enough cash." : undefined),
    run(ctx) {
      const npc = npcOf(ctx);
      pay(ctx, 500);
      npc.wealth += Math.round(500 * ctx.country.costIndex);
      close(npc, ctx.rng.int(4, 9));
      return { text: `You gave ${npc.firstName} ${formatMoney(ctx.country, 500 * ctx.country.costIndex)}.${quote(ctx, npc, "gift")}`, tone: "good" };
    },
  },
  {
    id: "people-disown",
    group: "Family",
    label: "Cut them off",
    icon: "X",
    visible: (ctx) => is("child", "sibling", "mother", "father", "stepparent", "grandparent")(ctx) && ctx.player.age >= 18,
    run(ctx) {
      const npc = npcOf(ctx);
      npc.inContact = false;
      npc.closeness = 0;
      adjustStat(ctx.player, "happiness", -4);
      ctx.state.flags.cutOffFamily = true;
      return { text: `You cut ${npc.firstName} out of your life. It was quiet afterwards.${quote(ctx, npc, "farewell")}`, tone: "bad" };
    },
  },
  // -------------------------------------------------------------- friendship
  {
    id: "people-befriend",
    group: "Friendship",
    label: "Become friends",
    icon: "Users",
    visible: (ctx) => is("classmate", "coworker", "neighbor", "roommate", "collegeRoommate", "gymBuddy", "bandmate", "teammate", "acquaintance", "travelBuddy", "cellmate")(ctx),
    blocked: (ctx) => (ctx.npc && ctx.npc.closeness < 40 ? "You're not close enough yet." : undefined),
    run(ctx) {
      const npc = npcOf(ctx);
      npc.role = "friend";
      close(npc, 5);
      return { text: `You and ${npc.firstName} are officially friends now.`, tone: "good" };
    },
  },
  {
    id: "people-best-friend",
    group: "Friendship",
    label: "Ask to be best friends",
    icon: "Star",
    visible: (ctx) => is("friend")(ctx) && !Object.values(ctx.state.npcs).some((n) => n.role === "bestFriend" && n.alive && n.inContact),
    blocked: (ctx) => (ctx.npc && ctx.npc.closeness < 70 ? "You're not close enough yet." : undefined),
    run(ctx) {
      const npc = npcOf(ctx);
      npc.role = "bestFriend";
      return { text: `${npc.firstName} said yes. Best friends.`, tone: "good" };
    },
  },
  {
    id: "people-end-friendship",
    group: "Friendship",
    label: "End the friendship",
    icon: "X",
    visible: is("friend", "bestFriend"),
    run(ctx) {
      const npc = npcOf(ctx);
      npc.inContact = false;
      npc.role = "acquaintance";
      return { text: `You ended your friendship with ${npc.firstName}.${quote(ctx, npc, "farewell")}`, tone: "bad" };
    },
  },
  {
    id: "people-ask-out",
    group: "Romance",
    label: "Ask them out",
    icon: "Heart",
    perYearPerPerson: 1,
    visible: (ctx) =>
      notRole("mother", "father", "stepparent", "sibling", "halfSibling", "grandparent", "child", "grandchild", ...ROMANTIC, "teacher", "therapist", "lawyer")(ctx) &&
      ctx.player.age >= 14 &&
      Math.abs(ctx.npc!.age - ctx.player.age) <= 12 &&
      ctx.npc!.age >= 16 &&
      !partnerOf(ctx.state),
    run(ctx) {
      const npc = npcOf(ctx);
      const p = clamp(npc.closeness / 150 + ctx.player.stats.looks / 250 + ctx.player.skills.charisma / 300, 0.05, 0.85);
      if (!ctx.rng.chance(p)) {
        close(npc, -6);
        return { text: `${npc.firstName} let you down gently. It still hurt.`, tone: "bad" };
      }
      npc.role = "partner";
      close(npc, 10);
      adjustStat(ctx.player, "happiness", 8);
      return { text: `${npc.firstName} said yes! You're dating now.`, tone: "good" };
    },
  },
  // -------------------------------------------------------------- romance
  {
    id: "people-date",
    group: "Romance",
    label: "Go on a date",
    icon: "Wine",
    perYearPerPerson: 2,
    visible: is("partner", "fiance", "spouse", "date", "affair"),
    options: (ctx) =>
      [
        { id: "dinner", label: "Fancy dinner", usd: 150 },
        { id: "movies", label: "Movie night", usd: 30 },
        { id: "hike", label: "Sunset hike", usd: 0 },
        { id: "weekend", label: "Weekend getaway", usd: 900 },
      ].map((d) => ({ id: d.id, label: d.label, price: d.usd ? Math.round(d.usd * ctx.country.costIndex) : undefined, blocked: ctx.player.finance.cash < d.usd * ctx.country.costIndex ? "Can't afford it." : undefined, icon: "Heart" })),
    run(ctx, p) {
      const npc = npcOf(ctx);
      const cost = p.option === "dinner" ? 150 : p.option === "movies" ? 30 : p.option === "weekend" ? 900 : 0;
      if (cost && !pay(ctx, cost)) return;
      if (ctx.rng.chance(0.12)) {
        close(npc, -4);
        return { text: `The date with ${npc.firstName} was a disaster. ${ctx.rng.pick(["You both got food poisoning.", "It rained, then hailed.", "You ran into their ex."])}`, tone: "bad" };
      }
      close(npc, ctx.rng.int(5, 12) + (p.option === "weekend" ? 6 : 0));
      adjustStat(ctx.player, "happiness", ctx.rng.int(3, 7));
      return { text: `You and ${npc.firstName} had a wonderful time.${quote(ctx, npc, "spendTime")}`, tone: "good" };
    },
  },
  {
    id: "people-propose",
    group: "Romance",
    label: "Propose",
    icon: "Gem",
    perYearPerPerson: 1,
    visible: (ctx) => is("partner")(ctx) && adult(ctx),
    run(ctx) {
      const npc = npcOf(ctx);
      const p = clamp((npc.closeness - 30) / 60, 0.05, 0.95);
      if (ctx.rng.chance(p)) {
        npc.role = "fiance";
        adjustStat(ctx.player, "happiness", 12);
        return { title: "Engaged!", text: `You got down on one knee. ${npc.firstName} said yes!`, tone: "major" };
      }
      close(npc, -15);
      adjustStat(ctx.player, "happiness", -10);
      return { text: `You proposed. ${npc.firstName} said ${npc.pronouns === "they" ? "they weren't" : `${npc.pronouns} wasn't`} ready. The ring is back in your pocket.`, tone: "bad" };
    },
  },
  {
    id: "people-wedding",
    group: "Romance",
    label: "Get married",
    icon: "Church",
    visible: is("fiance"),
    options: (ctx) =>
      [
        { id: "courthouse", label: "Courthouse wedding", usd: 200 },
        { id: "small", label: "Small wedding", usd: 8_000 },
        { id: "lavish", label: "Lavish wedding", usd: 60_000 },
        { id: "courthouse-prenup", label: "Courthouse wedding with a prenup", usd: 2_200 },
        { id: "small-prenup", label: "Small wedding with a prenup", usd: 10_000 },
      ].map((w) => ({ id: w.id, label: w.label, price: Math.round(w.usd * ctx.country.costIndex), blocked: ctx.player.finance.cash < w.usd * ctx.country.costIndex ? "Can't afford it." : undefined, icon: "Church" })),
    run(ctx, p) {
      const npc = npcOf(ctx);
      const opt = String(p.option);
      const usd = opt.startsWith("courthouse") ? (opt.endsWith("prenup") ? 2_200 : 200) : opt.startsWith("small") ? (opt.endsWith("prenup") ? 10_000 : 8_000) : 60_000;
      if (!pay(ctx, usd)) return;
      const prenup = opt.endsWith("prenup");
      if (prenup && ctx.rng.chance(npc.closeness < 70 ? 0.4 : 0.15)) {
        close(npc, -20);
        return { text: `${npc.firstName} was hurt you asked for a prenup and postponed the wedding.`, tone: "bad" };
      }
      marry(ctx.state, npc, prenup);
      adjustStat(ctx.player, "happiness", 15);
      const flavor = opt.startsWith("lavish") ? "A string quartet played. Someone's uncle cried through the vows." : opt.startsWith("small") ? "Just close friends and family. Perfect." : "Two witnesses and a clerk who'd seen it all.";
      return { title: "Married!", text: `You married ${npc.firstName}. ${flavor}`, tone: "major" };
    },
  },
  {
    id: "people-baby",
    group: "Romance",
    label: "Try for a baby",
    icon: "Baby",
    perYearPerPerson: 1,
    visible: (ctx) => is("partner", "fiance", "spouse")(ctx) && adult(ctx) && !ctx.player.pregnancy,
    blocked: (ctx) => (carrier(ctx.state, ctx.npc!) === undefined ? "You'll need to adopt or use a surrogate (see Love)." : undefined),
    run(ctx) {
      const npc = npcOf(ctx);
      const who = carrier(ctx.state, npc)!;
      const age = who === "player" ? ctx.player.age : npc.age;
      if (!ctx.rng.chance(fertility(age))) {
        adjustStat(ctx.player, "happiness", -3);
        return { text: "You tried for a baby. No luck this year." };
      }
      startPregnancy(ctx.state, npc, who === "player");
      ctx.state.flags.parentToBe = true;
      return { title: "Expecting!", text: who === "player" ? "You're pregnant! The baby is due next year." : `${npc.firstName} is pregnant! The baby is due next year.`, tone: "major" };
    },
  },
  {
    id: "people-therapy",
    group: "Romance",
    label: "Couples therapy",
    icon: "Brain",
    perYearPerPerson: 1,
    cost: 1500,
    visible: (ctx) => is("spouse", "partner", "fiance")(ctx) && ctx.npc!.closeness < 55,
    blocked: (ctx) => (ctx.player.finance.cash < 1500 * ctx.country.costIndex ? "Can't afford it." : undefined),
    run(ctx) {
      const npc = npcOf(ctx);
      pay(ctx, 1500);
      if (ctx.rng.chance(0.65)) {
        close(npc, ctx.rng.int(10, 20));
        return { text: `Couples therapy helped. You and ${npc.firstName} are communicating again.`, tone: "good" };
      }
      return { text: `The therapist spent most of the session refereeing. Progress: unclear.` };
    },
  },
  {
    id: "people-break-up",
    group: "Romance",
    label: (ctx) => (ctx.npc?.role === "fiance" ? "Call off the engagement" : "Break up"),
    icon: "X",
    visible: is("partner", "fiance", "date", "affair"),
    run(ctx) {
      const npc = npcOf(ctx);
      breakUp(ctx.state, npc);
      return { text: `You broke up with ${npc.firstName}.${quote(ctx, npc, "farewell")}`, tone: "bad" };
    },
  },
  {
    id: "people-divorce",
    group: "Romance",
    label: "File for divorce",
    icon: "Gavel",
    visible: is("spouse"),
    run(ctx) {
      const npc = npcOf(ctx);
      const terms = divorce(ctx.state, npc, ctx.country);
      return { title: "Divorced", text: `You divorced ${npc.firstName}. ${terms}`, tone: "major" };
    },
  },
  {
    id: "people-get-back-together",
    group: "Romance",
    label: "Try to get back together",
    icon: "Heart",
    perYearPerPerson: 1,
    visible: (ctx) => !!ctx.npc && ctx.npc.alive && ctx.npc.role === "ex" && !partnerOf(ctx.state),
    run(ctx) {
      const npc = npcOf(ctx);
      if (ctx.rng.chance(0.25 + npc.closeness / 200)) {
        npc.role = "partner";
        npc.inContact = true;
        npc.closeness = Math.max(npc.closeness, 45);
        return { text: `You and ${npc.firstName} gave it another shot.`, tone: "good" };
      }
      return { text: `${npc.firstName} said it was better this way.`, tone: "bad" };
    },
  },
  // -------------------------------------------------------------- work & rivals
  {
    id: "people-suck-up",
    group: "Work",
    label: "Suck up",
    icon: "ThumbsUp",
    perYearPerPerson: 1,
    visible: is("boss"),
    run(ctx) {
      const npc = npcOf(ctx);
      const job = ctx.player.career.job;
      if (roll(ctx, "charisma", 40)) {
        close(npc, ctx.rng.int(5, 10));
        if (job) job.performance = clamp(job.performance + 4);
        return { text: `You laughed at all of ${npc.firstName}'s jokes this year. It worked.`, tone: "good" };
      }
      close(npc, -4);
      return { text: `${npc.firstName} saw right through you.`, tone: "bad" };
    },
  },
  {
    id: "people-report-hr",
    group: "Work",
    label: "Report to HR",
    icon: "AlertTriangle",
    perYearPerPerson: 1,
    visible: is("boss", "coworker", "rival"),
    run(ctx) {
      const npc = npcOf(ctx);
      close(npc, -20);
      if (ctx.rng.chance(0.3)) {
        npc.inContact = false;
        return { text: `HR investigated ${npc.firstName} and let them go.`, tone: "good" };
      }
      return { text: `HR "made a note of it." ${npc.firstName} definitely knows it was you.`, tone: "bad" };
    },
  },
  {
    id: "people-sabotage",
    group: "Rivalry",
    label: "Sabotage",
    icon: "Bomb",
    perYearPerPerson: 1,
    visible: is("rival", "nemesis"),
    run(ctx) {
      const npc = npcOf(ctx);
      adjustKarma(ctx.player, -3);
      if (roll(ctx, "streetSmarts", 45)) {
        npc.wealth = Math.round(npc.wealth * 0.8);
        return { text: `Your scheme against ${npc.firstName} worked perfectly. They'll never know it was you.`, tone: "good" };
      }
      close(npc, -10);
      return { text: `${npc.firstName} caught you mid-scheme. The rivalry intensifies.`, tone: "bad" };
    },
  },
  {
    id: "people-make-peace",
    group: "Rivalry",
    label: "Make peace",
    icon: "HandHeart",
    perYearPerPerson: 1,
    visible: is("rival", "nemesis"),
    run(ctx) {
      const npc = npcOf(ctx);
      if (ctx.rng.chance(0.3 + npc.closeness / 150)) {
        npc.role = "acquaintance";
        close(npc, 20);
        adjustKarma(ctx.player, 3);
        ctx.state.flags.madePeace = true;
        return { text: `You and ${npc.firstName} buried the hatchet over a drink. It's strange not having a rival.`, tone: "good" };
      }
      return { text: `${npc.firstName} laughed and walked off. The feud continues.`, tone: "bad" };
    },
  },
]);

