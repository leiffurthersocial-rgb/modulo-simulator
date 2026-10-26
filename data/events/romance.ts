import { addChild, breakUp, divorce, partnerOf } from "@/engine/family";
import { defineEvents, fail, fx, pass, when } from "@/engine/events/helpers";
import type { EventContext } from "@/engine/types";

const partnerFilter = (ctx: EventContext) => partnerOf(ctx.state) !== undefined;

export const ROMANCE_EVENTS = defineEvents("romance", [
  {
    id: "love-first-date",
    ages: [16, 120],
    triggeredOnly: true,
    title: "First date",
    text: "You met {npc}, {npc.age}, for {coffee|drinks|a walk in the park|tacos}. {npc.He} {npc.is} a {npc.job} and {npc.has} {a great laugh|strong opinions about cheese|a dog named after a philosopher}.",
    choices: [
      {
        label: "Ask for a second date",
        outcomes: [
          { weight: (ctx) => 0.35 + (ctx.npc?.closeness ?? 40) / 140 + ctx.player.stats.looks / 300, text: "{npc} said yes. Things are getting serious.", tone: "good", effects: [fx.custom(({ npc }) => { if (npc) npc.role = "partner"; }), fx.close(10), fx.happy(6)] },
          { weight: 0.5, text: "{npc} said {npc.he} had a nice time but didn't feel a spark.", effects: [fx.custom(({ npc }) => { if (npc) { npc.role = "acquaintance"; npc.inContact = false; } }), fx.happy(-3)] },
        ],
      },
      {
        label: "Not interested",
        outcomes: [{ text: "You thanked {npc} for a nice time and went home.", effects: [fx.custom(({ npc }) => { if (npc) { npc.role = "acquaintance"; npc.inContact = false; } })] }],
      },
    ],
  },
  {
    id: "love-caught-cheating",
    ages: [16, 120],
    triggeredOnly: true,
    title: "Caught",
    text: "{npc} found the messages on your phone.",
    choices: [
      { label: "Beg for forgiveness", outcomes: [{ weight: (ctx) => (ctx.npc?.closeness ?? 50) / 100, text: "{npc} forgave you, eventually. Trust will take years.", effects: [fx.close(-35), fx.happy(-6)] }, { weight: 0.6, text: "{npc} packed a bag and left.", tone: "bad", effects: [fx.custom((ctx) => { if (ctx.npc?.role === "spouse") divorce(ctx.state, ctx.npc, ctx.country); else if (ctx.npc) breakUp(ctx.state, ctx.npc); })] }] },
      { label: "Deny everything", outcomes: [{ weight: pass("charisma", 70), text: "Somehow, {npc} believed you. You feel terrible.", effects: [fx.close(-10), fx.karma(-3)] }, { weight: fail("charisma", 70), text: "Your denial made it so much worse. {npc} is gone.", tone: "bad", effects: [fx.custom((ctx) => { if (ctx.npc?.role === "spouse") divorce(ctx.state, ctx.npc, ctx.country); else if (ctx.npc) breakUp(ctx.state, ctx.npc); })] }] },
      { label: "End it yourself", outcomes: [{ text: "You ended things with {npc} before it got uglier.", effects: [fx.custom((ctx) => { if (ctx.npc?.role === "spouse") divorce(ctx.state, ctx.npc, ctx.country); else if (ctx.npc) breakUp(ctx.state, ctx.npc); })] }] },
    ],
  },
  {
    id: "love-surprise-baby",
    ages: [17, 120],
    triggeredOnly: true,
    title: "Surprise",
    text: "{npc}, who you hooked up with last year, showed up at your door holding a baby. \"It's yours.\"",
    choices: [
      { label: "Step up", outcomes: [{ text: "You stepped up. You're a parent now.", tone: "major", effects: [fx.custom((ctx) => { const kid = addChild(ctx.state, ctx.rng, ctx.country, { otherParent: ctx.npc }); ctx.vars.kid = kid.firstName; }), fx.karma(5), fx.log("Your child's name is {kid}.", "major")] }] },
      { label: "Pay child support only", outcomes: [{ text: "You agreed to pay child support. {npc} looked at you like you were a stranger.", effects: [fx.cash(-12000), fx.karma(-2)] }] },
      { label: "Demand a DNA test", outcomes: [{ weight: 1, text: "The test came back negative. Not yours.", effects: [fx.happy(4)] }, { weight: 2, text: "The test came back positive. You're a parent, and {npc} is furious you asked.", tone: "major", effects: [fx.close(-20), fx.custom((ctx) => { const kid = addChild(ctx.state, ctx.rng, ctx.country, { otherParent: ctx.npc }); ctx.vars.kid = kid.firstName; }), fx.log("Your child's name is {kid}.", "major")] }] },
    ],
  },
  {
    id: "love-move-in",
    ages: [18, 70],
    once: true,
    npc: { kind: "existing", roles: ["partner"], filter: (n) => n.closeness >= 55 },
    title: "Moving in",
    text: "{npc} asked if you want to move in together.",
    choices: [
      { label: "Yes!", outcomes: [{ text: "You moved in with {npc}. You discovered {npc.he} load{npc.s} the dishwasher like a raccoon.", tone: "good", effects: [fx.close(8), fx.happy(5), fx.custom((ctx) => { ctx.player.livesWithParents = false; }), fx.flag("livedTogether")] }] },
      { label: "Not yet", outcomes: [{ text: "You said you weren't ready. {npc} said {npc.he} understood.", effects: [fx.close(-8)] }] },
    ],
  },
  {
    id: "love-partner-proposes",
    ages: [20, 70],
    cooldown: 3,
    npc: { kind: "existing", roles: ["partner"], filter: (n) => n.closeness >= 70 && n.age >= 20 },
    weight: 1.5,
    title: "Proposal",
    text: "{npc} got down on one knee {at your favorite restaurant|on a mountaintop|in the middle of the grocery store}.",
    choices: [
      { label: "Say yes", outcomes: [{ text: "You said yes! You're engaged.", tone: "major", effects: [fx.custom(({ npc }) => { if (npc) npc.role = "fiance"; }), fx.happy(12)] }] },
      { label: "Say no", outcomes: [{ text: "You said no. {npc} walked out of the restaurant. Everyone stared.", tone: "bad", effects: [fx.custom((ctx) => { if (ctx.npc) breakUp(ctx.state, ctx.npc); })] }] },
      { label: "Ask for time", outcomes: [{ text: "You asked for time. {npc} put the ring back in {npc.his} pocket.", effects: [fx.close(-12)] }] },
    ],
  },
  {
    id: "love-jealousy",
    ages: [16, 80],
    cooldown: 3,
    npc: { kind: "existing", roles: ["partner", "spouse", "fiance"] },
    weight: (ctx) => (partnerOf(ctx.state)?.traits.includes("jealous") ? 3 : 0.8),
    title: "Jealousy",
    text: "{npc} got upset that you were {texting a coworker late|laughing too hard at someone's joke|liking an ex's photos}.",
    choices: [
      { label: "Reassure {npc.him}", outcomes: [{ text: "You talked it through. {npc} felt better.", effects: [fx.close(3)] }] },
      { label: "Get defensive", outcomes: [{ text: "You got defensive. It became a three-hour fight.", tone: "bad", effects: [fx.close(-10)] }] },
      { label: "Show {npc.him} your phone", outcomes: [{ text: "You handed over your phone. {npc} found nothing and apologized.", tone: "good", effects: [fx.close(5), fx.karma(1)] }] },
    ],
  },
  {
    id: "love-anniversary",
    ages: [20, 100],
    cooldown: 5,
    npc: { kind: "existing", roles: ["spouse"] },
    title: "Anniversary",
    text: "It's your wedding anniversary.",
    choices: [
      { label: "Plan something special", outcomes: [{ text: "You recreated your first date. {npc} cried, the good kind.", tone: "good", effects: [fx.close([8, 14]), fx.cash(-400), fx.happy(4)] }] },
      { label: "Dinner at your usual place", outcomes: [{ text: "Dinner at the usual place. Comfortable. Nice.", effects: [fx.close(4)] }] },
      { label: "Forget it", outcomes: [{ text: "You forgot. {npc} did not.", tone: "bad", effects: [fx.close(-15)] }] },
    ],
  },
  {
    id: "love-meet-parents",
    ages: [18, 50],
    once: true,
    npc: { kind: "existing", roles: ["partner", "fiance"] },
    title: "Meet the parents",
    text: "{npc} is taking you home to meet {npc.his} parents.",
    choices: [
      { label: "Be charming", outcomes: [{ weight: pass("charisma", 40), text: "They loved you. {npc}'s mom has already started knitting you a sweater.", tone: "good", effects: [fx.close(8)] }, { weight: fail("charisma", 40), text: "You called {npc}'s dad by the wrong name all weekend.", tone: "bad", effects: [fx.close(-4)] }] },
      { label: "Talk politics", outcomes: [{ text: "You talked politics at dinner. A fork was dropped. Possibly thrown.", tone: "bad", effects: [fx.close(-8)] }] },
      { label: "Bring an expensive gift", outcomes: [{ text: "You brought a gift basket worth more than their car. It worked.", effects: [fx.cash(-300), fx.close(5)] }] },
    ],
  },
  {
    id: "love-honeymoon",
    ages: [18, 90],
    cooldown: 5,
    condition: (ctx) => ctx.state.flags.marriedAt === ctx.player.age - 1 || ctx.state.flags.marriedAt === ctx.player.age,
    npc: { kind: "existing", roles: ["spouse"] },
    text: "You and {npc} honeymooned in {Bali|Santorini|Iceland|the Maldives|a cabin with no wifi}. {You got sunburned in a shape that will never fade|It rained every day and you didn't care|You came home a little more in love}.",
    tone: "good",
    effects: [fx.close(10), fx.happy(8), fx.cash(-3000)],
  },
  {
    id: "love-ex-returns",
    ages: [20, 80],
    cooldown: 5,
    npc: { kind: "existing", roles: ["ex"], filter: (n) => n.alive },
    weight: 0.8,
    title: "An old flame",
    text: "Your ex {npc} messaged you out of nowhere: \"hey stranger.\"",
    choices: [
      { label: "Meet up", condition: when.single, outcomes: [{ weight: 1, text: "You met {npc} for drinks. The old spark is still there. You're back together.", tone: "good", effects: [fx.custom(({ npc }) => { if (npc) { npc.role = "partner"; npc.inContact = true; npc.closeness = 55; } })] }, { weight: 1, text: "You met {npc} and remembered exactly why you broke up.", effects: [] }] },
      { label: "Leave it on read", outcomes: [{ text: "You left {npc} on read. Growth." }] },
    ],
  },
  {
    id: "love-partner-cheats",
    ages: [18, 80],
    once: true,
    npc: { kind: "existing", roles: ["partner", "spouse", "fiance"], filter: (n) => n.closeness < 50 || n.traits.includes("sneaky") },
    weight: 0.6,
    title: "Betrayal",
    text: "You found out {npc} has been seeing someone else for months.",
    choices: [
      { label: "Leave", outcomes: [{ text: "You walked out. It's over.", tone: "bad", effects: [fx.custom((ctx) => { if (ctx.npc?.role === "spouse") divorce(ctx.state, ctx.npc, ctx.country); else if (ctx.npc) breakUp(ctx.state, ctx.npc); }), fx.happy(-8)] }] },
      { label: "Try to work it out", outcomes: [{ weight: 1, text: "You went to counseling. It's slowly mending.", effects: [fx.close(5), fx.happy(-4)] }, { weight: 1, text: "You tried. It didn't work. You split up.", tone: "bad", effects: [fx.custom((ctx) => { if (ctx.npc?.role === "spouse") divorce(ctx.state, ctx.npc, ctx.country); else if (ctx.npc) breakUp(ctx.state, ctx.npc); })] }] },
      { label: "Get revenge", outcomes: [{ text: "You {listed all of {npc}'s belongings online for a dollar each|told {npc}'s mother everything}. Then you left.", effects: [fx.custom((ctx) => { if (ctx.npc?.role === "spouse") divorce(ctx.state, ctx.npc, ctx.country); else if (ctx.npc) breakUp(ctx.state, ctx.npc); }), fx.happy(3), fx.karma(-2)] }] },
    ],
  },
  {
    id: "love-long-distance",
    ages: [18, 50],
    once: true,
    npc: { kind: "existing", roles: ["partner"] },
    title: "Long distance",
    text: "{npc} got a job offer in another city, {nine hundred|two thousand} miles away.",
    choices: [
      { label: "Do long distance", outcomes: [{ weight: 1, text: "Long distance was hard, but you made it work with nightly calls.", tone: "good", effects: [fx.close(5)] }, { weight: 1, text: "The distance slowly pulled you apart. You broke up over video call.", tone: "bad", effects: [fx.custom((ctx) => { if (ctx.npc) breakUp(ctx.state, ctx.npc); })] }] },
      { label: "Move with {npc.him}", outcomes: [{ text: "You packed up your life and moved with {npc}.", tone: "good", effects: [fx.close(12), fx.happy(-2)] }] },
      { label: "Ask {npc.him} to stay", outcomes: [{ weight: 1, text: "{npc} turned down the job for you.", effects: [fx.close(-5)] }, { weight: 1, text: "{npc} took the job anyway. And ended things.", tone: "bad", effects: [fx.custom((ctx) => { if (ctx.npc) breakUp(ctx.state, ctx.npc); })] }] },
    ],
  },
  {
    id: "love-spouse-promotion",
    ages: [22, 70],
    cooldown: 5,
    npc: { kind: "existing", roles: ["spouse"] },
    text: "{npc} got a big promotion at work. You celebrated with {champagne|takeout and a movie|a ridiculous cake}.",
    tone: "good",
    effects: [fx.close(4), fx.happy(3), fx.custom(({ npc }) => { if (npc) npc.wealth += 20000; })],
  },
  {
    id: "love-midlife-spark",
    ages: [40, 60],
    once: true,
    condition: partnerFilter,
    npc: { kind: "existing", roles: ["spouse"], filter: (n) => n.closeness < 60 },
    title: "In a rut",
    text: "You and {npc} have been living like roommates lately.",
    choices: [
      { label: "Plan a surprise trip", outcomes: [{ text: "You surprised {npc} with a trip to {Paris|Kyoto|the coast}. You fell for each other all over again.", tone: "good", effects: [fx.close(18), fx.cash(-5000), fx.happy(6)] }] },
      { label: "Take a dance class together", outcomes: [{ text: "You took a salsa class together. You were terrible. It was the best part of your week.", tone: "good", effects: [fx.close(10)] }] },
      { label: "Accept it", outcomes: [{ text: "You accepted it. Comfortable is fine. Probably.", effects: [fx.close(-3)] }] },
    ],
  },
  {
    id: "family-spouse-divorce",
    category: "family",
    ages: [18, 120],
    triggeredOnly: true,
    title: "Divorce papers",
    text: "{npc} handed you divorce papers. \"I'm not happy. I haven't been for a long time.\"",
    choices: [
      { label: "Sign them", outcomes: [{ text: "You signed. It's over.", tone: "bad", effects: [fx.custom((ctx) => { if (ctx.npc) ctx.vars.terms = divorce(ctx.state, ctx.npc, ctx.country); }), fx.log("{terms}", "bad")] }] },
      { label: "Fight for the marriage", outcomes: [{ weight: pass("charisma", 55), text: "You convinced {npc} to give it one more try.", tone: "good", effects: [fx.close(25)] }, { weight: fail("charisma", 55), text: "{npc} didn't budge. The divorce went through.", tone: "bad", effects: [fx.custom((ctx) => { if (ctx.npc) ctx.vars.terms = divorce(ctx.state, ctx.npc, ctx.country); }), fx.log("{terms}", "bad")] }] },
    ],
  },
]);

