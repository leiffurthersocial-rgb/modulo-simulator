import { defineEvents, fail, fx, pass, when } from "@/engine/events/helpers";

export const TEEN_EVENTS = defineEvents("teen", [
  {
    id: "teen-puberty",
    ages: [12, 14],
    once: true,
    text: "Puberty arrived {like a freight train|slowly, then all at once|with zero warning}. Your voice, skin, and mood were all affected.",
    effects: [fx.looks([-4, 4]), fx.happy(-2)],
  },
  {
    id: "teen-acne",
    ages: [13, 17],
    once: true,
    weight: 0.8,
    title: "Breakout",
    text: "You woke up with a constellation of pimples the day before school photos.",
    choices: [
      {
        label: "Pop them",
        outcomes: [{ text: "You popped them. It was worse. It's always worse.", tone: "bad", effects: [fx.looks(-3)] }],
      },
      {
        label: "Ask a parent for help",
        outcomes: [{ text: "Your {mom|dad} taught you about concealer and dignity.", effects: [fx.close(4, "mother")] }],
      },
      {
        label: "Own it",
        outcomes: [{ text: "You smiled big in the photo. It's honestly a great picture.", tone: "good", effects: [fx.happy(2)] }],
      },
    ],
  },
  {
    id: "teen-orientation",
    ages: [13, 17],
    once: true,
    title: "Figuring things out",
    text: "Lately you've been thinking a lot about who you're attracted to.",
    choices: [
      { id: "men", label: "Men", outcomes: [{ text: "You realized you're into guys.", effects: [fx.custom((ctx) => { ctx.player.attraction = "men"; })] }] },
      { id: "women", label: "Women", outcomes: [{ text: "You realized you're into girls.", effects: [fx.custom((ctx) => { ctx.player.attraction = "women"; })] }] },
      { id: "everyone", label: "Everyone", outcomes: [{ text: "You realized you're into people, full stop.", effects: [fx.custom((ctx) => { ctx.player.attraction = "everyone"; })] }] },
    ],
  },
  {
    id: "teen-crush",
    ages: [12, 17],
    cooldown: 2,
    condition: when.single,
    npc: { kind: "new", role: "partner", ageOffset: [-1, 1], gender: "attracted", closeness: [30, 50], keep: false },
    title: "Crush",
    text: "You can't stop thinking about {npc} from {math class|the bus|the cafeteria|your street}.",
    choices: [
      {
        label: "Ask {npc.him} out",
        outcomes: [
          {
            weight: (ctx) => 0.2 + ctx.player.stats.looks / 180 + ctx.player.skills.charisma / 200,
            text: "{npc} said yes! You're officially dating.",
            tone: "good",
            effects: [
              fx.happy(8),
              fx.custom(({ npc }) => {
                if (npc) {
                  npc.inContact = true;
                  npc.tags = npc.tags.filter((t) => t !== "oneOff");
                  npc.closeness = 65;
                }
              }),
              fx.flag("firstRelationship"),
            ],
          },
          { weight: (ctx) => 0.8 - ctx.player.stats.looks / 180 - ctx.player.skills.charisma / 200, text: "{npc} said {npc.he} \"liked you as a friend.\" Devastating.", tone: "bad", effects: [fx.happy(-6)] },
        ],
      },
      {
        label: "Send an anonymous note",
        outcomes: [{ text: "You slipped {npc} an anonymous note. {npc.He} never figured out it was you.", effects: [fx.happy(-1)] }],
      },
      {
        label: "Admire from afar",
        outcomes: [{ text: "You admired {npc} from afar. It passed, like a weather system." }],
      },
    ],
  },
  {
    id: "teen-first-kiss",
    ages: [13, 17],
    once: true,
    npc: { kind: "existing", roles: ["partner"] },
    text: "You had your first kiss with {npc} {behind the gym|at a party|at the movies|on a park bench}. It was {awkward|perfect|mostly teeth}.",
    tone: "good",
    effects: [fx.happy(6), fx.close(8), fx.flag("firstKiss")],
  },
  {
    id: "teen-breakup",
    ages: [13, 19],
    cooldown: 2,
    npc: { kind: "existing", roles: ["partner"], filter: (n) => n.age < 21 },
    weight: 1.5,
    text: "{npc} broke up with you {by text|in front of everyone|with a surprisingly mature speech}.",
    tone: "bad",
    effects: [fx.happy([-10, -5]), fx.custom(({ npc }) => { if (npc) { npc.role = "ex"; npc.inContact = false; } })],
  },
  {
    id: "teen-party",
    ages: [14, 17],
    cooldown: 2,
    title: "House party",
    text: "You got invited to a house party. The parents are definitely out of town.",
    choices: [
      {
        label: "Go and drink",
        outcomes: [
          { weight: 3, text: "You drank way too much and threw up in a houseplant. A legendary night, apparently.", effects: [fx.happy(4), fx.health(-2), fx.addiction("alcohol", [2, 6]), fx.flag("teenDrinker")] },
          { weight: 1, text: "The police broke up the party. You hid in a closet for an hour.", tone: "bad", effects: [fx.happy(-3), fx.skill("streetSmarts", 2)] },
        ],
      },
      {
        label: "Go but stay sober",
        outcomes: [{ text: "You went, stayed sober, and drove three friends home. Hero.", tone: "good", effects: [fx.karma(2), fx.skill("charisma", 1)] }],
      },
      {
        label: "Stay home",
        outcomes: [{ text: "You stayed home. Monday's stories made it sound incredible." }],
      },
    ],
  },
  {
    id: "teen-cigarette",
    ages: [13, 17],
    once: true,
    title: "Peer pressure",
    text: "Some older kids offer you a cigarette behind the school.",
    choices: [
      {
        label: "Try it",
        outcomes: [{ text: "You coughed for a full minute, then tried again. It was the start of something bad.", tone: "bad", effects: [fx.addiction("smoking", [10, 20]), fx.health(-2), fx.flag("teenSmoker")] }],
      },
      {
        label: "Say no",
        outcomes: [{ text: "You said no. They said something rude. You'll outlive them.", tone: "good", effects: [fx.karma(1)] }],
      },
    ],
  },
  {
    id: "teen-sneak-out",
    ages: [14, 17],
    once: true,
    condition: when.livesWithParents,
    title: "Midnight",
    text: "Your friends are going to {the lake|a concert|the abandoned mall} tonight. Your parents said no.",
    choices: [
      {
        label: "Sneak out the window",
        outcomes: [
          { weight: pass("streetSmarts", 40), text: "You snuck out and back in without a sound. Best night of the summer.", tone: "good", effects: [fx.happy(6), fx.skill("streetSmarts", 2)] },
          { weight: fail("streetSmarts", 40), text: "Your {mom|dad} was waiting in the dark when you climbed back in. Grounded until further notice.", tone: "bad", effects: [fx.happy(-5), fx.close(-8, "mother"), fx.close(-8, "father")] },
        ],
      },
      {
        label: "Obey",
        outcomes: [{ text: "You stayed home. You heard all about it on Monday.", effects: [fx.close(2, "mother")] }],
      },
    ],
  },
  {
    id: "teen-driving-test",
    ages: [16, 18],
    once: true,
    title: "Driving test",
    text: "Today is your driving test.",
    choices: [
      {
        label: "Drive carefully",
        outcomes: [
          { weight: pass("smarts", 30), text: "You passed your driving test on the first try.", tone: "good", effects: [fx.happy(6), fx.flag("license")] },
          { weight: fail("smarts", 30), text: "You failed for rolling through a stop sign. The instructor sighed loudly.", tone: "bad", effects: [fx.happy(-4), fx.schedule("teen-driving-retest", 1)] },
        ],
      },
      {
        label: "Show off",
        outcomes: [
          { weight: 1, text: "You parallel parked one-handed. The instructor passed you, reluctantly.", tone: "good", effects: [fx.happy(5), fx.flag("license")] },
          { weight: 2, text: "You clipped a cone and the instructor's patience. Failed.", tone: "bad", effects: [fx.happy(-4), fx.schedule("teen-driving-retest", 1)] },
        ],
      },
    ],
  },
  {
    id: "teen-driving-retest",
    ages: [16, 40],
    triggeredOnly: true,
    text: "You retook your driving test and passed.",
    tone: "good",
    effects: [fx.flag("license"), fx.happy(4)],
  },
  {
    id: "teen-first-job",
    ages: [15, 17],
    once: true,
    title: "Part-time job",
    text: "A {burger place|movie theater|grocery store|ice cream shop} near you is hiring teenagers.",
    choices: [
      {
        label: "Apply",
        outcomes: [
          { weight: 3, text: "You got the job. Minimum wage, maximum life lessons. You saved {money:2400} by the end of the year.", tone: "good", effects: [fx.cash(2400), fx.skill("streetSmarts", 2), fx.flag("teenJob")] },
          { weight: 1, text: "You didn't get the job. They hired someone's nephew.", effects: [fx.happy(-2)] },
        ],
      },
      {
        label: "Focus on school",
        outcomes: [{ text: "You decided to focus on school instead.", effects: [fx.smarts(1)] }],
      },
    ],
  },
  {
    id: "teen-social-media-post",
    ages: [13, 19],
    cooldown: 3,
    title: "Going viral",
    text: "You filmed yourself {doing a dance trend|reviewing gas station snacks|explaining a conspiracy theory as a joke}. Should you post it?",
    choices: [
      {
        label: "Post it",
        outcomes: [
          { weight: pass("charisma", 60), text: "It went mildly viral. You gained {2,000|5,000|12,000} followers overnight.", tone: "good", effects: [fx.happy(5), fx.custom((ctx) => { ctx.player.followers += ctx.rng.int(2000, 12000); }), fx.fame(2)] },
          { weight: fail("charisma", 60), text: "It got four likes. One was your {mom|grandma}.", effects: [fx.happy(-1)] },
        ],
      },
      {
        label: "Delete it",
        outcomes: [{ text: "You deleted it. Future you is grateful." }],
      },
    ],
  },
  {
    id: "teen-curfew-fight",
    ages: [14, 17],
    cooldown: 3,
    condition: when.livesWithParents,
    npc: { kind: "existing", roles: ["mother", "father", "stepparent"] },
    text: "You and {npc} got into a screaming match about curfew.",
    choices: [
      {
        label: "Slam your door",
        outcomes: [{ text: "You slammed your door hard enough to knock a picture off the wall.", tone: "bad", effects: [fx.close(-8), fx.happy(-2)] }],
      },
      {
        label: "Negotiate",
        outcomes: [
          { weight: pass("charisma", 40), text: "You negotiated an extra hour. Diplomacy works.", tone: "good", effects: [fx.close(3), fx.skill("charisma", 2)] },
          { weight: fail("charisma", 40), text: "Negotiations broke down. Curfew moved earlier.", effects: [fx.close(-3)] },
        ],
      },
      {
        label: "Apologize",
        outcomes: [{ text: "You apologized. {npc} looked genuinely surprised.", tone: "good", effects: [fx.close(6), fx.karma(1)] }],
      },
    ],
  },
  {
    id: "teen-diary",
    ages: [12, 16],
    once: true,
    condition: when.hasLiving("sibling"),
    npc: { kind: "existing", roles: ["sibling"] },
    text: "{npc} found your diary and read it out loud at dinner.",
    tone: "bad",
    choices: [
      {
        label: "Plot revenge",
        outcomes: [{ text: "You put hair dye in {npc}'s shampoo. {npc.He} {npc.was} blue for a month.", effects: [fx.close(-6), fx.happy(4), fx.flag("siblingWar")] }],
      },
      {
        label: "Laugh it off",
        outcomes: [{ text: "You laughed along. The power drained out of it immediately.", tone: "good", effects: [fx.skill("charisma", 2)] }],
      },
    ],
  },
  {
    id: "teen-sports-injury",
    ages: [13, 18],
    once: true,
    condition: when.any(when.club("soccer"), when.club("basketball"), when.club("track"), when.club("swim")),
    text: "You tore a ligament at practice and spent the season on the bench.",
    tone: "bad",
    effects: [fx.health(-8), fx.happy(-5), fx.skill("athleticism", -3)],
  },
  {
    id: "teen-scouted",
    ages: [15, 17],
    once: true,
    condition: when.all(when.statAtLeast("athleticism", 70), when.any(when.club("soccer"), when.club("basketball"), when.club("track"), when.club("swim"))),
    text: "A college scout watched you play and left a business card with your coach.",
    tone: "major",
    effects: [fx.happy(6), fx.flag("scouted")],
  },
  {
    id: "teen-model-scout",
    ages: [14, 19],
    once: true,
    condition: when.statAtLeast("looks", 82),
    title: "Scouted",
    text: "A modeling agent stopped you at the mall and handed you a card.",
    choices: [
      {
        label: "Call them",
        outcomes: [
          { weight: 2, text: "You did a test shoot. The agency signed you for some catalog work.", tone: "good", effects: [fx.cash(3000), fx.fame(3), fx.flag("teenModel")] },
          { weight: 1, text: "The \"agency\" wanted {money:900} for a portfolio. It was a scam.", tone: "bad", effects: [fx.skill("streetSmarts", 2)] },
        ],
      },
      {
        label: "Throw the card away",
        outcomes: [{ text: "You threw the card away. You'll always wonder." }],
      },
    ],
  },
  {
    id: "teen-rebellion-hair",
    ages: [13, 17],
    once: true,
    title: "Self-expression",
    text: "You want to do something dramatic with your look.",
    choices: [
      {
        label: "Dye your hair",
        outcomes: [{ text: "You dyed your hair {electric blue|platinum|bright red}. Your parents held a meeting about it.", effects: [fx.happy(4), fx.custom((ctx) => { ctx.player.appearance.hairColor = ctx.rng.pick(["platinum", "red"] as const); })] }],
      },
      {
        label: "Shave it all off",
        condition: (ctx) => ctx.player.gender !== "female",
        outcomes: [{ text: "You buzzed it all off in the bathroom. It grew back. Mostly.", effects: [fx.custom((ctx) => { ctx.player.appearance.hairStyle = "buzz"; })] }],
      },
      {
        label: "Get a piercing",
        outcomes: [{ text: "You got your {ear|eyebrow|nose} pierced at the mall. Your parents noticed three months later.", effects: [fx.happy(3)] }],
      },
    ],
  },
  {
    id: "teen-online-friend",
    ages: [13, 17],
    once: true,
    title: "Online friend",
    text: "Someone you met in an online game wants to meet up in person. They say they're 16.",
    choices: [
      {
        label: "Meet in a public place with a friend",
        outcomes: [
          { weight: 3, text: "They were actually 16, and actually cool. You're still friends.", tone: "good", effects: [fx.happy(4)] },
          { weight: 1, text: "They were not 16. You and your friend left immediately and told the police.", tone: "bad", effects: [fx.skill("streetSmarts", 3), fx.happy(-4)] },
        ],
      },
      {
        label: "Decline",
        outcomes: [{ text: "You declined. Smart move.", tone: "good", effects: [fx.skill("streetSmarts", 1)] }],
      },
    ],
  },
  {
    id: "teen-volunteer",
    ages: [14, 17],
    once: true,
    text: "You volunteered at {an animal shelter|a soup kitchen|a nursing home} for your community-service hours and kept going after.",
    tone: "good",
    effects: [fx.karma(5), fx.happy(3), fx.flag("teenVolunteer")],
  },
  {
    id: "teen-gap-year-talk",
    ages: [17, 18],
    once: true,
    condition: when.livesWithParents,
    text: "Your parents sat you down to ask what your plan is after high school. You said \"vibes.\" They did not laugh.",
    effects: [fx.close(-2, "mother")],
  },
  {
    id: "teen-concert",
    ages: [13, 19],
    once: true,
    text: "You saw your favorite band live. You lost your voice screaming and your phone in the mosh pit.",
    tone: "good",
    effects: [fx.happy(6)],
  },
  {
    id: "teen-graffiti",
    ages: [13, 17],
    once: true,
    title: "Blank wall",
    text: "Your friends want to tag the freshly painted wall behind the supermarket.",
    choices: [
      {
        label: "Grab a spray can",
        outcomes: [
          { weight: pass("streetSmarts", 40), text: "You painted a surprisingly good mural and got away clean.", effects: [fx.skill("creativity", 2), fx.karma(-1)] },
          { weight: fail("streetSmarts", 40), text: "A cop rolled up mid-tag. You spent a weekend scrubbing walls.", tone: "bad", effects: [fx.karma(-1), fx.happy(-3), fx.custom((ctx) => { ctx.player.crime.record.push({ crime: "Vandalism", age: ctx.player.age, convicted: false, sentenceYears: 0 }); })] },
        ],
      },
      {
        label: "Be the lookout",
        outcomes: [{ text: "You kept watch while your friends painted something rude.", effects: [fx.skill("streetSmarts", 1)] }],
      },
      {
        label: "Go home",
        outcomes: [{ text: "You went home. They got caught. You didn't.", effects: [fx.karma(1)] }],
      },
    ],
  },
  {
    id: "teen-family-vacation",
    ages: [10, 17],
    once: true,
    condition: when.wealth("middle", "upper", "rich"),
    text: "Your family drove {nine|twelve} hours to {the beach|a national park|your aunt's lake house}. You were angry the whole way and happy the whole time there.",
    tone: "good",
    effects: [fx.happy(4), fx.close(3, "mother"), fx.close(3, "father")],
  },
  {
    id: "teen-sibling-advice",
    ages: [13, 17],
    once: true,
    npc: { kind: "existing", roles: ["sibling"], filter: (n, ctx) => n.age > ctx.player.age },
    text: "Your older sibling {npc} gave you some genuinely useful advice about {high school|heartbreak|surviving our parents}.",
    tone: "good",
    effects: [fx.close(8), fx.skill("streetSmarts", 1)],
  },
  {
    id: "teen-depression",
    ages: [14, 19],
    once: true,
    condition: when.statBelow("happiness", 35),
    title: "Heavy",
    text: "You've felt flat and heavy for months. Nothing seems fun anymore.",
    choices: [
      {
        label: "Talk to a parent",
        condition: when.any(when.hasLiving("mother"), when.hasLiving("father")),
        outcomes: [{ text: "You told your parent how you felt. They found you a therapist. It helped, slowly.", tone: "good", effects: [fx.happy([8, 14]), fx.close(8, "mother")] }],
      },
      {
        label: "Talk to the school counselor",
        outcomes: [{ text: "The school counselor listened, then helped you make a plan. Things got a little lighter.", tone: "good", effects: [fx.happy([6, 10])] }],
      },
      {
        label: "Keep it to yourself",
        outcomes: [{ text: "You kept it to yourself. It didn't go away.", tone: "bad", effects: [fx.happy(-4)] }],
      },
    ],
  },
  {
    id: "teen-wealthy-car",
    ages: [16, 17],
    once: true,
    condition: when.all(when.wealth("rich"), when.flag("license")),
    text: "Your parents gave you a brand-new {convertible|SUV|sports car} for your birthday. You dented it within a week.",
    tone: "good",
    effects: [fx.happy(6), fx.karma(-1)],
  },
]);
