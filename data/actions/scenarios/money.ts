import { defineScenarios } from "@/engine/actionHelpers";
import { fail, fx, pass } from "@/engine/events/helpers";
import { between, minAge, out, outThen } from "./kit";

/** Ways of making (and losing) money, each with its own odds. */
export const MONEY_SCENARIOS = defineScenarios([
  {
    id: "sc-money-invest-friend",
    section: "money",
    group: "Opportunities",
    label: "A friend's business pitch",
    icon: "Rocket",
    visible: minAge(20),
    approaches: [
      {
        id: "small",
        label: "Put in a small stake",
        cost: 1000,
        outcomes: [out(3, "It quietly returned your stake with a little extra.", "good", fx.cash(1400)), out(3, "The business closed within a year. You wrote off the loss.", "bad", fx.happy(-2)), out(0.7, "It exploded. Your small stake became a very nice cheque.", "major", fx.cash(14000), fx.happy(6))],
      },
      {
        id: "big",
        label: "Go all-in",
        cost: 8000,
        outcomes: [out(2, "They hit a gold mine. You tripled your money.", "major", fx.cash(26000), fx.happy(8)), out(5, "It collapsed in spectacular fashion. Your friend stopped answering your calls.", "bad", fx.happy(-8), fx.karma(0)), out(2, "It limped along and returned your money, slowly.", "neutral", fx.cash(8500))],
      },
      {
        id: "advise",
        label: "Offer advice instead of cash",
        outcomes: [{ weight: pass("smarts", 50), text: "Your advice was sound. Your friend gave you a cut for it.", tone: "good", effects: [fx.cash(1200), fx.karma(2), fx.happy(3)] }, { weight: fail("smarts", 50), text: "Your friend ignored you and lost money. 'I told you so' is not welcome.", tone: "neutral", effects: [fx.happy(-1)] }],
      },
    ],
  },
  {
    id: "sc-money-flea",
    section: "money",
    group: "Opportunities",
    label: "Flip something for profit",
    icon: "Tag",
    perYear: 3,
    visible: minAge(14),
    approaches: [
      {
        id: "yard-sale",
        label: "Buy at yard sales and resell online",
        cost: 120,
        outcomes: [
          { weight: pass("streetSmarts", 40), text: "You spotted a collectible a seller thought was junk. Pure profit.", tone: "good", effects: [fx.cash(400), fx.skill("streetSmarts", 1)] },
          { weight: fail("streetSmarts", 40), text: "Nobody wanted your haul. It's stacked in your hallway.", tone: "bad", effects: [fx.happy(-1)] },
        ],
      },
      {
        id: "sneakers",
        label: "Buy limited-edition sneakers",
        cost: 600,
        outcomes: [out(3, "Sold for triple on the aftermarket. You are a genius.", "good", fx.cash(1800)), out(3, "The hype died overnight. You sold at a loss.", "bad", fx.cash(-200)), out(1, "A celebrity wore them on TV. You made a killing.", "major", fx.cash(6500), fx.happy(5))],
      },
      {
        id: "estate",
        label: "Bid on a storage unit",
        cost: 300,
        outcomes: [
          out(3, "Mostly boxes of old magazines and a broken lamp.", "bad", fx.happy(-1)),
          out(2, "A few things were genuinely good. Small win.", "good", fx.cash(800)),
          out(0.5, "Behind the junk was an antique worth thousands.", "major", fx.cash(7500), fx.happy(5)),
          out(0.5, "You found something you were not supposed to find. You quietly walked away.", "bad", fx.skill("streetSmarts", 3), fx.happy(-3)),
        ],
      },
    ],
  },
  {
    id: "sc-money-tax-time",
    section: "money",
    group: "Admin",
    label: "Sort out your taxes",
    icon: "FileText",
    visible: (ctx) => ctx.player.age >= 18 && ctx.player.finance.lastYearIncome > 0 && !ctx.player.crime.prison,
    approaches: [
      {
        id: "honest",
        label: "File honestly yourself",
        outcomes: [out(4, "You filed on time. You found two deductions you'd missed.", "good", fx.cash(120)), out(1, "You made an arithmetic mistake and had to refile.", "neutral", fx.happy(-1))],
      },
      {
        id: "accountant",
        label: "Hire an accountant",
        cost: 400,
        outcomes: [out(4, "Your accountant found a tidy refund.", "good", fx.cash(900), fx.happy(2)), out(1, "They found nothing special, but the stress was gone.", "neutral", fx.happy(2))],
      },
      {
        id: "dodge",
        label: "Fudge the numbers",
        outcomes: [out(3, "Nobody checked. You pocketed a few extra thousand.", "neutral", fx.cash(3000), fx.karma(-4)), out(2, "You were audited. The fine was brutal.", "bad", fx.cash(-5000), fx.karma(-4), fx.happy(-6))],
      },
    ],
  },
  {
    id: "sc-money-negotiate",
    section: "money",
    group: "Admin",
    label: "Negotiate a big purchase",
    icon: "Handshake",
    visible: minAge(18),
    approaches: [
      {
        id: "haggle",
        label: "Haggle hard",
        outcomes: [{ weight: pass("charisma", 45), text: "You walked away with 18% off and a free extended warranty.", tone: "good", effects: [fx.cash(700), fx.skill("charisma", 1)] }, { weight: fail("charisma", 45), text: "The salesman called your bluff. You paid full price.", tone: "bad", effects: [fx.happy(-1)] }],
      },
      {
        id: "research",
        label: "Research thoroughly and compare",
        outcomes: [out(4, "You found a significantly better price. Patience pays.", "good", fx.cash(500), fx.smarts(1)), out(1, "You researched so long the sale ended.", "neutral")],
      },
    ],
  },
  {
    id: "sc-money-giving",
    section: "money",
    group: "Admin",
    label: "Give to charity",
    icon: "HandHeart",
    visible: minAge(16),
    approaches: [
      {
        id: "small",
        label: "A small donation",
        cost: 100,
        outcomes: [out(1, "You gave what you could and felt a small warmth.", "good", fx.karma(4), fx.happy(2))],
      },
      {
        id: "large",
        label: "A serious donation",
        cost: 3000,
        outcomes: [out(3, "A hospital wing now bears your name. Well, a corridor.", "major", fx.karma(14), fx.happy(5), fx.fame(1)), out(1, "The charity used the funds poorly. You were bitterly disappointed.", "neutral", fx.karma(8), fx.happy(-2))],
      },
      {
        id: "anon",
        label: "Anonymous, but big",
        cost: 6000,
        outcomes: [out(1, "Nobody knows it was you. That is the best part.", "major", fx.karma(22), fx.happy(9))],
      },
    ],
  },
  {
    id: "sc-money-crypto",
    section: "money",
    group: "Opportunities",
    label: "A hot tip",
    description: "Everyone is talking about it",
    icon: "TrendingUp",
    visible: between(18, 80),
    approaches: [
      {
        id: "dabble",
        label: "Dabble with spare change",
        cost: 500,
        outcomes: [out(3, "It dipped, then recovered. Net zero and a lot of anxiety.", "neutral", fx.cash(500)), out(3, "It tanked. Your money is gone.", "bad", fx.happy(-2)), out(1, "It doubled. You told everyone.", "good", fx.cash(1100), fx.happy(3))],
      },
      {
        id: "yolo",
        label: "Put in your savings",
        cost: 6000,
        outcomes: [out(1, "It went to the moon. You're insufferable at parties.", "major", fx.cash(40000), fx.happy(10)), out(5, "It went to zero. You stared at the screen in silence for an hour.", "bad", fx.happy(-9), fx.health(-2)), out(2, "It was a scam. You reported it to the authorities.", "bad", fx.happy(-5), fx.skill("streetSmarts", 2))],
      },
      {
        id: "skip",
        label: "Ignore the hype",
        outcomes: [out(5, "It crashed a month later. You smugly enjoyed your day.", "good", fx.happy(2), fx.skill("streetSmarts", 1)), out(2, "It soared. You tried to not think about it.", "neutral", fx.happy(-2))],
      },
    ],
  },
  {
    id: "sc-money-gig",
    section: "money",
    group: "Quick cash",
    label: "Pick up a weekend gig",
    icon: "Hammer",
    perYear: 3,
    visible: minAge(14),
    approaches: [
      {
        id: "moving",
        label: "Help people move house",
        outcomes: [{ weight: pass("athleticism", 35), text: "Heavy work, decent pay, and a pizza lunch.", tone: "good", effects: [fx.cash(250), fx.skill("athleticism", 1)] }, { weight: fail("athleticism", 35), text: "You dropped a stranger's piano. The tip was withheld.", tone: "bad", effects: [fx.cash(-120), fx.health(-2)] }],
      },
      {
        id: "extra",
        label: "Be a film extra",
        outcomes: [out(3, "Twelve hours of standing in the background. The catering was great.", "neutral", fx.cash(200), fx.happy(1)), out(1, "The director liked your face and gave you a line.", "major", fx.cash(600), fx.fame(1), fx.happy(5))],
      },
      {
        id: "survey",
        label: "Take paid research studies",
        outcomes: [out(3, "Easy money for a few hours of questionnaires.", "neutral", fx.cash(180)), out(1, "A study turned out to have fun side effects. Mostly itching.", "bad", fx.cash(300), fx.health(-3))],
      },
      {
        id: "odd-jobs",
        label: "Do odd jobs around the neighbourhood",
        outcomes: [out(4, "You mowed lawns and cleaned gutters. A tidy sum and several new friends.", "good", fx.cash(260), fx.karma(1)), outThen(1, "An elderly neighbour was so grateful that she wrote you into her will.", "good", "will-neighbor-bequest", fx.cash(100), fx.karma(3))],
      },
    ],
  },
]);
