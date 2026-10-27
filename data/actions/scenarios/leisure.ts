import { defineScenarios } from "@/engine/actionHelpers";
import { fail, fx, pass } from "@/engine/events/helpers";
import { between, minAge, out, outThen } from "./kit";

/** Nightlife, travel and weekend adventures: each approach is a different gamble. */
export const LEISURE_SCENARIOS = defineScenarios([
  {
    id: "sc-night-out",
    section: "nightlife",
    group: "Going out",
    label: "A night out",
    description: "How wild do you want it?",
    icon: "Wine",
    perYear: 3,
    visible: minAge(18),
    approaches: [
      {
        id: "quiet",
        label: "Quiet drinks with friends",
        cost: 60,
        outcomes: [
          out(5, "A calm night of good conversation. You got home at a respectable hour.", "good", fx.happy([2, 5])),
          out(2, "Someone brought up politics. The evening ended early.", "neutral", fx.happy(-1)),
        ],
      },
      {
        id: "club",
        label: "Hit the club",
        cost: 150,
        outcomes: [
          out(4, "You danced until your feet gave out. Best night in months.", "good", fx.happy([4, 8]), fx.skill("charisma", 1)),
          out(2, "You woke up with a stamp on your hand and no memory of the second half.", "neutral", fx.happy(2), fx.health(-2)),
          out(2, "Someone spilled a drink on your phone. Night ruined, phone ruined.", "bad", fx.happy(-3), fx.cash(-300)),
          outThen(1, "A stranger at the bar locked eyes with you across the room.", "good", "night-stranger-chat", fx.happy(2)),
        ],
      },
      {
        id: "bar-crawl",
        label: "Epic bar crawl",
        cost: 250,
        outcomes: [
          out(3, "Eleven bars. You were a legend. You will be paying for it all week.", "neutral", fx.happy(6), fx.health(-4), fx.addiction("alcohol", 3)),
          out(2, "You lost your wallet somewhere between bar six and bar nine.", "bad", fx.cash(-400), fx.happy(-3)),
          out(2, "You ended up singing karaoke with a retired opera singer. A crowd gathered.", "good", fx.happy(8), fx.skill("charisma", 2), fx.fame(1)),
          out(1, "You got into a shoving match outside the last bar and woke up in the ER.", "bad", fx.health([-15, -6]), fx.happy(-4), fx.cash(-1200)),
        ],
      },
    ],
  },
  {
    id: "sc-festival",
    section: "nightlife",
    group: "Going out",
    label: "Music festival",
    description: "Three days, one field",
    icon: "Music",
    visible: between(16, 60),
    approaches: [
      {
        id: "day-pass",
        label: "Day pass",
        cost: 180,
        outcomes: [
          out(4, "You caught three great sets and went home before the rain.", "good", fx.happy([3, 6])),
          out(1, "It rained the whole day. You still sang along.", "neutral", fx.happy(1), fx.health(-1)),
        ],
      },
      {
        id: "camp",
        label: "Camp all weekend",
        cost: 700,
        outcomes: [
          out(4, "Three days of mud, music and strangers who became friends.", "good", fx.happy([6, 10]), fx.skill("charisma", 1)),
          out(2, "Your tent flooded. You slept in a stranger's van.", "neutral", fx.happy(2), fx.health(-3)),
          out(1, "You got heatstroke on day two and missed the headliner.", "bad", fx.health(-8), fx.happy(-2)),
          out(1, "You met someone in the crowd who changed your weekend.", "good", fx.happy(7), fx.skill("charisma", 1)),
        ],
      },
      {
        id: "vip",
        label: "VIP weekend",
        cost: 2600,
        outcomes: [
          out(4, "Backstage, free drinks, and a front-row view. You felt very important.", "good", fx.happy([8, 12])),
          out(2, "You were photographed next to a pop star and ended up on a gossip site.", "good", fx.happy(6), fx.fame(1)),
          out(1, "The headliner cancelled. You got a refund voucher.", "bad", fx.happy(-3), fx.cash(800)),
        ],
      },
    ],
  },
  {
    id: "sc-road-trip",
    section: "activities",
    group: "Adventures",
    label: "Road trip",
    description: "Pick a direction and go",
    icon: "Car",
    visible: minAge(17),
    approaches: [
      {
        id: "scenic",
        label: "Scenic coastal drive",
        cost: 600,
        outcomes: [
          out(5, "Salt air, cheap motels and a radio that only got one station. Perfect.", "good", fx.happy([5, 8])),
          out(1, "The car overheated in the middle of nowhere. A farmer towed you for free.", "neutral", fx.happy(3), fx.karma(1)),
        ],
      },
      {
        id: "cross-country",
        label: "Cross-country with no plan",
        cost: 1800,
        outcomes: [
          out(3, "Six states, four diners, one very memorable sunrise.", "good", fx.happy([8, 12]), fx.skill("streetSmarts", 2)),
          out(2, "You got hopelessly lost and found the best pie of your life.", "good", fx.happy(7)),
          out(2, "Two flat tires and a speeding ticket. Still glad you went.", "neutral", fx.happy(3), fx.cash(-500)),
          out(1, "You picked up a hitchhiker who turned out to be a world-class bore.", "bad", fx.happy(-1), fx.karma(1)),
        ],
      },
      {
        id: "mystery",
        label: "Follow a strange roadside sign",
        cost: 300,
        outcomes: [
          out(2, "The sign led to a tiny museum of lost umbrellas. You bought a postcard.", "neutral", fx.happy(3)),
          out(2, "It led to a farm stand selling the best peaches in the county.", "good", fx.happy(5)),
          out(1, "It led to a very strange cult dinner. You left quickly.", "bad", fx.happy(-2), fx.skill("streetSmarts", 2)),
          out(1, "It led to an auction. You accidentally bought a taxidermy owl.", "neutral", fx.happy(2), fx.cash(-200)),
        ],
      },
    ],
  },
  {
    id: "sc-adventure-sport",
    section: "activities",
    group: "Adventures",
    label: "Extreme sports",
    description: "Heart rate up, odds down",
    icon: "Zap",
    perYear: 2,
    visible: between(16, 60),
    approaches: [
      {
        id: "climb",
        label: "Rock climbing",
        cost: 150,
        outcomes: [
          { weight: pass("athleticism", 45), text: "You topped a route you'd been eyeing for months. The view was worth every ache.", tone: "good", effects: [fx.skill("athleticism", 3), fx.happy(5), fx.health(2)] },
          { weight: fail("athleticism", 45), text: "You slipped near the top and swung on the rope, scraping your arm. You'll go again.", tone: "neutral", effects: [fx.health(-3), fx.skill("athleticism", 1)] },
          out(0.15, "A hold gave way and you fell badly.", "bad", fx.health([-30, -12]), fx.happy(-4), fx.cash(-3000)),
        ],
      },
      {
        id: "skydive",
        label: "Skydiving",
        cost: 350,
        outcomes: [
          out(8, "You screamed the whole way down and loved every second.", "good", fx.happy([8, 12]), fx.stat("health", 1)),
          out(1, "Your landing was a belly flop into a field. You limped for a week.", "neutral", fx.health(-5), fx.happy(4)),
          out(0.05, "Your chute failed to open properly. The reserve saved you, barely.", "major", fx.health(-12), fx.happy(5)),
        ],
      },
      {
        id: "surf",
        label: "Learn to surf",
        cost: 250,
        outcomes: [
          { weight: pass("athleticism", 40), text: "You stood up on your fourth wave. You were insufferable about it for a month.", tone: "good", effects: [fx.skill("athleticism", 3), fx.happy(6)] },
          { weight: fail("athleticism", 40), text: "You swallowed half the ocean but got up on one wave.", tone: "neutral", effects: [fx.skill("athleticism", 1), fx.happy(3)] },
          out(0.3, "A jellyfish got you. It looked a lot like a plastic bag.", "bad", fx.health(-4), fx.happy(-2)),
        ],
      },
      {
        id: "motorbike",
        label: "Weekend motorbike racing",
        cost: 500,
        outcomes: [
          out(3, "You shaved two seconds off your best lap and grinned for an hour.", "good", fx.happy(7), fx.skill("streetSmarts", 1)),
          out(2, "You finished mid-pack, sunburned and happy.", "neutral", fx.happy(3)),
          out(1, "You clipped a barrier and broke your collarbone.", "bad", fx.health([-20, -10]), fx.happy(-3), fx.cash(-2500)),
        ],
      },
    ],
  },
  {
    id: "sc-camping",
    section: "activities",
    group: "Adventures",
    label: "Wilderness trip",
    icon: "Leaf",
    visible: minAge(14),
    approaches: [
      {
        id: "car-camp",
        label: "Car camping",
        cost: 120,
        outcomes: [
          out(4, "Stars, a campfire and burnt marshmallows. Simple and perfect.", "good", fx.happy([3, 6]), fx.health(1)),
          out(1, "A raccoon stole your entire snack bag.", "neutral", fx.happy(1)),
        ],
      },
      {
        id: "backpack",
        label: "Week-long backpacking trek",
        cost: 400,
        outcomes: [
          { weight: pass("athleticism", 40), text: "Eighty kilometres on foot. You came home leaner, tanner and strangely calm.", tone: "good", effects: [fx.health([3, 6]), fx.skill("athleticism", 2), fx.happy(7)] },
          { weight: fail("athleticism", 40), text: "Blisters by day two. You still made it, and you've never felt more alive.", tone: "neutral", effects: [fx.health(1), fx.skill("athleticism", 1), fx.happy(4)] },
          out(0.4, "You twisted an ankle on day five and got helicoptered out.", "bad", fx.health(-6), fx.cash(-1500)),
        ],
      },
      {
        id: "solo",
        label: "Solo survival challenge",
        cost: 200,
        outcomes: [
          out(3, "Five days alone. You learned you're better company than you thought.", "good", fx.happy(7), fx.skill("streetSmarts", 3)),
          out(2, "You ate some very suspicious berries and spent a day regretting it.", "neutral", fx.health(-4), fx.skill("streetSmarts", 1)),
          out(1, "A bear wandered into your camp. You calmly walked away. Mostly calmly.", "good", fx.happy(5), fx.skill("streetSmarts", 3)),
        ],
      },
    ],
  },
  {
    id: "sc-cooking-night",
    section: "activities",
    group: "At home",
    label: "Dinner party",
    description: "Host something memorable",
    icon: "Utensils",
    visible: minAge(18),
    approaches: [
      {
        id: "takeout",
        label: "Order takeout and call it catering",
        cost: 80,
        outcomes: [out(4, "Nobody cared that you cheated. They ate all of it.", "good", fx.happy(3)), out(1, "The delivery came cold. People were polite.", "neutral", fx.happy(-1))],
      },
      {
        id: "homemade",
        label: "Cook an ambitious menu",
        cost: 150,
        outcomes: [
          { weight: pass("creativity", 40), text: "Every course landed. Your friends are still talking about the lamb.", tone: "good", effects: [fx.happy(6), fx.skill("creativity", 2), fx.skill("charisma", 1)] },
          { weight: fail("creativity", 40), text: "The soufflé fell, the sauce split, but everyone had fun anyway.", tone: "neutral", effects: [fx.happy(2), fx.skill("creativity", 1)] },
          out(0.25, "You set off the smoke alarm and the whole building evacuated.", "bad", fx.happy(-2)),
        ],
      },
      {
        id: "theme",
        label: "Murder mystery theme night",
        cost: 220,
        outcomes: [
          out(3, "Your friend 'Colonel Mustard' took it far too seriously. It was glorious.", "good", fx.happy(7), fx.skill("charisma", 2)),
          out(2, "Someone accused you with a dramatic gasp. You laughed for an hour.", "good", fx.happy(5)),
          out(1, "An old grievance came out as the 'killer' was revealed. Awkward.", "bad", fx.happy(-3)),
        ],
      },
    ],
  },
  {
    id: "sc-volunteer",
    section: "activities",
    group: "Giving back",
    label: "Volunteer",
    icon: "HeartHandshake",
    visible: minAge(12),
    approaches: [
      {
        id: "shelter",
        label: "Animal shelter",
        outcomes: [
          out(4, "You walked dogs and cleaned kennels. One of them looked at you like you were everything.", "good", fx.karma(4), fx.happy(5)),
          outThen(1, "One of the shelter animals decided you were its human.", "good", "adopt-shelter-pet", fx.karma(3), fx.happy(5)),
        ],
      },
      {
        id: "food-bank",
        label: "Food bank",
        outcomes: [
          out(4, "You packed boxes all afternoon. It felt like actually doing something.", "good", fx.karma(5), fx.happy(4)),
          out(1, "A volunteer coordinator quietly offered you a leadership role.", "good", fx.karma(6), fx.happy(5), fx.skill("charisma", 2)),
        ],
      },
      {
        id: "build",
        label: "Build houses abroad",
        cost: 1200,
        outcomes: [
          out(4, "Two weeks of hammering and heat. You came back sunburned and changed.", "good", fx.karma(8), fx.happy(8), fx.skill("athleticism", 2)),
          out(1, "You made friends with a local family you'll write to for years.", "major", fx.karma(10), fx.happy(10)),
          out(1, "The trip was mostly a photo-op. You felt a bit hollow.", "neutral", fx.karma(1), fx.happy(-1)),
        ],
      },
      {
        id: "disaster",
        label: "Disaster relief",
        outcomes: [
          out(3, "Exhausting, harrowing, and the most meaningful week of your year.", "major", fx.karma(10), fx.happy(5), fx.health(-3), fx.skill("streetSmarts", 2)),
          out(1, "You saw things that will take a while to process.", "bad", fx.karma(8), fx.happy(-5)),
        ],
      },
    ],
  },
  {
    id: "sc-dare",
    section: "activities",
    group: "Social",
    label: "Take a dare",
    description: "What could go wrong?",
    icon: "Flame",
    visible: between(10, 50),
    approaches: [
      {
        id: "eat",
        label: "Eat the world's hottest pepper",
        outcomes: [
          out(3, "You cried, you hiccupped, you won twenty dollars. Worth it.", "neutral", fx.happy(3), fx.health(-2), fx.cash(20)),
          out(1, "You threw up on your own shoes. The crowd roared.", "bad", fx.happy(-1), fx.health(-3), fx.skill("charisma", 1)),
        ],
      },
      {
        id: "jump",
        label: "Jump off the high cliff",
        outcomes: [
          out(4, "You screamed. You hit the water. You came up laughing.", "good", fx.happy(6), fx.skill("athleticism", 1)),
          out(1, "You belly-flopped. The echo was audible.", "bad", fx.health(-6), fx.happy(-2)),
          out(0.1, "You landed wrong and broke something expensive.", "bad", fx.health([-25, -12]), fx.cash(-4000)),
        ],
      },
      {
        id: "karaoke",
        label: "Sing karaoke solo, sober",
        outcomes: [
          { weight: pass("charisma", 50), text: "You nailed the high note. The bar went quiet, then loud.", tone: "good", effects: [fx.happy(7), fx.skill("charisma", 2)] },
          { weight: fail("charisma", 50), text: "You were truly dreadful. People applauded out of pity. You loved it.", tone: "neutral", effects: [fx.happy(4), fx.skill("charisma", 1)] },
        ],
      },
      {
        id: "stranger",
        label: "Ask a stranger to marry you (as a joke)",
        outcomes: [
          out(3, "They laughed, said 'maybe in the sequel', and bought you a coffee.", "good", fx.happy(4), fx.skill("charisma", 2)),
          out(1, "They said yes. Then they said it was a joke. Then they didn't.", "neutral", fx.happy(1)),
          out(1, "They were not amused. A bouncer escorted you out.", "bad", fx.happy(-3)),
        ],
      },
    ],
  },
  {
    id: "sc-shopping",
    section: "activities",
    group: "At home",
    label: "Go shopping",
    icon: "ShoppingBag",
    perYear: 3,
    visible: minAge(14),
    approaches: [
      {
        id: "thrift",
        label: "Thrift stores",
        cost: 40,
        outcomes: [
          out(4, "You scored a vintage jacket for the price of a sandwich.", "good", fx.happy(4), fx.looks(1)),
          out(2, "Nothing fit. You bought a mug shaped like a duck.", "neutral", fx.happy(2)),
          out(1, "You found a signed record under a stack of dusty vinyl. Worth real money.", "major", fx.happy(6), fx.cash(500)),
        ],
      },
      {
        id: "mall",
        label: "Mall day",
        cost: 200,
        outcomes: [
          out(4, "New wardrobe, new confidence.", "good", fx.happy(4), fx.looks(1)),
          out(2, "You bought four things you did not need. Receipts are in a drawer.", "neutral", fx.happy(1), fx.cash(-150)),
        ],
      },
      {
        id: "designer",
        label: "Designer spree",
        cost: 1800,
        outcomes: [
          out(3, "You looked incredible. People noticed.", "good", fx.happy(5), fx.looks(2), fx.skill("charisma", 1)),
          out(2, "Buyer's remorse set in around the third bag.", "bad", fx.happy(-2)),
          out(1, "A stylist at the store told you your colors were wrong. She was right.", "neutral", fx.looks(2), fx.happy(2)),
        ],
      },
    ],
  },
  {
    id: "sc-pet-project",
    section: "activities",
    group: "At home",
    label: "Fix up the place",
    description: "Home improvement, your way",
    icon: "Hammer",
    visible: (ctx) => ctx.player.age >= 18 && !ctx.player.livesWithParents && !ctx.player.crime.prison,
    approaches: [
      {
        id: "diy",
        label: "DIY it yourself",
        cost: 400,
        outcomes: [
          { weight: pass("creativity", 45), text: "You built a bookshelf that's actually level. Wow.", tone: "good", effects: [fx.happy(6), fx.skill("creativity", 2)] },
          { weight: fail("creativity", 45), text: "The shelf collapsed at 3 a.m., waking the neighbors.", tone: "bad", effects: [fx.happy(-2), fx.cash(-150)] },
        ],
      },
      {
        id: "hire",
        label: "Hire a contractor",
        cost: 2500,
        outcomes: [
          out(4, "Done in a week. It looks amazing.", "good", fx.happy(5)),
          out(2, "The contractor disappeared with your deposit for a month, then came back.", "bad", fx.happy(-3)),
          out(1, "The workers found something odd behind the wall. You kept it.", "good", fx.happy(4), fx.cash(800)),
        ],
      },
      {
        id: "garden",
        label: "Redo the garden",
        cost: 600,
        outcomes: [
          out(4, "Tomatoes! Real tomatoes! You are basically a farmer now.", "good", fx.happy(6), fx.health(1), fx.skill("creativity", 1)),
          out(2, "Slugs ate everything. You will try again.", "bad", fx.happy(-1)),
        ],
      },
    ],
  },
  {
    id: "sc-lucky-break",
    section: "activities",
    group: "Social",
    label: "Strike up a conversation",
    description: "With whoever's nearby",
    icon: "MessageCircle",
    perYear: 4,
    visible: minAge(12),
    approaches: [
      {
        id: "elder",
        label: "An older stranger on a bench",
        outcomes: [
          out(3, "They told you a story about the war and a stolen pie. You learned more than you expected.", "good", fx.happy(3), fx.smarts(1), fx.karma(1)),
          out(2, "They gave you life advice you'll remember for decades.", "good", fx.happy(4), fx.skill("streetSmarts", 2)),
          out(1, "They talked for two hours without breathing. You missed your bus.", "neutral", fx.happy(-1)),
        ],
      },
      {
        id: "crowd",
        label: "Someone interesting at a party",
        outcomes: [
          { weight: pass("charisma", 45), text: "You hit it off immediately. You swapped numbers.", tone: "good", effects: [fx.happy(5), fx.skill("charisma", 1)] },
          { weight: fail("charisma", 45), text: "It fizzled. You both stared at your phones.", tone: "neutral", effects: [fx.happy(-1)] },
        ],
      },
      {
        id: "busker",
        label: "A street busker",
        outcomes: [
          out(3, "They played you a song they wrote that morning. You tipped generously.", "good", fx.happy(4), fx.cash(-20), fx.karma(1)),
          out(1, "They turned out to be famous in another country. You got a video call invite.", "good", fx.happy(5), fx.fame(1)),
        ],
      },
    ],
  },
  {
    id: "sc-spa-day",
    section: "health",
    group: "Looks",
    label: "Wellness retreat",
    icon: "Flower2",
    visible: minAge(16),
    approaches: [
      {
        id: "spa",
        label: "Spa day",
        cost: 220,
        outcomes: [out(4, "A massage and a long steam. You floated home.", "good", fx.happy(5), fx.health(2), fx.looks(1)), out(1, "A cucumber slice got stuck somewhere unfortunate.", "neutral", fx.happy(1))],
      },
      {
        id: "retreat",
        label: "Week at a silent retreat",
        cost: 900,
        outcomes: [
          out(3, "No talking for seven days. Your mind has never been so clear.", "good", fx.happy(8), fx.health(3), fx.smarts(1)),
          out(2, "You nearly died of boredom on day three, then it clicked.", "good", fx.happy(5), fx.health(2)),
          out(1, "You broke your vow of silence in the first hour and spent the week embarrassed.", "neutral", fx.happy(1)),
        ],
      },
      {
        id: "detox",
        label: "Extreme detox program",
        cost: 1500,
        outcomes: [
          out(2, "You felt amazing and lost your cravings.", "good", fx.happy(5), fx.health(4), fx.addiction("alcohol", -8), fx.addiction("smoking", -8)),
          out(2, "You paid a lot of money to drink green sludge. No real change.", "bad", fx.happy(-2)),
          out(1, "You fainted on day three and the program 'refunded' you half.", "bad", fx.health(-3), fx.cash(300)),
        ],
      },
    ],
  },
]);
