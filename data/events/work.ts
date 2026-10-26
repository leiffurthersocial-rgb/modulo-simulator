import { careerOf } from "@/engine/content";
import { leaveJob, retire } from "@/engine/career";
import { defineEvents, fail, fx, pass, when } from "@/engine/events/helpers";
import type { EventContext } from "@/engine/types";
import { clamp } from "@/engine/util";

const perf = (delta: number) =>
  fx.custom((ctx) => {
    const j = ctx.player.career.job;
    if (j) j.performance = clamp(j.performance + delta);
  });
const fullTime = (ctx: EventContext) => !!ctx.player.career.job && !ctx.player.career.job.partTime;
const category = (...cats: string[]) => (ctx: EventContext) => {
  const job = ctx.player.career.job;
  const def = job && careerOf(ctx.content, job.careerId);
  return !!def && cats.includes(def.category);
};
const careerIs = (...ids: string[]) => (ctx: EventContext) => !!ctx.player.career.job && ids.includes(ctx.player.career.job.careerId);

export const WORK_EVENTS = defineEvents("career", [
  {
    id: "work-first-day",
    ages: [14, 80],
    cooldown: 1,
    condition: (ctx) => !!ctx.player.career.job && ctx.player.career.job.yearsAtCompany === 0,
    weight: 3,
    text: "Your first {day|week} at {job}: you {got lost looking for the bathroom|called your boss by the wrong name|accidentally replied-all to the whole company}.",
    effects: [fx.custom((ctx) => { ctx.vars.job = ctx.player.career.job?.employer ?? "work"; })],
  },
  {
    id: "work-boss-mood",
    ages: [16, 75],
    cooldown: 3,
    condition: fullTime,
    npc: { kind: "existing", roles: ["boss"] },
    title: "Boss",
    text: "Your boss {npc} snapped at you in front of the whole team over a {typo|missed email|stapler incident}.",
    choices: [
      { label: "Take it gracefully", outcomes: [{ text: "You stayed calm. Later, {npc} awkwardly apologized.", tone: "good", effects: [fx.close(8), perf(3)] }] },
      { label: "Snap back", outcomes: [{ weight: 1, text: "You snapped back. The room went silent. {npc} respects you now, weirdly.", effects: [fx.close(4), fx.skill("charisma", 1)] }, { weight: 2, text: "You snapped back. HR scheduled a \"conversation.\"", tone: "bad", effects: [fx.close(-12), perf(-8)] }] },
      { label: "Complain to HR", outcomes: [{ text: "HR listened, nodded, and did nothing.", effects: [fx.close(-5)] }] },
    ],
  },
  {
    id: "work-coworker-credit",
    ages: [18, 70],
    cooldown: 4,
    condition: fullTime,
    npc: { kind: "existing", roles: ["coworker"] },
    title: "Credit thief",
    text: "{npc} presented your idea at the big meeting as {npc.his} own.",
    choices: [
      { label: "Call {npc.him} out on the spot", outcomes: [{ weight: pass("charisma", 50), text: "You calmly explained where the idea came from. Your boss noticed.", tone: "good", effects: [perf(6), fx.close(-15)] }, { weight: fail("charisma", 50), text: "It came out petty. Everyone looked at their shoes.", tone: "bad", effects: [perf(-3), fx.close(-15)] }] },
      { label: "Talk to {npc.him} privately", outcomes: [{ text: "{npc} apologized and credited you in a follow-up email.", tone: "good", effects: [fx.close(5), perf(2)] }] },
      { label: "Let it go", outcomes: [{ text: "You let it go. {npc} got a bonus.", effects: [fx.happy(-4)] }] },
      { label: "Start a rivalry", outcomes: [{ text: "You decided {npc} is now your workplace nemesis.", effects: [fx.custom(({ npc }) => { if (npc) npc.role = "rival"; }), fx.flag("hasRival")] }] },
    ],
  },
  {
    id: "work-office-romance",
    ages: [20, 60],
    once: true,
    condition: when.all(fullTime, when.single),
    npc: { kind: "existing", roles: ["coworker"] },
    title: "Office romance",
    text: "You and {npc} have been flirting at the coffee machine for weeks.",
    choices: [
      { label: "Ask {npc.him} out", outcomes: [{ weight: (ctx) => 0.3 + ctx.player.stats.looks / 200, text: "{npc} said yes. You're keeping it quiet at work. Nobody is fooled.", tone: "good", effects: [fx.custom(({ npc }) => { if (npc) { npc.role = "partner"; npc.closeness = 65; } }), fx.happy(6)] }, { weight: 0.5, text: "{npc} said {npc.he} doesn't date coworkers. The coffee machine is awkward now.", effects: [fx.close(-10), fx.happy(-3)] }] },
      { label: "Keep it professional", outcomes: [{ text: "You kept things professional. Probably wise." }] },
    ],
  },
  {
    id: "work-holiday-party",
    ages: [18, 70],
    cooldown: 3,
    condition: fullTime,
    title: "Office party",
    text: "It's the company holiday party. There's an open bar and a karaoke machine.",
    choices: [
      { label: "Sing karaoke", outcomes: [{ weight: pass("charisma", 40), text: "Your karaoke performance became office legend.", tone: "good", effects: [fx.happy(4), fx.skill("charisma", 2), perf(2)] }, { weight: fail("charisma", 40), text: "Your karaoke performance is now an office meme. Not the good kind.", effects: [fx.happy(-3)] }] },
      { label: "Hit the open bar hard", outcomes: [{ weight: 1, text: "You told the CEO exactly what you think of the new logo. Monday was tense.", tone: "bad", effects: [perf(-10), fx.addiction("alcohol", 3)] }, { weight: 1, text: "You had a great time and remember almost all of it.", effects: [fx.happy(3), fx.addiction("alcohol", 2)] }] },
      { label: "Network", outcomes: [{ text: "You chatted with a senior executive about fly fishing for forty minutes. It paid off.", tone: "good", effects: [perf(5)] }] },
      { label: "Skip it", outcomes: [{ text: "You skipped the party. You heard it was \"a lot.\"" }] },
    ],
  },
  {
    id: "work-burnout",
    ages: [22, 65],
    cooldown: 5,
    condition: when.all(fullTime, (ctx) => ctx.player.stats.happiness < 40),
    title: "Burnout",
    text: "You stared at your inbox for an hour without opening a single email. You're running on empty.",
    choices: [
      { label: "Take a vacation", outcomes: [{ text: "You took two weeks off and didn't check email once. You came back human.", tone: "good", effects: [fx.happy(10), fx.cash(-1500)] }] },
      { label: "Push through", outcomes: [{ text: "You pushed through. Your health took the hit.", tone: "bad", effects: [fx.health(-6), perf(3)] }] },
      { label: "Quit on the spot", outcomes: [{ text: "You stood up, said \"I'm done,\" and walked out. Exhilarating, then terrifying.", effects: [fx.happy(6), fx.custom((ctx) => leaveJob(ctx.state, "quit"))] }] },
    ],
  },
  {
    id: "work-headhunter",
    ages: [24, 60],
    cooldown: 5,
    condition: when.all(fullTime, (ctx) => (ctx.player.career.job?.performance ?? 0) >= 70),
    title: "Headhunter",
    text: "A recruiter from a competitor offered you the same role for {15|20|30} percent more.",
    choices: [
      { label: "Use it to negotiate", outcomes: [{ weight: 2, text: "Your company matched the offer. Loyalty, purchased.", tone: "good", effects: [fx.custom((ctx) => { const j = ctx.player.career.job; if (j) j.salary = Math.round(j.salary * 1.15); })] }, { weight: 1, text: "Your company called your bluff. You stayed, at the same salary, slightly embarrassed.", effects: [fx.happy(-2)] }] },
      { label: "Take the new job", outcomes: [{ text: "You jumped ship for the raise.", tone: "good", effects: [fx.custom((ctx) => { const j = ctx.player.career.job; if (j) { j.salary = Math.round(j.salary * 1.2); j.employer = ctx.rng.pick(["Rival Corp", "Northstar Group", "Helix Partners", "Summit Co."]); j.yearsAtCompany = 0; } })] }] },
      { label: "Decline", outcomes: [{ text: "You declined. You like it where you are." }] },
    ],
  },
  {
    id: "work-retirement-offer",
    ages: [63, 80],
    cooldown: 3,
    condition: fullTime,
    title: "Retirement",
    text: "Your company is offering you a retirement package. Your coworkers are already planning the cake.",
    choices: [
      { label: "Retire", outcomes: [{ text: "You retired with a cake, a card, and a pension.", tone: "major", effects: [fx.custom((ctx) => { retire(ctx.state); ctx.state.flags.retiredAt = ctx.player.age; }), fx.happy(8)] }] },
      { label: "Keep working", outcomes: [{ text: "You're not ready to stop. They cancelled the cake." }] },
    ],
  },
  {
    id: "work-bad-review",
    ages: [16, 70],
    cooldown: 3,
    condition: (ctx) => !!ctx.player.career.job && ctx.player.career.job.performance < 35,
    text: "Your annual review was brutal. The phrase \"performance improvement plan\" was used.",
    tone: "bad",
    effects: [fx.happy(-5)],
  },
  {
    id: "work-employee-of-month",
    ages: [16, 70],
    cooldown: 3,
    condition: (ctx) => !!ctx.player.career.job && ctx.player.career.job.performance >= 80,
    text: "You were named Employee of the {Month|Quarter|Year}. Your photo hangs by the {elevator|break room|restrooms}.",
    tone: "good",
    effects: [fx.happy(4), perf(2)],
  },
  {
    id: "work-commute",
    ages: [18, 70],
    once: true,
    condition: fullTime,
    text: "Your commute is {ninety minutes each way|a crowded train with no air conditioning|a bike ride through a park}. You've made peace with it. Mostly.",
  },
  {
    id: "work-service-customer",
    ages: [14, 70],
    cooldown: 3,
    condition: category("service", "partTime"),
    title: "The customer",
    text: "A customer is screaming at you because {their coupon expired in 2009|the ice is too cold|you won't let them speak to the manager, who is you}.",
    choices: [
      { label: "Stay polite", outcomes: [{ text: "You smiled through it. They left a one-star review anyway.", effects: [fx.karma(1), fx.happy(-2)] }] },
      { label: "Give them something free", outcomes: [{ text: "You comped their order. They left happy. Your manager did not.", effects: [perf(-2), fx.karma(1)] }] },
      { label: "Tell them off", outcomes: [{ weight: 1, text: "You told them off. The line of customers behind them applauded.", tone: "good", effects: [fx.happy(5)] }, { weight: 1, text: "You told them off. They recorded it. You're briefly famous, and briefly unemployed.", tone: "bad", effects: [fx.custom((ctx) => leaveJob(ctx.state, "fired")), fx.fame(1)] }] },
    ],
  },
  {
    id: "work-medical-save",
    ages: [21, 75],
    cooldown: 4,
    condition: category("medical"),
    title: "Code blue",
    text: "A patient's heart stopped in front of you.",
    choices: [
      { label: "Lead the response", outcomes: [{ weight: pass("smarts", 55), text: "You brought them back. Their family hugged you in the hallway.", tone: "good", effects: [fx.happy(8), perf(8), fx.karma(3)] }, { weight: fail("smarts", 55), text: "You did everything right. It wasn't enough. You went home and sat in the car for a long time.", tone: "bad", effects: [fx.happy(-8)] }] },
      { label: "Call for a senior colleague", outcomes: [{ text: "The senior doctor took over and saved the patient. You learned a lot.", effects: [fx.smarts(2)] }] },
    ],
  },
  {
    id: "work-medical-malpractice",
    ages: [25, 75],
    once: true,
    condition: careerIs("doctor", "surgeon", "dentist"),
    weight: 0.5,
    title: "Lawsuit",
    text: "A former patient is suing you for malpractice over a {routine procedure|missed diagnosis|misplaced instrument}.",
    choices: [
      { label: "Fight it in court", outcomes: [{ weight: pass("smarts", 50), text: "The case was dismissed. Your record is clean.", tone: "good", effects: [fx.cash(-15000)] }, { weight: fail("smarts", 50), text: "You lost. Your insurance covered most of it, your reputation not so much.", tone: "bad", effects: [fx.cash(-60000), perf(-15), fx.happy(-8)] }] },
      { label: "Settle quietly", outcomes: [{ text: "You settled out of court for {money:80000}.", effects: [fx.cash(-80000), fx.happy(-4)] }] },
    ],
  },
  {
    id: "work-police-chase",
    ages: [18, 65],
    cooldown: 3,
    condition: careerIs("police", "federal-agent"),
    title: "Pursuit",
    text: "A suspect bolted from a traffic stop on foot.",
    choices: [
      { label: "Chase {him|her} down", outcomes: [{ weight: pass("athleticism", 50), text: "You tackled the suspect after six blocks. They had a stolen car's keys in their pocket.", tone: "good", effects: [perf(8), fx.skill("athleticism", 1)] }, { weight: fail("athleticism", 50), text: "You twisted your ankle on a curb. The suspect got away.", tone: "bad", effects: [fx.health(-5), perf(-3)] }] },
      { label: "Call it in", outcomes: [{ text: "You called it in. A K-9 unit found the suspect hiding in a dumpster.", effects: [perf(2)] }] },
    ],
  },
  {
    id: "work-police-bribe",
    ages: [18, 65],
    once: true,
    condition: careerIs("police"),
    title: "An envelope",
    text: "A local businessman slides an envelope with {money:5000} across the table and asks you to lose a report.",
    choices: [
      { label: "Take it", outcomes: [{ weight: 2, text: "You took the money. The report disappeared.", effects: [fx.cash(5000), fx.karma(-8), fx.flag("dirtyCop")] }, { weight: 1, text: "It was an internal affairs sting. You were fired on the spot.", tone: "bad", effects: [fx.karma(-8), fx.custom((ctx) => leaveJob(ctx.state, "fired"))] }] },
      { label: "Arrest him for bribery", outcomes: [{ text: "You arrested him on the spot. Your captain was impressed.", tone: "good", effects: [perf(10), fx.karma(4)] }] },
    ],
  },
  {
    id: "work-military-deployment",
    ages: [18, 55],
    cooldown: 3,
    condition: category("military"),
    title: "Deployment",
    text: "Your unit is being deployed overseas for {nine|twelve} months.",
    choices: [
      { label: "Volunteer for the front line", outcomes: [{ weight: 3, text: "You served with distinction and came home with a medal.", tone: "good", effects: [perf(12), fx.achieve("decorated-veteran"), fx.happy(4)] }, { weight: 1, text: "You were wounded in an ambush. You came home with a Purple Heart and a limp.", tone: "bad", effects: [fx.health(-25), fx.happy(-8), fx.flag("woundedVeteran")] }] },
      { label: "Request a support role", outcomes: [{ text: "You served in logistics. Unglamorous, essential, and you came home safe.", effects: [perf(3)] }] },
    ],
  },
  {
    id: "work-military-ptsd",
    ages: [20, 70],
    once: true,
    condition: (ctx) => ctx.player.career.history.some((h) => h.careerId === "military") || careerIs("military")(ctx),
    weight: 0.6,
    title: "Nightmares",
    text: "Loud noises have been sending you right back to the deployment.",
    choices: [
      { label: "See a counselor", outcomes: [{ text: "You started seeing a counselor at the veterans' center. It's slowly getting better.", tone: "good", effects: [fx.happy(6)] }] },
      { label: "Keep it to yourself", outcomes: [{ text: "You kept it to yourself and started drinking more.", tone: "bad", effects: [fx.happy(-6), fx.addiction("alcohol", 8)] }] },
    ],
  },
  {
    id: "work-teacher-student",
    ages: [21, 70],
    cooldown: 3,
    condition: careerIs("teacher", "professor"),
    title: "That student",
    text: "One of your students has been {acting out every day|asleep every day|turning in brilliant work and then skipping class}.",
    choices: [
      { label: "Stay after class to talk", outcomes: [{ weight: 3, text: "Turns out things are hard at home. You helped. Years later you get a thank-you letter.", tone: "good", effects: [fx.karma(4), fx.happy(4), perf(4)] }, { weight: 1, text: "They told you to mind your own business. Fair enough.", effects: [] }] },
      { label: "Send them to the principal", outcomes: [{ text: "You sent them to the principal. Problem solved, for a week.", effects: [] }] },
    ],
  },
  {
    id: "work-tech-outage",
    ages: [20, 65],
    cooldown: 3,
    condition: category("tech"),
    title: "Production is down",
    text: "It's 2 a.m. and the whole site is down. Your phone will not stop buzzing.",
    choices: [
      { label: "Fix it yourself", outcomes: [{ weight: pass("smarts", 55), text: "You found the bug, a missing semicolon, and saved the day.", tone: "good", effects: [perf(10), fx.health(-1)] }, { weight: fail("smarts", 55), text: "Your fix made it worse. Much worse. The postmortem has your name in it.", tone: "bad", effects: [perf(-10)] }] },
      { label: "Wake up a senior engineer", outcomes: [{ text: "You woke up a senior engineer. They fixed it in four minutes and sighed loudly.", effects: [perf(-1), fx.smarts(1)] }] },
      { label: "Mute your phone", outcomes: [{ text: "You muted your phone and went back to sleep. Bold. Your manager disagreed.", tone: "bad", effects: [perf(-15)] }] },
    ],
  },
  {
    id: "work-startup-equity",
    ages: [22, 55],
    once: true,
    condition: category("tech"),
    title: "Startup offer",
    text: "A tiny startup wants you as employee number {four|seven|nine}. The salary is lower, but there's equity.",
    choices: [
      { label: "Take the gamble", outcomes: [{ weight: 1, text: "The startup was acquired three years later. Your equity was worth {money:900000}.", tone: "major", effects: [fx.cash(900000), fx.achieve("startup-jackpot")] }, { weight: 4, text: "The startup ran out of money and folded. Your equity is a nice story.", tone: "bad", effects: [fx.happy(-4), fx.custom((ctx) => leaveJob(ctx.state, "laidOff"))] }] },
      { label: "Stay put", outcomes: [{ text: "You stayed at your stable job. Sensible." }] },
    ],
  },
  {
    id: "work-trades-injury",
    ages: [18, 65],
    once: true,
    condition: category("trades"),
    text: "You {fell off a ladder|caught your hand in a saw|got a nasty shock from a live wire} on a job site.",
    tone: "bad",
    effects: [fx.health([-15, -6]), fx.happy(-3)],
  },
  {
    id: "work-trades-big-contract",
    ages: [22, 65],
    once: true,
    condition: when.all(category("trades"), (ctx) => (ctx.player.career.job?.rank ?? 0) >= 2),
    text: "You landed a huge contract to redo every {bathroom|wiring system|roof} in a new apartment complex.",
    tone: "good",
    effects: [fx.cash(25000), perf(6)],
  },
  {
    id: "work-audition",
    ages: [10, 70],
    cooldown: 2,
    condition: category("entertainment"),
    title: "Big break",
    text: "You got a callback for {a prestige TV drama|a blockbuster sequel|a national commercial|a Broadway revival}.",
    choices: [
      { label: "Give it everything", outcomes: [{ weight: pass("charisma", 60), text: "You booked it. Your agent screamed into the phone.", tone: "major", effects: [perf(15), fx.fame(6), fx.happy(8)] }, { weight: fail("charisma", 60), text: "You were great. They went with someone \"taller.\"", effects: [fx.happy(-4)] }] },
      { label: "Play it cool", outcomes: [{ weight: pass("looks", 65), text: "Your effortless vibe won them over. You booked it.", tone: "major", effects: [perf(12), fx.fame(5)] }, { weight: fail("looks", 65), text: "Too cool. They forgot you were in the room.", effects: [fx.happy(-2)] }] },
    ],
  },
  {
    id: "work-athlete-injury",
    ages: [17, 40],
    once: true,
    condition: careerIs("athlete"),
    title: "Injury",
    text: "You felt something pop in your knee during a game.",
    choices: [
      { label: "Get surgery and rehab properly", outcomes: [{ text: "You missed the season but came back stronger.", effects: [fx.health(-5), perf(-10)] }] },
      { label: "Play through the pain", outcomes: [{ weight: 1, text: "You played through it and won the championship. Your knee will never forgive you.", tone: "good", effects: [fx.fame(8), fx.health(-15), fx.achieve("champion")] }, { weight: 2, text: "You made it much worse. Your career may be over.", tone: "bad", effects: [fx.health(-20), perf(-30)] }] },
    ],
  },
  {
    id: "work-athlete-championship",
    ages: [18, 40],
    cooldown: 3,
    condition: when.all(careerIs("athlete"), (ctx) => (ctx.player.career.job?.rank ?? 0) >= 1),
    text: "Your team won the championship. You were on the cover of every sports page.",
    tone: "major",
    effects: [fx.fame(10), fx.happy(10), fx.achieve("champion"), fx.cash(250000)],
  },
  {
    id: "work-whistleblower",
    ages: [22, 65],
    once: true,
    condition: category("corporate", "finance"),
    title: "Something's off",
    text: "You found evidence that your company has been {cooking the books|dumping chemicals in a river|lying to investors}.",
    choices: [
      { label: "Blow the whistle", outcomes: [{ weight: 2, text: "You went to the regulators. The company was fined billions, and you became a minor hero.", tone: "major", effects: [fx.karma(10), fx.fame(5), fx.custom((ctx) => leaveJob(ctx.state, "quit")), fx.achieve("whistleblower")] }, { weight: 1, text: "You went to the regulators. Nothing happened, except you got fired.", tone: "bad", effects: [fx.karma(8), fx.custom((ctx) => leaveJob(ctx.state, "fired"))] }] },
      { label: "Ask for hush money", outcomes: [{ text: "Your bonus this year was mysteriously generous.", effects: [fx.cash(50000), fx.karma(-10)] }] },
      { label: "Look the other way", outcomes: [{ text: "You closed the spreadsheet and never opened it again.", effects: [fx.karma(-4)] }] },
    ],
  },
  {
    id: "work-unemployed-blues",
    ages: [22, 60],
    cooldown: 3,
    condition: (ctx) => !ctx.player.career.job && !ctx.player.education.enrolled && !ctx.player.career.retired && !ctx.player.business && ctx.player.age >= 22,
    text: "Another month without a job. You've started rating daytime TV shows.",
    tone: "bad",
    effects: [fx.happy(-3)],
  },
]);
