import { recordArrest, sendToPrison } from "@/engine/crime";
import { defineEvents, fail, fx, pass } from "@/engine/events/helpers";
import { killPlayer } from "@/engine/lifecycle/death";
import type { EventContext } from "@/engine/types";
import { clamp } from "@/engine/util";

/** Sentence within the crime's range, scaled by how good your defense was (0 = great, 1 = terrible). */
function convict(defense: number) {
  return fx.custom((ctx: EventContext) => {
    const lo = Number(ctx.vars.sMin ?? 1);
    const hi = Number(ctx.vars.sMax ?? 3);
    const years = Math.max(0, Math.round(lo + (hi - lo) * clamp(defense + ctx.rng.float(-0.2, 0.2), 0, 1)));
    const crime = String(ctx.vars.crime ?? "a crime");
    if (crime === "murder" && ctx.country.tags.includes("deathPenalty") && ctx.rng.chance(0.15)) {
      ctx.vars.verdict = "sentenced to death";
      killPlayer(ctx.state, "executed", `You were convicted of murder and executed by the state at ${ctx.player.age}.`);
      return;
    }
    sendToPrison(ctx.state, ctx.rng, crime, years);
    ctx.vars.verdict = years === 0 ? "given probation" : `sentenced to ${years} year${years === 1 ? "" : "s"} in prison`;
  });
}
const acquit = fx.custom((ctx: EventContext) => {
  recordArrest(ctx.state, String(ctx.vars.crime ?? "a crime"));
});
const acquittalWeight = (base: number) => (ctx: EventContext) => clamp(base + ctx.player.karma / 400 - ctx.player.crime.notoriety / 300, 0.02, 0.9);

