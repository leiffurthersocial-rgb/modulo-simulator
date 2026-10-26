import { defineEvents, fail, fx, pass, when } from "@/engine/events/helpers";

export const CHILDHOOD_EVENTS = defineEvents("childhood", [
  {
    id: "child-lost-tooth",
    ages: [5, 8],
    once: true,
    text: "You lost your first tooth. The tooth fairy left {money:2} under your pillow.",
    tone: "good",
    effects: [fx.happy(3), fx.cash(2)],
  },
  {
    id: "child-new-classmate",
    ages: [6, 11],
    cooldown: 3,
    condition: when.inSchool("elementary"),
    npc: { kind: "new", role: "classmate", ageOffset: [0, 0], closeness: [25, 45] },
    text: "A new kid named {npc} joined your class. {npc.He} {npc.has} a lunchbox shaped like a {dinosaur|rocket|robot}.",
    choices: [
      {
        label: "Invite {npc.him} to sit with you",
        outcomes: [
          { weight: pass("charisma", 25), text: "You and {npc} became friends almost immediately.", tone: "good", effects: [fx.close([20, 30]), fx.happy(4), fx.custom(({ npc }) => { if (npc) npc.role = "friend"; })] },
          { weight: fail("charisma", 25), text: "{npc} sat with you but spent lunch talking to someone else.", effects: [fx.close(5)] },
        ],
      },
      {
        label: "Ignore {npc.him}",
        outcomes: [{ text: "You ignored {npc}. {npc.He} found other friends.", effects: [fx.close(-10)] }],
      },
      {
        label: "Make fun of the lunchbox",
        outcomes: [
          { text: "You mocked {npc}'s lunchbox in front of everyone. {npc.He} will remember this.", tone: "bad", effects: [fx.close(-25), fx.karma(-3), fx.tag("bullied"), fx.flag("bulliedNewKid"), fx.schedule("callback-bullied-kid-returns", [15, 25], true)] },
        ],
      },
    ],
  },
  {
    id: "callback-bullied-kid-returns",
    category: "callback",
    ages: [18, 60],
    triggeredOnly: true,
    text: "You ran into {npc.full}, the kid whose lunchbox you mocked years ago. {npc.He} {npc.is} doing {great|fine|better than you, honestly}.",
    choices: [
      {
        label: "Apologize",
        outcomes: [
          { weight: 3, text: "{npc} laughed it off and bought you a coffee. Old wounds, closed.", tone: "good", effects: [fx.karma(4), fx.close([20, 35]), fx.happy(3)] },
          { weight: 1, text: '{npc} stared at you and said "I know." Then {npc.he} walked away.', effects: [fx.karma(2), fx.happy(-2)] },
        ],
      },
      {
        label: "Pretend not to recognize {npc.him}",
        outcomes: [{ text: "You pretended not to know {npc}. {npc.He} definitely recognized you.", effects: [fx.karma(-1)] }],
      },
    ],
  },
  {
    id: "child-spelling-bee",
    ages: [8, 12],
    once: true,
    condition: when.inSchool(),
    title: "Spelling bee",
    text: 'You made the final round of the school spelling bee. Your word is "{onomatopoeia|bureaucracy|rhythm|chrysanthemum}."',
    choices: [
      {
        label: "Spell it carefully",
        outcomes: [
          { weight: pass("smarts", 55), text: "You spelled it perfectly and won the school spelling bee.", tone: "good", effects: [fx.happy(6), fx.smarts(2), fx.achieve("spelling-bee-champ")] },
          { weight: fail("smarts", 55), text: "You missed one letter. Second place. You'll think about it at 3 a.m. for years.", effects: [fx.happy(-3)] },
        ],
      },
      {
        label: "Ask for it in a sentence. Repeatedly.",
        outcomes: [{ text: "You asked for the word in a sentence eleven times before being disqualified for stalling.", effects: [fx.happy(-1), fx.skill("charisma", 1)] }],
      },
    ],
  },
  {
    id: "child-school-play",
    ages: [6, 12],
    once: true,
    condition: when.inSchool(),
    text: "You were cast as {a tree|Third Villager|the back half of a horse|the narrator} in the school play.",
    choices: [
      {
        label: "Commit to the role",
        outcomes: [
          { weight: pass("creativity", 30), text: "You stole the show. Parents talked about your performance in the parking lot.", tone: "good", effects: [fx.skill("creativity", [2, 4]), fx.skill("charisma", 2), fx.happy(5), fx.flag("childActor")] },
          { weight: fail("creativity", 30), text: "You forgot your one line and stood there in silence.", effects: [fx.happy(-3)] },
        ],
      },
      {
        label: "Fake being sick on opening night",
        outcomes: [{ text: "You faked a fever. Your understudy was thrilled.", effects: [fx.karma(-1)] }],
      },
    ],
  },
  {
    id: "child-found-wallet",
    ages: [8, 14],
    once: true,
    text: "You found a wallet on the sidewalk with {money:60} inside.",
    choices: [
      {
        label: "Turn it in",
        outcomes: [{ text: "You handed the wallet to the police. The owner sent you a thank-you card.", tone: "good", effects: [fx.karma(5), fx.happy(2), fx.flag("returnedWallet")] }],
      },
      {
        label: "Keep the cash, toss the wallet",
        outcomes: [{ text: "You pocketed {amount}.", effects: [fx.cash(60), fx.karma(-4)] }],
      },
    ],
  },
  {
    id: "child-broken-arm",
    ages: [5, 13],
    once: true,
    text: "You broke your arm falling off the {monkey bars|trampoline|garage roof}. Everyone signed your cast.",
    tone: "bad",
    effects: [fx.health([-8, -4]), fx.happy(-2)],
  },
  {
    id: "child-parents-argue",
    ages: [5, 14],
    cooldown: 4,
    condition: when.all(when.hasLiving("mother"), when.hasLiving("father")),
    text: "Your parents had a loud argument about {money|your grandmother|who forgot to pay the electric bill}. You heard everything.",
    tone: "bad",
    effects: [fx.happy([-6, -2])],
  },
  {
    id: "child-library-card",
    ages: [6, 12],
    once: true,
    text: "You got your first library card.",
    choices: [
      {
        label: "Read everything",
        outcomes: [{ text: "You read {forty|sixty|a frankly concerning number of} books that year.", tone: "good", effects: [fx.smarts([3, 6]), fx.skill("creativity", 2), fx.flag("bookworm")] }],
      },
      {
        label: "Mostly use it for comics",
        outcomes: [{ text: "You became an expert in a fictional universe's convoluted timeline.", effects: [fx.smarts(1), fx.happy(3)] }],
      },
    ],
  },
  {
    id: "child-poor-free-lunch",
    ages: [6, 13],
    once: true,
    condition: when.wealth("poor"),
    text: "You got free school lunch. A classmate made sure everyone noticed.",
    effects: [fx.happy(-4), fx.skill("streetSmarts", 2)],
  },
  {
    id: "child-grandma-cash",
    ages: [5, 12],
    cooldown: 3,
    text: "A relative pressed {money:20} into your hand and told you not to tell your parents.",
    tone: "good",
    effects: [fx.cash(20), fx.happy(2)],
  },
]);
