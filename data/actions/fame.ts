import { OFFICES, OFFICE_BY_ID } from "@/data/politics";
import { defineActions, pay, roll, trigger } from "@/engine/actionHelpers";
import { fameFromFollowers } from "@/engine/fame";
import { availableOffices, campaignBlocked, electionOdds, officeTitle } from "@/engine/politics";
import { adjustKarma, adjustSkill, adjustStat } from "@/engine/stats";
import type { EventContext } from "@/engine/types";
import { clamp, formatMoney } from "@/engine/util";

const inOffice = (ctx: EventContext) => ctx.player.office !== undefined;
const addFollowers = (ctx: EventContext, n: number) => {
  ctx.player.followers = Math.max(0, Math.round(ctx.player.followers + n));
  ctx.player.fame = Math.max(ctx.player.fame, fameFromFollowers(ctx.player.followers));
};

export const FAME_ACTIONS = defineActions("fame", [
  {
    id: "fame-post",
    group: "Social media",
    label: "Post on social media",
    description: (ctx) => `${ctx.player.followers.toLocaleString("en-US")} followers`,
    icon: "Camera",
    perYear: 3,
    visible: (ctx) => ctx.player.age >= 13,
    run(ctx) {
      ctx.state.flags.postedAt = ctx.player.age;
      const base = 20 + ctx.player.followers * 0.04;
      const quality = (ctx.player.skills.charisma + ctx.player.stats.looks + ctx.player.skills.creativity) / 150;
      if (ctx.rng.chance(0.04 + quality * 0.05)) {
        const viral = Math.round(ctx.rng.int(20_000, 400_000) * quality);
        addFollowers(ctx, viral);
        ctx.state.flags.wentViral = true;
        return { title: "Viral!", text: `Your post about ${ctx.rng.pick(["your cat's disdain for Mondays", "a terrible first date", "a perfectly-timed photo of a pigeon", "your hot take on breakfast"])} went viral. +${viral.toLocaleString("en-US")} followers.`, tone: "major" };
      }
      if (ctx.rng.chance(0.06)) {
        const lost = Math.round(ctx.player.followers * ctx.rng.float(0.05, 0.2));
        addFollowers(ctx, -lost);
        return { text: "Your post aged badly within an hour. You lost followers and gained a lot of opinions.", tone: "bad" };
      }
      const gained = Math.round(base * ctx.rng.float(0.3, 1.5) * (0.5 + quality));
      addFollowers(ctx, gained);
      return { text: `You posted ${ctx.rng.pick(["a selfie", "a recipe", "a sunset", "a meme", "a thoughtful thread", "a dance video"])}. +${gained.toLocaleString("en-US")} followers.` };
    },
  },
  {
    id: "fame-brand-deal",
    group: "Social media",
    label: "Take a brand deal",
    icon: "Coins",
    perYear: 2,
    visible: (ctx) => ctx.player.followers >= 20_000,
    run(ctx) {
      const pay = Math.round(ctx.player.followers * ctx.rng.float(0.01, 0.04) * ctx.country.salaryIndex);
      ctx.player.finance.cash += pay;
      if (ctx.rng.chance(0.15)) addFollowers(ctx, -ctx.player.followers * 0.03);
      return { text: `You promoted ${ctx.rng.pick(["a meal kit", "an energy drink", "a VPN", "teeth whitening strips", "a mattress"])} for ${formatMoney(ctx.country, pay)}. Some followers called you a sellout.`, tone: "good" };
    },
  },
  {
    id: "fame-write-book",
    group: "Projects",
    label: "Write a book",
    icon: "PenTool",
    perYear: 1,
    visible: (ctx) => ctx.player.age >= 14,
    run(ctx) {
      const quality = ctx.player.skills.creativity * 0.5 + ctx.player.stats.smarts * 0.3 + ctx.player.fame * 0.5;
      if (quality < 40 || !ctx.rng.chance(0.25 + quality / 200)) {
        adjustSkill(ctx.player, "creativity", 2);
        return { text: `You finished a ${ctx.rng.pick(["mystery novel", "memoir", "fantasy epic", "self-help book"])}. Every publisher passed. It lives in a drawer now.` };
      }
      ctx.state.flags.publishedBook = true;
      const sales = Math.round(quality * ctx.rng.int(50, 400) * (1 + ctx.player.fame / 20));
      const royalties = Math.round(sales * 2.5 * ctx.country.costIndex);
      ctx.player.finance.cash += royalties;
      ctx.player.fame = clamp(ctx.player.fame + (sales > 100_000 ? 10 : 2));
      if (sales > 100_000) ctx.state.flags.bestseller = true;
      return { title: "Published", text: `Your book sold ${sales.toLocaleString("en-US")} copies${sales > 100_000 ? " and hit the bestseller list" : ""}. Royalties: ${formatMoney(ctx.country, royalties)}.`, tone: "major" };
    },
  },
  {
    id: "fame-release-song",
    group: "Projects",
    label: "Release a song",
    icon: "Music",
    perYear: 2,
    visible: (ctx) => ctx.player.age >= 12 && ctx.player.skills.creativity >= 30,
    run(ctx) {
      const quality = ctx.player.skills.creativity * 0.6 + ctx.player.skills.charisma * 0.2 + ctx.player.fame * 0.6;
      const streams = Math.round(Math.max(50, quality * quality * ctx.rng.float(1, 60)));
      addFollowers(ctx, streams / 50);
      ctx.player.finance.cash += Math.round(streams * 0.004 * ctx.country.costIndex);
      if (streams > 1_000_000) {
        ctx.state.flags.hitSong = true;
        ctx.player.fame = clamp(ctx.player.fame + 8);
        return { title: "A hit", text: `Your song racked up ${streams.toLocaleString("en-US")} streams. You can't go anywhere without hearing it.`, tone: "major" };
      }
      return { text: `Your song got ${streams.toLocaleString("en-US")} streams. ${streams < 1000 ? "Mostly your mom." : "Not bad."}` };
    },
  },
  {
    id: "fame-podcast",
    group: "Projects",
    label: "Start a podcast",
    icon: "Mic",
    perYear: 1,
    visible: (ctx) => ctx.player.age >= 16,
    run(ctx) {
      const listeners = Math.round(ctx.rng.int(20, 300) * (1 + ctx.player.skills.charisma / 30) * (1 + ctx.player.fame / 10));
      addFollowers(ctx, listeners);
      adjustSkill(ctx.player, "charisma", 2);
      return { text: `You launched a podcast about ${ctx.rng.pick(["true crime", "obscure history", "your friend's dating life", "sandwiches", "productivity, ironically"])}. ${listeners.toLocaleString("en-US")} people listen regularly.` };
    },
  },
  {
    id: "fame-interview",
    group: "Celebrity",
    label: "Do a talk show interview",
    icon: "Tv",
    perYear: 1,
    visible: (ctx) => ctx.player.fame >= 40,
    run(ctx) {
      if (roll(ctx, "charisma", 50)) {
        ctx.player.fame = clamp(ctx.player.fame + 4);
        addFollowers(ctx, ctx.player.followers * 0.1 + 1000);
        return { text: "You were charming, funny, and told a story about your grandmother that killed. Clips everywhere.", tone: "good" };
      }
      ctx.player.fame = clamp(ctx.player.fame - 2);
      return { text: "You froze on live TV and answered a question nobody asked.", tone: "bad" };
    },
  },
  {
    id: "fame-charity-gala",
    group: "Celebrity",
    label: "Host a charity gala",
    icon: "HandHeart",
    perYear: 1,
    cost: 20_000,
    visible: (ctx) => ctx.player.fame >= 30,
    blocked: (ctx) => (ctx.player.finance.cash < 20_000 * ctx.country.costIndex ? "Can't afford it." : undefined),
    run(ctx) {
      pay(ctx, 20_000);
      adjustKarma(ctx.player, 6);
      ctx.player.fame = clamp(ctx.player.fame + 2);
      return { text: "Your gala raised a fortune for charity. Someone famous spilled wine on you.", tone: "good" };
    },
  },
  // ------------------------------------------------------------ politics
  {
    id: "politics-run",
    section: "politics",
    label: "Run for office",
    icon: "Landmark",
    perYear: 1,
    visible: (ctx) => ctx.player.age >= 18 && !ctx.player.crime.prison,
    options: (ctx) =>
      availableOffices(ctx.state).map((o) => {
        const blocked = campaignBlocked(ctx.state, o, ctx.country);
        return {
          id: o.id,
          label: officeTitle(o, ctx.country),
          description: blocked ?? `${Math.round(electionOdds(ctx.state, o) * 100)}% polling`,
          price: Math.round(o.cost * ctx.country.costIndex),
          blocked,
          icon: "Landmark",
        };
      }),
    run(ctx, p) {
      const office = OFFICE_BY_ID[String(p.option)];
      if (!office) return;
      pay(ctx, office.cost);
      ctx.vars.officeId = office.id;
      ctx.vars.office = officeTitle(office, ctx.country);
      trigger(ctx, "politics-campaign");
    },
  },
  {
    id: "politics-speech",
    section: "politics",
    label: "Give a speech",
    icon: "Megaphone",
    perYear: 2,
    visible: inOffice,
    run(ctx) {
      const o = ctx.player.office!;
      if (roll(ctx, "charisma", 45)) {
        o.approval = clamp(o.approval + ctx.rng.int(3, 8));
        return { text: `Your speech on ${ctx.rng.pick(["infrastructure", "education", "the economy", "potholes"])} went over well. Approval: ${o.approval}%.`, tone: "good" };
      }
      o.approval = clamp(o.approval - ctx.rng.int(2, 6));
      return { text: `You mispronounced the name of the town you were in. Approval: ${o.approval}%.`, tone: "bad" };
    },
  },
  {
    id: "politics-policy",
    section: "politics",
    label: "Push a policy",
    icon: "Gavel",
    perYear: 1,
    visible: inOffice,
    options: () => [
      { id: "tax-cut", label: "Cut taxes" },
      { id: "tax-raise", label: "Raise taxes for public services" },
      { id: "healthcare", label: "Expand healthcare" },
      { id: "schools", label: "Fund schools" },
      { id: "police", label: "Increase police funding" },
      { id: "green", label: "Green energy program" },
    ],
    run(ctx, p) {
      const o = ctx.player.office!;
      const delta = ctx.rng.int(-8, 12) + (p.option === "tax-raise" ? -6 : p.option === "schools" ? 3 : 0);
      o.approval = clamp(o.approval + delta);
      adjustKarma(ctx.player, p.option === "healthcare" || p.option === "schools" ? 2 : 0);
      ctx.state.flags.policiesPassed = Number(ctx.state.flags.policiesPassed ?? 0) + 1;
      return { text: `Your policy passed. ${delta >= 0 ? "The public mostly loved it." : "Half the country is furious."} Approval: ${o.approval}%.`, tone: delta >= 0 ? "good" : "bad" };
    },
  },
  {
    id: "politics-bribe",
    section: "politics",
    label: "Accept a \"donation\"",
    icon: "HandCoins",
    perYear: 1,
    visible: inOffice,
    run(ctx) {
      const level = OFFICES.find((o) => o.id === ctx.player.office!.officeId)?.level ?? 1;
      const amount = Math.round(level * level * ctx.rng.int(5_000, 20_000) * ctx.country.costIndex);
      ctx.player.finance.cash += amount;
      adjustKarma(ctx.player, -6);
      if (ctx.rng.chance(0.2)) {
        ctx.vars.crime = "corruption";
        ctx.vars.sMin = 2;
        ctx.vars.sMax = 8;
        ctx.player.office = undefined;
        trigger(ctx, "crime-arrest");
        return;
      }
      return { text: `A "concerned citizen" donated ${formatMoney(ctx.country, amount)} to your "campaign." Nobody needs to know.` };
    },
  },
  {
    id: "politics-resign",
    section: "politics",
    label: "Resign",
    icon: "X",
    visible: inOffice,
    run(ctx) {
      const title = ctx.player.office!.title;
      ctx.player.office = undefined;
      adjustStat(ctx.player, "happiness", 3);
      return { text: `You resigned as ${title}. You slept for fourteen hours.` };
    },
  },
]);
