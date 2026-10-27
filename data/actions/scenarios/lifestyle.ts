import { defineScenarios } from "@/engine/actionHelpers";
import { fail, fx, pass, when } from "@/engine/events/helpers";
import type { EventContext } from "@/engine/types";
import { arrestFor } from "../crime";
import { out } from "./kit";

const student = when.inSchool();
const free = (ctx: EventContext) => !ctx.player.crime.prison;

/** School, body, mind, fame, crime and oddities. Same idea as the others: pick an approach, live with the odds. */
export const LIFESTYLE_SCENARIOS = defineScenarios([
  // ---------------------------------------------------------------- school
  {
    id: "sc-school-exam",
    section: "school",
    group: "Studying",
    label: "Big exam coming up",
    icon: "BookOpen",
    perYear: 2,
    visible: (ctx) => student(ctx) && free(ctx),
    approaches: [
      { id: "cram", label: "Cram all night", outcomes: [{ weight: pass("smarts", 45), text: "Fuelled by coffee, you aced it. You then slept for fourteen hours.", tone: "good", effects: [fx.smarts(1), fx.happy(2), fx.health(-1)] }, { weight: fail("smarts", 45), text: "Everything blurred together. You scraped a pass.", tone: "neutral", effects: [fx.happy(-3), fx.health(-1)] }] },
      { id: "steady", label: "Study steadily for weeks", outcomes: [out(4, "Your calm preparation paid off. Top marks.", "good", fx.smarts(2), fx.happy(3)), out(1, "The exam covered everything you skipped. Unlucky.", "neutral", fx.happy(-1))] },
      { id: "cheat", label: "Cheat", outcomes: [out(3, "Nobody noticed. You feel a little queasy.", "neutral", fx.karma(-4), fx.happy(1)), out(2, "You got caught. Zero, and your parents were called in.", "bad", fx.karma(-4), fx.happy(-8), fx.smarts(-1))] },
      { id: "tutor", label: "Hire a tutor", outcomes: [out(4, "An hour a week, a miracle of clarity.", "good", fx.smarts(2), fx.happy(2)), out(1, "Your tutor was in the wrong subject. A waste.", "neutral", fx.happy(-1))] },
    ],
  },
  {
    id: "sc-school-group",
    section: "school",
    group: "Studying",
    label: "Group project",
    icon: "Users",
    visible: (ctx) => student(ctx) && free(ctx),
    approaches: [
      { id: "lead", label: "Take charge", outcomes: [{ weight: pass("charisma", 40), text: "You ran the group like a general. A+.", tone: "good", effects: [fx.smarts(1), fx.skill("charisma", 2), fx.happy(3)] }, { weight: fail("charisma", 40), text: "Nobody listened. You did it all yourself.", tone: "bad", effects: [fx.happy(-3), fx.smarts(1)] }] },
      { id: "follow", label: "Do your part and stay out of the drama", outcomes: [out(4, "You got your bit done and the group got a B.", "neutral", fx.smarts(1)), out(1, "The group fell apart, but your part saved the grade.", "good", fx.smarts(1), fx.happy(2))] },
      { id: "slack", label: "Let others do the work", outcomes: [out(3, "The group carried you. You felt great until the credits.", "neutral", fx.happy(2), fx.karma(-2)), out(2, "They noticed. You were frozen out of the group chat.", "bad", fx.karma(-2), fx.happy(-3))] },
    ],
  },
  {
    id: "sc-school-club",
    section: "school",
    group: "Extracurriculars",
    label: "Join a club",
    icon: "Star",
    visible: (ctx) => ctx.player.age >= 8 && ctx.player.age <= 22 && free(ctx),
    approaches: [
      { id: "debate", label: "Debate team", outcomes: [{ weight: pass("charisma", 40), text: "You won the regional final with a devastating closing statement.", tone: "major", effects: [fx.skill("charisma", 3), fx.smarts(1), fx.happy(5)] }, { weight: fail("charisma", 40), text: "You lost every round and learned humility.", tone: "neutral", effects: [fx.skill("charisma", 1)] }] },
      { id: "drama", label: "Drama club", outcomes: [out(3, "You got a lead role. You were a natural.", "good", fx.skill("charisma", 2), fx.skill("creativity", 2), fx.happy(5)), out(2, "You played Tree #3. You were an excellent tree.", "neutral", fx.skill("creativity", 1), fx.happy(2))] },
      { id: "robotics", label: "Robotics club", outcomes: [out(3, "Your bot made it to the finals before catching fire.", "good", fx.smarts(2), fx.happy(4)), out(1, "Your robot won the whole thing.", "major", fx.smarts(3), fx.happy(8))] },
      { id: "band", label: "Start a band", outcomes: [out(2, "You played one gig at a school dance. Cheering. Legend.", "major", fx.skill("creativity", 3), fx.happy(8), fx.fame(1)), out(3, "Your band broke up over a name.", "neutral", fx.skill("creativity", 1), fx.happy(1))] },
    ],
  },
  {
    id: "sc-school-prank",
    section: "school",
    group: "Mischief",
    label: "Pull a prank",
    icon: "Flame",
    visible: (ctx) => ctx.player.age >= 9 && ctx.player.age <= 20 && student(ctx) && free(ctx),
    approaches: [
      { id: "mild", label: "Whoopee cushion on the teacher's chair", outcomes: [out(4, "The class collapsed in giggles. Even the teacher smirked.", "good", fx.happy(4), fx.skill("charisma", 1)), out(1, "The teacher was not amused. Detention.", "bad", fx.happy(-2))] },
      { id: "epic", label: "Release chickens in the hall", outcomes: [out(2, "The chickens went everywhere. It's the stuff of school legend.", "major", fx.happy(8), fx.skill("charisma", 2), fx.karma(-1)), out(3, "You were identified in minutes and suspended.", "bad", fx.happy(-7), fx.karma(-2))] },
      { id: "benign", label: "Surprise the teacher with a thank-you party", outcomes: [out(4, "The teacher teared up. Probably the best prank ever.", "major", fx.karma(4), fx.happy(5)), out(1, "The teacher thought it was a trick and was cold about it.", "neutral", fx.happy(-1))] },
    ],
  },
  // ---------------------------------------------------------------- health
  {
    id: "sc-health-checkup",
    section: "health",
    group: "Care",
    label: "Health screening",
    icon: "Stethoscope",
    visible: (ctx) => ctx.player.age >= 25 && free(ctx),
    approaches: [
      { id: "basic", label: "Basic annual check", cost: 100, outcomes: [out(5, "Clean bill of health. Take a lollipop.", "good", fx.health(1), fx.happy(1)), out(1, "They found something early. You got treatment in time.", "good", fx.health(3), fx.happy(-1))] },
      { id: "full", label: "Full-body screening", cost: 1500, outcomes: [out(4, "Everything looks great, and you got a nice report to frame.", "good", fx.health(2), fx.happy(2)), out(1, "A scan caught something small before it got big.", "major", fx.health(6), fx.happy(-1)), out(1, "A false alarm sent you into three weeks of anxiety.", "bad", fx.happy(-5))] },
      { id: "skip", label: "Skip it, you feel fine", outcomes: [out(5, "You felt fine. You still do. Probably.", "neutral"), out(1, "A year later, a problem you could have caught early got worse.", "bad", fx.health(-6), fx.happy(-3))] },
    ],
  },
  {
    id: "sc-health-sleep",
    section: "health",
    group: "Care",
    label: "Fix your sleep",
    icon: "Moon",
    visible: (ctx) => ctx.player.age >= 14 && free(ctx),
    approaches: [
      { id: "routine", label: "Strict bedtime routine", outcomes: [{ weight: pass("smarts", 30), text: "Phone off at 10, lights out at 11. You've never felt better.", tone: "good", effects: [fx.health(3), fx.happy(4)] }, { weight: fail("smarts", 30), text: "You lasted two nights, then watched TV till 3.", tone: "neutral", effects: [fx.health(1)] }] },
      { id: "supplement", label: "Try supplements", cost: 150, outcomes: [out(2, "Melatonin helped a bit. Weird dreams.", "neutral", fx.health(1), fx.happy(1)), out(2, "Nothing changed, except your wallet.", "bad", fx.happy(-1))] },
      { id: "sleep-clinic", label: "See a sleep specialist", cost: 600, outcomes: [out(4, "A diagnosis, a gadget, and finally a full night. Bliss.", "major", fx.health(5), fx.happy(6)), out(1, "They sent you home with a pamphlet.", "neutral")] },
    ],
  },
  {
    id: "sc-health-sport",
    section: "health",
    group: "Care",
    label: "Join a sports league",
    icon: "Trophy",
    visible: (ctx) => ctx.player.age >= 14 && ctx.player.age <= 65 && free(ctx),
    approaches: [
      { id: "five-a-side", label: "Five-a-side football", cost: 120, outcomes: [out(3, "You scored a screamer and no one has stopped talking about it.", "good", fx.health(2), fx.skill("athleticism", 2), fx.happy(5)), out(2, "You twisted an ankle in minute three.", "bad", fx.health(-4), fx.happy(-1)), out(1, "The league champion trophy is on your shelf.", "major", fx.health(3), fx.happy(8), fx.skill("charisma", 1))] },
      { id: "tennis", label: "Tennis doubles", cost: 160, outcomes: [out(4, "A civilised afternoon and several unforced errors.", "good", fx.health(2), fx.happy(3)), out(1, "A ball to the head. You saw stars.", "bad", fx.health(-3))] },
      { id: "swim", label: "Master swimmers club", cost: 100, outcomes: [out(4, "Lap after lap. You feel eternally young.", "good", fx.health(3), fx.skill("athleticism", 1), fx.happy(3))] },
    ],
  },
  {
    id: "sc-health-habit",
    section: "health",
    group: "Care",
    label: "Kick a bad habit",
    icon: "Cigarette",
    visible: (ctx) => free(ctx) && Object.values(ctx.player.health.addictions).some((v) => (v ?? 0) > 0),
    approaches: [
      { id: "cold-turkey", label: "Cold turkey", outcomes: [{ weight: pass("smarts", 40), text: "Three brutal weeks and then it clicked. You're free.", tone: "major", effects: [fx.addiction("smoking", -40), fx.addiction("alcohol", -40), fx.addiction("drugs", -40), fx.addiction("gambling", -40), fx.happy(5), fx.health(4)] }, { weight: fail("smarts", 40), text: "You lasted nine days and then you were back to it.", tone: "bad", effects: [fx.happy(-4)] }] },
      { id: "program", label: "Join a support program", cost: 500, outcomes: [out(4, "Weekly meetings, a sponsor, and a coin for a month sober.", "major", fx.addiction("smoking", -30), fx.addiction("alcohol", -30), fx.addiction("drugs", -30), fx.addiction("gambling", -30), fx.happy(5), fx.health(3)), out(1, "It helped a little. The path is long.", "neutral", fx.addiction("alcohol", -10), fx.addiction("drugs", -10), fx.addiction("smoking", -10), fx.addiction("gambling", -10))] },
      { id: "rehab", label: "Check into rehab", cost: 9000, outcomes: [out(4, "Thirty days away from everything. You came out clear-eyed.", "major", fx.addiction("smoking", -80), fx.addiction("alcohol", -80), fx.addiction("drugs", -80), fx.addiction("gambling", -80), fx.health(5), fx.happy(4)), out(1, "It didn't stick the first time. But it moved things.", "neutral", fx.addiction("alcohol", -25), fx.addiction("drugs", -25), fx.addiction("smoking", -25), fx.addiction("gambling", -25))] },
    ],
  },
  // ---------------------------------------------------------------- mind
  {
    id: "sc-mind-journal",
    section: "mind",
    group: "Inner life",
    label: "Look inward",
    icon: "Brain",
    visible: (ctx) => ctx.player.age >= 12 && free(ctx),
    approaches: [
      { id: "journal", label: "Keep a journal", outcomes: [out(4, "A year of daily entries. You discovered what you really want.", "good", fx.happy(4), fx.smarts(1)), out(1, "You found yourself writing mostly complaints. Cathartic, at least.", "neutral", fx.happy(1))] },
      { id: "digital-detox", label: "Do a digital detox", outcomes: [{ weight: pass("smarts", 25), text: "A month without a phone. The world looked a lot bigger.", tone: "major", effects: [fx.happy(7), fx.health(2), fx.skill("charisma", 1)] }, { weight: fail("smarts", 25), text: "You lasted a day and a half and then spent six hours on social media.", tone: "bad", effects: [fx.happy(-2)] }] },
      { id: "philosophy", label: "Read the great philosophers", outcomes: [out(3, "Marcus Aurelius, Seneca, Camus. You now see things in a different light.", "good", fx.smarts(2), fx.happy(3)), out(2, "You nodded off during Kant. It's fine.", "neutral", fx.smarts(1))] },
    ],
  },
  // ---------------------------------------------------------------- fame
  {
    id: "sc-fame-post",
    section: "fame",
    group: "Online",
    label: "Post something",
    description: "A hot take, a selfie, a confession",
    icon: "Camera",
    perYear: 3,
    visible: (ctx) => ctx.player.age >= 13 && free(ctx),
    approaches: [
      { id: "selfie", label: "A flattering selfie", outcomes: [out(4, "A few hundred likes. Your cousin commented a thumbs-up.", "good", fx.happy(2), fx.custom((ctx) => { ctx.player.followers += 80; })), out(1, "It went mildly viral.", "major", fx.happy(4), fx.fame(1), fx.custom((ctx) => { ctx.player.followers += 5000; }))] },
      { id: "hot-take", label: "A controversial opinion", outcomes: [out(2, "It blew up. Half agreed, half were furious.", "major", fx.fame(2), fx.custom((ctx) => { ctx.player.followers += 20000; }), fx.happy(-2)), out(3, "You got ratio'd by a thousand strangers and a bot.", "bad", fx.happy(-5), fx.fame(0))] },
      { id: "confession", label: "A vulnerable confession", outcomes: [out(3, "Strangers sent you kind messages. It felt oddly healing.", "good", fx.happy(5), fx.karma(1), fx.custom((ctx) => { ctx.player.followers += 400; })), out(1, "Someone screenshot it and used it against you.", "bad", fx.happy(-5))] },
      { id: "charity-stream", label: "Charity livestream", outcomes: [out(3, "You raised a decent sum and made your audience feel part of something.", "major", fx.karma(6), fx.fame(1), fx.happy(5), fx.custom((ctx) => { ctx.player.followers += 3000; })), out(1, "The stream cut out at the climax. People forgave you.", "neutral", fx.karma(2))] },
    ],
  },
  {
    id: "sc-fame-interview",
    section: "fame",
    group: "In the spotlight",
    label: "An interview request",
    icon: "Mic",
    visible: (ctx) => ctx.player.fame >= 10 && free(ctx),
    approaches: [
      { id: "podcast", label: "A friendly podcast", outcomes: [out(4, "A warm chat. Listeners loved you.", "good", fx.fame(1), fx.happy(4)), out(1, "You said something you shouldn't have. Clip went viral.", "bad", fx.fame(1), fx.happy(-5))] },
      { id: "tv", label: "A primetime TV interview", outcomes: [{ weight: pass("charisma", 50), text: "You were electric. The host asked you back.", tone: "major", effects: [fx.fame(4), fx.happy(8), fx.cash(3000)] }, { weight: fail("charisma", 50), text: "A tough question flustered you. The clip trended for the wrong reasons.", tone: "bad", effects: [fx.fame(1), fx.happy(-7)] }] },
      { id: "decline", label: "Decline and stay private", outcomes: [out(3, "You stayed mysterious. The press didn't know what to make of you.", "neutral", fx.happy(2), fx.fame(-1)), out(1, "A magazine invented a story anyway.", "bad", fx.happy(-3))] },
    ],
  },
  // ---------------------------------------------------------------- crime
  {
    id: "sc-crime-hustle",
    section: "crime",
    group: "Hustles",
    label: "Run a hustle",
    icon: "Laptop",
    perYear: 2,
    visible: (ctx) => ctx.player.age >= 14 && free(ctx),
    approaches: [
      { id: "poker", label: "Hustle a poker game", outcomes: [{ weight: pass("streetSmarts", 45), text: "You cleaned out a table of overconfident accountants.", tone: "good", effects: [fx.cash(1800), fx.skill("streetSmarts", 2)] }, { weight: fail("streetSmarts", 45), text: "A better hustler hustled you.", tone: "bad", effects: [fx.cash(-800), fx.happy(-3)] }] },
      { id: "knockoffs", label: "Sell knockoff watches", outcomes: [out(3, "A busy weekend at the market. Nobody checked the hallmark.", "neutral", fx.cash(1200), fx.karma(-2)), out(2, "Trading standards confiscated your stock and fined you.", "bad", fx.cash(-900), fx.karma(-2)), out(1, "An undercover officer bought one.", "bad", fx.custom((ctx) => arrestFor(ctx, "counterfeit goods", [0, 2])))] },
      { id: "smuggle", label: "Smuggle a package across the border", outcomes: [{ weight: pass("streetSmarts", 55), text: "You walked through customs with a smile. A fat envelope waited at the other end.", tone: "neutral", effects: [fx.cash(6000), fx.karma(-5)] }, { weight: fail("streetSmarts", 55), text: "A sniffer dog took a particular interest in you.", tone: "bad", effects: [fx.custom((ctx) => arrestFor(ctx, "smuggling", [2, 8])), fx.karma(-5)] }] },
      { id: "protest", label: "Join a daring protest instead", outcomes: [out(3, "You chained yourself to a fence and made the evening news.", "neutral", fx.karma(4), fx.fame(1), fx.happy(3)), out(2, "The police were in a mood. You spent a night in the cells.", "bad", fx.karma(4), fx.happy(-2), fx.cash(-200))] },
    ],
  },
  // ---------------------------------------------------------------- special
  {
    id: "sc-special-pilgrim",
    section: "special",
    group: "Journeys",
    label: "Go on a life-changing journey",
    icon: "Compass",
    visible: (ctx) => ctx.player.age >= 18 && free(ctx),
    approaches: [
      { id: "camino", label: "Walk a thousand-mile pilgrimage", cost: 800, outcomes: [out(4, "Forty days on foot. You came back lighter, stronger and clearer.", "major", fx.health(4), fx.happy(9), fx.skill("athleticism", 2)), out(1, "You twisted a knee on day ten and finished anyway. Respect.", "good", fx.health(-2), fx.happy(7), fx.skill("streetSmarts", 2))] },
      { id: "volunteer-abroad", label: "Teach in a remote village", cost: 1500, outcomes: [out(4, "A year's worth of stories in three months.", "major", fx.karma(8), fx.happy(8), fx.skill("charisma", 2)), out(1, "You caught a nasty fever but never regretted it.", "neutral", fx.health(-6), fx.karma(8), fx.happy(5))] },
      { id: "sail", label: "Sail across an ocean", cost: 6000, outcomes: [out(3, "Twenty-two days at sea. You discovered what silence sounds like.", "major", fx.happy(10), fx.skill("athleticism", 2), fx.skill("streetSmarts", 3)), out(2, "A storm tore the sails. You were rescued by a cargo ship.", "bad", fx.health(-8), fx.happy(2), fx.cash(-3000)), out(1, "You hit a whale. It was fine. It was fine!", "neutral", fx.happy(4))] },
    ],
  },
  {
    id: "sc-special-wager",
    section: "special",
    group: "Wild cards",
    label: "A bet with a stranger",
    description: "Something outrageous",
    icon: "Dice5",
    visible: (ctx) => ctx.player.age >= 18 && free(ctx),
    approaches: [
      { id: "arm", label: "Arm wrestle a burly stranger", outcomes: [{ weight: pass("athleticism", 60), text: "You won, to everyone's astonishment. The pot was yours.", tone: "major", effects: [fx.cash(500), fx.happy(5)] }, { weight: fail("athleticism", 60), text: "He nearly snapped your arm off.", tone: "bad", effects: [fx.health(-5), fx.cash(-100)] }] },
      { id: "trivia", label: "Pub trivia grudge match", outcomes: [{ weight: pass("smarts", 50), text: "The final question: something you actually knew. Bliss.", tone: "good", effects: [fx.cash(300), fx.happy(5)] }, { weight: fail("smarts", 50), text: "You were undone by the capital of Burkina Faso.", tone: "bad", effects: [fx.cash(-60), fx.happy(-2)] }] },
      { id: "eat", label: "Eat-the-whole-menu challenge", outcomes: [out(2, "You did it. You are a monster. The wall of fame has your face on it.", "major", fx.happy(6), fx.fame(1), fx.health(-1)), out(3, "You made it to the last course and then became a cautionary tale.", "bad", fx.happy(-2), fx.health(-3), fx.cash(-60))] },
    ],
  },
  {
    id: "sc-special-reunion",
    section: "special",
    group: "Wild cards",
    label: "Attend your reunion",
    icon: "Users",
    visible: (ctx) => ctx.player.age >= 28 && free(ctx),
    approaches: [
      { id: "flaunt", label: "Show up in style", cost: 500, outcomes: [out(3, "You were the talk of the night. Some old rivals even bought you a drink.", "good", fx.happy(6), fx.skill("charisma", 1)), out(1, "You ran into your high school crush. They're now married to your rival. Awkward.", "neutral", fx.happy(-1))] },
      { id: "humble", label: "Go as you are", outcomes: [out(4, "Honest conversations, stories and a surprising number of hugs.", "good", fx.happy(5), fx.karma(1)), out(1, "You discovered you have nothing in common any more.", "neutral", fx.happy(-1))] },
      { id: "skip", label: "Skip it, send regrets", outcomes: [out(3, "You stayed home and watched a film. No regrets.", "neutral", fx.happy(1)), out(2, "A month later you wondered who you missed.", "bad", fx.happy(-2))] },
    ],
  },
  {
    id: "sc-special-eccentric",
    section: "special",
    group: "Wild cards",
    label: "Do something out of character",
    icon: "Sparkles",
    visible: (ctx) => ctx.player.age >= 16 && free(ctx),
    approaches: [
      { id: "makeover", label: "A dramatic makeover", cost: 300, outcomes: [out(3, "New hair, new wardrobe, new you. People double-took.", "good", fx.looks(3), fx.happy(5), fx.skill("charisma", 1)), out(2, "It was a bit much. You grew into it, eventually.", "neutral", fx.looks(-1), fx.happy(1))] },
      { id: "tattoo", label: "Get a spontaneous tattoo", cost: 250, outcomes: [out(2, "A tiny symbol you adore.", "good", fx.happy(4), fx.looks(1)), out(2, "You regret it by Tuesday. It's on your arm forever.", "bad", fx.happy(-2), fx.looks(-1)), out(1, "It got infected. Antibiotics and a lecture followed.", "bad", fx.health(-4), fx.cash(-200))] },
      { id: "quit-everything", label: "Quit everything and go off-grid for a month", outcomes: [out(3, "A cabin, a stack of books and no signal. You emerged a better person.", "major", fx.happy(9), fx.health(3), fx.smarts(1)), out(2, "You came back to find you'd been fired by email.", "bad", fx.happy(-3))] },
    ],
  },
  {
    id: "sc-special-lost-sibling",
    section: "special",
    group: "Wild cards",
    label: "Trace your family history",
    icon: "Search",
    visible: (ctx) => ctx.player.age >= 20 && free(ctx),
    approaches: [
      { id: "dna", label: "Take a DNA test", cost: 100, outcomes: [out(3, "You're 12% Scandinavian and wholly unsurprised.", "neutral", fx.happy(1)), out(2, "It matched you with a distant cousin who wants to meet.", "good", fx.happy(4)), out(1, "It revealed a half-sibling you never knew existed.", "major", fx.happy(3), fx.skill("charisma", 1))] },
      { id: "archive", label: "Dig through the archives", outcomes: [out(3, "A great-great-grandfather who was a pirate. Probably.", "good", fx.happy(4), fx.smarts(1)), out(1, "You discovered a skeleton in the family closet, and it's a doozy.", "neutral", fx.happy(-1), fx.smarts(1))] },
      { id: "ask", label: "Ask the elders", outcomes: [out(4, "Your grandparent talked for six hours and cried twice. You learned a ton.", "major", fx.happy(6), fx.close(10, "grandparent")), out(1, "They said, 'Some doors are best kept closed.'", "neutral", fx.happy(-1))] },
    ],
  },
]);
