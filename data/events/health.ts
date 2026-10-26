import { CONDITION_BY_ID } from "@/data/conditions";
import { addCondition } from "@/engine/health";
import { defineEvents, fail, fx, pass, when } from "@/engine/events/helpers";
import { killPlayer } from "@/engine/lifecycle/death";

const giveCondition = (id: string) =>
  fx.custom((ctx) => {
    const def = CONDITION_BY_ID[id];
    if (def) addCondition(ctx.state, ctx.rng, def);
  });

export const HEALTH_EVENTS = defineEvents("health", [
  {
    id: "health-overdose",
    ages: [12, 120],
    triggeredOnly: true,
    title: "Overdose",
    text: "Your heart is racing. Your vision is narrowing. Something is very wrong.",
    choices: [
      { label: "Call for help", outcomes: [{ weight: 3, text: "Paramedics got to you just in time. You woke up in the ICU.", tone: "bad", effects: [fx.health(-25), fx.cash(-5000), fx.flag("overdoseSurvivor")] }, { weight: 1, text: "Help came too late.", effects: [fx.custom((ctx) => killPlayer(ctx.state, "overdose", `You died of an overdose at ${ctx.player.age}.`))] }] },
      { label: "Ride it out", outcomes: [{ weight: 1, text: "You rode it out on the bathroom floor. You survived, somehow.", tone: "bad", effects: [fx.health(-30)] }, { weight: 2, text: "You didn't wake up.", effects: [fx.custom((ctx) => killPlayer(ctx.state, "overdose", `You died of an overdose at ${ctx.player.age}.`))] }] },
    ],
  },
  {
    id: "health-allergic",
    ages: [3, 80],
    once: true,
    text: "You discovered you're allergic to {shellfish|peanuts|cats|bee stings} the hard way.",
    tone: "bad",
    effects: [fx.health(-5)],
  },
  {
    id: "health-car-accident",
    ages: [16, 95],
    once: true,
    weight: 0.4,
    condition: (ctx) => ctx.player.assets.some((a) => a.kind === "car") || ctx.state.flags.license === true,
    title: "Crash",
    text: "A car ran a red light and slammed into you.",
    choices: [
      { label: "Get checked at the ER", outcomes: [{ text: "You had whiplash and a broken wrist. It could have been much worse.", tone: "bad", effects: [fx.health(-12), fx.cash(-1500), giveCondition("broken-bone")] }] },
      { label: "Walk it off", outcomes: [{ weight: 2, text: "You walked it off. You were fine. Probably.", effects: [fx.health(-6)] }, { weight: 1, text: "Days later you collapsed with internal bleeding.", tone: "bad", effects: [fx.health(-30), fx.cash(-8000)] }] },
    ],
  },
  {
    id: "health-food-poisoning",
    ages: [5, 100],
    cooldown: 6,
    text: "You got food poisoning from {gas station sushi|a questionable taco truck|your own leftovers}. You lost three days and your dignity.",
    tone: "bad",
    effects: [fx.health(-3), fx.happy(-2)],
  },
  {
    id: "health-sports-injury",
    ages: [14, 70],
    once: true,
    condition: when.statAtLeast("athleticism", 50),
    text: "You tore your ACL {playing pickup basketball|skiing|chasing a bus}. Six months of physical therapy followed.",
    tone: "bad",
    effects: [fx.health(-10), fx.skill("athleticism", -5)],
  },
  {
    id: "health-pregnancy-complication",
    ages: [15, 50],
    once: true,
    weight: 0.4,
    condition: (ctx) => ctx.player.pregnancy?.carriedByPlayer === true,
    title: "Complications",
    text: "Your doctor is worried about your pregnancy and wants you on bed rest.",
    choices: [
      { label: "Follow orders", outcomes: [{ text: "You stayed in bed for months. Everything turned out fine.", effects: [fx.happy(-3)] }] },
      { label: "Keep working", outcomes: [{ weight: 3, text: "You kept working. It was hard, but you made it.", effects: [fx.health(-6)] }, { weight: 1, text: "You ended up in the hospital for weeks.", tone: "bad", effects: [fx.health(-20), fx.cash(-6000)] }] },
    ],
  },
  {
    id: "health-midlife-checkup",
    ages: [40, 55],
    once: true,
    title: "The checkup",
    text: "Your doctor looked at your bloodwork and said \"hmm\" in a way you didn't love.",
    choices: [
      { label: "Overhaul your lifestyle", outcomes: [{ text: "You started walking every day and cut out sugar. Your next results were great.", tone: "good", effects: [fx.health(8), fx.flag("fit", 0), fx.custom((ctx) => { ctx.state.flags.fit = ctx.player.age; })] }] },
      { label: "Ignore it", outcomes: [{ text: "You ignored it. You'll deal with it later.", effects: [fx.health(-4), giveCondition("hypertension")] }] },
    ],
  },
  {
    id: "health-elder-fall",
    ages: [70, 120],
    cooldown: 4,
    text: "You slipped {in the bathroom|on the front steps|reaching for a high shelf} and broke your hip.",
    tone: "bad",
    effects: [fx.health([-18, -8]), giveCondition("broken-bone")],
  },
  {
    id: "health-nursing-home",
    ages: [75, 120],
    once: true,
    condition: (ctx) => ctx.player.stats.health < 45,
    title: "Care",
    text: "Your doctor says you can't safely live alone anymore.",
    choices: [
      { label: "Move into a nursing home", outcomes: [{ text: "You moved into {Sunny Pines|Golden Oaks|Willow Creek}. The bingo is competitive and the gossip is elite.", effects: [fx.flag("nursingHome"), fx.cash(-20000), fx.happy(-3), fx.health(5)] }] },
      { label: "Move in with family", condition: when.hasLiving("child"), outcomes: [{ text: "You moved in with your kid's family. The grandkids teach you phone things.", tone: "good", effects: [fx.close(8, "child"), fx.happy(4)] }] },
      { label: "Stay home, stubbornly", outcomes: [{ text: "You stayed home. You will die in this house, thank you very much.", effects: [fx.health(-4)] }] },
    ],
  },
  {
    id: "health-nursing-home-life",
    ages: [75, 120],
    cooldown: 3,
    condition: when.flag("nursingHome"),
    text: "At the nursing home, you {won the bingo tournament|started a feud over the TV remote|taught a watercolor class|flirted shamelessly with a retired pilot}.",
    effects: [fx.happy(3)],
  },
  {
    id: "health-senior-moment",
    ages: [68, 120],
    cooldown: 4,
    text: "You {put your keys in the fridge|called your grandchild by the dog's name|drove to the store and walked home}. Classic.",
    effects: [fx.smarts(-1)],
  },
  {
    id: "health-centenarian",
    ages: [100, 100],
    once: true,
    text: "You turned 100. The mayor sent a card. You told a reporter the secret is \"spite.\"",
    tone: "major",
    effects: [fx.achieve("centenarian"), fx.fame(2), fx.happy(10)],
  },
  {
    id: "health-smoker-cough",
    ages: [30, 100],
    cooldown: 6,
    condition: (ctx) => (ctx.player.health.addictions.smoking ?? 0) > 30,
    title: "That cough",
    text: "Your smoker's cough is getting worse. Your doctor gave you the look.",
    choices: [
      { label: "Quit for real", outcomes: [{ weight: pass("happiness", 50), text: "You quit for real this time. You can taste food again.", tone: "good", effects: [fx.custom((ctx) => { ctx.player.health.addictions.smoking = 0; })] }, { weight: fail("happiness", 50), text: "You lasted a week.", effects: [] }] },
      { label: "Switch to vaping", outcomes: [{ text: "You switched to vaping. Your doctor sighed.", effects: [fx.custom((ctx) => { ctx.player.health.addictions.smoking = Math.max(0, (ctx.player.health.addictions.smoking ?? 0) - 15); })] }] },
      { label: "Light another", outcomes: [{ text: "You lit another one on the way out of the clinic.", tone: "bad", effects: [fx.health(-3)] }] },
    ],
  },
  {
    id: "health-drinking-intervention",
    ages: [18, 100],
    once: true,
    condition: (ctx) => (ctx.player.health.addictions.alcohol ?? 0) > 45,
    npc: { kind: "existing", roles: ["mother", "father", "spouse", "partner", "sibling", "bestFriend", "child"] },
    title: "Intervention",
    text: "You walked into your living room to find {npc} and a circle of chairs. It's an intervention.",
    choices: [
      { label: "Agree to rehab", outcomes: [{ weight: 2, text: "You went to rehab. You've been sober since.", tone: "good", effects: [fx.custom((ctx) => { ctx.player.health.addictions.alcohol = 0; }), fx.close(15), fx.cash(-8000), fx.flag("rehabSuccess")] }, { weight: 1, text: "You went to rehab and relapsed within months.", effects: [fx.cash(-8000), fx.close(5)] }] },
      { label: "Storm out", outcomes: [{ text: "You stormed out. {npc} cried in the driveway.", tone: "bad", effects: [fx.close(-20)] }] },
    ],
  },
  {
    id: "health-gambling-debt",
    ages: [18, 100],
    cooldown: 4,
    condition: (ctx) => (ctx.player.health.addictions.gambling ?? 0) > 40,
    text: "You owe a bookie {money:5000}. He's been calling. Then he stopped calling and started visiting.",
    tone: "bad",
    effects: [fx.cash(-5000), fx.happy(-6)],
  },
  {
    id: "health-blood-donation",
    ages: [17, 70],
    once: true,
    title: "Blood drive",
    text: "There's a blood drive at {work|school|the community center}.",
    choices: [
      { label: "Donate", outcomes: [{ text: "You donated blood and got a cookie. Good trade.", tone: "good", effects: [fx.karma(3)] }] },
      { label: "Faint at the sight of the needle", outcomes: [{ text: "You fainted before they even started. They gave you two cookies.", effects: [fx.happy(1)] }] },
    ],
  },
  {
    id: "health-marathon",
    ages: [18, 70],
    once: true,
    condition: (ctx) => ctx.player.skills.athleticism >= 55 && ctx.player.stats.health >= 60,
    title: "Marathon",
    text: "You signed up for a marathon on a dare.",
    choices: [
      { label: "Train properly", outcomes: [{ weight: pass("athleticism", 55), text: "You finished the marathon in under four hours. You cried at the finish line.", tone: "good", effects: [fx.achieve("marathoner"), fx.health(4), fx.happy(8)] }, { weight: fail("athleticism", 55), text: "You hit the wall at mile 20 and walked the rest. You still finished.", effects: [fx.achieve("marathoner"), fx.happy(3)] }] },
      { label: "Wing it", outcomes: [{ text: "You winged it and were carried off the course at mile 14.", tone: "bad", effects: [fx.health(-6)] }] },
    ],
  },
  {
    id: "health-mental-day",
    ages: [16, 90],
    cooldown: 5,
    condition: when.statBelow("happiness", 30),
    title: "Dark days",
    text: "You haven't wanted to get out of bed in weeks.",
    choices: [
      { label: "See a doctor", outcomes: [{ text: "Your doctor diagnosed depression and started you on treatment. Some days are better now.", tone: "good", effects: [giveCondition("depression"), fx.custom((ctx) => { const c = ctx.player.health.conditions.find((x) => x.id === "depression"); if (c) c.severity = 20; }), fx.happy(8)] }] },
      { label: "Call a friend", condition: when.hasLiving("friend", "bestFriend"), outcomes: [{ text: "You called a friend. They came over with soup and stayed all evening.", tone: "good", effects: [fx.happy(6)] }] },
      { label: "Push through alone", outcomes: [{ text: "You pushed through alone. It took a long time.", tone: "bad", effects: [fx.happy(-3), giveCondition("depression")] }] },
    ],
  },
]);