export const CRIME_EVENTS = defineEvents("crime", [
  {
    id: "crime-arrest",
    ages: [10, 120],
    triggeredOnly: true,
    expects: { crime: "burglary", sMin: 1, sMax: 5 },
    title: "Busted",
    text: "Police officers caught you in the act of {crime}.",
    choices: [
      { id: "quiet", label: "Go quietly", outcomes: [{ text: "You put your hands up. They read you your rights.", next: "crime-trial" }] },
      {
        id: "run",
        label: "Run for it",
        outcomes: [
          { weight: pass("athleticism", 55), text: "You vaulted a fence, cut through three backyards and lost them. You got away.", tone: "good", effects: [fx.custom((ctx) => { ctx.player.crime.notoriety = clamp(ctx.player.crime.notoriety + 5); })] },
          { weight: fail("athleticism", 55), text: "You made it two blocks before being tackled. Resisting arrest has been added to the charges.", tone: "bad", effects: [fx.custom((ctx) => { ctx.vars.sMin = Number(ctx.vars.sMin ?? 0) + 1; ctx.vars.sMax = Number(ctx.vars.sMax ?? 1) + 2; }), fx.health(-4)], next: "crime-trial" },
        ],
      },
      {
        id: "bribe",
        label: "Offer a bribe",
        condition: (ctx) => ctx.player.finance.cash >= 3000 * ctx.country.costIndex,
        outcomes: [
          { weight: pass("streetSmarts", 55), text: "The officer pocketed {money:3000} and looked the other way.", effects: [fx.cash(-3000), fx.karma(-3)] },
          { weight: fail("streetSmarts", 55), text: "The officer did not take kindly to that. Bribery added to the charges.", tone: "bad", effects: [fx.custom((ctx) => { ctx.vars.sMax = Number(ctx.vars.sMax ?? 1) + 2; })], next: "crime-trial" },
        ],
      },
    ],
  },
  {
    id: "crime-trial",
    ages: [10, 120],
    triggeredOnly: true,
    expects: { crime: "burglary", sMin: 1, sMax: 5, verdict: "sentenced to 3 years in prison" },
    title: "Trial",
    text: "You've been charged with {crime}. Your trial starts next month.",
    choices: [
      {
        id: "top",
        label: "Hire a top defense lawyer",
        condition: (ctx) => ctx.player.finance.cash >= 30000 * ctx.country.costIndex,
        outcomes: [
          { weight: acquittalWeight(0.55), text: "Your lawyer tore the prosecution apart. Not guilty.", tone: "good", effects: [fx.cash(-30000), acquit] },
          { weight: 0.45, text: "Even your expensive lawyer couldn't save you. Guilty. You were {verdict}.", tone: "bad", effects: [fx.cash(-30000), convict(0.15)] },
        ],
      },
      {
        id: "cheap",
        label: "Hire a cheap lawyer",
        condition: (ctx) => ctx.player.finance.cash >= 4000 * ctx.country.costIndex,
        outcomes: [
          { weight: acquittalWeight(0.3), text: "Your lawyer found a technicality. Case dismissed.", tone: "good", effects: [fx.cash(-4000), acquit] },
          { weight: 0.7, text: "Your lawyer called you by the wrong name twice. Guilty. You were {verdict}.", tone: "bad", effects: [fx.cash(-4000), convict(0.45)] },
        ],
      },
      {
        id: "public",
        label: "Use a public defender",
        outcomes: [
          { weight: acquittalWeight(0.2), text: "Your overworked public defender pulled off a miracle. Not guilty.", tone: "good", effects: [acquit] },
          { weight: 0.8, text: "Your public defender met you five minutes before the trial. Guilty. You were {verdict}.", tone: "bad", effects: [convict(0.6)] },
        ],
      },
      {
        id: "self",
        label: "Represent yourself",
        outcomes: [
          { weight: (ctx) => clamp(ctx.player.stats.smarts / 300 + ctx.player.skills.charisma / 300 - 0.1, 0.02, 0.5), text: "Against all odds, your closing argument convinced the jury. Not guilty!", tone: "good", effects: [acquit, fx.achieve("own-lawyer")] },
          { weight: 0.75, text: "Representing yourself went about as well as everyone said it would. Guilty. You were {verdict}.", tone: "bad", effects: [convict(0.85)] },
        ],
      },
    ],
  },
  {
    id: "crime-dui",
    ages: [16, 120],
    triggeredOnly: true,
    title: "Flashing lights",
    text: "Blue lights in your mirror. You've definitely had too much to drink.",
    choices: [
      { label: "Pull over", outcomes: [{ weight: 1, text: "You failed the breathalyzer. License suspended, heavy fine.", tone: "bad", effects: [fx.cash(-3000), fx.flag("license", false), fx.custom((ctx) => recordArrest(ctx.state, "DUI"))] }, { weight: 1, text: "You blew just under the limit. The officer told you to call a cab. You did.", effects: [] }] },
      { label: "Floor it", outcomes: [{ weight: 1, text: "You lost them on the highway. Your hands shook for an hour.", effects: [fx.karma(-3)] }, { weight: 1, text: "You crashed into a ditch. You survived, barely, and were arrested.", tone: "bad", effects: [fx.health(-25), fx.custom((ctx) => { ctx.vars.crime = "drunk driving"; ctx.vars.sMin = 1; ctx.vars.sMax = 3; })], next: "crime-trial" }] },
    ],
  },
  {
    id: "crime-fugitive",
    ages: [16, 120],
    cooldown: 3,
    condition: (ctx) => ctx.state.flags.fugitive === true && !ctx.player.crime.prison,
    title: "Wanted",
    text: "You saw your own face on a wanted poster at a gas station.",
    choices: [
      { label: "Lie low", outcomes: [{ weight: pass("streetSmarts", 50), text: "You moved to a new town and changed your hair. So far, so good.", effects: [] }, { weight: fail("streetSmarts", 50), text: "A neighbor recognized you. Police kicked in the door at dawn.", tone: "bad", effects: [fx.flag("fugitive", false), fx.custom((ctx) => { ctx.vars.crime = "escaping custody"; ctx.vars.sMin = 3; ctx.vars.sMax = 8; })], next: "crime-trial" }] },
      { label: "Turn yourself in", outcomes: [{ text: "You walked into a police station and turned yourself in.", effects: [fx.flag("fugitive", false), fx.karma(3), fx.custom((ctx) => { ctx.vars.crime = "escaping custody"; ctx.vars.sMin = 1; ctx.vars.sMax = 4; })], next: "crime-trial" }] },
    ],
  },
  {
    id: "crime-mugged",
    ages: [14, 95],
    once: true,
    weight: 0.6,
    title: "Mugged",
    text: "A stranger with a knife cornered you in a parking garage and demanded your wallet.",
    choices: [
      { label: "Hand it over", outcomes: [{ text: "You handed over your wallet. They took {money:300} and ran.", tone: "bad", effects: [fx.cash(-300), fx.happy(-4)] }] },
      { label: "Fight back", outcomes: [{ weight: pass("athleticism", 60), text: "You disarmed the mugger and held them until police arrived.", tone: "good", effects: [fx.happy(3), fx.fame(1), fx.achieve("vigilante")] }, { weight: fail("athleticism", 60), text: "You fought back and got stabbed. You survived.", tone: "bad", effects: [fx.health([-35, -15]), fx.cash(-300)] }] },
      { label: "Run", outcomes: [{ weight: pass("athleticism", 40), text: "You ran and got away clean.", effects: [] }, { weight: fail("athleticism", 40), text: "You tripped. They took your wallet and your dignity.", tone: "bad", effects: [fx.cash(-300), fx.health(-3)] }] },
    ],
  },
  {
    id: "crime-burgled",
    ages: [18, 100],
    once: true,
    weight: 0.5,
    condition: (ctx) => !ctx.player.livesWithParents,
    text: "Your home was burglarized while you were out. They took {the TV|your laptop|your grandmother's ring|a frozen lasagna, specifically}.",
    tone: "bad",
    effects: [fx.cash(-1500), fx.happy(-5)],
  },
  {
    id: "crime-witness",
    ages: [12, 90],
    once: true,
    title: "Witness",
    text: "You witnessed a hit-and-run. The driver looked right at you before speeding off.",
    choices: [
      { label: "Testify", outcomes: [{ weight: 3, text: "Your testimony put the driver behind bars.", tone: "good", effects: [fx.karma(4)] }, { weight: 1, text: "You testified. A week later someone slashed your tires.", tone: "bad", effects: [fx.karma(4), fx.cash(-600)] }] },
      { label: "Stay out of it", outcomes: [{ text: "You stayed out of it. The case went cold.", effects: [fx.karma(-2)] }] },
    ],
  },
  {
    id: "crime-heat",
    ages: [16, 90],
    cooldown: 3,
    condition: (ctx) => ctx.player.crime.notoriety >= 25 && !ctx.player.crime.prison,
    text: "An unmarked car has been parked across from your place for three days.",
    effects: [fx.happy(-3)],
  },
]);

