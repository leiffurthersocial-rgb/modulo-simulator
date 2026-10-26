import { defineEvents, fail, fx, pass, when } from "@/engine/events/helpers";
import { clamp } from "@/engine/util";

const grade = (delta: number) =>
  fx.custom((ctx) => {
    const e = ctx.player.education.enrolled;
    if (e) e.performance = clamp(e.performance + delta);
  });

const inCollege = when.inSchool("college", "trade", "grad", "medical", "law", "phd");
const undergrad = when.inSchool("college");

export const COLLEGE_EVENTS = defineEvents("college", [
  {
    id: "college-roommate",
    ages: [17, 30],
    condition: (ctx) => ctx.player.education.enrolled?.level === "college" && ctx.player.education.enrolled.year === 1,
    once: true,
    weight: 6,
    npc: { kind: "new", role: "collegeRoommate", ageOffset: [0, 1], closeness: [35, 55] },
    title: "Roommate",
    text: "You moved into the dorms. Your roommate, {npc}, has already claimed the better bed and covered the wall in {band posters|motivational quotes|a flag of a country {npc.he} has never visited}.",
    choices: [
      {
        label: "Hit it off",
        outcomes: [
          { weight: pass("charisma", 30), text: "You and {npc} stayed up until 4 a.m. talking. Instant friends.", tone: "good", effects: [fx.close([25, 35]), fx.happy(5)] },
          { weight: fail("charisma", 30), text: "You tried to bond with {npc}. {npc.He} put headphones on.", effects: [fx.close(-5)] },
        ],
      },
      {
        label: "Set ground rules",
        outcomes: [{ text: "You and {npc} drafted a roommate agreement. It was ignored within a week, but it was a nice document.", effects: [fx.close(5)] }],
      },
      {
        label: "Request a room change",
        outcomes: [{ text: "You asked for a new room. The housing office laughed politely.", effects: [fx.close(-15), fx.happy(-2)] }],
      },
    ],
  },
  {
    id: "college-roommate-quirk",
    ages: [17, 30],
    cooldown: 3,
    condition: undergrad,
    npc: { kind: "existing", roles: ["collegeRoommate"] },
    text: "Your roommate {npc} {started a sourdough culture on the windowsill|adopted a hamster against dorm rules|learned the bagpipes|has a new partner who basically lives with you now}.",
    choices: [
      { label: "Roll with it", outcomes: [{ text: "You rolled with it. It became a running joke between you.", effects: [fx.close(6), fx.happy(1)] }] },
      { label: "Complain", outcomes: [{ text: "You complained. {npc} sulked for a week.", effects: [fx.close(-8)] }] },
    ],
  },
  {
    id: "college-frat-party",
    ages: [18, 24],
    cooldown: 2,
    condition: undergrad,
    title: "Party",
    text: "There's a huge party at {the Kappa house|an off-campus mansion|the rugby team's house} this weekend.",
    choices: [
      {
        label: "Go all out",
        outcomes: [
          { weight: 3, text: "You did a keg stand, made {four|six|a dozen} new friends, and lost a shoe.", effects: [fx.happy(5), fx.addiction("alcohol", [3, 6]), grade(-3)] },
          { weight: 1, text: "You woke up on a lawn two miles away with no memory of how.", tone: "bad", effects: [fx.health(-3), fx.addiction("alcohol", [4, 8])] },
        ],
      },
      { label: "Go for an hour", outcomes: [{ text: "You stopped by, said hi, and left before things got weird.", effects: [fx.happy(2)] }] },
      { label: "Study instead", outcomes: [{ text: "You studied instead. Your grades thanked you. Your social life did not.", effects: [grade(4)] }] },
    ],
  },
  {
    id: "college-all-nighter",
    ages: [17, 30],
    cooldown: 2,
    condition: inCollege,
    title: "Deadline",
    text: "You have a {15-page paper|final project|take-home exam} due at 9 a.m. You haven't started.",
    choices: [
      {
        label: "Pull an all-nighter",
        outcomes: [
          { weight: pass("smarts", 45), text: "You finished at 8:57 a.m. and got a B+. The adrenaline was incredible.", tone: "good", effects: [grade(2), fx.health(-1)] },
          { weight: fail("smarts", 45), text: "You fell asleep on your keyboard at 4 a.m. The paper was mostly the letter J.", tone: "bad", effects: [grade(-6)] },
        ],
      },
      {
        label: "Ask for an extension",
        outcomes: [
          { weight: pass("charisma", 50), text: "Your professor gave you an extension. You still waited until the night before.", effects: [] },
          { weight: fail("charisma", 50), text: "Your professor said no and looked disappointed in you specifically.", tone: "bad", effects: [grade(-4)] },
        ],
      },
      {
        label: "Pay someone to write it",
        outcomes: [
          { weight: 2, text: "You paid {money:150} to an essay mill. You got an A-. You feel weird about it.", effects: [fx.cash(-150), grade(3), fx.karma(-3)] },
          { weight: 1, text: "Your professor ran it through plagiarism software. Academic probation.", tone: "bad", effects: [fx.cash(-150), grade(-15), fx.karma(-3), fx.flag("academicProbation")] },
        ],
      },
    ],
  },
  {
    id: "college-professor-mentor",
    ages: [18, 30],
    once: true,
    condition: inCollege,
    npc: { kind: "new", role: "teacher", age: [38, 68], closeness: [40, 60] },
    text: "Professor {npc.full} took an interest in your work and invited you to join {npc.his} research.",
    choices: [
      {
        label: "Accept",
        outcomes: [{ text: "You spent long nights in {npc}'s lab. You learned more there than in any class.", tone: "good", effects: [fx.smarts(4), grade(5), fx.close(15), fx.flag("researchAssistant")] }],
      },
      { label: "Politely decline", outcomes: [{ text: "You declined. {npc} nodded, slightly hurt.", effects: [fx.close(-10)] }] },
    ],
  },
  {
    id: "college-change-major",
    ages: [18, 22],
    once: true,
    condition: (ctx) => ctx.player.education.enrolled?.level === "college" && ctx.player.education.enrolled.year <= 2,
    title: "Second thoughts",
    text: "You're starting to think {major} isn't for you.",
    effects: [fx.custom((ctx) => { ctx.vars.major = ctx.player.education.enrolled?.major ?? "your major"; })],
    choices: [
      { label: "Stick with it", outcomes: [{ text: "You stuck with it. It grew on you, like a fungus." }] },
      {
        label: "Switch to something you love",
        outcomes: [
          {
            text: "You switched majors. You lost a year of credits but found your people.",
            effects: [
              fx.happy(6),
              fx.custom((ctx) => {
                const e = ctx.player.education.enrolled;
                if (e) {
                  e.major = ctx.rng.pick(["Fine Arts", "Philosophy", "Music", "Film Studies", "English Literature", "History"]);
                  e.length += 1;
                }
              }),
            ],
          },
        ],
      },
    ],
  },
  {
    id: "college-study-abroad",
    ages: [19, 23],
    once: true,
    condition: undergrad,
    title: "Study abroad",
    text: "You could spend a semester studying in {Barcelona|Tokyo|Melbourne|Prague|Buenos Aires}.",
    choices: [
      {
        label: "Go",
        outcomes: [{ text: "You spent a semester abroad and came back with a new perspective and a slight accent you can't explain.", tone: "good", effects: [fx.happy(8), fx.skill("charisma", 3), fx.smarts(2), fx.flag("studiedAbroad")] }],
      },
      { label: "Stay", outcomes: [{ text: "You stayed on campus. Your friends' photos were unbearable." }] },
    ],
  },
  {
    id: "college-internship",
    ages: [19, 24],
    once: true,
    condition: undergrad,
    title: "Internship",
    text: "You landed an interview for a summer internship at {a big tech company|a bank downtown|a newspaper|a film studio|a hospital}.",
    choices: [
      {
        label: "Nail the interview",
        outcomes: [
          { weight: pass("charisma", 45), text: "You got the internship. Free snacks and a reference letter.", tone: "good", effects: [fx.flag("internship"), fx.cash(4000), fx.skill("charisma", 2)] },
          { weight: fail("charisma", 45), text: "You panicked and described your greatest weakness as \"breathing.\" No offer.", tone: "bad", effects: [fx.happy(-3)] },
        ],
      },
      { label: "Take a summer off", outcomes: [{ text: "You spent the summer at home. You recharged, allegedly." }] },
    ],
  },
  {
    id: "college-protest",
    ages: [18, 26],
    once: true,
    condition: inCollege,
    title: "Protest",
    text: "Students are occupying the admin building to protest {tuition hikes|the university's investments|a beloved professor's firing}.",
    choices: [
      {
        label: "Join the occupation",
        outcomes: [
          { weight: 2, text: "You slept on the floor of the dean's office for three days. The university gave in.", tone: "good", effects: [fx.karma(3), fx.skill("charisma", 2), fx.flag("activist")] },
          { weight: 1, text: "Campus police dragged everyone out. You got a disciplinary note.", tone: "bad", effects: [fx.karma(2), grade(-3), fx.flag("activist")] },
        ],
      },
      { label: "Bring them snacks", outcomes: [{ text: "You brought the protesters pizza. Low risk, high appreciation.", effects: [fx.karma(1)] }] },
      { label: "Walk past", outcomes: [{ text: "You walked past on the way to class." }] },
    ],
  },
  {
    id: "college-ramen",
    ages: [18, 26],
    cooldown: 3,
    condition: when.all(inCollege, when.poorerThan(500)),
    text: "You lived on instant ramen for a month. Your sodium levels are a public concern.",
    effects: [fx.health(-2), fx.happy(-1)],
  },
  {
    id: "college-sick-semester",
    ages: [18, 30],
    once: true,
    condition: inCollege,
    text: "You got mono and missed half a semester.",
    tone: "bad",
    effects: [fx.health(-6), grade(-8)],
  },
  {
    id: "college-dean-list",
    ages: [18, 30],
    cooldown: 2,
    condition: (ctx) => (ctx.player.education.enrolled?.performance ?? 0) >= 88 && !["elementary", "middle", "high"].includes(ctx.player.education.enrolled?.level ?? "elementary"),
    text: "You made the dean's list.",
    tone: "good",
    effects: [fx.happy(4)],
  },
  {
    id: "college-probation",
    ages: [18, 30],
    cooldown: 2,
    condition: (ctx) => (ctx.player.education.enrolled?.performance ?? 100) < 30 && !["elementary", "middle", "high"].includes(ctx.player.education.enrolled?.level ?? "elementary"),
    title: "Academic probation",
    text: "The registrar warned you that your grades put you on academic probation.",
    choices: [
      { label: "Get a tutor", outcomes: [{ text: "You got a tutor and dragged your grades back up.", tone: "good", effects: [grade(12), fx.cash(-400)] }] },
      { label: "Promise to try harder", outcomes: [{ text: "You promised to try harder. You meant it, mostly.", effects: [grade(5)] }] },
      { label: "Ignore it", outcomes: [{ text: "You ignored it. Bold.", effects: [grade(-3)] }] },
    ],
  },
  {
    id: "college-med-school-cadaver",
    ages: [21, 40],
    once: true,
    condition: when.inSchool("medical"),
    text: "In anatomy lab you met your first cadaver. Your lab group named him {Gerald|Steve|Mr. Bones}. You fainted, briefly.",
    effects: [fx.smarts(2)],
  },
  {
    id: "college-med-residency-stress",
    ages: [22, 40],
    cooldown: 2,
    condition: when.inSchool("medical"),
    text: "You worked a 30-hour shift during your clinical rotation. You fell asleep standing in an elevator.",
    tone: "bad",
    effects: [fx.health(-3), fx.happy(-3)],
  },
  {
    id: "college-law-moot-court",
    ages: [21, 40],
    once: true,
    condition: when.inSchool("law"),
    title: "Moot court",
    text: "You're in the final round of the moot court competition.",
    choices: [
      {
        label: "Argue precedent",
        outcomes: [
          { weight: pass("smarts", 60), text: "You won moot court. The judges called your argument \"airtight.\"", tone: "good", effects: [fx.skill("charisma", 3), fx.flag("mootCourtWinner")] },
          { weight: fail("smarts", 60), text: "Opposing counsel shredded your precedent. Close, though.", effects: [fx.happy(-2)] },
        ],
      },
      {
        label: "Appeal to emotion",
        outcomes: [
          { weight: pass("charisma", 60), text: "Your closing moved a judge to tears. You won.", tone: "good", effects: [fx.skill("charisma", 3), fx.flag("mootCourtWinner")] },
          { weight: fail("charisma", 60), text: "The judges reminded you this was a tax law case.", effects: [fx.happy(-2)] },
        ],
      },
    ],
  },
  {
    id: "college-phd-imposter",
    ages: [22, 45],
    cooldown: 3,
    condition: when.inSchool("phd"),
    text: "Your experiment failed for the {fourth|ninth|twentieth} time. Your advisor asked if you'd \"considered industry.\"",
    tone: "bad",
    effects: [fx.happy(-4)],
  },
  {
    id: "college-phd-breakthrough",
    ages: [23, 45],
    once: true,
    condition: when.all(when.inSchool("phd"), when.statAtLeast("smarts", 70)),
    text: "Your dissertation research produced a genuine breakthrough. A journal accepted your paper.",
    tone: "major",
    effects: [fx.happy(8), fx.smarts(3), fx.achieve("published")],
  },
  {
    id: "college-trade-apprentice",
    ages: [17, 40],
    once: true,
    condition: when.inSchool("trade"),
    npc: { kind: "new", role: "coworker", age: [40, 62], closeness: [40, 60] },
    text: "You started your apprenticeship under {npc.full}, a gruff veteran who said exactly four words to you on day one.",
    effects: [fx.skill("streetSmarts", 1)],
  },
  {
    id: "college-athlete",
    ages: [18, 22],
    once: true,
    condition: when.all(undergrad, when.flag("scouted")),
    text: "You played for the university team. The crowd chanted your name at the homecoming game.",
    tone: "good",
    effects: [fx.happy(6), fx.fame(3), fx.skill("athleticism", 3)],
  },
  {
    id: "college-graduation-party",
    ages: [20, 30],
    once: true,
    condition: (ctx) => ctx.player.education.degrees.some((d) => d.level === "college" && d.graduatedAtAge === ctx.player.age),
    text: "Your family came to your college graduation. Someone brought an air horn.",
    tone: "good",
    effects: [fx.happy(6), fx.close(4, "mother"), fx.close(4, "father")],
  },
]);
