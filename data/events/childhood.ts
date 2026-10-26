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
  {
    id: "child-pet-request",
    ages: [6, 12],
    once: true,
    title: "Can we get a dog?",
    text: "You've been begging your parents for a pet for months.",
    choices: [
      {
        label: "Promise to walk it every day",
        outcomes: [
          { weight: 1, text: "Your parents caved. You named your new puppy {Biscuit|Pickles|Captain|Waffles}. You walked it twice.", tone: "good", effects: [fx.happy(8), fx.flag("childhoodPet")] },
          { weight: 1, text: "Your parents said no. Their reasons involved the carpet.", effects: [fx.happy(-3)] },
        ],
      },
      {
        label: "Settle for a goldfish",
        outcomes: [{ text: "You got a goldfish named {Bubbles|Sir Swims|Gary}. It lived a surprisingly long time.", effects: [fx.happy(2)] }],
      },
    ],
  },
  {
    id: "child-broke-vase",
    ages: [5, 11],
    once: true,
    title: "Crash",
    text: "You broke your {mom|dad}'s favorite vase playing ball in the house.",
    choices: [
      {
        label: "Confess",
        outcomes: [{ text: "You confessed. You were grounded, but your parents were proud you told the truth.", tone: "good", effects: [fx.karma(3), fx.close(3, "mother"), fx.flag("honestKid")] }],
      },
      {
        label: "Blame a sibling",
        condition: when.hasLiving("sibling"),
        outcomes: [
          { weight: pass("streetSmarts", 40), text: "Your sibling got blamed. You'll take that to the grave.", effects: [fx.karma(-3), fx.close(-5, "sibling")] },
          { weight: fail("streetSmarts", 40), text: "Your sibling had an alibi. You were grounded for a month.", tone: "bad", effects: [fx.karma(-3), fx.happy(-4), fx.close(-8, "sibling")] },
        ],
      },
      {
        label: "Blame the cat",
        outcomes: [{ text: "You blamed the cat. You don't have a cat. Grounded.", tone: "bad", effects: [fx.happy(-3), fx.karma(-1)] }],
      },
    ],
  },
  {
    id: "child-bike",
    ages: [5, 9],
    once: true,
    text: "You learned to ride a bike {without training wheels|after crashing into a hedge eleven times}.",
    tone: "good",
    effects: [fx.skill("athleticism", 2), fx.happy(3)],
  },
  {
    id: "child-swimming",
    ages: [5, 10],
    once: true,
    text: "You learned to swim. Technically it was more of an aggressive dog paddle.",
    effects: [fx.skill("athleticism", 2), fx.health(1)],
  },
  {
    id: "child-chicken-pox",
    ages: [3, 10],
    once: true,
    text: "You got chickenpox and spent two weeks itching in oven mitts.",
    tone: "bad",
    effects: [fx.health([-4, -2]), fx.happy(-3)],
  },
  {
    id: "child-santa",
    ages: [6, 9],
    once: true,
    text: "You {found the presents in the closet|caught your dad eating the cookies|did the math on the chimney} and figured out the truth about the gift-bringer.",
    effects: [fx.smarts(1), fx.happy(-1)],
  },
  {
    id: "child-lemonade",
    ages: [6, 11],
    once: true,
    title: "Business plan",
    text: "You want to open a lemonade stand.",
    choices: [
      {
        label: "Undercut the competition",
        outcomes: [{ text: "You sold lemonade for a quarter and made {money:18}. The kid down the street went out of business.", tone: "good", effects: [fx.cash(18), fx.skill("streetSmarts", 2), fx.flag("childEntrepreneur")] }],
      },
      {
        label: "Charge premium prices",
        outcomes: [
          { weight: pass("charisma", 35), text: "You marketed it as artisanal. You made {money:40}.", tone: "good", effects: [fx.cash(40), fx.skill("charisma", 2), fx.flag("childEntrepreneur")] },
          { weight: fail("charisma", 35), text: "Nobody paid premium prices for lemonade made from powder.", effects: [fx.happy(-2)] },
        ],
      },
      {
        label: "Drink the inventory",
        outcomes: [{ text: "You drank all the lemonade yourself. No regrets." , effects: [fx.happy(2)] }],
      },
    ],
  },
  {
    id: "child-divorce",
    ages: [4, 16],
    once: true,
    weight: 0.6,
    condition: when.all(when.hasLiving("mother"), when.hasLiving("father")),
    text: "Your parents sat you down and told you they're getting divorced.",
    tone: "major",
    effects: [
      fx.happy([-12, -6]),
      fx.flag("parentsDivorced"),
      fx.custom((ctx) => {
        const dad = Object.values(ctx.state.npcs).find((n) => n.role === "father" && n.alive);
        if (dad) dad.closeness = Math.max(0, dad.closeness - 15);
      }),
    ],
  },
  {
    id: "child-stepparent",
    ages: [6, 17],
    once: true,
    condition: when.flag("parentsDivorced"),
    npc: { kind: "new", role: "stepparent", age: [28, 50], closeness: [25, 50] },
    title: "New family",
    text: "Your {mom|dad} is getting remarried to {npc.full}.",
    choices: [
      {
        label: "Give {npc.him} a chance",
        outcomes: [{ text: "{npc} turned out to be alright. {npc.He} make{npc.s} great pancakes.", tone: "good", effects: [fx.close(20), fx.happy(2)] }],
      },
      {
        label: "Make {npc.his} life miserable",
        outcomes: [{ text: "You declared war on {npc}. Dinners became tense.", tone: "bad", effects: [fx.close(-20), fx.karma(-2), fx.happy(-2)] }],
      },
    ],
  },
  {
    id: "child-grandparent-visit",
    ages: [4, 12],
    once: true,
    npc: { kind: "new", role: "grandparent", age: [58, 80], closeness: [50, 80] },
    text: "You spent the summer with your {grandma|grandpa}, {npc}, who taught you {to fish|to play cards and cheat at them|every swear word in two languages}.",
    tone: "good",
    effects: [fx.happy(5), fx.skill("streetSmarts", 1)],
  },
  {
    id: "child-grandparent-dies",
    ages: [6, 30],
    once: true,
    weight: 0.7,
    npc: { kind: "existing", roles: ["grandparent"] },
    text: "Your grandparent {npc} passed away peacefully. {npc.He} left you a {pocket watch|recipe book|box of old letters}.",
    tone: "bad",
    effects: [
      fx.happy(-6),
      fx.custom(({ npc }) => {
        if (npc) {
          npc.alive = false;
          npc.deathAge = npc.age;
        }
      }),
    ],
  },
  {
    id: "child-lost-at-mall",
    ages: [4, 7],
    once: true,
    text: "You got lost at the mall. Security announced your name over the speakers.",
    effects: [fx.happy(-2)],
  },
  {
    id: "child-hide-and-seek",
    ages: [5, 10],
    once: true,
    text: "You hid so well during hide-and-seek that everyone gave up and went home.",
    effects: [fx.skill("streetSmarts", 1)],
  },
  {
    id: "child-stray-cat",
    ages: [6, 13],
    once: true,
    title: "A stray",
    text: "A scruffy stray cat followed you home from school.",
    choices: [
      {
        label: "Sneak it into your room",
        outcomes: [
          { weight: 1, text: "You hid the cat for three weeks before your parents noticed. They let you keep it.", tone: "good", effects: [fx.happy(6), fx.flag("childhoodPet")] },
          { weight: 1, text: "Your parents found the cat on day one and drove it to a shelter.", tone: "bad", effects: [fx.happy(-4)] },
        ],
      },
      {
        label: "Take it to a shelter",
        outcomes: [{ text: "You took the cat to a shelter. A family adopted it the next week.", tone: "good", effects: [fx.karma(3)] }],
      },
      {
        label: "Shoo it away",
        outcomes: [{ text: "You shooed the cat away. It looked at you like it would remember this.", effects: [fx.karma(-1)] }],
      },
    ],
  },
  {
    id: "child-allowance",
    ages: [7, 12],
    once: true,
    condition: when.wealth("middle", "upper", "rich"),
    text: "Your parents started giving you an allowance of {money:5} a week for chores.",
    effects: [fx.cash(250), fx.skill("streetSmarts", 1)],
  },
  {
    id: "child-rich-birthday",
    ages: [6, 13],
    once: true,
    condition: when.wealth("rich"),
    text: "Your parents threw you a birthday party with {a pony|a professional magician|a rented-out water park}. You've never been so spoiled.",
    tone: "good",
    effects: [fx.happy(6), fx.karma(-1)],
  },
  {
    id: "child-poor-hand-me-downs",
    ages: [6, 14],
    once: true,
    condition: when.wealth("poor", "working"),
    text: "You wore hand-me-down shoes two sizes too big. You learned to tie them very tight.",
    effects: [fx.happy(-2), fx.skill("streetSmarts", 2)],
  },
  {
    id: "child-power-outage",
    ages: [5, 14],
    once: true,
    text: "A storm knocked out the power for three days. Your family played board games by candlelight and only one fight broke out.",
    effects: [fx.happy(2), fx.close(3, "mother")],
  },
  {
    id: "child-nightmare",
    ages: [4, 9],
    once: true,
    text: "You were convinced a monster lived {under your bed|in the closet|in the basement}. You slept with the lights on for a year.",
    effects: [fx.happy(-1), fx.skill("creativity", 1)],
  },
  {
    id: "child-musical-instrument",
    ages: [6, 12],
    once: true,
    title: "Music lessons",
    text: "Your parents want you to learn an instrument.",
    choices: [
      {
        label: "Piano",
        outcomes: [{ text: "You started piano lessons with a strict teacher who smelled like peppermint.", effects: [fx.skill("creativity", 3), fx.flag("instrument", "piano")] }],
      },
      {
        label: "Guitar",
        outcomes: [{ text: "You learned three chords and played them constantly.", effects: [fx.skill("creativity", 3), fx.flag("instrument", "guitar")] }],
      },
      {
        label: "Drums",
        outcomes: [{ text: "You started drums. Your neighbors started a petition.", effects: [fx.skill("creativity", 3), fx.flag("instrument", "drums")] }],
      },
      {
        label: "Refuse",
        outcomes: [{ text: "You refused music lessons. Your parents sighed in harmony." }],
      },
    ],
  },
  {
    id: "child-shoplift-candy",
    ages: [7, 12],
    once: true,
    title: "Candy aisle",
    text: "Your friend dares you to pocket a candy bar at the corner store.",
    choices: [
      {
        label: "Do it",
        outcomes: [
          { weight: pass("streetSmarts", 30), text: "You walked out with the candy bar. Your heart pounded for an hour.", effects: [fx.karma(-2), fx.skill("streetSmarts", 2), fx.flag("childShoplifter")] },
          { weight: fail("streetSmarts", 30), text: "The shopkeeper caught you and called your parents. Humiliating.", tone: "bad", effects: [fx.karma(-2), fx.happy(-4), fx.close(-5, "mother")] },
        ],
      },
      {
        label: "Refuse",
        outcomes: [{ text: "You refused. Your friend called you chicken. You bought the candy bar with your own money.", effects: [fx.karma(2)] }],
      },
    ],
  },
  {
    id: "child-hospital-stitches",
    ages: [5, 12],
    once: true,
    text: "You needed {four|seven|eleven} stitches after {jumping off a swing at full height|a disagreement with a fence|testing whether you could fly}.",
    tone: "bad",
    effects: [fx.health(-3)],
  },
  {
    id: "child-summer-camp",
    ages: [8, 14],
    once: true,
    condition: when.wealth("middle", "upper", "rich"),
    npc: { kind: "new", role: "friend", ageOffset: [0, 1], closeness: [50, 70] },
    text: "At summer camp you met {npc}. You swore to be friends forever and traded friendship bracelets.",
    tone: "good",
    effects: [fx.happy(5), fx.skill("athleticism", 1)],
  },
  {
    id: "child-overheard-money",
    ages: [8, 15],
    once: true,
    condition: when.wealth("poor", "working"),
    text: "You overheard your parents whispering about money at the kitchen table. You stopped asking for things.",
    tone: "bad",
    effects: [fx.happy(-3), fx.karma(1)],
  },
]);
