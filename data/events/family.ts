import { defineEvents, fail, fx, pass, when } from "@/engine/events/helpers";
import { createNpc, randomFirstName } from "@/engine/npc";
import type { EventContext, Npc } from "@/engine/types";

const kidAged = (lo: number, hi: number) => (n: Npc) => n.age >= lo && n.age <= hi;
function createSibling(ctx: EventContext): string {
  const n = createNpc(ctx.state, ctx.rng, ctx.country, { role: "halfSibling", age: ctx.player.age + ctx.rng.int(-8, 8), closeness: 45 });
  return n.firstName;
}

const rename = (key: string) =>
  fx.custom((ctx) => {
    const name = ctx.vars[key];
    if (ctx.npc && typeof name === "string") ctx.npc.firstName = name;
  });

export const FAMILY_EVENTS = defineEvents("family", [
  {
    id: "family-name-baby",
    ages: [14, 120],
    triggeredOnly: true,
    title: "What's in a name?",
    text: "Your new baby needs a name. You've been calling the baby {npc} while you decide.",
    effects: [
      fx.custom((ctx) => {
        const g = ctx.npc?.gender ?? "female";
        const used = new Set([ctx.npc?.firstName]);
        for (const key of ["n1", "n2", "n3"]) {
          let name = randomFirstName(ctx.rng, ctx.country, g);
          for (let i = 0; i < 6 && used.has(name); i++) name = randomFirstName(ctx.rng, ctx.country, g);
          used.add(name);
          ctx.vars[key] = name;
        }
      }),
    ],
    choices: [
      { id: "keep", label: "Keep {npc}", outcomes: [{ text: "You stuck with {npc}. It suits the baby." }] },
      { id: "n1", label: "{n1}", outcomes: [{ text: "You named the baby {n1}.", effects: [rename("n1")] }] },
      { id: "n2", label: "{n2}", outcomes: [{ text: "You named the baby {n2}.", effects: [rename("n2")] }] },
      { id: "n3", label: "{n3}", outcomes: [{ text: "You named the baby {n3}.", effects: [rename("n3")] }] },
    ],
  },
  {
    id: "kid-sleepless",
    ages: [16, 70],
    cooldown: 5,
    npc: { kind: "existing", roles: ["child"], filter: kidAged(0, 1) },
    text: "{npc} has not slept through the night once. You've started hallucinating faintly.",
    tone: "bad",
    effects: [fx.health(-3), fx.happy(-3)],
  },
  {
    id: "kid-first-word",
    ages: [16, 70],
    npc: { kind: "existing", roles: ["child"], filter: kidAged(1, 2) },
    cooldown: 3,
    text: "{npc}'s first word was {\"no\"|\"dog\"|your name|a word they definitely learned from you in traffic}.",
    tone: "good",
    effects: [fx.close(5), fx.happy(4)],
  },
  {
    id: "kid-daycare-cost",
    ages: [18, 60],
    cooldown: 6,
    npc: { kind: "existing", roles: ["child"], filter: kidAged(1, 4) },
    text: "You got the daycare bill for {npc}. It's roughly a second rent.",
    effects: [fx.cash(-6000)],
  },
  {
    id: "kid-school-trouble",
    ages: [20, 75],
    cooldown: 4,
    npc: { kind: "existing", roles: ["child"], filter: kidAged(6, 15) },
    title: "Call from school",
    text: "The principal called. {npc} {got into a fight|was caught cheating|glued a teacher's stapler to the desk}.",
    choices: [
      { label: "Ground {npc.him}", outcomes: [{ text: "You grounded {npc} for a month. {npc.He} sulked dramatically.", effects: [fx.close(-6), fx.karma(1)] }] },
      { label: "Talk it through", outcomes: [{ weight: pass("charisma", 35), text: "You talked it through. {npc} opened up about what's really going on.", tone: "good", effects: [fx.close(8)] }, { weight: fail("charisma", 35), text: "You tried to talk. {npc} stared at the wall.", effects: [fx.close(-2)] }] },
      { label: "Take {npc.his} side", outcomes: [{ text: "You stormed into the principal's office and defended {npc}. {npc.He} thinks you're a hero.", effects: [fx.close(10), fx.karma(-1)] }] },
    ],
  },
  {
    id: "kid-good-grades",
    ages: [20, 75],
    cooldown: 4,
    npc: { kind: "existing", roles: ["child"], filter: kidAged(7, 17) },
    text: "{npc} brought home a perfect report card.",
    choices: [
      { label: "Reward {npc.him}", outcomes: [{ text: "You took {npc} out for ice cream and let {npc.him} pick the music in the car.", tone: "good", effects: [fx.close(8), fx.cash(-50)] }] },
      { label: "Ask why it's not better", outcomes: [{ text: "You asked why it wasn't better. {npc}'s face fell.", tone: "bad", effects: [fx.close(-12)] }] },
    ],
  },
  {
    id: "kid-sports",
    ages: [20, 75],
    cooldown: 4,
    npc: { kind: "existing", roles: ["child"], filter: kidAged(6, 16) },
    title: "The big game",
    text: "{npc} has a {soccer|basketball|baseball} game on the same night as an important work thing.",
    choices: [
      { label: "Go to the game", outcomes: [{ text: "You cheered from the bleachers. {npc} scored and pointed at you.", tone: "good", effects: [fx.close(12), fx.custom((ctx) => { const j = ctx.player.career.job; if (j) j.performance = Math.max(0, j.performance - 4); })] }] },
      { label: "Go to work", outcomes: [{ text: "You missed the game. {npc} said it was fine. It wasn't.", tone: "bad", effects: [fx.close(-10)] }] },
    ],
  },
  {
    id: "kid-teen-rebellion",
    ages: [28, 80],
    cooldown: 4,
    npc: { kind: "existing", roles: ["child"], filter: kidAged(13, 17) },
    title: "Teenager",
    text: "{npc} {came home three hours past curfew|dyed {npc.his} hair green without asking|got a tattoo using a fake ID}.",
    choices: [
      { label: "Lay down the law", outcomes: [{ text: "You laid down the law. {npc} slammed a door so hard a picture fell.", effects: [fx.close(-8)] }] },
      { label: "Let it slide", outcomes: [{ text: "You let it slide. {npc} seemed almost disappointed.", effects: [fx.close(2)] }] },
      { label: "Tell your own wild story", outcomes: [{ text: "You told {npc} about the time you did worse at {npc.his} age. {npc.He} laughed for the first time in weeks.", tone: "good", effects: [fx.close(8)] }] },
    ],
  },
  {
    id: "kid-asks-car",
    ages: [32, 80],
    once: true,
    npc: { kind: "existing", roles: ["child"], filter: kidAged(16, 18) },
    title: "Car keys",
    text: "{npc} just got {npc.his} license and wants a car.",
    choices: [
      { label: "Buy {npc.him} a used car", condition: when.richerThan(6_000), outcomes: [{ text: "You bought {npc} a used car. {npc.He} named it.", tone: "good", effects: [fx.cash(-6000), fx.close(15)] }] },
      { label: "Make {npc.him} earn it", outcomes: [{ text: "You told {npc} to get a job. {npc.He} did, eventually.", effects: [fx.close(-3), fx.karma(1)] }] },
    ],
  },
  {
    id: "kid-graduates",
    ages: [34, 85],
    cooldown: 3,
    npc: { kind: "existing", roles: ["child"], filter: kidAged(18, 18) },
    text: "{npc} graduated high school. You cried in the bleachers and denied it afterwards.",
    tone: "good",
    effects: [fx.close(6), fx.happy(6)],
  },
  {
    id: "kid-college-money",
    ages: [34, 85],
    once: true,
    npc: { kind: "existing", roles: ["child"], filter: kidAged(18, 22) },
    title: "Tuition",
    text: "{npc} got into college. Tuition is {money:24000} a year.",
    choices: [
      { label: "Pay for it", condition: when.richerThan(24_000), outcomes: [{ text: "You paid {npc}'s tuition. {npc.He} hugged you for a long time.", tone: "good", effects: [fx.cash(-24000), fx.close(15), fx.flag("paidKidsTuition")] }] },
      { label: "Help a little", condition: when.richerThan(5_000), outcomes: [{ text: "You chipped in what you could. {npc} took out loans for the rest.", effects: [fx.cash(-5000), fx.close(5)] }] },
      { label: "They're on their own", outcomes: [{ text: "You told {npc} it builds character. {npc} said so do loans.", effects: [fx.close(-8)] }] },
    ],
  },
  {
    id: "kid-empty-nest",
    category: "phase",
    ages: [38, 80],
    once: true,
    condition: (ctx) => {
      const kids = Object.values(ctx.state.npcs).filter((n) => n.role === "child" && n.alive);
      return kids.length > 0 && kids.every((k) => k.age >= 19);
    },
    text: "Your last child moved out. The house is so quiet you can hear the fridge thinking.",
    choices: [
      { label: "Turn their room into a gym", outcomes: [{ text: "You turned the bedroom into a home gym within the week. You've used it twice.", effects: [fx.happy(3)] }] },
      { label: "Call them every day", outcomes: [{ text: "You call every day. They answer most days.", effects: [fx.happy(-1)] }] },
      { label: "Rediscover yourself", outcomes: [{ text: "You took up {pottery|salsa dancing|Italian|birdwatching}. Turns out you're interesting.", tone: "good", effects: [fx.happy(6), fx.skill("creativity", 2)] }] },
    ],
  },
  {
    id: "kid-adult-asks-money",
    ages: [40, 100],
    cooldown: 4,
    npc: { kind: "existing", roles: ["child"], filter: kidAged(20, 60) },
    title: "Hey, so...",
    text: "{npc} asked to borrow {money:8000} for {a down payment|a business idea|\"stuff\"}.",
    choices: [
      { label: "Give it", condition: when.richerThan(8_000), outcomes: [{ text: "You gave {npc} the money. {npc.He} promised to pay it back.", tone: "good", effects: [fx.cash(-8000), fx.close(10)] }] },
      { label: "Say no", outcomes: [{ text: "You said no. Thanksgiving was chilly.", effects: [fx.close(-8)] }] },
    ],
  },
  {
    id: "kid-wedding",
    ages: [42, 100],
    cooldown: 5,
    npc: { kind: "existing", roles: ["child"], filter: (n) => n.age >= 22 && n.tags.includes("married") },
    text: "You gave a speech at {npc}'s wedding. {Everyone laughed in the right places|You told one story too many|Not a dry eye in the house}.",
    tone: "good",
    effects: [fx.close(6), fx.happy(5)],
  },
  {
    id: "kid-grandkid-visit",
    ages: [45, 110],
    cooldown: 3,
    npc: { kind: "existing", roles: ["grandchild"], filter: kidAged(3, 14) },
    text: "Your grandkid {npc} stayed the weekend. You taught {npc.him} {a card trick|to fish|to make pancakes|a song from your youth}.",
    tone: "good",
    effects: [fx.close(8), fx.happy(5)],
  },
  {
    id: "family-sibling-rivalry",
    ages: [8, 40],
    cooldown: 5,
    npc: { kind: "existing", roles: ["sibling"] },
    title: "Sibling rivalry",
    text: "Your parents keep comparing you to {npc}, who {got better grades|has a better job|gave them a grandchild already}.",
    choices: [
      { label: "Compete harder", outcomes: [{ text: "You doubled down on proving yourself. It's exhausting.", effects: [fx.close(-6), fx.smarts(1), fx.happy(-2)] }] },
      { label: "Laugh it off with {npc}", outcomes: [{ text: "You and {npc} joked about it. You realized {npc.he} get{npc.s} compared to you too.", tone: "good", effects: [fx.close(10)] }] },
    ],
  },
  {
    id: "family-sibling-wedding",
    ages: [18, 70],
    once: true,
    npc: { kind: "existing", roles: ["sibling"], filter: (n) => n.age >= 22 },
    title: "Wedding",
    text: "{npc} is getting married and asked you to give a toast.",
    choices: [
      { label: "Heartfelt toast", outcomes: [{ text: "Your toast made the whole room cry.", tone: "good", effects: [fx.close(10)] }] },
      { label: "Roast {npc.him}", outcomes: [{ weight: pass("charisma", 50), text: "Your roast killed. Even the in-laws laughed.", tone: "good", effects: [fx.close(6), fx.skill("charisma", 1)] }, { weight: fail("charisma", 50), text: "Your roast went too far. Someone gasped audibly.", tone: "bad", effects: [fx.close(-12)] }] },
    ],
  },
  {
    id: "family-sibling-crisis",
    ages: [20, 80],
    once: true,
    npc: { kind: "existing", roles: ["sibling"], filter: (n) => n.age >= 20 },
    title: "Late night call",
    text: "{npc} called at 2 a.m. {npc.His} marriage is falling apart and {npc.he} need{npc.s} somewhere to stay.",
    choices: [
      { label: "Take {npc.him} in", outcomes: [{ text: "{npc} stayed on your couch for two months. You grew closer than you've been since childhood.", tone: "good", effects: [fx.close(18), fx.happy(-2)] }] },
      { label: "Help find a hotel", outcomes: [{ text: "You paid for a week at a hotel.", effects: [fx.cash(-700), fx.close(5)] }] },
      { label: "Let the call go to voicemail", outcomes: [{ text: "You let it ring. {npc} never mentioned it again.", tone: "bad", effects: [fx.close(-20)] }] },
    ],
  },
  {
    id: "family-reunion",
    ages: [10, 90],
    cooldown: 8,
    text: "Your family held a reunion. {Your uncle brought up politics|Someone brought a new partner nobody liked|Everyone fought over the last of the potato salad|It was genuinely lovely, which was suspicious}.",
    effects: [fx.happy([-2, 4])],
  },
  {
    id: "family-parent-remarries",
    ages: [10, 60],
    once: true,
    condition: when.flag("parentsDivorced"),
    weight: 0.6,
    text: "Your {mom|dad} announced a second wedding. You were asked to walk them down the aisle.",
    tone: "good",
    effects: [fx.happy(3)],
  },
  {
    id: "family-parent-moves-in",
    ages: [35, 75],
    once: true,
    condition: when.movedOut,
    npc: { kind: "existing", roles: ["mother", "father"], filter: (n) => n.age >= 75 },
    title: "Getting older",
    text: "{npc} can't live alone safely anymore.",
    choices: [
      { label: "Move {npc.him} in with you", outcomes: [{ text: "{npc} moved into your spare room. It's a lot, but you're glad you can be there.", tone: "good", effects: [fx.close(15), fx.happy(-3), fx.karma(3)] }] },
      { label: "Find a good care home", outcomes: [{ text: "You found {npc} a lovely care home. It's expensive, and {npc.he} complain{npc.s} about the pudding.", effects: [fx.cash(-15000), fx.close(-3)] }] },
      { label: "Leave it to your siblings", condition: when.hasLiving("sibling"), outcomes: [{ text: "You left it to your siblings. They noticed.", tone: "bad", effects: [fx.close(-10), fx.close(-10, "sibling")] }] },
    ],
  },
  {
    id: "family-parent-dementia",
    ages: [30, 80],
    once: true,
    weight: 0.6,
    npc: { kind: "existing", roles: ["mother", "father"], filter: (n) => n.age >= 72 },
    text: "{npc} called you by {npc.his} sister's name and didn't seem to notice. The diagnosis was early dementia.",
    tone: "bad",
    effects: [fx.happy(-8), fx.close(5)],
  },
  {
    id: "family-parent-last-words",
    ages: [20, 90],
    once: true,
    npc: { kind: "existing", roles: ["mother", "father"], filter: (n) => n.age >= 80 },
    weight: 0.7,
    title: "Hospital",
    text: "{npc} is in hospice. The nurse says it could be any day.",
    choices: [
      { label: "Sit with {npc.him}", outcomes: [{ text: "You held {npc}'s hand and talked about old times. {npc.His} last words to you were \"{I'm proud of you|Don't forget to eat vegetables|Be kind. Mostly.}\" {npc.He} died that night.", tone: "major", effects: [fx.close(10), fx.happy(-10), fx.custom(({ npc }) => { if (npc) { npc.alive = false; npc.deathAge = npc.age; } }), fx.flag("saidGoodbye")] }] },
      { label: "Say you'll come tomorrow", outcomes: [{ text: "You said you'd come tomorrow. {npc} died that night.", tone: "bad", effects: [fx.happy(-14), fx.custom(({ npc }) => { if (npc) { npc.alive = false; npc.deathAge = npc.age; } })] }] },
    ],
  },
  {
    id: "family-dna-test",
    ages: [20, 80],
    once: true,
    weight: 0.4,
    title: "Ancestry kit",
    text: "You took a mail-in DNA test for fun. The results say you have a half-sibling you never knew about.",
    choices: [
      {
        label: "Reach out",
        outcomes: [{ text: "You met your half-sibling for coffee. You have the same laugh.", tone: "good", effects: [fx.custom((ctx) => { ctx.vars.sib = createSibling(ctx); }), fx.log("Your half-sibling's name is {sib}.", "good")] }],
      },
      { label: "Leave it alone", outcomes: [{ text: "You closed the email and never told anyone." }] },
    ],
  },
]);
