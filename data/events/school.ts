import { defineEvents, fail, fx, pass, when } from "@/engine/events/helpers";
import { clamp } from "@/engine/util";

const grade = (delta: number) =>
  fx.custom((ctx) => {
    const e = ctx.player.education.enrolled;
    if (e) e.performance = clamp(e.performance + delta);
  });

const inSchool = when.inSchool("elementary", "middle", "high");

export const SCHOOL_EVENTS = defineEvents("school", [
  {
    id: "school-first-day",
    ages: [6, 6],
    once: true,
    condition: when.inSchool("elementary"),
    text: "On your first day of school you {cried at the gate|marched in without looking back|hid in the coat closet for an hour}.",
    effects: [fx.happy([-2, 3])],
  },
  {
    id: "school-bully",
    ages: [7, 15],
    cooldown: 4,
    condition: inSchool,
    npc: { kind: "new", role: "classmate", ageOffset: [0, 1], closeness: [0, 10] },
    title: "Bully",
    text: "{npc} has been shoving you in the hallway and calling you names.",
    choices: [
      {
        label: "Fight back",
        outcomes: [
          { weight: pass("athleticism", 40), text: "You decked {npc}. {npc.He} never bothered you again.", tone: "good", effects: [fx.happy(5), fx.skill("streetSmarts", 2), fx.tag("bully"), fx.flag("stoodUpToBully")] },
          { weight: fail("athleticism", 40), text: "You swung at {npc} and missed. {npc.He} did not miss.", tone: "bad", effects: [fx.health([-6, -2]), fx.happy(-4), fx.tag("bully")] },
        ],
      },
      {
        label: "Tell a teacher",
        outcomes: [
          { weight: 2, text: "The teacher had a word with {npc}. Things calmed down.", effects: [fx.happy(2), fx.tag("bully")] },
          { weight: 1, text: "You told a teacher. {npc} found out, and it got worse.", tone: "bad", effects: [fx.happy(-5), fx.tag("bully")] },
        ],
      },
      {
        label: "Try to make friends with {npc.him}",
        outcomes: [
          { weight: pass("charisma", 50), text: "Turns out {npc} was having a rough time at home. You became friends.", tone: "good", effects: [fx.close(40), fx.karma(3), fx.custom(({ npc }) => { if (npc) npc.role = "friend"; })] },
          { weight: fail("charisma", 50), text: "{npc} laughed in your face.", tone: "bad", effects: [fx.happy(-3), fx.tag("bully")] },
        ],
      },
      {
        label: "Ignore it",
        outcomes: [{ text: "You kept your head down until {npc} found someone else to pick on.", effects: [fx.happy(-3), fx.tag("bully")] }],
      },
    ],
  },
  {
    id: "school-report-card",
    ages: [7, 17],
    cooldown: 2,
    condition: inSchool,
    text: (ctx) => {
      const p = ctx.player.education.enrolled?.performance ?? 50;
      if (p >= 85) return "Your report card was straight A's. Your parents put it on the fridge.";
      if (p >= 65) return "Your report card was solid. Mostly B's, one suspicious A.";
      if (p >= 45) return "Your report card was a C average. \"Has potential,\" wrote your teacher.";
      return "Your report card was a disaster. You considered forging a signature.";
    },
    effects: (ctx) => {
      const p = ctx.player.education.enrolled?.performance ?? 50;
      return p >= 85 ? [fx.happy(4), fx.close(3, "mother")] : p < 45 ? [fx.happy(-4), fx.close(-3, "mother")] : [];
    },
  },
  {
    id: "school-cheat-test",
    ages: [10, 17],
    cooldown: 3,
    condition: inSchool,
    title: "Test day",
    text: "You didn't study for a big {math|history|science|geography} test. The smartest kid in class is sitting right next to you.",
    choices: [
      {
        label: "Copy their answers",
        outcomes: [
          { weight: pass("streetSmarts", 45), text: "You copied everything and aced it. You feel a bit gross about it.", effects: [grade(6), fx.karma(-2)] },
          { weight: fail("streetSmarts", 45), text: "The teacher caught you copying. Zero, plus a call home.", tone: "bad", effects: [grade(-10), fx.karma(-2), fx.happy(-4), fx.inc("detentions")] },
        ],
      },
      {
        label: "Wing it",
        outcomes: [
          { weight: pass("smarts", 55), text: "You winged it and somehow passed.", tone: "good", effects: [grade(2)] },
          { weight: fail("smarts", 55), text: "You winged it. You did not pass.", tone: "bad", effects: [grade(-6), fx.happy(-2)] },
        ],
      },
      {
        label: "Fake being sick",
        outcomes: [{ text: "You faked a stomachache and went to the nurse. The makeup test was harder.", effects: [grade(-2), fx.karma(-1)] }],
      },
    ],
  },
  {
    id: "school-detention",
    ages: [9, 17],
    cooldown: 3,
    condition: when.all(inSchool, (ctx) => Number(ctx.state.flags.detentions ?? 0) >= 1),
    text: "You spent another afternoon in detention, carving your initials into a desk.",
    effects: [fx.happy(-2), fx.skill("streetSmarts", 1)],
  },
  {
    id: "school-favorite-teacher",
    ages: [8, 17],
    once: true,
    condition: inSchool,
    npc: { kind: "new", role: "teacher", age: [28, 60], closeness: [45, 65] },
    text: "Your {math|English|science|art|history} teacher, {npc.full}, told you that you had real talent.",
    tone: "good",
    effects: [fx.happy(5), fx.smarts(2), fx.flag("hadMentor")],
  },
  {
    id: "school-teacher-feud",
    ages: [10, 17],
    once: true,
    condition: inSchool,
    npc: { kind: "new", role: "teacher", age: [35, 64], closeness: [5, 20] },
    title: "Teacher trouble",
    text: "{npc.full}, your teacher, seems to have decided you are a problem. {npc.He} called on you every time you weren't paying attention.",
    choices: [
      {
        label: "Win {npc.him} over",
        outcomes: [
          { weight: pass("charisma", 45), text: "You started participating. {npc} grudgingly admitted you were alright.", tone: "good", effects: [fx.close(30), grade(4)] },
          { weight: fail("charisma", 45), text: "{npc} saw through it immediately.", effects: [fx.close(-5)] },
        ],
      },
      {
        label: "Talk back",
        outcomes: [{ text: "You told {npc} exactly what you thought. Detention for a week.", tone: "bad", effects: [fx.close(-15), fx.inc("detentions"), grade(-5), fx.skill("charisma", 1)] }],
      },
      {
        label: "Complain to the principal",
        outcomes: [
          { weight: 1, text: "The principal took your side. {npc} eased off.", effects: [fx.close(-10), fx.happy(3)] },
          { weight: 1, text: "The principal took {npc}'s side. Obviously.", tone: "bad", effects: [fx.close(-10), fx.happy(-3)] },
        ],
      },
    ],
  },
  {
    id: "school-science-fair",
    ages: [9, 15],
    once: true,
    condition: inSchool,
    title: "Science fair",
    text: "The science fair is coming up.",
    choices: [
      {
        label: "Build a volcano",
        outcomes: [{ text: "You built a baking-soda volcano, along with eleven other kids.", effects: [fx.smarts(1)] }],
      },
      {
        label: "Try something ambitious",
        outcomes: [
          { weight: pass("smarts", 60), text: "Your project on {solar ovens|bee navigation|bacteria on phone screens} won first prize.", tone: "good", effects: [fx.smarts(4), fx.happy(5), fx.achieve("science-fair-winner"), fx.flag("scienceFair")] },
          { weight: fail("smarts", 60), text: "Your ambitious project caught fire. Literally. The gym was evacuated.", tone: "bad", effects: [fx.happy(-3), fx.flag("scienceFairFire")] },
        ],
      },
      {
        label: "Make your parents do it",
        outcomes: [{ text: "Your {mom|dad} built an impressive project with your name on it. You won second place and learned nothing.", effects: [fx.karma(-1)] }],
      },
    ],
  },
  {
    id: "school-field-trip",
    ages: [6, 13],
    cooldown: 3,
    condition: inSchool,
    text: "Your class went on a field trip to {the science museum|a dairy farm|the aquarium|a planetarium|a wastewater treatment plant}.",
    effects: [fx.happy(2), fx.smarts(1)],
  },
  {
    id: "school-lunch-trade",
    ages: [6, 12],
    cooldown: 3,
    condition: inSchool,
    text: "You traded your {apple|carrot sticks|sandwich} for a {pudding cup|bag of chips|chocolate bar}. Best deal of the year.",
    effects: [fx.happy(2), fx.skill("streetSmarts", 1)],
  },
  {
    id: "school-lice",
    ages: [6, 10],
    once: true,
    condition: inSchool,
    text: "Head lice went around your class. Your {mom|dad} combed your hair with a metal comb for an entire weekend.",
    effects: [fx.happy(-2)],
  },
  {
    id: "school-glasses",
    ages: [7, 15],
    once: true,
    condition: (ctx) => ctx.player.appearance.glasses === "none",
    weight: 0.6,
    text: "An eye test revealed you'd been squinting at the board for years. You got glasses.",
    effects: [
      fx.custom((ctx) => {
        ctx.player.appearance.glasses = ctx.rng.pick(["round", "square"] as const);
      }),
      fx.smarts(2),
    ],
  },
  {
    id: "school-spelling-test-perfect",
    ages: [7, 10],
    cooldown: 3,
    condition: when.all(inSchool, when.statAtLeast("smarts", 60)),
    text: "You got a perfect score on your spelling test and a gold star sticker.",
    tone: "good",
    effects: [fx.happy(2), grade(2)],
  },
  {
    id: "school-group-project",
    ages: [10, 17],
    cooldown: 3,
    condition: inSchool,
    npc: { kind: "new", role: "classmate", ageOffset: [0, 0], closeness: [30, 45] },
    title: "Group project",
    text: "You got paired with {npc} for a group project. {npc.He} {npc.has} done absolutely nothing.",
    choices: [
      {
        label: "Do it all yourself",
        outcomes: [{ text: "You did the whole project. {npc} presented it like a pro and took the credit.", effects: [grade(4), fx.happy(-3), fx.close(-5)] }],
      },
      {
        label: "Confront {npc.him}",
        outcomes: [
          { weight: pass("charisma", 40), text: "You told {npc} to step up. {npc.He} actually did.", tone: "good", effects: [grade(3), fx.close(5)] },
          { weight: fail("charisma", 40), text: "{npc} shrugged. You both got a C.", effects: [grade(-2), fx.close(-5)] },
        ],
      },
      {
        label: "Tell the teacher",
        outcomes: [{ text: "The teacher graded you separately. {npc} got an F and an attitude.", effects: [grade(2), fx.close(-15)] }],
      },
    ],
  },
  {
    id: "school-talent-show",
    ages: [8, 17],
    once: true,
    condition: inSchool,
    title: "Talent show",
    text: "Sign-ups for the school talent show are open.",
    choices: [
      {
        label: "Sing",
        outcomes: [
          { weight: pass("creativity", 45), text: "You sang and got a standing ovation.", tone: "good", effects: [fx.skill("charisma", 3), fx.happy(6), fx.flag("talentShowStar")] },
          { weight: fail("creativity", 45), text: "Your voice cracked on the big note. People still bring it up.", tone: "bad", effects: [fx.happy(-5)] },
        ],
      },
      {
        label: "Do stand-up",
        outcomes: [
          { weight: pass("charisma", 50), text: "Your stand-up set killed. Even the principal laughed.", tone: "good", effects: [fx.skill("charisma", 4), fx.happy(5), fx.flag("comedian")] },
          { weight: fail("charisma", 50), text: "Your stand-up set was met with a silence you could hear.", tone: "bad", effects: [fx.happy(-5)] },
        ],
      },
      {
        label: "Skip it",
        outcomes: [{ text: "You watched from the audience. Safer that way." }],
      },
    ],
  },
  {
    id: "school-sports-day",
    ages: [6, 13],
    cooldown: 3,
    condition: inSchool,
    text: (ctx) =>
      ctx.player.skills.athleticism >= 45
        ? "You won {the sack race|the 100-meter dash|the long jump} on sports day."
        : "You came last in {the sack race|the egg-and-spoon race|the relay} on sports day, but got a participation ribbon.",
    effects: (ctx) => (ctx.player.skills.athleticism >= 45 ? [fx.happy(4), fx.skill("athleticism", 2)] : [fx.happy(-1)]),
  },
  {
    id: "school-best-friend",
    ages: [6, 12],
    once: true,
    condition: inSchool,
    npc: { kind: "new", role: "bestFriend", ageOffset: [0, 0], closeness: [70, 85] },
    text: "You and {npc} became inseparable. Best friends, pinky-sworn.",
    tone: "good",
    effects: [fx.happy(6), fx.flag("childhoodBestFriend")],
  },
  {
    id: "school-sleepover",
    ages: [8, 13],
    cooldown: 3,
    npc: { kind: "existing", roles: ["bestFriend", "friend"] },
    text: "You had a sleepover at {npc}'s house. You stayed up until {2|3|4} a.m. telling ghost stories.",
    tone: "good",
    effects: [fx.close([4, 8]), fx.happy(3)],
  },
  {
    id: "school-friend-moves",
    ages: [8, 16],
    once: true,
    npc: { kind: "existing", roles: ["bestFriend", "friend"] },
    text: "{npc}'s family moved to another city. You promised to stay in touch.",
    tone: "bad",
    choices: [
      {
        label: "Write letters every week",
        outcomes: [{ text: "You and {npc} kept writing. The friendship survived the distance.", tone: "good", effects: [fx.close(5), fx.karma(1)] }],
      },
      {
        label: "Let it fade",
        outcomes: [{ text: "The messages slowed down, then stopped.", effects: [fx.loseContact(), fx.happy(-3)] }],
      },
    ],
  },
  {
    id: "school-club-game",
    ages: [8, 17],
    cooldown: 2,
    condition: when.any(when.club("soccer"), when.club("basketball")),
    title: "Championship game",
    text: "Your team made the championship game. It's tied with seconds left, and the ball comes to you.",
    choices: [
      {
        label: "Take the shot",
        outcomes: [
          { weight: pass("athleticism", 55), text: "You scored the winning point. Your teammates carried you off the field.", tone: "good", effects: [fx.happy(8), fx.skill("athleticism", 2), fx.achieve("game-winner")] },
          { weight: fail("athleticism", 55), text: "You missed. The other team went wild.", tone: "bad", effects: [fx.happy(-5)] },
        ],
      },
      {
        label: "Pass it",
        outcomes: [
          { weight: 1, text: "You passed, and your teammate scored. Team player.", tone: "good", effects: [fx.happy(4), fx.karma(1)] },
          { weight: 1, text: "You passed, and your teammate fumbled. Nobody blamed you, out loud.", effects: [fx.happy(-2)] },
        ],
      },
    ],
  },
  {
    id: "school-club-band-solo",
    ages: [9, 17],
    once: true,
    condition: when.any(when.club("band"), when.club("choir")),
    text: "You got a solo at the spring concert.",
    choices: [
      {
        label: "Practice every day",
        outcomes: [{ text: "Your solo was flawless. Someone's grandma cried.", tone: "good", effects: [fx.skill("creativity", 3), fx.happy(5)] }],
      },
      {
        label: "Wing it",
        outcomes: [
          { weight: pass("creativity", 55), text: "You winged it and nailed it anyway.", tone: "good", effects: [fx.happy(4)] },
          { weight: fail("creativity", 55), text: "You winged it. The conductor's eye twitched.", tone: "bad", effects: [fx.happy(-3)] },
        ],
      },
    ],
  },
  {
    id: "school-club-debate",
    ages: [12, 17],
    once: true,
    condition: when.club("debate"),
    text: "You argued that {cats are better than dogs|school uniforms should be banned|homework is unconstitutional} at the regional debate tournament.",
    choices: [
      {
        label: "Go for logic",
        outcomes: [
          { weight: pass("smarts", 50), text: "Your airtight logic won you the regional title.", tone: "good", effects: [fx.skill("charisma", 3), fx.achieve("debate-champ")] },
          { weight: fail("smarts", 50), text: "You lost on a technicality you still dispute.", effects: [fx.happy(-2)] },
        ],
      },
      {
        label: "Go for passion",
        outcomes: [
          { weight: pass("charisma", 50), text: "Your passionate closing speech got a standing ovation and the win.", tone: "good", effects: [fx.skill("charisma", 4), fx.achieve("debate-champ")] },
          { weight: fail("charisma", 50), text: "You got so passionate you forgot your point.", effects: [fx.happy(-2)] },
        ],
      },
    ],
  },
  {
    id: "school-club-drama-lead",
    ages: [10, 17],
    once: true,
    condition: when.club("drama"),
    text: "You landed the lead role in the school's production of {Hamlet|Grease|Our Town|Into the Woods}.",
    tone: "good",
    effects: [fx.skill("charisma", 3), fx.skill("creativity", 2), fx.happy(5), fx.flag("childActor")],
  },
  {
    id: "school-club-robotics",
    ages: [11, 17],
    once: true,
    condition: when.club("robotics"),
    text: "Your robotics team's robot {won the regional competition|drove straight off the stage|caught fire, but in a cool way}.",
    effects: [fx.smarts(3), fx.happy(2)],
  },
  {
    id: "school-chess-tournament",
    ages: [9, 17],
    once: true,
    condition: when.club("chess"),
    title: "Chess tournament",
    text: "You reached the final of a chess tournament against a {seven|nine}-year-old prodigy.",
    choices: [
      {
        label: "Play aggressively",
        outcomes: [
          { weight: pass("smarts", 60), text: "You crushed the prodigy in twenty moves. They cried. You felt bad for about a minute.", tone: "good", effects: [fx.smarts(3), fx.happy(4), fx.achieve("chess-champ")] },
          { weight: fail("smarts", 60), text: "The prodigy dismantled you while eating a juice box.", tone: "bad", effects: [fx.happy(-3)] },
        ],
      },
      {
        label: "Play it safe",
        outcomes: [{ text: "You drew. Everyone agreed it was a respectable result.", effects: [fx.smarts(1)] }],
      },
    ],
  },
  {
    id: "school-student-council",
    ages: [11, 17],
    once: true,
    condition: inSchool,
    title: "Student council",
    text: "Elections for student council president are coming up.",
    choices: [
      {
        label: "Run on real issues",
        outcomes: [
          { weight: pass("charisma", 55), text: "You won the election on a platform of better vending machines.", tone: "good", effects: [fx.skill("charisma", 3), fx.flag("studentPresident"), fx.achieve("student-president")] },
          { weight: fail("charisma", 55), text: "You lost to the popular kid who promised a pool.", effects: [fx.happy(-3)] },
        ],
      },
      {
        label: "Promise everyone a pool",
        outcomes: [
          { weight: 2, text: "You promised a pool and won in a landslide. There is no pool.", tone: "good", effects: [fx.flag("studentPresident"), fx.achieve("student-president"), fx.karma(-1)] },
          { weight: 1, text: "Nobody believed you about the pool.", effects: [fx.happy(-2)] },
        ],
      },
      {
        label: "Stay out of politics",
        outcomes: [{ text: "You stayed out of it. Wise beyond your years." }],
      },
    ],
  },
  {
    id: "school-standardized-test",
    ages: [16, 17],
    once: true,
    condition: when.inSchool("high"),
    title: "Entrance exam",
    text: "The college entrance exam is next week.",
    choices: [
      {
        label: "Cram all week",
        outcomes: [
          { weight: pass("smarts", 45), text: "You scored in the top {5|8|10} percent.", tone: "good", effects: [fx.smarts(3), grade(4), fx.flag("highTestScore")] },
          { weight: fail("smarts", 45), text: "You crammed so hard you blanked on the day.", effects: [grade(-2)] },
        ],
      },
      {
        label: "Pay for a tutor",
        condition: when.wealth("middle", "upper", "rich"),
        outcomes: [{ text: "Your parents paid for a tutor. Your score was excellent and suspiciously expensive.", tone: "good", effects: [fx.smarts(2), grade(5), fx.flag("highTestScore")] }],
      },
      {
        label: "Don't bother",
        outcomes: [{ text: "You took the exam without studying. Your score was... a number.", effects: [grade(-3)] }],
      },
    ],
  },
  {
    id: "school-valedictorian",
    ages: [17, 17],
    once: true,
    condition: (ctx) => (ctx.player.education.enrolled?.performance ?? 0) >= 92 && ctx.player.education.enrolled?.level === "high",
    text: "You were named valedictorian of your class.",
    tone: "major",
    effects: [fx.happy(8), fx.achieve("valedictorian"), fx.flag("valedictorian")],
  },
  {
    id: "school-yearbook-superlative",
    ages: [17, 17],
    once: true,
    condition: when.inSchool("high"),
    text: (ctx) => {
      const p = ctx.player;
      if (p.stats.looks >= 75) return 'The yearbook voted you "Best Looking." You will mention this for decades.';
      if (p.skills.charisma >= 55) return 'The yearbook voted you "Most Likely to Be Famous."';
      if (p.stats.smarts >= 75) return 'The yearbook voted you "Most Likely to Succeed."';
      if (ctx.state.flags.classClown) return 'The yearbook voted you "Class Clown." Deserved.';
      return "The yearbook voted you \"Most Likely to Be Fine.\" It's something.";
    },
    effects: [fx.happy(3)],
  },
  {
    id: "school-prom",
    ages: [16, 17],
    once: true,
    condition: when.inSchool("high"),
    npc: { kind: "new", role: "date", ageOffset: [0, 0], gender: "attracted", closeness: [40, 60], keep: false },
    title: "Prom",
    text: "Prom is in two weeks. You've had your eye on {npc} from your {chemistry|English|history} class.",
    choices: [
      {
        label: "Ask {npc.him} to prom",
        outcomes: [
          { weight: (ctx) => 0.25 + ctx.player.stats.looks / 160 + ctx.player.skills.charisma / 250, text: "{npc} said yes! You had a great night and an awkward slow dance.", tone: "good", effects: [fx.happy(8), fx.flag("promDate")] },
          { weight: (ctx) => 1 - (0.25 + ctx.player.stats.looks / 160 + ctx.player.skills.charisma / 250), text: "{npc} said {npc.he} already had a date. You went with friends and had more fun anyway.", effects: [fx.happy(-3)] },
        ],
      },
      {
        label: "Go with friends",
        outcomes: [{ text: "You went to prom with a group of friends and danced until the lights came on.", tone: "good", effects: [fx.happy(5)] }],
      },
      {
        label: "Skip prom",
        outcomes: [{ text: "You skipped prom and watched movies. No regrets. Some regrets." }],
      },
    ],
  },
  {
    id: "school-senior-prank",
    ages: [17, 17],
    once: true,
    condition: when.inSchool("high"),
    title: "Senior prank",
    text: "Your class is planning a senior prank.",
    choices: [
      {
        label: "Mastermind it",
        outcomes: [
          { weight: pass("streetSmarts", 45), text: "You filled the principal's office with {balloons|crickets|rubber ducks}. A legend was born.", tone: "good", effects: [fx.happy(6), fx.skill("streetSmarts", 2), fx.flag("seniorPrank")] },
          { weight: fail("streetSmarts", 45), text: "You got caught on camera and banned from graduation.", tone: "bad", effects: [fx.happy(-6), fx.flag("bannedFromGraduation")] },
        ],
      },
      {
        label: "Help out quietly",
        outcomes: [{ text: "You helped glue every chair to the ceiling. Nobody ever found out it was you.", effects: [fx.happy(3)] }],
      },
      {
        label: "Stay out of it",
        outcomes: [{ text: "You stayed out of it, which was boring but kept your record clean." }],
      },
    ],
  },
  {
    id: "school-guidance-counselor",
    ages: [16, 17],
    once: true,
    condition: when.inSchool("high"),
    text: (ctx) =>
      ctx.player.stats.smarts >= 65
        ? "Your guidance counselor suggested you apply to some competitive colleges."
        : "Your guidance counselor handed you a pamphlet about trade schools and wished you luck.",
  },
  {
    id: "school-expelled-risk",
    ages: [12, 17],
    once: true,
    condition: when.all(inSchool, (ctx) => Number(ctx.state.flags.detentions ?? 0) >= 3),
    title: "Principal's office",
    text: "After your latest detention, the principal says one more incident and you're expelled.",
    choices: [
      {
        label: "Promise to change",
        outcomes: [{ text: "You kept your head down for the rest of the year.", effects: [fx.flag("detentions", 0), fx.karma(1)] }],
      },
      {
        label: "Shrug",
        outcomes: [
          { weight: 1, text: "You got caught {vaping in the bathroom|forging a hall pass} a week later and were expelled. Your parents enrolled you somewhere stricter.", tone: "bad", effects: [fx.happy(-6), grade(-15), fx.flag("expelled"), fx.close(-10, "mother")] },
          { weight: 1, text: "The principal forgot about it by Friday.", effects: [] },
        ],
      },
    ],
  },
  {
    id: "school-home-economics",
    ages: [12, 15],
    once: true,
    condition: inSchool,
    text: "In home economics you {baked a cake that collapsed|sewed a pillow shaped like a potato|set off the fire alarm making toast}.",
    effects: [fx.skill("creativity", 1)],
  },
  {
    id: "school-pe-dodgeball",
    ages: [9, 14],
    once: true,
    condition: inSchool,
    text: (ctx) =>
      ctx.player.skills.athleticism >= 40
        ? "You were the last one standing in dodgeball. Undefeated."
        : "You took a dodgeball to the face in gym class. Your glasses, if any, did not survive emotionally.",
    effects: (ctx) => (ctx.player.skills.athleticism >= 40 ? [fx.happy(3)] : [fx.health(-1), fx.happy(-2)]),
  },
  {
    id: "school-foreign-exchange",
    ages: [15, 17],
    once: true,
    condition: when.all(when.inSchool("high"), when.wealth("middle", "upper", "rich")),
    title: "Exchange program",
    text: "Your school offered a semester abroad in {Spain|Japan|Germany|Brazil|France}.",
    choices: [
      {
        label: "Go",
        outcomes: [{ text: "You spent a semester abroad. You came back slightly insufferable and a lot more worldly.", tone: "good", effects: [fx.smarts(3), fx.skill("charisma", 2), fx.happy(6), fx.flag("exchangeStudent")] }],
      },
      {
        label: "Stay home",
        outcomes: [{ text: "You stayed home. Maybe some other time." }],
      },
    ],
  },
]);
