import { defineScenarios } from "@/engine/actionHelpers";
import { fail, fx, pass } from "@/engine/events/helpers";
import type { EventContext, NpcRole } from "@/engine/types";
import { out, outThen } from "./kit";

const alive = (ctx: EventContext) => !!ctx.npc?.alive && ctx.npc.inContact;
const ROMANTIC: NpcRole[] = ["partner", "fiance", "spouse"];
const FRIENDLY: NpcRole[] = ["friend", "bestFriend", "classmate", "coworker", "neighbor", "roommate", "collegeRoommate", "gymBuddy", "bandmate", "teammate"];
const FAMILY: NpcRole[] = ["mother", "father", "sibling", "grandparent", "stepparent", "child"];

/** Things you can do with a specific person. Different approaches, different relationships afterwards. */
export const SOCIAL_SCENARIOS = defineScenarios([
  {
    id: "sc-heart-to-heart",
    section: "people",
    group: "Go deeper",
    label: "Have a heart-to-heart",
    description: "Say what you actually feel",
    icon: "Heart",
    perYearPerPerson: 1,
    visible: (ctx) => alive(ctx) && ctx.player.age >= 10,
    approaches: [
      {
        id: "honest",
        label: "Be completely honest",
        outcomes: [
          { weight: pass("charisma", 40), text: "{npc} listened. You both said things you'd never said. You feel closer.", tone: "good", effects: [fx.close([8, 15]), fx.happy(4)] },
          { weight: fail("charisma", 40), text: "It came out wrong. {npc} went quiet and changed the subject.", tone: "bad", effects: [fx.close([-8, -2]), fx.happy(-3)] },
        ],
      },
      {
        id: "gentle",
        label: "Ease into it gently",
        outcomes: [out(4, "{npc} opened up slowly. It was lovely.", "good", fx.close([4, 9]), fx.happy(3)), out(2, "You talked about everything except the thing. It was still nice.", "neutral", fx.close(2))],
      },
      {
        id: "confront",
        label: "Bring up an old grievance",
        outcomes: [
          out(2, "You finally cleared the air. It was awful and then it was wonderful.", "good", fx.close([6, 12]), fx.happy(2)),
          out(3, "The old argument came roaring back. {npc} left in a huff.", "bad", fx.close([-14, -5]), fx.happy(-4)),
        ],
      },
    ],
  },
  {
    id: "sc-favor",
    section: "people",
    group: "Go deeper",
    label: "Ask for a favour",
    icon: "HandHeart",
    perYearPerPerson: 1,
    visible: (ctx) => alive(ctx) && ctx.player.age >= 14 && ctx.npc!.role !== "child",
    approaches: [
      {
        id: "small",
        label: "A small one (a lift, a loan of tools)",
        outcomes: [out(5, "{npc} happily helped.", "good", fx.close(2)), out(1, "{npc} said 'ugh, fine' and brought it up later.", "neutral", fx.close(-1))],
      },
      {
        id: "big",
        label: "A big one (money, a job reference, a place to stay)",
        outcomes: [
          { weight: (ctx) => 0.3 + ctx.npc!.closeness / 100, text: "{npc} came through for you in a big way. You owe them.", tone: "major", effects: [fx.cash(2000), fx.close(5), fx.happy(4)] },
          { weight: (ctx) => 1.2 - ctx.npc!.closeness / 100, text: "{npc} said no. It hurt to ask and it hurts more now.", tone: "bad", effects: [fx.close([-12, -4]), fx.happy(-4)] },
        ],
      },
      {
        id: "intro",
        label: "An introduction to someone useful",
        outcomes: [
          out(3, "{npc} made a call. A door opened.", "good", fx.skill("charisma", 1), fx.cash(500), fx.close(3)),
          out(2, "{npc} said they'd 'keep an eye out'. They won't.", "neutral", fx.close(-1)),
        ],
      },
    ],
  },
  {
    id: "sc-surprise",
    section: "people",
    group: "Go deeper",
    label: "Plan a surprise",
    icon: "Gift",
    perYearPerPerson: 1,
    visible: (ctx) => alive(ctx) && ctx.player.age >= 10 && (ROMANTIC.includes(ctx.npc!.role) || FRIENDLY.includes(ctx.npc!.role) || FAMILY.includes(ctx.npc!.role)),
    approaches: [
      {
        id: "party",
        label: "Throw a surprise party",
        cost: 300,
        outcomes: [
          out(4, "{npc} burst into tears when the lights came on. It was perfect.", "major", fx.close([8, 14]), fx.happy(5)),
          out(2, "Someone leaked the surprise. {npc} pretended to be shocked, bless them.", "good", fx.close([3, 6]), fx.happy(2)),
          out(1, "{npc} hates surprises and left early.", "bad", fx.close(-6), fx.happy(-3)),
        ],
      },
      {
        id: "trip",
        label: "Whisk them away for a weekend",
        cost: 1200,
        outcomes: [out(4, "Two nights somewhere gorgeous. {npc} still talks about it.", "major", fx.close([8, 14]), fx.happy(6)), out(2, "It rained the whole time, and somehow that was the best part.", "good", fx.close(6), fx.happy(4))],
      },
      {
        id: "handmade",
        label: "Make something by hand",
        outcomes: [
          { weight: pass("creativity", 40), text: "{npc} cried over what you made. It's on their wall.", tone: "good", effects: [fx.close([6, 11]), fx.skill("creativity", 1)] },
          { weight: fail("creativity", 40), text: "It looked like a melted candle. {npc} kept it anyway.", tone: "neutral", effects: [fx.close(4), fx.happy(1)] },
        ],
      },
    ],
  },
  {
    id: "sc-apology",
    section: "people",
    group: "Go deeper",
    label: "Mend a rift",
    icon: "HeartHandshake",
    perYearPerPerson: 1,
    visible: (ctx) => alive(ctx) && ctx.npc!.closeness < 45 && ctx.player.age >= 10,
    approaches: [
      {
        id: "apologize",
        label: "Apologize sincerely",
        outcomes: [out(3, "{npc} accepted. It took time, but things are better.", "good", fx.close([10, 20]), fx.karma(2)), out(2, "{npc} wasn't ready. They said 'maybe later'.", "neutral", fx.close(3))],
      },
      {
        id: "gift",
        label: "Make it up with a gift",
        cost: 150,
        outcomes: [out(3, "{npc} softened. Gifts do talk.", "good", fx.close([5, 12])), out(2, "{npc} saw straight through it.", "bad", fx.close(-4), fx.happy(-2))],
      },
      {
        id: "cut",
        label: "Cut them off for good",
        outcomes: [
          out(1, "It was a relief. You haven't looked back.", "neutral", fx.happy(3), fx.loseContact()),
          out(1, "It hurt more than you thought it would.", "bad", fx.happy(-4), fx.loseContact()),
        ],
      },
    ],
  },
  {
    id: "sc-date-night",
    section: "people",
    group: "Romance",
    label: "Plan a date",
    icon: "Heart",
    perYearPerPerson: 2,
    visible: (ctx) => alive(ctx) && (ROMANTIC.includes(ctx.npc!.role) || ctx.npc!.role === "date") && ctx.player.age >= 14,
    approaches: [
      {
        id: "cozy",
        label: "A cozy night in",
        outcomes: [out(5, "Pasta, a film, no phones. Exactly what you both needed.", "good", fx.close([4, 8]), fx.happy(3)), out(1, "You argued about what to watch for two hours.", "neutral", fx.close(1))],
      },
      {
        id: "fancy",
        label: "A fancy dinner",
        cost: 220,
        outcomes: [out(4, "Candlelight, a perfect table, a bottle of something good. Romance lives.", "good", fx.close([6, 12]), fx.happy(5)), out(2, "The waiter was rude and the soup was cold, but you laughed through it.", "neutral", fx.close(4), fx.happy(2)), out(1, "You got food poisoning. Both of you.", "bad", fx.health(-4), fx.close(-2))],
      },
      {
        id: "adventure",
        label: "An adventure date (hiking, climbing, go-karts)",
        cost: 120,
        outcomes: [
          out(3, "A thrilling day together. Adrenaline does wonders.", "good", fx.close([6, 11]), fx.happy(5)),
          out(2, "Someone got stuck at the top. It's a great story now.", "good", fx.close(5), fx.happy(3)),
          out(1, "One of you sprained something. The other was a saint.", "neutral", fx.close(4), fx.health(-3)),
        ],
      },
      {
        id: "meet-family",
        label: "Introduce them to your family",
        outcomes: [
          { weight: pass("charisma", 40), text: "{npc} charmed everyone. Your mum is already planning the wedding.", tone: "major", effects: [fx.close([8, 14]), fx.happy(5)] },
          { weight: fail("charisma", 40), text: "Dinner was a disaster. Your dad asked about their salary.", tone: "bad", effects: [fx.close([-6, 0]), fx.happy(-3)] },
        ],
      },
    ],
  },
  {
    id: "sc-argue",
    section: "people",
    group: "Romance",
    label: "Settle a disagreement",
    icon: "MessageSquare",
    perYearPerPerson: 1,
    visible: (ctx) => alive(ctx) && ROMANTIC.includes(ctx.npc!.role),
    approaches: [
      {
        id: "compromise",
        label: "Look for a compromise",
        outcomes: [out(4, "You met in the middle. Nobody won, which means you both did.", "good", fx.close([4, 8]), fx.karma(1)), out(1, "The compromise made everyone unhappy.", "neutral", fx.close(0))],
      },
      {
        id: "win",
        label: "Make your case and win",
        outcomes: [out(2, "You won the argument and lost something harder to measure.", "bad", fx.close([-8, -3]), fx.happy(-2)), out(2, "You made the better point, and {npc} agreed. Rare.", "good", fx.close(2), fx.happy(3))],
      },
      {
        id: "walk",
        label: "Take a walk and cool down",
        outcomes: [out(4, "You came back calmer. So did {npc}. It blew over.", "good", fx.close(3), fx.happy(2)), out(1, "{npc} took your leaving as a statement.", "bad", fx.close(-5))],
      },
    ],
  },
  {
    id: "sc-parent-time",
    section: "people",
    group: "Family",
    label: "Spend quality time",
    description: "More than just hanging out",
    icon: "Home",
    perYearPerPerson: 2,
    visible: (ctx) => alive(ctx) && FAMILY.includes(ctx.npc!.role),
    approaches: [
      {
        id: "cook",
        label: "Cook together",
        outcomes: [out(4, "You made a family recipe. It was a bit burned, and perfect.", "good", fx.close([5, 9]), fx.happy(4)), outThen(1, "{npc} taught you a secret recipe.", "good", "family-recipe-passed", fx.close(8), fx.happy(5))],
      },
      {
        id: "trip",
        label: "Take a day trip",
        cost: 200,
        outcomes: [out(4, "A day by the water. No phones. {npc} laughed more than they had in months.", "major", fx.close([7, 12]), fx.happy(5)), out(1, "The car broke down. Five hours later you had a story.", "neutral", fx.close(4), fx.happy(1))],
      },
      {
        id: "stories",
        label: "Ask about their past",
        outcomes: [out(3, "{npc} told you things you never knew. You'll remember all of it.", "major", fx.close([6, 10]), fx.smarts(1), fx.happy(3)), out(2, "{npc} said 'ancient history'. They didn't want to talk about it.", "neutral", fx.close(1))],
      },
    ],
  },
  {
    id: "sc-friend-trip",
    section: "people",
    group: "Friends",
    label: "Plan an outing",
    icon: "Compass",
    perYearPerPerson: 1,
    visible: (ctx) => alive(ctx) && FRIENDLY.includes(ctx.npc!.role) && ctx.player.age >= 8,
    approaches: [
      {
        id: "game-night",
        label: "Game night",
        cost: 40,
        outcomes: [out(4, "Board games turned into a shouting match. A fantastic one.", "good", fx.close([4, 8]), fx.happy(4)), out(1, "{npc} flipped the table. Metaphorically. Mostly.", "neutral", fx.close(-2), fx.happy(1))],
      },
      {
        id: "concert",
        label: "Go to a concert",
        cost: 180,
        outcomes: [out(4, "You screamed every word of every song.", "good", fx.close([5, 9]), fx.happy(6)), out(1, "You lost each other in the crowd and met by the exit, laughing.", "good", fx.close(6), fx.happy(4))],
      },
      {
        id: "weekend",
        label: "A weekend away",
        cost: 700,
        outcomes: [
          out(3, "A lakeside cabin and no plans. Bliss.", "major", fx.close([8, 14]), fx.happy(7)),
          out(2, "Someone fell in the lake. It was you. Everyone has the photos.", "good", fx.close(7), fx.happy(4)),
          out(1, "An argument about the bill ruined the last day.", "bad", fx.close(-5), fx.happy(-2)),
        ],
      },
    ],
  },
  {
    id: "sc-borrow-money",
    section: "people",
    group: "Money",
    label: "Lend or borrow money",
    icon: "Coins",
    perYearPerPerson: 1,
    visible: (ctx) => alive(ctx) && ctx.player.age >= 16 && ctx.npc!.role !== "child",
    approaches: [
      {
        id: "lend",
        label: "Lend them money",
        requires: (ctx) => (ctx.player.finance.cash < 800 * ctx.country.costIndex ? "You don't have enough to spare." : undefined),
        outcomes: [
          { weight: (ctx) => 0.4 + ctx.npc!.closeness / 100, text: "{npc} paid you back with interest — and a bottle of something nice.", tone: "good", effects: [fx.cash(100), fx.close(6), fx.karma(2)] },
          { weight: (ctx) => 0.9 - ctx.npc!.closeness / 150, text: "{npc} never paid you back, and now avoids your calls.", tone: "bad", effects: [fx.cash(-700), fx.close(-12), fx.happy(-3)] },
        ],
      },
      {
        id: "borrow",
        label: "Borrow from them",
        outcomes: [
          { weight: (ctx) => 0.3 + ctx.npc!.closeness / 100, text: "{npc} lent you a lifeline and said not to worry about it.", tone: "good", effects: [fx.cash(1500), fx.close(4), fx.karma(1)] },
          { weight: (ctx) => 1 - ctx.npc!.closeness / 120, text: "{npc} said no, and told a few mutual friends why.", tone: "bad", effects: [fx.close(-8), fx.happy(-4)] },
        ],
      },
      {
        id: "gift",
        label: "Gift them a chunk with no strings",
        requires: (ctx) => (ctx.player.finance.cash < 1500 * ctx.country.costIndex ? "You don't have enough to give away." : undefined),
        outcomes: [out(4, "{npc} was overwhelmed with gratitude. Karma, banked.", "major", fx.cash(-1000), fx.close(12), fx.karma(8), fx.happy(4)), out(1, "{npc} accepted it a little too readily.", "neutral", fx.cash(-1000), fx.close(3), fx.karma(5))],
      },
    ],
  },
]);
