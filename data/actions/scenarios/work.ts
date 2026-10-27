import { defineScenarios } from "@/engine/actionHelpers";
import { fail, fx, pass } from "@/engine/events/helpers";
import type { EventContext } from "@/engine/types";
import { bonus, employedIn, inCategory, out, outThen, payChange, perf, sacked } from "./kit";

const anyJob = (ctx: EventContext) => !!ctx.player.career.job && !ctx.player.crime.prison;
const fullTime = (ctx: EventContext) => anyJob(ctx) && !ctx.player.career.job!.partTime;

/** Decisions that come with a job. Every approach has its own upside and its own way of going wrong. */
export const WORK_SCENARIOS = defineScenarios([
  {
    id: "sc-work-conflict",
    section: "career",
    group: "On the job",
    label: "Deal with a difficult coworker",
    icon: "Users",
    visible: fullTime,
    approaches: [
      {
        id: "talk",
        label: "Talk to them directly",
        outcomes: [
          { weight: pass("charisma", 45), text: "The conversation was awkward, then honest. Things are much better now.", tone: "good", effects: [perf(4), fx.happy(4), fx.skill("charisma", 1)] },
          { weight: fail("charisma", 45), text: "It went badly. They told everyone you'd 'confronted' them.", tone: "bad", effects: [perf(-4), fx.happy(-3)] },
        ],
      },
      {
        id: "hr",
        label: "Go to HR",
        outcomes: [
          out(3, "HR took notes, nodded gravely, and moved them to another floor.", "good", fx.happy(3)),
          out(2, "HR filed it. Nothing changed, but it's on record.", "neutral", fx.happy(-1)),
          out(1, "Word got out. The whole team now thinks you're a snitch.", "bad", perf(-5), fx.happy(-4)),
        ],
      },
      {
        id: "ignore",
        label: "Kill them with kindness",
        outcomes: [
          out(3, "Your relentless cheerfulness eventually broke them. They brought you donuts.", "good", fx.happy(3), fx.karma(2)),
          out(2, "It didn't help, but you felt like the bigger person.", "neutral", fx.karma(1)),
        ],
      },
      {
        id: "sabotage",
        label: "Quietly undermine them",
        outcomes: [
          out(2, "They got moved off the project. Their loss, your gain.", "neutral", perf(5), fx.karma(-5)),
          out(2, "It backfired and the boss found out it was you.", "bad", perf(-12), fx.karma(-6), fx.happy(-5)),
        ],
      },
    ],
  },
  {
    id: "sc-work-project",
    section: "career",
    group: "On the job",
    label: "Take on a big project",
    icon: "Briefcase",
    visible: fullTime,
    approaches: [
      {
        id: "safe",
        label: "Play it safe and deliver on time",
        outcomes: [out(4, "You delivered a solid result. No fireworks, no fires.", "good", perf(5)), out(1, "It was fine. The boss said 'fine'.", "neutral", perf(1))],
      },
      {
        id: "bold",
        label: "Go big with an ambitious plan",
        outcomes: [
          { weight: pass("smarts", 50), text: "It was a triumph. People are quoting your presentation in hallways.", tone: "major", effects: [perf(15), bonus(0.08), fx.happy(6)] },
          { weight: fail("smarts", 50), text: "It fell apart in week three. Your boss's face said everything.", tone: "bad", effects: [perf(-12), fx.happy(-5)] },
        ],
      },
      {
        id: "team",
        label: "Build a team and delegate",
        outcomes: [
          { weight: pass("charisma", 45), text: "Your team gelled. The result beat expectations and everyone shared the credit.", tone: "good", effects: [perf(10), fx.karma(2), fx.happy(4)] },
          { weight: fail("charisma", 45), text: "Everyone had a different idea. The project limped across the line.", tone: "neutral", effects: [perf(1), fx.happy(-2)] },
        ],
      },
      {
        id: "shortcut",
        label: "Cut a corner or two",
        outcomes: [
          out(3, "Nobody noticed. You looked like a wizard.", "good", perf(8), fx.karma(-2)),
          out(2, "The shortcut came back to bite you in the audit.", "bad", perf(-10), fx.karma(-2), fx.happy(-4)),
          out(0.5, "The corner you cut turned out to be load-bearing. You were let go.", "bad", sacked(), fx.karma(-3)),
        ],
      },
    ],
  },
  {
    id: "sc-work-offer",
    section: "career",
    group: "On the job",
    label: "A recruiter calls",
    description: "Listen to what they're offering",
    icon: "Phone",
    visible: fullTime,
    approaches: [
      {
        id: "decline",
        label: "Politely decline",
        outcomes: [out(4, "You told them you were happy where you were. You mostly meant it.", "neutral", perf(1)), out(1, "Your boss heard about it somehow and gave you a nudge.", "good", perf(4), payChange(2))],
      },
      {
        id: "leverage",
        label: "Use the offer as leverage for a raise",
        outcomes: [
          { weight: pass("charisma", 50), text: "Your boss matched it, and then some.", tone: "good", effects: [payChange(10), perf(2)] },
          { weight: fail("charisma", 50), text: "Your boss called your bluff. 'Take it, then.'", tone: "bad", effects: [perf(-6), fx.happy(-4)] },
        ],
      },
      {
        id: "switch",
        label: "Interview and switch if it's right",
        outcomes: [
          out(3, "You jumped ship to a better offer. New desk, new coffee machine, more pay.", "good", payChange(14), fx.happy(5), perf(-10)),
          out(2, "The new job looked great on paper. In person, it was worse than your old one.", "bad", fx.happy(-3)),
          out(2, "The interview went nowhere, but it felt good to know your worth.", "neutral", fx.happy(2)),
        ],
      },
    ],
  },
  {
    id: "sc-work-mistake",
    section: "career",
    group: "On the job",
    label: "You made a mistake at work",
    description: "A costly one. What now?",
    icon: "Siren",
    visible: fullTime,
    approaches: [
      {
        id: "confess",
        label: "Own up immediately",
        outcomes: [
          out(4, "Your boss respected the honesty. The fix was painless.", "good", perf(3), fx.karma(3)),
          out(2, "You got a stern talking-to and a note on your file.", "neutral", perf(-3), fx.karma(2)),
        ],
      },
      {
        id: "fix",
        label: "Fix it quietly yourself",
        outcomes: [
          { weight: pass("smarts", 45), text: "You cleaned it up and no one ever knew.", tone: "good", effects: [perf(1), fx.skill("streetSmarts", 1)] },
          { weight: fail("smarts", 45), text: "You made it worse, and now it's an incident.", tone: "bad", effects: [perf(-10), fx.happy(-5)] },
        ],
      },
      {
        id: "blame",
        label: "Blame someone else",
        outcomes: [
          out(2, "The blame stuck to a colleague. You feel a little sick about it.", "bad", fx.karma(-6), fx.happy(-3)),
          out(2, "Security footage told the real story.", "bad", perf(-15), fx.karma(-6), sacked()),
        ],
      },
    ],
  },
  {
    id: "sc-work-training",
    section: "career",
    group: "On the job",
    label: "Professional development",
    icon: "GraduationCap",
    visible: fullTime,
    approaches: [
      {
        id: "course",
        label: "Online certification",
        cost: 400,
        outcomes: [out(4, "You passed with flying colors. It sits on your résumé, glowing.", "good", perf(5), fx.smarts(1)), out(1, "You never finished it. Your login still works.", "neutral")],
      },
      {
        id: "conference",
        label: "Industry conference",
        cost: 1800,
        outcomes: [
          out(3, "You met three people who will matter. You also got a free tote bag.", "good", perf(4), fx.skill("charisma", 2), fx.happy(3)),
          out(1, "You got offered a better job over dinner.", "good", payChange(8), fx.happy(4)),
          out(2, "Mostly lanyards and lukewarm sandwiches.", "neutral", fx.happy(1)),
        ],
      },
      {
        id: "mentor",
        label: "Seek out a mentor",
        outcomes: [
          { weight: pass("charisma", 45), text: "A senior colleague took you under their wing. You learned in a year what takes most five.", tone: "major", effects: [perf(10), fx.smarts(2), fx.skill("charisma", 2)] },
          { weight: fail("charisma", 45), text: "They were too busy. You settled for their podcast recommendations.", tone: "neutral", effects: [perf(1)] },
        ],
      },
    ],
  },
  {
    id: "sc-work-party",
    section: "career",
    group: "On the job",
    label: "The office party",
    icon: "PartyPopper",
    visible: fullTime,
    approaches: [
      {
        id: "network",
        label: "Work the room",
        outcomes: [
          { weight: pass("charisma", 50), text: "You charmed three VPs and learned the CFO's dog's name. People will remember you.", tone: "good", effects: [perf(7), fx.skill("charisma", 1)] },
          { weight: fail("charisma", 50), text: "You spent the evening cornered by someone describing their fantasy football team.", tone: "neutral", effects: [fx.happy(-1)] },
        ],
      },
      {
        id: "wild",
        label: "Let loose",
        outcomes: [
          out(3, "You were the life of the party. Everyone loves you now.", "good", fx.happy(5), perf(3)),
          out(2, "You did a karaoke rendition of a power ballad. The video is circulating.", "neutral", fx.happy(2), perf(-3)),
          out(1, "You said something unforgivable to your boss's spouse.", "bad", perf(-12), fx.happy(-5)),
        ],
      },
      {
        id: "skip",
        label: "Politely skip it",
        outcomes: [out(4, "You went home early and watched TV in peace.", "good", fx.happy(2)), out(1, "People noticed your absence.", "neutral", perf(-2))],
      },
    ],
  },
  {
    id: "sc-work-side-deal",
    section: "career",
    group: "On the job",
    label: "A tempting opportunity",
    description: "Something not quite above board",
    icon: "Eye",
    visible: fullTime,
    approaches: [
      {
        id: "refuse",
        label: "Walk away",
        outcomes: [out(4, "You said no. It cost you nothing and kept your conscience clear.", "good", fx.karma(4)), out(1, "Later you learned the deal had been a sting. You were relieved.", "good", fx.karma(4), perf(5))],
      },
      {
        id: "take",
        label: "Take the money",
        outcomes: [
          out(3, "Nobody asked. You pocketed a tidy sum.", "neutral", fx.cash(6000), fx.karma(-6)),
          out(2, "HR called you in. You were escorted out with a cardboard box.", "bad", sacked(), fx.karma(-6), fx.happy(-8)),
          out(1, "It caught up with you in a court room.", "bad", fx.karma(-8), fx.happy(-10), fx.cash(-12000)),
        ],
      },
      {
        id: "report",
        label: "Report it",
        outcomes: [
          out(3, "The company thanked you. You were quietly moved onto a more important team.", "good", perf(8), fx.karma(6)),
          out(2, "You were tagged as 'not a team player'. Lonely at lunch, but your integrity is intact.", "neutral", perf(-4), fx.karma(7)),
        ],
      },
    ],
  },
  // --- sales and corporate ---
  {
    id: "sc-work-pitch",
    section: "career",
    group: "On the job",
    label: "Land a big client",
    icon: "Handshake",
    visible: employedIn(["sales", "marketing", "consultant", "realtor", "insurance", "banker", "executive", "project-manager", "accountant"]),
    approaches: [
      {
        id: "warm",
        label: "Work your network",
        outcomes: [
          { weight: pass("charisma", 45), text: "An old contact came through. The contract landed on your desk.", tone: "good", effects: [bonus(0.1), perf(8)] },
          { weight: fail("charisma", 45), text: "Everyone you called was 'swamped this quarter'.", tone: "neutral", effects: [fx.happy(-2)] },
        ],
      },
      {
        id: "cold",
        label: "Cold-call a hundred prospects",
        outcomes: [
          out(2, "Ninety hang-ups, nine 'maybes', one deal. You'll take it.", "good", bonus(0.06), perf(5), fx.skill("charisma", 2)),
          out(3, "Forty-seven voicemails and a very long conversation with a lonely retiree.", "neutral", fx.skill("charisma", 1), fx.happy(-2)),
        ],
      },
      {
        id: "gift",
        label: "Wine and dine the decision-maker",
        cost: 900,
        outcomes: [
          out(3, "Four courses later, they signed. You expensed it.", "good", bonus(0.12), perf(8)),
          out(2, "They ate the lobster and ghosted you.", "bad", fx.happy(-3)),
          out(1, "Compliance questioned the dinner receipts.", "bad", perf(-8), fx.karma(-2)),
        ],
      },
    ],
  },
  {
    id: "sc-work-restructure",
    section: "career",
    group: "On the job",
    label: "Layoffs are coming",
    description: "You've heard the rumours",
    icon: "AlertTriangle",
    visible: (ctx) => fullTime(ctx) && ctx.player.career.job!.yearsAtCompany >= 2,
    approaches: [
      {
        id: "stay",
        label: "Keep your head down",
        outcomes: [out(4, "The axe fell on someone else. You exhaled.", "neutral", fx.happy(-1)), out(2, "You survived the cut, but your workload doubled.", "neutral", perf(2), fx.happy(-3)), out(1, "Your name was on the list.", "bad", sacked(), fx.happy(-6), fx.cash(6000))],
      },
      {
        id: "volunteer",
        label: "Volunteer for the buyout",
        outcomes: [out(4, "You left with a decent package and a free year to figure it out.", "neutral", sacked(), fx.cash(14000), fx.happy(2)), out(1, "They declined your offer and made your life difficult.", "bad", perf(-6), fx.happy(-4))],
      },
      {
        id: "stand-out",
        label: "Make yourself indispensable",
        outcomes: [
          { weight: pass("smarts", 50), text: "You took over three critical workstreams. They couldn't afford to lose you.", tone: "good", effects: [perf(10), payChange(5)] },
          { weight: fail("smarts", 50), text: "You exhausted yourself and still ended up on the list.", tone: "bad", effects: [sacked(), fx.happy(-6), fx.health(-3)] },
        ],
      },
    ],
  },
  // --- tech ---
  {
    id: "sc-work-ship",
    section: "career",
    group: "On the job",
    label: "Ship the release",
    icon: "Code",
    visible: employedIn(["software", "game-dev", "web-designer", "it-support", "data-scientist", "cybersecurity", "engineer"]),
    approaches: [
      {
        id: "tested",
        label: "Test thoroughly, ship late",
        outcomes: [out(4, "It shipped clean. Not one bug report in the first week.", "good", perf(7)), out(2, "Your manager sighed at the delay but admitted it was worth it.", "neutral", perf(2))],
      },
      {
        id: "friday",
        label: "Ship on Friday at 5pm",
        outcomes: [
          out(2, "It just worked. You went home like a hero.", "good", perf(8), fx.happy(4)),
          out(3, "The pager went off at 2 a.m. You spent your weekend rolling it back.", "bad", perf(-5), fx.happy(-5), fx.health(-2)),
        ],
      },
      {
        id: "rewrite",
        label: "Rewrite the whole thing from scratch",
        outcomes: [
          { weight: pass("smarts", 55), text: "The new version is elegant, fast and loved by the team.", tone: "major", effects: [perf(14), payChange(4), fx.happy(5)] },
          { weight: fail("smarts", 55), text: "Six months in, you're still at 40% of the old features.", tone: "bad", effects: [perf(-8), fx.happy(-6)] },
        ],
      },
    ],
  },
  {
    id: "sc-work-incident",
    section: "career",
    group: "On the job",
    label: "Production is down",
    icon: "Siren",
    visible: employedIn(["software", "it-support", "cybersecurity", "data-scientist", "engineer"]),
    approaches: [
      {
        id: "fix",
        label: "Fix it yourself, now",
        outcomes: [
          { weight: pass("smarts", 55), text: "You found the one misplaced comma. Service restored in forty minutes.", tone: "good", effects: [perf(8), bonus(0.02)] },
          { weight: fail("smarts", 55), text: "Four hours in, you were still staring at logs. Someone else fixed it.", tone: "bad", effects: [perf(-4), fx.happy(-3)] },
        ],
      },
      {
        id: "escalate",
        label: "Escalate to the on-call lead",
        outcomes: [out(4, "They knew exactly what to do. You learned a lot watching.", "neutral", fx.smarts(1), perf(1)), out(1, "They said they'd 'take a look' and went back to sleep.", "bad", perf(-3))],
      },
      {
        id: "coverup",
        label: "Say nothing and hope it resolves",
        outcomes: [out(2, "It resolved itself. You never mentioned it.", "neutral", fx.karma(-2)), out(3, "It did not resolve itself. It made the news.", "bad", perf(-14), fx.karma(-3), sacked())],
      },
    ],
  },
  // --- medical ---
  {
    id: "sc-work-ward",
    section: "career",
    group: "On the job",
    label: "A critical shift",
    icon: "HeartPulse",
    visible: employedIn(["nurse", "doctor", "surgeon", "paramedic", "cna", "dentist", "pharmacist", "vet"]),
    approaches: [
      {
        id: "extra",
        label: "Pick up a double shift",
        outcomes: [
          out(3, "Long, brutal and rewarding. You saved a life before breakfast.", "good", perf(7), fx.karma(3), fx.health(-3), bonus(0.03)),
          out(2, "You nodded off during charting. A colleague caught your mistake.", "bad", perf(-4), fx.health(-4)),
        ],
      },
      {
        id: "standard",
        label: "Stick to your schedule",
        outcomes: [out(4, "A normal shift. A small win or two, no disasters.", "good", perf(3), fx.happy(1))],
      },
      {
        id: "experimental",
        label: "Try a new procedure on a hunch",
        outcomes: [
          { weight: pass("smarts", 60), text: "It worked, and the journal wants to publish it.", tone: "major", effects: [perf(15), fx.fame(2), payChange(5)] },
          { weight: fail("smarts", 60), text: "It didn't work. There was an inquiry.", tone: "bad", effects: [perf(-15), fx.karma(-2), fx.happy(-8)] },
        ],
      },
    ],
  },
  // --- law / public ---
  {
    id: "sc-work-case",
    section: "career",
    group: "On the job",
    label: "A defining case",
    icon: "Scale",
    visible: employedIn(["lawyer", "paralegal", "judge"]),
    approaches: [
      {
        id: "pro-bono",
        label: "Take it pro bono",
        outcomes: [out(3, "You won. The family wept. So did you.", "major", fx.karma(10), fx.happy(8), perf(3)), out(2, "You lost, but the press picked it up. Public opinion shifted.", "neutral", fx.karma(8), fx.fame(1))],
      },
      {
        id: "big-client",
        label: "Take on the corporate heavyweight",
        outcomes: [out(3, "They paid handsomely. You don't dwell on what they did.", "good", bonus(0.15), fx.karma(-3)), out(2, "You were outmaneuvered by a better-prepared firm.", "bad", perf(-8), fx.happy(-4))],
      },
      {
        id: "settle",
        label: "Settle quietly",
        outcomes: [out(4, "Nobody was thrilled. Nobody was angry. Case closed.", "neutral", perf(2)), out(1, "You settled for far too little. The client never forgave you.", "bad", fx.karma(-2), perf(-3))],
      },
    ],
  },
  {
    id: "sc-work-duty",
    section: "career",
    group: "On the job",
    label: "A dangerous call",
    icon: "Shield",
    visible: employedIn(["police", "firefighter", "military", "federal-agent", "security", "paramedic"]),
    approaches: [
      {
        id: "by-the-book",
        label: "Follow protocol",
        outcomes: [out(4, "Everyone got home safe. It's in the report.", "good", perf(5), fx.karma(2)), out(1, "Protocol made it slower. Someone else's brave move saved the day.", "neutral", perf(0))],
      },
      {
        id: "hero",
        label: "Go in alone",
        outcomes: [
          { weight: pass("athleticism", 55), text: "You pulled three people out. They're calling you a hero.", tone: "major", effects: [perf(15), fx.karma(8), fx.fame(2), bonus(0.04)] },
          { weight: fail("athleticism", 55), text: "You made it out, barely. You spent a month in hospital.", tone: "bad", effects: [fx.health([-25, -10]), fx.karma(4), perf(5), fx.cash(-2000)] },
          out(0.12, "You didn't make it out.", "bad", fx.die("accident", "You died in the line of duty. They gave you a funeral with full honors.")),
        ],
      },
      {
        id: "back-off",
        label: "Call for backup and wait",
        outcomes: [out(3, "Backup arrived in time. Teamwork.", "good", perf(3)), out(1, "Waiting cost precious minutes.", "bad", perf(-6), fx.karma(-1), fx.happy(-4))],
      },
    ],
  },
  // --- creative and entertainment ---
  {
    id: "sc-work-creative",
    section: "career",
    group: "On the job",
    label: "A career-making project",
    icon: "Palette",
    visible: employedIn(["author", "journalist", "photographer", "designer", "actor", "musician", "comedian", "tv-host", "model", "influencer"]),
    approaches: [
      {
        id: "commercial",
        label: "Make something people will buy",
        outcomes: [out(4, "It sold. It wasn't your best work, but the bills are paid.", "good", fx.cash(3000), perf(4)), out(1, "It was formulaic and you knew it.", "neutral", fx.happy(-2), fx.cash(1500))],
      },
      {
        id: "art",
        label: "Make something you believe in",
        outcomes: [
          { weight: pass("creativity", 60), text: "Critics adored it. Sales were modest, but you'll be remembered.", tone: "major", effects: [fx.fame(3), fx.happy(8), fx.skill("creativity", 2), perf(8)] },
          { weight: fail("creativity", 60), text: "It was misunderstood. You like it anyway.", tone: "neutral", effects: [fx.happy(3), fx.skill("creativity", 2)] },
          out(0.3, "It went spectacularly viral for a reason you hadn't intended.", "major", fx.fame(5), fx.happy(2)),
        ],
      },
      {
        id: "collab",
        label: "Collaborate with someone famous",
        outcomes: [
          { weight: pass("charisma", 55), text: "The collaboration took off. Doors opened.", tone: "major", effects: [fx.fame(4), perf(8), bonus(0.1)] },
          { weight: fail("charisma", 55), text: "They took the credit and cut you from the final edit.", tone: "bad", effects: [fx.happy(-5), perf(-4)] },
        ],
      },
    ],
  },
  // --- trades, farming ---
  {
    id: "sc-work-job-site",
    section: "career",
    group: "On the job",
    label: "A tricky job on site",
    icon: "Hammer",
    visible: employedIn(["electrician", "plumber", "welder", "carpenter", "mechanic", "hvac", "laborer", "farmer", "trucker"]),
    approaches: [
      {
        id: "careful",
        label: "Take your time and do it right",
        outcomes: [out(4, "A clean job, a happy customer, and a good tip.", "good", perf(5), fx.cash(300)), out(1, "It took twice as long, but they were thrilled.", "neutral", perf(3))],
      },
      {
        id: "fast",
        label: "Get it done fast",
        outcomes: [
          out(3, "In and out in half the time. Everyone's happy.", "good", perf(4), bonus(0.01)),
          out(2, "You rushed it and had to go back the next morning.", "bad", perf(-4)),
          out(1, "You cut a corner. The ceiling came down on a Tuesday.", "bad", fx.health(-12), perf(-8), fx.cash(-1500)),
        ],
      },
      {
        id: "side-job",
        label: "Take a cash job on the side",
        outcomes: [out(3, "Easy money, no paperwork.", "neutral", fx.cash(1800), fx.karma(-1)), out(1, "Your boss found out. Awkward Monday.", "bad", perf(-8), fx.karma(-1))],
      },
    ],
  },
  // --- education and public service ---
  {
    id: "sc-work-classroom",
    section: "career",
    group: "On the job",
    label: "A tough class",
    icon: "BookOpen",
    visible: employedIn(["teacher", "professor", "coach", "daycare", "trainer", "librarian"]),
    approaches: [
      {
        id: "strict",
        label: "Run a tight ship",
        outcomes: [out(3, "Order restored. Grades went up, smiles went down.", "neutral", perf(5), fx.happy(-1)), out(2, "The kids called you 'the warden'. The parents emailed the principal.", "bad", perf(-4))],
      },
      {
        id: "creative",
        label: "Make the lessons unforgettable",
        outcomes: [
          { weight: pass("creativity", 50), text: "Your students are still talking about the volcano unit.", tone: "major", effects: [perf(10), fx.happy(6), fx.karma(2)] },
          { weight: fail("creativity", 50), text: "The volcano unit set off the sprinklers.", tone: "bad", effects: [perf(-4), fx.happy(-1)] },
        ],
      },
      {
        id: "individual",
        label: "Give struggling students extra time",
        outcomes: [out(4, "A student you stayed late for passed the test. They thanked you by letter.", "major", fx.karma(6), fx.happy(6), perf(6)), out(2, "You're exhausted but you made a difference.", "good", fx.karma(4), fx.health(-1))],
      },
    ],
  },
  // --- service ---
  {
    id: "sc-work-rush",
    section: "career",
    group: "On the job",
    label: "The lunch rush",
    icon: "Utensils",
    visible: employedIn(["fast-food", "retail", "barista", "server", "bartender", "chef", "hotel", "call-center", "receptionist", "delivery", "stylist"]),
    approaches: [
      {
        id: "push",
        label: "Pull out all the stops",
        outcomes: [
          { weight: pass("charisma", 35), text: "Perfectly handled. A customer left a glowing review and a huge tip.", tone: "good", effects: [perf(8), fx.cash(250)] },
          { weight: fail("charisma", 35), text: "You dropped a tray in front of a full room.", tone: "bad", effects: [perf(-3), fx.happy(-2)] },
        ],
      },
      {
        id: "steady",
        label: "Work steady and smile",
        outcomes: [out(4, "Everyone got served. Nobody died.", "good", perf(3)), out(1, "A regular tipped you twenty and asked about your family.", "good", perf(4), fx.cash(60))],
      },
      {
        id: "snap",
        label: "Tell off a rude customer",
        outcomes: [out(2, "The whole room applauded. Your manager didn't.", "neutral", perf(-6), fx.happy(5)), out(2, "The customer called corporate. You got written up.", "bad", perf(-10), fx.happy(-3)), out(1, "It went viral. You are now a folk hero.", "major", fx.fame(2), fx.happy(5), perf(-5))],
      },
    ],
  },
  // --- all jobs, shorter ones ---
  {
    id: "sc-work-boss",
    section: "career",
    group: "On the job",
    label: "Your boss wants a favour",
    icon: "UserCheck",
    visible: fullTime,
    approaches: [
      {
        id: "yes",
        label: "Say yes to everything",
        outcomes: [out(3, "They remembered you at review time.", "good", perf(6), fx.happy(-2)), out(2, "You became the office doormat. Everyone dumps work on you now.", "bad", perf(2), fx.happy(-5), fx.health(-2))],
      },
      {
        id: "negotiate",
        label: "Say yes, with conditions",
        outcomes: [{ weight: pass("charisma", 45), text: "You got a half-day off and a mention in the newsletter.", tone: "good", effects: [perf(5), fx.happy(3)] }, { weight: fail("charisma", 45), text: "Your boss laughed. Then agreed. Then forgot.", tone: "neutral", effects: [perf(2)] }],
      },
      {
        id: "no",
        label: "Politely refuse",
        outcomes: [out(2, "They respected the boundary.", "good", perf(1), fx.happy(3)), out(3, "They didn't. You're on the bad list now.", "bad", perf(-7), fx.happy(-1))],
      },
    ],
  },
  {
    id: "sc-work-rumor",
    section: "career",
    group: "On the job",
    label: "Office gossip",
    icon: "MessageCircle",
    visible: fullTime,
    approaches: [
      {
        id: "listen",
        label: "Lean in and listen",
        outcomes: [out(3, "You learned who's getting promoted. Valuable intel.", "good", fx.skill("streetSmarts", 2), perf(2)), out(2, "The rumour turned out to be about you.", "bad", fx.happy(-4), perf(-2))],
      },
      {
        id: "spread",
        label: "Share some of your own",
        outcomes: [out(2, "You're suddenly very popular at lunch.", "good", fx.skill("charisma", 1), fx.karma(-2)), out(3, "It got back to the target.", "bad", fx.karma(-3), perf(-6), fx.happy(-4))],
      },
      {
        id: "shut-down",
        label: "Shut it down",
        outcomes: [out(3, "People respect you for it.", "good", fx.karma(3), perf(2)), out(1, "You came off as preachy.", "neutral", fx.happy(-1))],
      },
    ],
  },
  {
    id: "sc-work-sick",
    section: "career",
    group: "On the job",
    label: "You feel awful at work",
    icon: "Thermometer",
    visible: fullTime,
    perYear: 2,
    approaches: [
      {
        id: "power-through",
        label: "Power through it",
        outcomes: [out(2, "You got through the day. Your colleagues avoided you.", "neutral", perf(2), fx.health(-3)), out(2, "You sneezed on the client. The deal still went through.", "neutral", perf(0), fx.health(-3)), out(1, "You collapsed at your desk and woke up in an ambulance.", "bad", fx.health(-12), fx.cash(-1500))],
      },
      {
        id: "sick-day",
        label: "Call in sick",
        outcomes: [out(4, "A day of soup and daytime TV. Bliss.", "good", fx.health(3), fx.happy(3)), out(1, "Your boss saw you at the supermarket that afternoon.", "bad", perf(-6), fx.karma(-1))],
      },
    ],
  },
  {
    id: "sc-work-ask-flexibility",
    section: "career",
    group: "On the job",
    label: "Ask for flexibility",
    description: "Remote work, odd hours, a 4-day week",
    icon: "Clock",
    visible: (ctx) => inCategory("corporate", "finance", "tech", "creative", "public", "education", "science", "law")(ctx),
    approaches: [
      {
        id: "remote",
        label: "Work from home permanently",
        outcomes: [
          { weight: pass("charisma", 40), text: "Approved. Your commute is now 14 steps.", tone: "good", effects: [fx.happy(5), perf(1)] },
          { weight: fail("charisma", 40), text: "Denied. 'We value in-person collaboration.' It was a Zoom call.", tone: "bad", effects: [fx.happy(-3)] },
        ],
      },
      {
        id: "four-day",
        label: "Four-day work week",
        outcomes: [out(2, "You got it, on a trial basis. You have never been happier.", "good", fx.happy(7), payChange(-5)), out(3, "Your boss said they'd 'think about it' and never spoke of it again.", "neutral")],
      },
      {
        id: "sabbatical",
        label: "Take a sabbatical",
        outcomes: [out(2, "Six months of travel, rest and half-finished hobbies. You came back reborn.", "major", fx.happy(10), fx.health(4), perf(-5)), out(2, "They said you'd lose your seat. You quit and travelled anyway.", "neutral", sacked(), fx.happy(8), fx.cash(-4000))],
      },
    ],
  },
]);