export const PRISON_EVENTS = defineEvents("prison", [
  {
    id: "prison-first-day",
    ages: [10, 120],
    where: "prison",
    once: true,
    weight: 10,
    npc: { kind: "new", role: "cellmate", ageOffset: [-5, 15], closeness: [20, 40] },
    title: "Day one",
    text: "Your cellmate, {npc}, looked you up and down. \"What are you in for?\"",
    choices: [
      { label: "Tell the truth", outcomes: [{ text: "You told {npc} the truth. {npc.He} nodded slowly and offered you half a candy bar.", effects: [fx.close(10)] }] },
      { label: "Make it sound worse", outcomes: [{ weight: pass("charisma", 45), text: "{npc} believed every word. Word spread. People keep their distance now.", tone: "good", effects: [fx.custom((ctx) => { const p = ctx.player.crime.prison; if (p) p.respect = clamp(p.respect + 10); })] }, { weight: fail("charisma", 45), text: "{npc} laughed for a full minute. So did everyone {npc.he} told.", tone: "bad", effects: [fx.custom((ctx) => { const p = ctx.player.crime.prison; if (p) p.respect = clamp(p.respect - 10); })] }] },
      { label: "Say nothing", outcomes: [{ text: "You said nothing. {npc} respected that.", effects: [fx.close(4)] }] },
    ],
  },
  {
    id: "prison-shakedown",
    ages: [10, 120],
    where: "prison",
    cooldown: 2,
    title: "Shakedown",
    text: "An inmate demands your commissary money \"for protection.\"",
    choices: [
      { label: "Pay up", outcomes: [{ text: "You paid. You're protected, apparently, from them.", effects: [fx.cash(-200), fx.custom((ctx) => { const p = ctx.player.crime.prison; if (p) p.respect = clamp(p.respect - 5); })] }] },
      { label: "Refuse", outcomes: [{ weight: pass("athleticism", 50), text: "You refused and backed it up. They found someone else.", tone: "good", effects: [fx.custom((ctx) => { const p = ctx.player.crime.prison; if (p) p.respect = clamp(p.respect + 8); })] }, { weight: fail("athleticism", 50), text: "You refused. They jumped you in the shower.", tone: "bad", effects: [fx.health([-20, -8])] }] },
      { label: "Report it to a guard", outcomes: [{ text: "The guard shrugged. Now everyone knows you talk to guards.", tone: "bad", effects: [fx.custom((ctx) => { const p = ctx.player.crime.prison; if (p) p.respect = clamp(p.respect - 15); })] }] },
    ],
  },
  {
    id: "prison-contraband",
    ages: [10, 120],
    where: "prison",
    cooldown: 3,
    title: "A package",
    text: "A guard offers to smuggle in {a phone|cigarettes|real coffee} for a fee.",
    choices: [
      { label: "Take the deal", outcomes: [{ weight: 3, text: "The contraband arrived. You're the most popular person on the block.", effects: [fx.cash(-300), fx.happy(4)] }, { weight: 1, text: "It was a setup. A year was added to your sentence.", tone: "bad", effects: [fx.cash(-300), fx.custom((ctx) => { const p = ctx.player.crime.prison; if (p) p.yearsLeft += 1; })] }] },
      { label: "Decline", outcomes: [{ text: "You declined. Better safe." }] },
    ],
  },
  {
    id: "prison-visit",
    ages: [10, 120],
    where: "prison",
    cooldown: 2,
    npc: { kind: "existing", roles: ["mother", "father", "spouse", "partner", "sibling", "bestFriend", "child"], filter: (n) => n.closeness >= 40 },
    text: "{npc} came to visit you. You talked through the glass for the full half hour.",
    tone: "good",
    effects: [fx.close(4), fx.happy(5)],
  },
  {
    id: "prison-no-visitors",
    ages: [10, 120],
    where: "prison",
    cooldown: 3,
    text: "Nobody came to visit this year. You read the same letter until it fell apart.",
    tone: "bad",
    effects: [fx.happy(-5)],
  },
  {
    id: "prison-ged",
    ages: [16, 120],
    where: "prison",
    once: true,
    condition: (ctx) => !ctx.player.education.degrees.some((d) => d.level === "high"),
    title: "Second chance",
    text: "The prison offers a high school equivalency program.",
    choices: [
      { label: "Enroll", outcomes: [{ weight: pass("smarts", 30), text: "You earned your diploma behind bars. The warden shook your hand.", tone: "good", effects: [fx.custom((ctx) => { ctx.player.education.degrees.push({ level: "high", institution: "Prison GED program", graduatedAtAge: ctx.player.age, honors: false }); }), fx.karma(2)] }, { weight: fail("smarts", 30), text: "You failed the exam. You can try again next year.", effects: [] }] },
      { label: "Not interested", outcomes: [{ text: "You passed. Time moves slower than you'd think." }] },
    ],
  },
  {
    id: "prison-riot-event",
    ages: [10, 120],
    where: "prison",
    cooldown: 5,
    weight: 0.6,
    title: "Riot",
    text: "A riot broke out in your block.",
    choices: [
      { label: "Barricade yourself in", outcomes: [{ text: "You stayed in your cell until it was over. Smart.", effects: [] }] },
      { label: "Join in", outcomes: [{ weight: 1, text: "You joined the riot. Your reputation soared.", effects: [fx.custom((ctx) => { const p = ctx.player.crime.prison; if (p) p.respect = clamp(p.respect + 15); }), fx.health(-5)] }, { weight: 1, text: "A guard's baton found you early. You woke up in solitary.", tone: "bad", effects: [fx.health(-15), fx.custom((ctx) => { const p = ctx.player.crime.prison; if (p) p.yearsLeft += 1; })] }] },
      { label: "Protect a guard", outcomes: [{ text: "You shielded a guard from the mob. The parole board will hear about it.", tone: "good", effects: [fx.karma(6), fx.custom((ctx) => { const p = ctx.player.crime.prison; if (p) p.paroleEligibleAtAge = Math.min(p.paroleEligibleAtAge, ctx.player.age + 1); })] }] },
    ],
  },
  {
    id: "prison-stabbed",
    ages: [10, 120],
    where: "prison",
    once: true,
    weight: 0.3,
    condition: (ctx) => (ctx.player.crime.prison?.respect ?? 50) < 25,
    text: "Someone stabbed you with a sharpened toothbrush in the lunch line.",
    tone: "bad",
    effects: [fx.health([-40, -15]), fx.custom((ctx) => { if (ctx.player.stats.health <= 0) killPlayer(ctx.state, "prisonFight", `You were killed in prison at ${ctx.player.age}.`); })],
  },
]);
