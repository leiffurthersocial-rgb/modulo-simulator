import { giftPet } from "@/engine/assets";
import { defineEvents, fail, fx, pass } from "@/engine/events/helpers";

/** Triggered-only events that scenarios, pursuits and other events chain into. */
export const FOLLOWUP_EVENTS = defineEvents("callback", [
  {
    id: "night-stranger-chat",
    ages: [16, 90],
    triggeredOnly: true,
    npc: { kind: "new", role: "date", gender: "attracted", ageOffset: [-6, 6], closeness: 45 },
    title: "Across the room",
    text: "{npc}, {npc.age}, caught your eye at the bar and walked over. {npc.He} {npc.is} a {npc.job} with {a crooked smile|an infectious laugh|an excellent jacket}.",
    choices: [
      {
        label: "Flirt back",
        outcomes: [
          { weight: pass("charisma", 45), text: "The conversation flowed for hours. You swapped numbers.", tone: "good", effects: [fx.custom(({ npc }) => { if (npc) npc.role = "partner"; }), fx.close(12), fx.happy(6)] },
          { weight: fail("charisma", 45), text: "You tripped over your words. {npc} laughed kindly and walked away.", tone: "bad", effects: [fx.custom(({ npc }) => { if (npc) { npc.role = "acquaintance"; npc.inContact = false; } }), fx.happy(-2)] },
        ],
      },
      {
        label: "Politely decline",
        outcomes: [{ text: "You raised your glass, smiled, and went back to your friends.", effects: [fx.custom(({ npc }) => { if (npc) { npc.role = "acquaintance"; npc.inContact = false; } })] }],
      },
      {
        label: "Buy them a drink and talk as friends",
        outcomes: [{ text: "You talked until last call and parted as pals.", tone: "good", effects: [fx.custom(({ npc }) => { if (npc) npc.role = "friend"; }), fx.close(8), fx.happy(3), fx.cash(-30)] }],
      },
    ],
  },
  {
    id: "adopt-shelter-pet",
    ages: [10, 100],
    triggeredOnly: true,
    title: "Chosen",
    text: "One of the shelter animals has decided you are its person. It will not be argued with.",
    choices: [
      { label: "Adopt a dog", outcomes: [{ text: "You took the dog home. It's already on your couch.", tone: "good", effects: [fx.custom((ctx) => { giftPet(ctx.state, ctx.rng, ctx.country, "dog"); }), fx.happy(7)] }] },
      { label: "Adopt a cat", outcomes: [{ text: "You took the cat home. It has already redecorated.", tone: "good", effects: [fx.custom((ctx) => { giftPet(ctx.state, ctx.rng, ctx.country, "cat"); }), fx.happy(7)] }] },
      { label: "Not right now", outcomes: [{ text: "You said not yet. It watched you leave with sad eyes.", effects: [fx.happy(-2)] }] },
    ],
  },
  {
    id: "pursuit-novel-published",
    ages: [16, 100],
    triggeredOnly: true,
    title: "A publishing offer",
    text: "A small publisher wants your novel. The advance is modest, the contract is long.",
    choices: [
      { label: "Sign immediately", outcomes: [{ weight: 2, text: "Your book hit shelves. Reviews were warm. You signed forty copies for a niece.", tone: "major", effects: [fx.cash(6000), fx.fame(3), fx.happy(10)] }, { weight: 1, text: "The contract had an awful clause. Your book was in the shops, but you saw little of the profit.", tone: "neutral", effects: [fx.cash(1200), fx.fame(1), fx.happy(4)] }] },
      { label: "Self-publish instead", outcomes: [{ weight: 1, text: "It found a small, devoted audience online.", tone: "good", effects: [fx.cash(2500), fx.fame(1), fx.happy(7)] }, { weight: 3, text: "It sold eleven copies. Nine to family.", effects: [fx.happy(2)] }] },
      { label: "Hold out for a bigger deal", outcomes: [{ weight: 1, text: "A major house bid. Your book was a bestseller.", tone: "major", effects: [fx.cash(80000), fx.fame(8), fx.happy(14)] }, { weight: 4, text: "No one else called. You sat on it for years.", tone: "bad", effects: [fx.happy(-4)] }] },
    ],
  },
  {
    id: "pursuit-album-hit",
    ages: [14, 100],
    triggeredOnly: true,
    title: "Your song took off",
    text: "One of your tracks was used in a viral video. Streams are climbing.",
    choices: [
      { label: "Ride the wave: tour", outcomes: [{ weight: 2, text: "You played every dingy club you could find. Your fan base doubled.", tone: "major", effects: [fx.fame(5), fx.cash(7000), fx.health(-3), fx.happy(8)] }, { weight: 1, text: "The tour lost money but turned you into a legend of one small city.", tone: "neutral", effects: [fx.fame(3), fx.cash(-1500), fx.happy(4)] }] },
      { label: "Sign with a label", outcomes: [{ weight: 2, text: "The label gave you a budget and a publicist. Your second album went platinum in a small country.", tone: "major", effects: [fx.fame(6), fx.cash(20000), fx.happy(8)] }, { weight: 2, text: "The label changed your sound. Fans called you a sellout.", tone: "bad", effects: [fx.fame(3), fx.cash(10000), fx.happy(-4)] }] },
      { label: "Stay independent", outcomes: [{ text: "You kept your songs and your sanity. Your following is small, loyal and kind.", tone: "good", effects: [fx.fame(2), fx.cash(3000), fx.happy(6), fx.karma(1)] }] },
    ],
  },
  {
    id: "pursuit-instrument-scout",
    ages: [8, 100],
    triggeredOnly: true,
    title: "A talent scout",
    text: "After your recital, a scout from a music conservatory asked for your number.",
    choices: [
      { label: "Audition", outcomes: [{ weight: pass("creativity", 55), text: "You were offered a scholarship. Your teacher wept in the hallway.", tone: "major", effects: [fx.skill("creativity", 4), fx.happy(10), fx.cash(2000)] }, { weight: fail("creativity", 55), text: "You froze in the audition. It happens to the best.", tone: "bad", effects: [fx.happy(-4), fx.skill("creativity", 1)] }] },
      { label: "Keep it as a hobby", outcomes: [{ text: "You thanked them and went home to play for the joy of it.", tone: "good", effects: [fx.happy(4)] }] },
    ],
  },
  {
    id: "pursuit-sideproject-offer",
    ages: [16, 100],
    triggeredOnly: true,
    title: "An acquisition offer",
    text: "A bigger company wants to buy your side project. They're offering real money.",
    choices: [
      { label: "Take the cash", outcomes: [{ weight: 3, text: "You sold it for a very comfortable sum.", tone: "major", effects: [fx.cash([30000, 120000]), fx.happy(10)] }, { weight: 1, text: "They shut it down a month later. You were paid, but it stung.", tone: "neutral", effects: [fx.cash(40000), fx.happy(2)] }] },
      { label: "Keep building it", outcomes: [{ weight: 1, text: "It grew into something big. You turned down the offer and never looked back.", tone: "major", effects: [fx.cash(200000), fx.fame(3), fx.happy(12)] }, { weight: 3, text: "It plateaued. You still wonder about that offer.", tone: "bad", effects: [fx.happy(-5)] }] },
    ],
  },
  {
    id: "pursuit-film-festival",
    ages: [14, 100],
    triggeredOnly: true,
    title: "The festival",
    text: "Your short film is playing at a real festival, in front of real strangers.",
    choices: [
      { label: "Work the crowd", outcomes: [{ weight: pass("charisma", 45), text: "A producer cornered you at the after-party and offered you a development deal.", tone: "major", effects: [fx.fame(5), fx.cash(10000), fx.happy(10)] }, { weight: fail("charisma", 45), text: "You mostly ate the free canapés and said 'thanks' a lot.", effects: [fx.fame(1), fx.happy(2)] }] },
      { label: "Slip in the back", outcomes: [{ text: "You watched it from the last row. The audience laughed in the right places. That was enough.", tone: "good", effects: [fx.happy(8), fx.fame(1)] }] },
    ],
  },
  {
    id: "family-recipe-passed",
    ages: [8, 100],
    triggeredOnly: true,
    title: "The recipe",
    text: "{npc} wrote the recipe on a stained card and pressed it into your hand. 'Don't lose it.'",
    effects: [fx.close(6), fx.happy(4), fx.skill("creativity", 1)],
  },
  {
    id: "will-neighbor-bequest",
    ages: [12, 100],
    triggeredOnly: true,
    title: "A kind old neighbour",
    text: "Years later, you learned the old neighbour had left you something in her will: her late husband's pocket watch and a small sum.",
    tone: "good",
    effects: [fx.cash(2500), fx.karma(2), fx.happy(5)],
  },
]);
