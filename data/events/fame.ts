import { OFFICE_BY_ID } from "@/data/politics";
import { careerOf } from "@/engine/content";
import { defineEvents, fail, fx, pass, when } from "@/engine/events/helpers";
import { electionOdds, takeOffice } from "@/engine/politics";
import type { EventContext } from "@/engine/types";
import { clamp } from "@/engine/util";

const officeOdds = (bonus: number) => (ctx: EventContext) => {
  const office = OFFICE_BY_ID[String(ctx.vars.officeId)];
  return office ? clamp(electionOdds(ctx.state, office) + bonus, 0.03, 0.95) : 0;
};
const officeLoss = (bonus: number) => (ctx: EventContext) => 1 - officeOdds(bonus)(ctx);
const win = fx.custom((ctx) => {
  const office = OFFICE_BY_ID[String(ctx.vars.officeId)];
  if (office) takeOffice(ctx.state, office, ctx.country);
  if (office?.level === 6) ctx.state.flags.headOfState = true;
});
const famous = (min: number) => (ctx: EventContext) => ctx.player.fame >= min;
const fameCategory = (ctx: EventContext) => {
  const job = ctx.player.career.job;
  return job ? careerOf(ctx.content, job.careerId)?.id : undefined;
};

export const FAME_EVENTS = defineEvents("fame", [
  {
    id: "politics-campaign",
    category: "politics",
    ages: [18, 120],
    triggeredOnly: true,
    expects: { officeId: "mayor", office: "Mayor" },
    title: "Campaign trail",
    text: "Your campaign for {office} is in its final weeks. Your advisors want to know the strategy.",
    choices: [
      { id: "positive", label: "Run a positive campaign", outcomes: [{ weight: officeOdds(0), text: "Your hopeful message won the day. You were elected {office}!", tone: "major", effects: [win, fx.karma(2)] }, { weight: officeLoss(0), text: "You ran a clean race and lost. Your concession speech was gracious.", tone: "bad", effects: [fx.happy(-6)] }] },
      { id: "attack", label: "Go negative", outcomes: [{ weight: officeOdds(0.08), text: "Your attack ads were brutal and effective. You were elected {office}.", tone: "major", effects: [win, fx.karma(-4)] }, { weight: officeLoss(0.08), text: "The attack ads backfired. You lost, and looked mean doing it.", tone: "bad", effects: [fx.happy(-8), fx.karma(-4)] }] },
      { id: "promise", label: "Promise everyone everything", outcomes: [{ weight: officeOdds(0.04), text: "You promised free everything and won. Now you have to deliver.", tone: "major", effects: [win, fx.custom((ctx) => { if (ctx.player.office) ctx.player.office.approval = 45; })] }, { weight: officeLoss(0.04), text: "Voters didn't believe a word. You lost.", tone: "bad", effects: [fx.happy(-6)] }] },
      { id: "debate", label: "Win the debate", outcomes: [{ weight: (ctx) => clamp(officeOdds(0)(ctx) + (ctx.player.skills.charisma - 50) / 150, 0.03, 0.95), text: "Your debate performance went viral. You were elected {office}.", tone: "major", effects: [win] }, { weight: (ctx) => 1 - clamp(officeOdds(0)(ctx) + (ctx.player.skills.charisma - 50) / 150, 0.03, 0.95), text: "You froze in the debate. The clip haunted you. You lost.", tone: "bad", effects: [fx.happy(-8)] }] },
    ],
  },
  {
    id: "politics-term-end",
    category: "politics",
    ages: [18, 120],
    triggeredOnly: true,
    title: "Election season",
    text: "Your term is ending. Your approval rating is {approval}%.",
    effects: [fx.custom((ctx) => { ctx.vars.approval = ctx.player.office?.approval ?? 50; ctx.vars.office = ctx.player.office?.title ?? "office"; })],
    choices: [
      {
        label: "Run for re-election",
        outcomes: [
          { weight: (ctx) => clamp((ctx.player.office?.approval ?? 50) / 100 + 0.1, 0.05, 0.95), text: "You won re-election as {office}.", tone: "major", effects: [fx.custom((ctx) => { const o = ctx.player.office; const def = o ? OFFICE_BY_ID[o.officeId] : undefined; if (o && def) { o.termEndsAtAge = ctx.player.age + def.term; o.termsServed++; } })] },
          { weight: (ctx) => 1 - clamp((ctx.player.office?.approval ?? 50) / 100 + 0.1, 0.05, 0.95), text: "You lost your re-election bid. Time to write a memoir.", tone: "bad", effects: [fx.custom((ctx) => { ctx.player.office = undefined; }), fx.happy(-8)] },
        ],
      },
      { label: "Step down gracefully", outcomes: [{ text: "You stepped down at the end of your term to warm applause.", effects: [fx.custom((ctx) => { ctx.player.office = undefined; }), fx.happy(3)] }] },
    ],
  },
  {
    id: "politics-scandal",
    category: "politics",
    ages: [18, 120],
    cooldown: 4,
    condition: (ctx) => ctx.player.office !== undefined,
    title: "Scandal",
    text: "A newspaper published {old photos of you at a party|your browser history|a recording of you insulting a donor}.",
    choices: [
      { label: "Apologize publicly", outcomes: [{ text: "Your apology was sincere. Approval dipped but recovered.", effects: [fx.custom((ctx) => { if (ctx.player.office) ctx.player.office.approval = clamp(ctx.player.office.approval - 6); })] }] },
      { label: "Deny everything", outcomes: [{ weight: pass("charisma", 60), text: "You denied it convincingly. The story died.", effects: [] }, { weight: fail("charisma", 60), text: "More evidence leaked. Your approval cratered.", tone: "bad", effects: [fx.custom((ctx) => { if (ctx.player.office) ctx.player.office.approval = clamp(ctx.player.office.approval - 20); })] }] },
      { label: "Blame your staff", outcomes: [{ text: "You fired your chief of staff. Nobody bought it.", effects: [fx.karma(-3), fx.custom((ctx) => { if (ctx.player.office) ctx.player.office.approval = clamp(ctx.player.office.approval - 10); })] }] },
    ],
  },
  {
    id: "politics-crisis",
    category: "politics",
    ages: [18, 120],
    cooldown: 4,
    condition: (ctx) => (ctx.player.office ? OFFICE_BY_ID[ctx.player.office.officeId]?.level ?? 0 : 0) >= 2,
    title: "Crisis",
    text: "A {flood|heatwave|bridge collapse|cyberattack} hit your jurisdiction.",
    choices: [
      { label: "Rush to the scene", outcomes: [{ text: "You were on the ground handing out water within hours. The public noticed.", tone: "good", effects: [fx.custom((ctx) => { if (ctx.player.office) ctx.player.office.approval = clamp(ctx.player.office.approval + 12); }), fx.karma(3)] }] },
      { label: "Hold a press conference", outcomes: [{ text: "Your press conference was calm and competent.", effects: [fx.custom((ctx) => { if (ctx.player.office) ctx.player.office.approval = clamp(ctx.player.office.approval + 4); })] }] },
      { label: "Stay on vacation", outcomes: [{ text: "Photos of you on a beach during the crisis went everywhere.", tone: "bad", effects: [fx.custom((ctx) => { if (ctx.player.office) ctx.player.office.approval = clamp(ctx.player.office.approval - 25); })] }] },
    ],
  },
  {
    id: "fame-paparazzi",
    ages: [14, 120],
    cooldown: 3,
    condition: famous(45),
    title: "Paparazzi",
    text: "Photographers jumped out of the bushes outside your {gym|house|favorite restaurant}.",
    choices: [
      { label: "Smile and wave", outcomes: [{ text: "You smiled and waved. The photos were flattering.", effects: [fx.fame(1)] }] },
      { label: "Grab a camera", outcomes: [{ text: "You smashed a camera. The video of it was everywhere.", tone: "bad", effects: [fx.fame(3), fx.karma(-2), fx.cash(-5000)] }] },
      { label: "Hide your face", outcomes: [{ text: "You hid behind a newspaper. The tabloids called you \"mysterious.\"" }] },
    ],
  },
  {
    id: "fame-fan",
    ages: [14, 120],
    cooldown: 3,
    condition: famous(30),
    text: "A fan {cried when they met you|asked you to sign their arm and then got it tattooed|named their baby after you}.",
    tone: "good",
    effects: [fx.happy(3)],
  },
  {
    id: "fame-stalker",
    ages: [16, 120],
    once: true,
    condition: famous(55),
    title: "Uninvited",
    text: "Someone has been leaving handwritten letters on your doorstep. Every day. They know your schedule.",
    choices: [
      { label: "Get a restraining order", outcomes: [{ text: "The police got a restraining order. The letters stopped.", effects: [fx.cash(-3000)] }] },
      { label: "Hire security", outcomes: [{ text: "You hired a security team. You sleep better, and spend more.", effects: [fx.cash(-40000)] }] },
      { label: "Ignore it", outcomes: [{ weight: 2, text: "Eventually the letters just stopped.", effects: [fx.happy(-3)] }, { weight: 1, text: "One night they were inside your house. You got out safely, shaken.", tone: "bad", effects: [fx.happy(-12), fx.health(-5)] }] },
    ],
  },
  {
    id: "fame-award-acting",
    ages: [16, 120],
    cooldown: 4,
    condition: (ctx) => ["actor", "tv-host", "comedian"].includes(fameCategory(ctx) ?? "") && (ctx.player.career.job?.rank ?? 0) >= 2,
    title: "Nominated",
    text: "You were nominated for a Golden Statue for your role in {a war drama|a quiet indie film|a sci-fi blockbuster|a prestige miniseries}.",
    choices: [
      { label: "Prepare a speech, just in case", outcomes: [{ weight: pass("charisma", 70), text: "You won! Your speech made the whole theater cry.", tone: "major", effects: [fx.fame(10), fx.achieve("golden-statue"), fx.happy(12)] }, { weight: fail("charisma", 70), text: "You lost to a veteran actor playing a dying grandmother. Classic.", effects: [fx.fame(2)] }] },
      { label: "Act like you don't care", outcomes: [{ weight: 1, text: "You won. You had to improvise a speech. It was weird.", tone: "major", effects: [fx.fame(9), fx.achieve("golden-statue")] }, { weight: 2, text: "You lost. Your fake-casual reaction shot went viral anyway.", effects: [fx.fame(3)] }] },
    ],
  },
  {
    id: "fame-award-music",
    ages: [16, 120],
    cooldown: 4,
    condition: (ctx) => fameCategory(ctx) === "musician" && (ctx.player.career.job?.rank ?? 0) >= 2,
    text: "You won a Golden Record for {Album of the Year|Best New Artist|Song of the Year}. You thanked your mom first.",
    tone: "major",
    effects: [fx.fame(10), fx.achieve("golden-record"), fx.happy(10)],
  },
  {
    id: "fame-award-athlete",
    ages: [18, 50],
    cooldown: 4,
    condition: (ctx) => fameCategory(ctx) === "athlete" && (ctx.player.career.job?.rank ?? 0) >= 2,
    text: "You were named the league's Most Valuable Player.",
    tone: "major",
    effects: [fx.fame(8), fx.achieve("mvp"), fx.happy(8)],
  },
  {
    id: "fame-scandal",
    ages: [16, 120],
    cooldown: 6,
    condition: famous(40),
    title: "Exposed",
    text: "A tabloid ran a story about your {secret relationship|tax situation|behavior at a nightclub|old posts}.",
    choices: [
      { label: "Post an apology video", outcomes: [{ weight: 1, text: "Your apology was accepted. Mostly.", effects: [fx.fame(-2)] }, { weight: 1, text: "Your apology video was so bad it became its own scandal.", tone: "bad", effects: [fx.fame(-6), fx.custom((ctx) => { ctx.player.followers = Math.round(ctx.player.followers * 0.8); })] }] },
      { label: "Sue the tabloid", outcomes: [{ weight: 1, text: "You won the lawsuit and a retraction.", tone: "good", effects: [fx.cash(-20000)] }, { weight: 1, text: "You lost the lawsuit. The story got even bigger.", tone: "bad", effects: [fx.cash(-60000), fx.fame(-3)] }] },
      { label: "Lean into it", outcomes: [{ text: "You leaned into it. Somehow, you got more famous.", effects: [fx.fame(4), fx.karma(-2), fx.flag("scandalous")] }] },
    ],
  },
  {
    id: "fame-reality-show",
    ages: [18, 70],
    once: true,
    condition: (ctx) => ctx.player.fame >= 15 || ctx.player.followers >= 50_000,
    title: "Reality TV",
    text: "A producer wants you on a reality show where {strangers renovate each other's houses|celebrities survive on an island|people date while blindfolded}.",
    choices: [
      { label: "Sign up", outcomes: [{ weight: pass("charisma", 50), text: "You were the breakout star of the season.", tone: "good", effects: [fx.fame(10), fx.cash(50000), fx.custom((ctx) => { ctx.player.followers += 200_000; })] }, { weight: fail("charisma", 50), text: "You were edited as the villain. Your mom stopped watching.", tone: "bad", effects: [fx.fame(6), fx.cash(30000), fx.karma(-3), fx.flag("scandalous")] }] },
      { label: "Decline", outcomes: [{ text: "You declined. Some dignity is priceless." }] },
    ],
  },
  {
    id: "fame-imposter",
    ages: [18, 120],
    once: true,
    condition: famous(50),
    text: "Someone was caught impersonating you online and selling fake meet-and-greet tickets. Flattering, sort of.",
    effects: [fx.happy(-2)],
  },
  // ------------------------------------------------------------ life phases
  {
    id: "phase-midlife-crisis",
    category: "phase",
    ages: [40, 52],
    once: true,
    weight: 2,
    title: "Midlife crisis",
    text: "You looked in the mirror this morning and didn't recognize the person looking back. Something has to change.",
    choices: [
      { label: "Buy a sports car", condition: when.richerThan(60_000), outcomes: [{ text: "You bought a bright red convertible. You drive it with the top down, even in the rain.", tone: "good", effects: [fx.cash(-60000), fx.happy(10), fx.custom((ctx) => { ctx.player.assets.push({ id: ctx.rng.id("a_"), kind: "car", name: "Red Convertible", value: Math.round(55000 * ctx.country.costIndex), purchasePrice: Math.round(60000 * ctx.country.costIndex), boughtAtAge: ctx.player.age, condition: 100, yearlyUpkeep: Math.round(3000 * ctx.country.costIndex), rentedOut: false, catalogId: "sports-car" }); })] }] },
      { label: "Quit and chase a dream", outcomes: [{ text: "You quit your job to {open a bakery|become a surf instructor|write the novel}. Terrifying. Thrilling.", tone: "major", effects: [fx.custom((ctx) => { const j = ctx.player.career.job; if (j) { ctx.player.career.history.push({ careerId: j.careerId, title: j.title, employer: j.employer, startAge: ctx.player.age - j.yearsAtCompany, endAge: ctx.player.age, reason: "quit" }); ctx.player.career.job = undefined; } }), fx.happy(12)] }] },
      { label: "Get a tattoo and an earring", outcomes: [{ text: "You got a tattoo and an earring. Your kids are mortified. Perfect.", effects: [fx.happy(6), fx.inc("tattoos")] }] },
      { label: "Run a marathon", outcomes: [{ weight: pass("athleticism", 40), text: "You trained for six months and finished a marathon. Your knees disagree with the whole idea.", tone: "good", effects: [fx.achieve("marathoner"), fx.health(5), fx.happy(8)] }, { weight: fail("athleticism", 40), text: "You signed up for a marathon and pulled a hamstring in week two.", effects: [fx.health(-4)] }] },
    ],
  },
  {
    id: "phase-retirement-boredom",
    category: "phase",
    ages: [55, 90],
    once: true,
    condition: (ctx) => ctx.player.career.retired,
    title: "Retirement",
    text: "Retirement was great for six weeks. Now you've reorganized the garage three times.",
    choices: [
      { label: "Take up golf", outcomes: [{ text: "You took up golf. You are bad at it and you love it.", tone: "good", effects: [fx.happy(6), fx.skill("athleticism", 1)] }] },
      { label: "Volunteer", outcomes: [{ text: "You started volunteering at the library. The kids call you by your first name.", tone: "good", effects: [fx.karma(4), fx.happy(5)] }] },
      { label: "Go back to work part-time", outcomes: [{ text: "You took a part-time job at the hardware store. You know where everything is.", effects: [fx.happy(4), fx.cash(8000)] }] },
      { label: "Travel the world", condition: when.richerThan(20_000), outcomes: [{ text: "You spent a year traveling. Your photo albums are aggressively detailed.", tone: "good", effects: [fx.cash(-20000), fx.happy(10), fx.inc("countriesVisited", 6)] }] },
    ],
  },
  {
    id: "phase-reflection",
    category: "phase",
    ages: [75, 100],
    once: true,
    title: "Looking back",
    text: "You found an old box of photos in the attic and spent the whole afternoon with them.",
    choices: [
      { label: "Write your memoirs", outcomes: [{ text: "You started writing your memoirs. Chapter one is titled \"It Was Complicated.\"", effects: [fx.happy(4), fx.flag("memoir")] }] },
      { label: "Call everyone in the photos", outcomes: [{ text: "You called everyone in the photos who's still around. Some calls lasted hours.", tone: "good", effects: [fx.happy(6), fx.custom((ctx) => { for (const n of Object.values(ctx.state.npcs)) if (n.alive && n.inContact) n.closeness = clamp(n.closeness + 5); })] }] },
      { label: "Put them back", outcomes: [{ text: "You put the box back. Some things are better left in the attic.", effects: [] }] },
    ],
  },
  {
    id: "phase-teen-angst",
    category: "phase",
    ages: [14, 16],
    once: true,
    text: "Nobody understands you. You started {wearing only black|writing poetry|listening to music your parents call \"noise\"}.",
    effects: [fx.skill("creativity", 2), fx.happy(-1)],
  },
]);
