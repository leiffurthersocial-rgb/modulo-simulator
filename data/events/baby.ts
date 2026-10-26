import { defineEvents, fx, when } from "@/engine/events/helpers";

export const BABY_EVENTS = defineEvents("baby", [
  {
    id: "baby-first-word",
    ages: [1, 2],
    once: true,
    text: [
      'Your first word was "{no|mine|dog|uh-oh|bye}." Your parents pretended it was "mama."',
      'Your first word was "{ball|cookie|car|cat}." It was used constantly for the next eight months.',
    ],
    tone: "good",
    effects: [fx.happy([2, 5]), fx.smarts([1, 3])],
  },
  {
    id: "baby-first-steps",
    ages: [1, 1],
    once: true,
    text: "You took your first steps, straight into a coffee table.",
    effects: [fx.skill("athleticism", [1, 3]), fx.health(-1)],
  },
  {
    id: "baby-ate-crayon",
    ages: [1, 4],
    once: true,
    text: "You ate a {blue|green|red} crayon. It did not taste like the color promised.",
    effects: [fx.health(-1)],
  },
  {
    id: "baby-ear-infection",
    ages: [0, 3],
    once: true,
    text: "You had a nasty ear infection and screamed through three consecutive nights.",
    tone: "bad",
    effects: [fx.health([-6, -2]), fx.happy(-3), fx.close(-2, "mother")],
  },
  {
    id: "toddler-tantrum",
    ages: [2, 4],
    cooldown: 2,
    title: "Meltdown in aisle five",
    text: "Your {mom|dad} refused to buy you a candy bar at the supermarket.",
    choices: [
      {
        label: "Throw a legendary tantrum",
        outcomes: [
          { weight: 2, text: "You screamed until a stranger offered advice. You did not get the candy.", tone: "bad", effects: [fx.happy(-3), fx.close(-3, "mother")] },
          { weight: 1, text: "Your tantrum worked. You learned a terrible lesson.", effects: [fx.happy(4), fx.karma(-1)] },
        ],
      },
      {
        label: "Accept it with quiet dignity",
        outcomes: [{ text: "You accepted the ruling. The cashier gave you a sticker for being so good.", tone: "good", effects: [fx.happy(2), fx.karma(1)] }],
      },
    ],
  },
  {
    id: "toddler-imaginary-friend",
    ages: [3, 5],
    once: true,
    text: "You invented an imaginary friend named {Mr. Biscuits|Captain Zog|Princess Lulu|Greg}.",
    choices: [
      {
        label: "Keep them around",
        outcomes: [{ text: "Your imaginary friend got their own seat at dinner.", effects: [fx.skill("creativity", [2, 4]), fx.flag("imaginaryFriend")] }],
      },
      {
        label: "Tell them to get lost",
        outcomes: [{ text: "You fired your imaginary friend. They took it surprisingly well.", effects: [fx.happy(-1)] }],
      },
    ],
  },
  {
    id: "toddler-sibling-bite",
    ages: [2, 5],
    once: true,
    npc: { kind: "existing", roles: ["sibling"] },
    text: "{npc} took your toy without asking.",
    choices: [
      {
        label: "Bite {npc.him}",
        outcomes: [{ text: "You bit {npc}. You were both crying within seconds.", tone: "bad", effects: [fx.close(-6), fx.karma(-1), fx.flag("biter")] }],
      },
      {
        label: "Tell a grown-up",
        outcomes: [{ text: "Justice was served. {npc} gave the toy back with a glare.", effects: [fx.close(-2), fx.happy(2)] }],
      },
      {
        label: "Let {npc.him} have it",
        outcomes: [{ text: "You let {npc} keep the toy. {npc.He} seemed confused by your generosity.", tone: "good", effects: [fx.close(5), fx.karma(1)] }],
      },
    ],
  },
  {
    id: "toddler-wealthy-nanny",
    ages: [1, 4],
    once: true,
    condition: when.wealth("upper", "rich"),
    text: "Your parents hired a nanny who speaks to you exclusively in {French|Mandarin|Spanish}.",
    effects: [fx.smarts([2, 4])],
  },
]);
