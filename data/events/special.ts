import { defineEvents, fail, fx, pass, when } from "@/engine/events/helpers";
import { killPlayer } from "@/engine/lifecycle/death";
import type { EventContext, Npc } from "@/engine/types";
import { clamp } from "@/engine/util";

export const MAFIA_RANKS = ["Associate", "Soldier", "Capo", "Underboss", "Don"];
const lifelong = (n: Npc) => n.tags.includes("lifelong");
const mafiaRank = (ctx: EventContext) => Number(ctx.state.flags.mafiaRank ?? 0);

export const SPECIAL_EVENTS = defineEvents("random", [
  // ------------------------------------------------------------ mafia
  {
    id: "mafia-approach",
    ages: [18, 45],
    once: true,
    condition: (ctx) => ctx.player.crime.notoriety >= 12 || ctx.player.skills.streetSmarts >= 55,
    weight: 0.8,
    title: "A proposition",
    text: "A man in a very nice suit sat down next to you at the bar. \"Some friends of mine have heard good things about you.\"",
    choices: [
      { label: "Hear him out", outcomes: [{ text: "He slid a napkin across the bar with an address on it.", next: "mafia-first-job" }] },
      { label: "Walk away", outcomes: [{ text: "You paid your tab and left. He didn't follow. You checked twice." }] },
    ],
  },
  {
    id: "mafia-first-job",
    ages: [18, 60],
    triggeredOnly: true,
    title: "The package",
    text: "The job: drive a package across town. No questions.",
    choices: [
      { label: "Deliver it", outcomes: [{ weight: pass("streetSmarts", 30), text: "You delivered it without a hitch and got an envelope of cash. Welcome to the family.", tone: "major", effects: [fx.cash(5000), fx.flag("mafiaRank", 1), fx.karma(-4)] }, { weight: fail("streetSmarts", 30), text: "You got pulled over with the package. You kept your mouth shut. The family noticed.", tone: "bad", effects: [fx.flag("mafiaRank", 1), fx.custom((ctx) => { ctx.vars.crime = "possession"; ctx.vars.sMin = 1; ctx.vars.sMax = 3; })], next: "crime-trial" }] },
      { label: "Peek inside", outcomes: [{ text: "Inside was {a lot of cash|a ledger full of names|a single cannoli}. You delivered it anyway. They knew you looked.", effects: [fx.cash(2000), fx.flag("mafiaRank", 1)] }] },
      { label: "Go to the police", outcomes: [{ weight: 1, text: "The police thanked you. The family did not.", tone: "bad", effects: [fx.karma(6), fx.flag("mafiaEnemy")] }, { weight: 1, text: "The detective you talked to was on the family's payroll.", tone: "bad", effects: [fx.flag("mafiaEnemy"), fx.health(-15)] }] },
    ],
  },
  {
    id: "mafia-loyalty",
    ages: [18, 80],
    cooldown: 4,
    condition: (ctx) => mafiaRank(ctx) >= 1,
    title: "A favor for the boss",
    text: "The boss wants you to \"have a word\" with a restaurant owner who stopped paying.",
    choices: [
      { label: "Do what's asked", outcomes: [{ text: "You had a word. The owner paid. The boss was pleased.", effects: [fx.karma(-6), fx.cash(8000), fx.custom((ctx) => { ctx.state.flags.mafiaRank = clamp(mafiaRank(ctx) + 1, 1, 5); })] }] },
      { label: "Pay the debt yourself", condition: when.richerThan(10_000), outcomes: [{ text: "You quietly paid the owner's debt yourself. The boss never knew. The owner did.", tone: "good", effects: [fx.cash(-10000), fx.karma(5)] }] },
      { label: "Refuse", outcomes: [{ weight: 1, text: "The boss stared at you for a long time. \"Disappointing.\" You were demoted.", tone: "bad", effects: [fx.custom((ctx) => { ctx.state.flags.mafiaRank = clamp(mafiaRank(ctx) - 1, 1, 5); })] }, { weight: 1, text: "Refusing was a mistake. You woke up in the hospital.", tone: "bad", effects: [fx.health(-25)] }] },
    ],
  },
  {
    id: "mafia-war",
    ages: [20, 90],
    cooldown: 6,
    condition: (ctx) => mafiaRank(ctx) >= 2,
    weight: 0.7,
    title: "Family war",
    text: "A rival family made a move on your territory. Things are about to get loud.",
    choices: [
      { label: "Lead the response", outcomes: [{ weight: pass("streetSmarts", 60), text: "You outmaneuvered the rivals. The boss made you a capo on the spot.", tone: "major", effects: [fx.custom((ctx) => { ctx.state.flags.mafiaRank = clamp(mafiaRank(ctx) + 1, 1, 5); }), fx.cash(30000)] }, { weight: fail("streetSmarts", 60), text: "It went badly.", tone: "bad", effects: [fx.custom((ctx) => { if (ctx.rng.chance(0.4)) killPlayer(ctx.state, "murdered", `You were killed in a mob war at ${ctx.player.age}.`); else { ctx.player.stats.health = Math.max(5, ctx.player.stats.health - 30); } })] }] },
      { label: "Negotiate a truce", outcomes: [{ weight: pass("charisma", 55), text: "You brokered a truce over a very long dinner. Respect.", tone: "good", effects: [fx.custom((ctx) => { ctx.state.flags.mafiaRank = clamp(mafiaRank(ctx) + 1, 1, 5); })] }, { weight: fail("charisma", 55), text: "The talks collapsed. So did the restaurant ceiling, mysteriously.", tone: "bad", effects: [fx.health(-15)] }] },
      { label: "Lie low", outcomes: [{ text: "You stayed home until it blew over. Some people noticed your absence.", effects: [fx.custom((ctx) => { ctx.state.flags.mafiaRank = clamp(mafiaRank(ctx) - 1, 1, 5); })] }] },
    ],
  },
  {
    id: "mafia-out",
    ages: [40, 100],
    once: true,
    condition: (ctx) => mafiaRank(ctx) >= 1,
    title: "Getting out",
    text: "You're tired. You want out of the family. Nobody just leaves.",
    choices: [
      { label: "Ask the boss for retirement", outcomes: [{ weight: (ctx) => 0.3 + mafiaRank(ctx) * 0.1, text: "The boss hugged you and gave you his blessing. You moved somewhere warm.", tone: "good", effects: [fx.flag("mafiaRank", 0), fx.flag("exMafia"), fx.happy(8)] }, { weight: 0.5, text: "The boss smiled. \"Of course.\" A week later your brakes failed.", tone: "bad", effects: [fx.custom((ctx) => killPlayer(ctx.state, "carCrash", `Your brakes mysteriously failed at ${ctx.player.age}.`))] }] },
      { label: "Become an informant", outcomes: [{ weight: 2, text: "You testified. The family went down. You went into witness protection with a new name.", tone: "major", effects: [fx.flag("mafiaRank", 0), fx.karma(10), fx.flag("witnessProtection")] }, { weight: 1, text: "Someone leaked your name before the trial.", effects: [fx.custom((ctx) => killPlayer(ctx.state, "murdered", `You were murdered at ${ctx.player.age}, days before you could testify.`))] }] },
      { label: "Stay in", outcomes: [{ text: "You decided this is who you are now." }] },
    ],
  },
  // ------------------------------------------------------------ cult
  {
    id: "cult-recruit",
    ages: [18, 45],
    once: true,
    condition: when.statBelow("happiness", 55),
    weight: 0.6,
    title: "A warm welcome",
    text: "Some impossibly cheerful people invited you to a free weekend retreat about \"realigning your purpose.\"",
    choices: [
      { label: "Go to the retreat", outcomes: [{ text: "Everyone wears white and nobody has a phone. You felt more seen than you have in years.", next: "cult-inside" }] },
      { label: "Take a pamphlet and leave", outcomes: [{ text: "You took a pamphlet and used it as a coaster." }] },
    ],
  },
  {
    id: "cult-inside",
    ages: [18, 70],
    triggeredOnly: true,
    title: "The Collective",
    text: "The leader, a soft-spoken man called {Brother Ash|Father Sol|The Gardener}, asks you to sign over your savings to the Collective.",
    choices: [
      { label: "Sign", outcomes: [{ text: "You signed. You belong now. The rice is bland.", effects: [fx.custom((ctx) => { ctx.player.finance.cash = Math.round(ctx.player.finance.cash * 0.1); }), fx.flag("cultMember"), fx.happy(6), fx.schedule("cult-doubt", [2, 5])] }] },
      { label: "Ask questions", outcomes: [{ text: "You asked where the money goes. The room went quiet. You were asked to leave.", effects: [fx.skill("streetSmarts", 2)] }] },
      { label: "Sneak out at night", outcomes: [{ text: "You climbed out a bathroom window and hitchhiked home.", effects: [fx.skill("streetSmarts", 1)] }] },
    ],
  },
  {
    id: "cult-doubt",
    ages: [18, 90],
    triggeredOnly: true,
    title: "Doubts",
    text: "You overheard the leader on a phone he said didn't exist, talking about a yacht.",
    choices: [
      { label: "Escape", outcomes: [{ weight: pass("streetSmarts", 40), text: "You escaped with two other members. You're slowly rebuilding.", tone: "major", effects: [fx.flag("cultMember", false), fx.flag("cultSurvivor"), fx.happy(-4)] }, { weight: fail("streetSmarts", 40), text: "They caught you at the gate and kept you in \"reflection\" for a month. You escaped the second time.", tone: "bad", effects: [fx.flag("cultMember", false), fx.flag("cultSurvivor"), fx.health(-10)] }] },
      { label: "Take over", outcomes: [{ weight: pass("charisma", 70), text: "You exposed him at the evening gathering. The members made you their new leader.", tone: "major", effects: [fx.flag("cultLeader"), fx.cash(200000), fx.karma(-8), fx.fame(3)] }, { weight: fail("charisma", 70), text: "Nobody believed you. You were cast out with nothing.", tone: "bad", effects: [fx.flag("cultMember", false), fx.happy(-8)] }] },
      { label: "Stay faithful", outcomes: [{ text: "You decided you misheard. You did not mishear.", effects: [fx.happy(-3)] }] },
    ],
  },
  // ------------------------------------------------------------ secret agency
  {
    id: "agency-recruit",
    ages: [22, 40],
    once: true,
    condition: (ctx) => ctx.player.stats.smarts >= 72 && !ctx.player.crime.record.some((r) => r.convicted),
    weight: 0.6,
    title: "The woman in grey",
    text: "A woman in a grey coat handed you a business card with only a phone number on it. \"Your country needs people like you. This conversation didn't happen.\"",
    choices: [
      { label: "Call the number", outcomes: [{ weight: pass("athleticism", 35), text: "You passed six months of training at a facility that doesn't exist. You are now an agent.", tone: "major", effects: [fx.flag("agent"), fx.schedule("agency-mission", [1, 3])] }, { weight: fail("athleticism", 35), text: "You washed out of training in week two. They made you sign a lot of papers.", effects: [] }] },
      { label: "Throw the card away", outcomes: [{ text: "You threw the card away. Sometimes you see grey coats in crowds." }] },
    ],
  },
  {
    id: "agency-mission",
    ages: [22, 70],
    triggeredOnly: true,
    title: "Classified",
    text: "Your mission: retrieve a stolen hard drive from a {gala in Monaco|train crossing the Alps|embassy party in Vienna}.",
    choices: [
      { label: "Charm your way in", outcomes: [{ weight: pass("charisma", 55), text: "Mission accomplished. Nobody will ever know. A medal sits in a drawer with your name on it.", tone: "major", effects: [fx.cash(50000), fx.inc("missions"), fx.achieve("secret-agent"), fx.schedule("agency-mission", [2, 4])] }, { weight: fail("charisma", 55), text: "Your cover was blown. You escaped across a rooftop.", tone: "bad", effects: [fx.health(-10), fx.schedule("agency-mission", [2, 4])] }] },
      { label: "Sneak in", outcomes: [{ weight: pass("streetSmarts", 55), text: "You got in through the ventilation shafts. Textbook.", tone: "major", effects: [fx.cash(50000), fx.inc("missions"), fx.achieve("secret-agent"), fx.schedule("agency-mission", [2, 4])] }, { weight: fail("streetSmarts", 55), text: "You got stuck in the ventilation shafts. Embarrassing, but you got out.", effects: [fx.schedule("agency-mission", [2, 4])] }] },
      { label: "Retire from the agency", outcomes: [{ text: "You handed in your badge that never existed and went back to normal life.", effects: [fx.flag("agent", false), fx.flag("exAgent")] }] },
    ],
  },
  // ------------------------------------------------------------ lifelong rival
  {
    id: "rival-childhood",
    category: "rival",
    ages: [7, 12],
    once: true,
    weight: 2,
    npc: { kind: "new", role: "rival", ageOffset: [0, 0], closeness: [5, 20] },
    title: "Rival",
    text: "{npc.full} beat you at {the spelling bee|the class race|the science fair} and smirked about it. You will remember this.",
    effects: [fx.tag("lifelong")],
    choices: [
      { label: "Vow revenge", outcomes: [{ text: "You vowed to beat {npc} at everything for the rest of your life.", effects: [fx.flag("rivalry")] }] },
      { label: "Shake {npc.his} hand", outcomes: [{ text: "You shook {npc}'s hand. {npc.He} looked surprised. The rivalry lives on anyway.", effects: [fx.close(10), fx.karma(1)] }] },
    ],
  },
  {
    id: "rival-teen",
    category: "rival",
    ages: [13, 18],
    once: true,
    npc: { kind: "existing", roles: ["rival", "nemesis"], filter: lifelong },
    title: "Round two",
    text: "{npc} is running against you for {team captain|class president|the last spot in the honors program}.",
    choices: [
      { label: "Fight fair", outcomes: [{ weight: pass("charisma", 50), text: "You beat {npc} fair and square.", tone: "good", effects: [fx.happy(6), fx.inc("rivalWins")] }, { weight: fail("charisma", 50), text: "{npc} won. Again.", tone: "bad", effects: [fx.happy(-5), fx.inc("rivalLosses")] }] },
      { label: "Fight dirty", outcomes: [{ weight: pass("streetSmarts", 45), text: "You spread a rumor about {npc}. You won. It felt cheap.", effects: [fx.karma(-4), fx.inc("rivalWins")] }, { weight: fail("streetSmarts", 45), text: "Your scheme backfired publicly. {npc} won by a landslide.", tone: "bad", effects: [fx.karma(-4), fx.inc("rivalLosses"), fx.happy(-5)] }] },
    ],
  },
  {
    id: "rival-career",
    category: "rival",
    ages: [24, 55],
    cooldown: 8,
    npc: { kind: "existing", roles: ["rival", "nemesis"], filter: lifelong },
    title: "Small world",
    text: "{npc} just {got the promotion you wanted|opened a business across the street from yours|bought the house you were bidding on}.",
    choices: [
      { label: "Congratulate {npc.him}", outcomes: [{ text: "You congratulated {npc} through gritted teeth. {npc.He} seemed genuinely touched.", effects: [fx.close(10), fx.karma(2)] }] },
      { label: "Redouble your efforts", outcomes: [{ text: "You worked twice as hard all year. Spite is a powerful fuel.", effects: [fx.custom((ctx) => { const j = ctx.player.career.job; if (j) j.performance = clamp(j.performance + 15); }), fx.happy(-2)] }] },
      { label: "Make {npc.him} your nemesis", outcomes: [{ text: "This is war. {npc} is now your official nemesis.", effects: [fx.custom(({ npc }) => { if (npc) npc.role = "nemesis"; })] }] },
    ],
  },
  {
    id: "rival-downfall",
    category: "rival",
    ages: [30, 80],
    once: true,
    npc: { kind: "existing", roles: ["rival", "nemesis"], filter: lifelong },
    title: "Fallen",
    text: "{npc} lost everything in {a business collapse|a scandal|a messy divorce}. {npc.He} called you, of all people.",
    choices: [
      { label: "Help {npc.him}", outcomes: [{ text: "You helped {npc} get back on {npc.his} feet. After all these years, you're something like friends.", tone: "good", effects: [fx.custom(({ npc }) => { if (npc) npc.role = "friend"; }), fx.close(40), fx.karma(6), fx.flag("madePeace")] }] },
      { label: "Gloat", outcomes: [{ text: "You gloated. It felt amazing for about eleven minutes.", effects: [fx.happy(4), fx.karma(-4), fx.close(-20)] }] },
      { label: "Let it ring", outcomes: [{ text: "You let it ring." }] },
    ],
  },
  {
    id: "rival-final",
    category: "rival",
    ages: [70, 110],
    once: true,
    npc: { kind: "existing", roles: ["rival", "nemesis", "friend"], filter: lifelong },
    title: "One last time",
    text: "{npc}, your rival of a lifetime, is in the hospital. {npc.He} asked to see you.",
    choices: [
      { label: "Go", outcomes: [{ text: "You sat by {npc}'s bed and laughed about everything. \"You were always the better one,\" {npc.he} said. \"Liar,\" you said. {npc.He} died that week.", tone: "major", effects: [fx.custom(({ npc }) => { if (npc) { npc.alive = false; npc.deathAge = npc.age; } }), fx.happy(-4), fx.karma(4), fx.achieve("rivals-to-the-end")] }] },
      { label: "Don't go", outcomes: [{ text: "You didn't go. You thought about it for the rest of your life.", tone: "bad", effects: [fx.happy(-6)] }] },
    ],
  },
  // ------------------------------------------------------------ choose-your-own-adventure chains
  {
    id: "mystery-letter",
    ages: [20, 70],
    once: true,
    weight: 0.6,
    title: "A letter",
    text: "A lawyer's letter arrived: a great-aunt you never met left you \"the contents of locker 117\" at a train station.",
    choices: [
      { label: "Go to the station", outcomes: [{ text: "Locker 117 held an old key and a map of a town three hours away.", next: "mystery-key" }] },
      { label: "Ignore it", outcomes: [{ text: "You ignored it. You'll always wonder." }] },
    ],
  },
  {
    id: "mystery-key",
    ages: [20, 80],
    triggeredOnly: true,
    title: "The key",
    text: "The map leads to a boarded-up bakery. The key fits the back door.",
    choices: [
      { label: "Go inside", outcomes: [{ text: "Behind the ovens is a wall safe with a combination dial.", next: "mystery-vault" }] },
      { label: "Call a locksmith first", outcomes: [{ text: "The locksmith opened the door and found a wall safe. He asked for a cut.", effects: [fx.cash(-200)], next: "mystery-vault" }] },
      { label: "Leave", outcomes: [{ text: "This felt like the start of a horror movie. You drove home." }] },
    ],
  },
  {
    id: "mystery-vault",
    ages: [20, 80],
    triggeredOnly: true,
    title: "The safe",
    text: "You need a combination. You remember the locker number: 117.",
    choices: [
      { label: "Try 1-1-7", outcomes: [{ weight: 2, text: "Click. Inside: stacks of old bonds, still valid, and a note: \"For whoever was curious enough.\"", tone: "major", effects: [fx.cash(85000), fx.achieve("curious-enough")] }, { weight: 1, text: "Click. Inside: a recipe for the best bread you've ever tasted. You opened a bakery.", tone: "good", effects: [fx.happy(10), fx.skill("creativity", 4)] }] },
      { label: "Try her birthday", outcomes: [{ text: "Nothing. You never figured it out.", effects: [fx.happy(-2)] }] },
      { label: "Crack it", outcomes: [{ weight: pass("streetSmarts", 60), text: "You cracked it by ear. Inside: a diamond necklace and a photo of a woman who looks exactly like you.", tone: "major", effects: [fx.cash(40000), fx.achieve("curious-enough")] }, { weight: fail("streetSmarts", 60), text: "The dial jammed for good.", effects: [fx.happy(-2)] }] },
    ],
  },
  {
    id: "roadtrip-start",
    ages: [18, 60],
    once: true,
    condition: when.flag("license"),
    weight: 0.6,
    title: "Road trip",
    text: "You have a week off and a full tank of gas.",
    choices: [
      { label: "Head for the coast", outcomes: [{ text: "Three hours in, a hitchhiker with a guitar is waving at you from the shoulder.", next: "roadtrip-hitchhiker" }] },
      { label: "Head for the mountains", outcomes: [{ text: "You spent the week in a cabin with no signal. You came back a new person, briefly.", tone: "good", effects: [fx.happy(8)] }] },
      { label: "Stay home", outcomes: [{ text: "You stayed home and slept for most of it. Also valid." }] },
    ],
  },
  {
    id: "roadtrip-hitchhiker",
    ages: [18, 70],
    triggeredOnly: true,
    title: "The hitchhiker",
    text: "The hitchhiker says they're heading to a music festival and can pay in \"vibes and gas money.\"",
    choices: [
      { label: "Pick them up", outcomes: [{ weight: 3, text: "You ended up at the festival together. Best week of your year.", tone: "good", effects: [fx.happy(10), fx.custom((ctx) => { ctx.state.flags.festival = true; })], next: "roadtrip-end" }, { weight: 1, text: "They stole your wallet at the first gas station.", tone: "bad", effects: [fx.cash(-400)] }] },
      { label: "Drive past", outcomes: [{ text: "You drove past and had a quiet, perfectly fine week at the beach.", effects: [fx.happy(4)] }] },
    ],
  },
  {
    id: "roadtrip-end",
    ages: [18, 70],
    triggeredOnly: true,
    title: "Last night of the festival",
    text: "On the last night, your new friend asks if you want to keep driving: \"There's another festival next week.\"",
    choices: [
      { label: "Keep going", outcomes: [{ text: "You drove for a month. You came home tanned, broke, and happier than you've been in years.", tone: "good", effects: [fx.happy(12), fx.cash(-1500), fx.custom((ctx) => { const j = ctx.player.career.job; if (j) j.performance = clamp(j.performance - 20); })] }] },
      { label: "Go home", outcomes: [{ text: "You hugged goodbye and drove home. You still exchange postcards.", effects: [fx.happy(4)] }] },
    ],
  },
  {
    id: "lostdog-found",
    ages: [8, 80],
    once: true,
    weight: 0.6,
    title: "A lost dog",
    text: "A shaggy dog with a collar but no tag followed you home and sat on your doorstep.",
    choices: [
      { label: "Look for the owner", outcomes: [{ text: "You put up posters all over the neighborhood.", next: "lostdog-owner" }] },
      { label: "Keep the dog", outcomes: [{ text: "You named the dog {Scruffy|Mister|Pancake}. Nobody ever came looking.", tone: "good", effects: [fx.happy(8), fx.custom((ctx) => { ctx.player.assets.push({ id: ctx.rng.id("a_"), kind: "pet", name: "Scruffy the Dog", value: 0, purchasePrice: 0, boughtAtAge: ctx.player.age, condition: 100, yearlyUpkeep: Math.round(1500 * ctx.country.costIndex), rentedOut: false, catalogId: "dog", age: 4 }); })] }] },
    ],
  },
  {
    id: "lostdog-owner",
    ages: [8, 90],
    triggeredOnly: true,
    npc: { kind: "new", role: "acquaintance", age: [20, 85], closeness: [50, 70] },
    title: "Reunited",
    text: "{npc.full} called, crying. It was {npc.his} dog. {npc.He} insisted on giving you a reward.",
    choices: [
      { label: "Accept the reward", outcomes: [{ text: "You accepted {money:500}. {npc} sends you a photo of the dog every Christmas.", effects: [fx.cash(500), fx.close(10)] }] },
      { label: "Decline", outcomes: [{ text: "You declined. {npc} baked you a pie instead. A good pie.", tone: "good", effects: [fx.karma(4), fx.close(20)] }] },
    ],
  },
]);
