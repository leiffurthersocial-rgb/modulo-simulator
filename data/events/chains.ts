import { defineEvents, fail, fx, pass, when } from "@/engine/events/helpers";

/**
 * Choices with long tails: what you decide now schedules a very different follow-up years later.
 * Setup events are random; the payoffs are triggered-only.
 */
export const CHAIN_EVENTS = defineEvents("random", [
  // ---------------------------------------------------------------- the strange letter
  {
    id: "chain-letter-setup",
    ages: [20, 70],
    once: true,
    weight: 0.5,
    title: "A strange letter",
    text: "A lawyer's letter arrives: a distant relative you never met has died, and you may be named in the will. There's a catch: you must travel to claim it, and the fee to open the file is not small.",
    choices: [
      { label: "Pay the fee and go", outcomes: [{ weight: 1, text: "It was real. Your distant relative left you a small house and a very odd collection of clocks.", tone: "major", effects: [fx.cash(60000), fx.happy(6), fx.schedule("chain-letter-clocks", [2, 4])] }, { weight: 1.5, text: "It was a scam. You lost the fee and your faith in mail.", tone: "bad", effects: [fx.cash(-1500), fx.happy(-4), fx.skill("streetSmarts", 2)] }] },
      { label: "Verify it first", outcomes: [{ weight: pass("streetSmarts", 40), text: "You called the firm directly. It was a scam, and you reported it. You feel clever.", tone: "good", effects: [fx.skill("streetSmarts", 2), fx.karma(1)] }, { weight: fail("streetSmarts", 40), text: "The firm said it was real, but by the time you checked the deadline had passed.", tone: "bad", effects: [fx.happy(-3)] }] },
      { label: "Throw it away", outcomes: [{ text: "Probably a scam. You binned it. You'll never know.", effects: [] }] },
    ],
  },
  { id: "chain-letter-clocks", ages: [20, 80], triggeredOnly: true, title: "The clocks", text: "Cleaning out the inherited house, you discovered that one of the odd clocks conceals a hidden compartment with an old letter and a bank key.", choices: [{ label: "Follow the clue", outcomes: [{ weight: 1, text: "The key opened a vault box full of rare coins. A dealer valued them at a small fortune.", tone: "major", effects: [fx.cash(90000), fx.happy(8)] }, { weight: 1, text: "The box held only old photographs. They were priceless to you.", tone: "good", effects: [fx.happy(7), fx.karma(2)] }] }, { label: "Leave it sealed", outcomes: [{ text: "Some mysteries are better as mysteries. The clock ticks on your wall.", effects: [fx.happy(2)] }] }] },

  // ---------------------------------------------------------------- the wallet
  {
    id: "chain-wallet-setup",
    ages: [14, 80],
    weight: 0.8,
    cooldown: 8,
    title: "A fat wallet",
    text: "You found a wallet on the pavement. It holds {money:600} in cash, a driver's licence, and a photo of two small children.",
    choices: [
      { label: "Return it, cash and all", outcomes: [{ text: "The owner, overwhelmed, shook your hand for a full minute. You left your number.", tone: "good", effects: [fx.karma(6), fx.happy(4), fx.schedule("chain-wallet-thanks", [1, 5])] }] },
      { label: "Keep the cash, return the wallet", outcomes: [{ text: "You mailed the wallet back, light. You told yourself it was a finder's fee.", tone: "neutral", effects: [fx.cash(600), fx.karma(-4)] }] },
      { label: "Keep everything", outcomes: [{ weight: 3, text: "Nobody ever knew. You tried not to think about the photo.", tone: "bad", effects: [fx.cash(600), fx.karma(-8), fx.happy(-2)] }, { weight: 1, text: "The owner saw you on CCTV. It got awkward, and a policeman paid a visit.", tone: "bad", effects: [fx.cash(-200), fx.karma(-8), fx.happy(-5)] }] },
    ],
  },
  { id: "chain-wallet-thanks", ages: [14, 90], triggeredOnly: true, title: "A thank-you", text: "The man whose wallet you returned tracked you down. He runs a business, and he wanted to say thank you properly.", choices: [{ label: "Accept a job offer", outcomes: [{ text: "He offered you a spot at his company. It has been surprisingly good.", tone: "major", effects: [fx.cash(3000), fx.happy(5), fx.karma(2), fx.flag("wallet-job")] }] }, { label: "Accept a dinner invitation", outcomes: [{ text: "His family fed you until you couldn't move. You made friends for life.", tone: "good", effects: [fx.happy(6), fx.skill("charisma", 1)] }] }, { label: "Decline politely", outcomes: [{ text: "You said it was nothing. He insisted on sending a bottle of wine anyway.", tone: "good", effects: [fx.karma(2), fx.happy(2)] }] }] },

  // ---------------------------------------------------------------- the stranded driver
  {
    id: "chain-stranded-setup",
    ages: [17, 80],
    weight: 0.7,
    cooldown: 10,
    title: "Stranded",
    text: "On a quiet road at dusk, you passed a stranded driver waving for help. It was getting dark and you were running late.",
    choices: [
      { label: "Stop and help", outcomes: [{ weight: 4, text: "You changed their tyre in the rain. They were incredibly grateful.", tone: "good", effects: [fx.karma(5), fx.happy(3), fx.schedule("chain-stranded-return", [2, 8])] }, { weight: 1, text: "It was a trap. You got out of there with a bruise and no wallet.", tone: "bad", effects: [fx.health(-8), fx.cash(-300), fx.karma(3), fx.skill("streetSmarts", 2)] }] },
      { label: "Call it in and keep driving", outcomes: [{ text: "You called roadside assistance from a safe distance. Sensible.", tone: "neutral", effects: [fx.karma(1)] }] },
      { label: "Keep going", outcomes: [{ text: "You drove on, and spent the next twenty miles feeling like a coward.", tone: "bad", effects: [fx.karma(-2), fx.happy(-2)] }] },
    ],
  },
  { id: "chain-stranded-return", ages: [19, 90], triggeredOnly: true, title: "Karma, paid forward", text: "Years after you helped a stranger on a rainy road, you broke down yourself. The next car to stop turned out to be driven by the same person.", tone: "good", effects: [fx.happy(8), fx.karma(2), fx.health(1)] },

  // ---------------------------------------------------------------- the feud
  {
    id: "chain-feud-setup",
    ages: [22, 80],
    once: true,
    weight: 0.7,
    npc: { kind: "new", role: "neighbor", ageOffset: [-12, 20], closeness: 25, allowCameo: false },
    title: "The fence",
    text: "{npc}, your new neighbour, has built a fence two feet onto what you swear is your lawn.",
    choices: [
      { label: "Call a surveyor and fight it", outcomes: [{ weight: 2, text: "The survey showed you were right. {npc} paid for the new fence in a surly silence.", tone: "good", effects: [fx.cash(-400), fx.close(-12), fx.schedule("chain-feud-fire", [3, 7], true)] }, { weight: 1, text: "The survey showed {npc} was right. You were wrong. It was humiliating.", tone: "bad", effects: [fx.cash(-400), fx.close(-8), fx.happy(-4)] }] },
      { label: "Let it go and bring over cookies", outcomes: [{ weight: pass("charisma", 35), text: "{npc} was stunned into friendliness. You've been trading tomatoes ever since.", tone: "good", effects: [fx.close(25), fx.karma(3), fx.happy(4), fx.schedule("chain-feud-wedding", [3, 8], true)] }, { weight: fail("charisma", 35), text: "{npc} called the cookies 'a bit much'. The fence stays.", tone: "neutral", effects: [fx.close(3)] }] },
      { label: "Get petty", outcomes: [{ text: "You planted a very tall, very ugly hedge on your side. The war has begun.", tone: "bad", effects: [fx.close(-20), fx.happy(-2), fx.karma(-2), fx.schedule("chain-feud-fire", [3, 7], true)] }] },
    ],
  },
  { id: "chain-feud-fire", ages: [24, 90], triggeredOnly: true, title: "Smoke", text: "Years of cold war with {npc} ended abruptly: a fire broke out in {npc.his} kitchen and you were the first to see the smoke.", choices: [{ label: "Run in and help", outcomes: [{ text: "You dragged {npc} out. Neither of you said anything for a long moment, then {npc.he} cried. The fence came down the following week.", tone: "major", effects: [fx.close(60), fx.karma(10), fx.health(-3), fx.happy(5), fx.achieve("good-neighbor")] }] }, { label: "Call the fire department and wait", outcomes: [{ text: "The firefighters arrived in time. {npc} nodded stiffly at you the next day.", tone: "good", effects: [fx.close(20), fx.karma(2)] }] }] },
  { id: "chain-feud-wedding", ages: [24, 90], triggeredOnly: true, title: "A little invitation", text: "{npc} slipped an envelope through your door: an invitation to {npc.his} {daughter's|son's|own} wedding, with a note that said 'you're family now'.", tone: "good", effects: [fx.close(10), fx.happy(5), fx.karma(1)] },

  // ---------------------------------------------------------------- the mentor
  {
    id: "chain-mentor-setup",
    ages: [14, 26],
    once: true,
    weight: 0.8,
    npc: { kind: "existing", roles: ["teacher", "boss", "teammate"] },
    title: "Someone believes in you",
    text: "{npc} pulled you aside. 'You've got more in you than you're showing,' {npc.he} said. 'Let me help.'",
    choices: [
      { label: "Accept the help", outcomes: [{ text: "You started staying after school and working hard. It was exhausting and electrifying.", tone: "good", effects: [fx.smarts(3), fx.close(15), fx.schedule("chain-mentor-payoff", [3, 8], true)] }] },
      { label: "Brush it off", outcomes: [{ text: "You shrugged. {npc} looked disappointed and said nothing more.", tone: "bad", effects: [fx.close(-8), fx.happy(-1)] }] },
    ],
  },
  { id: "chain-mentor-payoff", ages: [17, 40], triggeredOnly: true, title: "A reference", text: "A letter from {npc} came out of nowhere: a glowing recommendation that someone had forwarded to a place you hadn't applied to yet.", effects: [fx.cash(2500), fx.happy(6), fx.smarts(1), fx.close(8)], tone: "good" },

  // ---------------------------------------------------------------- the bully
  {
    id: "chain-bully-setup",
    ages: [9, 17],
    once: true,
    weight: 0.8,
    npc: { kind: "new", role: "rival", ageOffset: [0, 1], closeness: 15 },
    title: "The bully",
    text: "{npc} has been making your life miserable for months. Today it got physical.",
    choices: [
      { label: "Fight back", outcomes: [{ weight: pass("athleticism", 45), text: "You won, mostly by flailing. {npc} left you alone after that, grudgingly.", tone: "good", effects: [fx.skill("streetSmarts", 2), fx.close(-10), fx.health(-3)] }, { weight: fail("athleticism", 45), text: "You lost the fight and got detention. It could have been worse.", tone: "bad", effects: [fx.health(-5), fx.happy(-4)] }] },
      { label: "Tell a teacher", outcomes: [{ text: "{npc} was disciplined. For a while, the bullying stopped.", tone: "neutral", effects: [fx.close(-5), fx.happy(2), fx.schedule("chain-bully-apology", [8, 18], true)] }] },
      { label: "Try to befriend {npc}", outcomes: [{ weight: pass("charisma", 50), text: "It took months, but {npc} turned out to be struggling at home. You became unlikely friends.", tone: "major", effects: [fx.close(40), fx.karma(5), fx.happy(5), fx.skill("charisma", 2)] }, { weight: fail("charisma", 50), text: "{npc} laughed at you. It stung.", tone: "bad", effects: [fx.happy(-3)] }] },
    ],
  },
  { id: "chain-bully-apology", ages: [20, 70], triggeredOnly: true, title: "A message from the past", text: "{npc} found you online: 'I've been wanting to say sorry for years. I was an awful kid. I hope you're doing well.'", choices: [{ label: "Forgive {npc.him}", outcomes: [{ text: "You wrote back kindly. It felt like setting down something heavy.", tone: "good", effects: [fx.karma(4), fx.happy(5), fx.close(15)] }] }, { label: "Ignore it", outcomes: [{ text: "Some apologies come too late. You didn't reply.", tone: "neutral", effects: [fx.happy(-1)] }] }] },

  // ---------------------------------------------------------------- the confidence
  {
    id: "chain-secret-setup",
    ages: [18, 70],
    once: true,
    weight: 0.7,
    npc: { kind: "existing", roles: ["friend", "bestFriend", "coworker"] },
    title: "A secret",
    text: "{npc} confided something huge to you: {npc.he} has been {having an affair|secretly job hunting|hiding a large debt|planning to leave town}. 'You can't tell anyone,' {npc.he} said.",
    choices: [
      { label: "Keep the secret", outcomes: [{ text: "You kept your word. It sat heavily on your chest for a while.", tone: "neutral", effects: [fx.close(12), fx.karma(2), fx.schedule("chain-secret-payoff", [1, 4], true)] }] },
      { label: "Tell someone you trust", outcomes: [{ weight: 2, text: "It got around anyway. {npc} knows it was you.", tone: "bad", effects: [fx.close(-35), fx.karma(-3), fx.happy(-3)] }, { weight: 1, text: "Your confidant had good advice. {npc} never found out.", tone: "neutral", effects: [fx.karma(-1)] }] },
      { label: "Urge {npc.him} to come clean", outcomes: [{ weight: pass("charisma", 45), text: "You talked it through. {npc} did the right thing and thanked you for it.", tone: "good", effects: [fx.close(18), fx.karma(3)] }, { weight: fail("charisma", 45), text: "{npc} got defensive and called you judgemental.", tone: "bad", effects: [fx.close(-12), fx.happy(-2)] }] },
    ],
  },
  { id: "chain-secret-payoff", ages: [19, 80], triggeredOnly: true, title: "Trust repaid", text: "{npc} came to you in a crisis and said: 'You're the only one I could think of who wouldn't betray me.'", tone: "good", effects: [fx.close(15), fx.happy(4), fx.karma(2)] },

  // ---------------------------------------------------------------- the witness
  {
    id: "chain-witness-setup",
    ages: [18, 80],
    weight: 0.5,
    cooldown: 20,
    title: "You saw something",
    text: "You witnessed a hit-and-run. The car sped off. You got the licence plate.",
    choices: [
      { label: "Give a full statement", outcomes: [{ text: "The police caught the driver. You gave testimony in court. It was nerve-wracking and necessary.", tone: "major", effects: [fx.karma(8), fx.happy(-2), fx.schedule("chain-witness-letter", [1, 3])] }] },
      { label: "Give an anonymous tip", outcomes: [{ text: "The police got the plate and left you out of it. Safe, if a little cowardly.", tone: "neutral", effects: [fx.karma(3)] }] },
      { label: "Stay out of it", outcomes: [{ text: "You didn't want trouble. The victim never got justice, and it haunts you now and then.", tone: "bad", effects: [fx.karma(-5), fx.happy(-3)] }] },
    ],
  },
  { id: "chain-witness-letter", ages: [18, 90], triggeredOnly: true, title: "A letter from the victim's family", text: "The family of the person hurt in the hit-and-run wrote to thank you. It made everything worth it.", tone: "good", effects: [fx.happy(6), fx.karma(3)] },

  // ---------------------------------------------------------------- the partner
  {
    id: "chain-partner-setup",
    ages: [24, 55],
    once: true,
    weight: 0.6,
    condition: when.employed,
    title: "A business partner",
    text: "An old friend proposes starting a business together. {A restaurant|A brewery|An app|A consultancy}. They want you to go halves.",
    choices: [
      { label: "Go in as an equal partner", outcomes: [{ text: "You pooled savings and signed the papers. It's thrilling and terrifying.", tone: "major", effects: [fx.cash(-5000), fx.happy(4), fx.schedule("chain-partner-ledger", [2, 4])] }] },
      { label: "Invest quietly but stay in your job", outcomes: [{ text: "You wired a smaller sum and kept your day job.", tone: "neutral", effects: [fx.cash(-2000), fx.schedule("chain-partner-small", [2, 5])] }] },
      { label: "Pass", outcomes: [{ text: "You wished them luck. They did it without you.", effects: [fx.happy(-1)] }] },
    ],
  },
  { id: "chain-partner-ledger", ages: [24, 70], triggeredOnly: true, title: "The books", text: "Reviewing the books, you notice the numbers do not add up. Your partner has been taking money out.", choices: [{ label: "Confront them", outcomes: [{ weight: 1, text: "They broke down: a gambling problem. You bought them out and held the business together.", tone: "neutral", effects: [fx.cash(-8000), fx.happy(-4), fx.karma(2)] }, { weight: 1, text: "They denied everything. The business collapsed in lawsuits.", tone: "bad", effects: [fx.cash(-15000), fx.happy(-9)] }] }, { label: "Quietly consult a lawyer", outcomes: [{ weight: pass("smarts", 50), text: "Your lawyer's paper trail won you a settlement.", tone: "good", effects: [fx.cash(12000), fx.happy(3), fx.karma(1)] }, { weight: fail("smarts", 50), text: "The lawyer's bills ate most of what you recovered.", tone: "neutral", effects: [fx.cash(-2000), fx.happy(-2)] }] }] },
  { id: "chain-partner-small", ages: [24, 75], triggeredOnly: true, title: "A dividend", text: "The business your friend started took off. Your small stake turned into a very nice return.", tone: "good", effects: [fx.cash(26000), fx.happy(7)] },

  // ---------------------------------------------------------------- the ex
  {
    id: "chain-ex-setup",
    ages: [24, 65],
    weight: 0.6,
    cooldown: 12,
    condition: when.all(when.noFlag("chain-ex-cooldown")),
    title: "A text from an ex",
    text: "Late at night, an ex texted: 'Hey. I was thinking about you. Can we talk?'",
    choices: [
      { label: "Call back", outcomes: [{ weight: 1, text: "You talked until sunrise. Closure, at last.", tone: "good", effects: [fx.happy(4), fx.flag("chain-ex-cooldown", true)] }, { weight: 1, text: "It reopened old wounds. You didn't sleep for a week.", tone: "bad", effects: [fx.happy(-5)] }, { weight: 0.5, text: "You started seeing each other again. Whatever happens, you'll make it a different story this time.", tone: "major", effects: [fx.happy(6), fx.schedule("chain-ex-fallout", [1, 3])] }] },
      { label: "Block the number", outcomes: [{ text: "You blocked it and slept like a baby. Mostly.", effects: [fx.happy(1)] }] },
    ],
  },
  { id: "chain-ex-fallout", ages: [24, 75], triggeredOnly: true, title: "History repeating", text: "It turns out that the same issues that ended things the first time were still there. The second breakup was quieter, and somehow sadder.", tone: "bad", effects: [fx.happy(-5), fx.skill("charisma", 1)] },

  // ---------------------------------------------------------------- the time capsule
  {
    id: "chain-capsule-setup",
    ages: [10, 17],
    once: true,
    weight: 0.7,
    title: "The time capsule",
    text: "Your class is burying a time capsule to be opened in twenty years. You get to add one item.",
    choices: [
      { label: "A letter to your future self", outcomes: [{ text: "You wrote down your biggest hopes and fears. You sealed it with a lick.", effects: [fx.schedule("chain-capsule-open", [18, 24]), fx.flag("capsule-item", "letter")] }] },
      { label: "Your favourite toy", outcomes: [{ text: "You said goodbye to a worn plush animal and buried it with ceremony.", effects: [fx.schedule("chain-capsule-open", [18, 24]), fx.flag("capsule-item", "toy")] }] },
      { label: "Something embarrassing", outcomes: [{ text: "You included a photo of yourself with a terrible haircut. Future you will thank you. Or not.", effects: [fx.schedule("chain-capsule-open", [18, 24]), fx.flag("capsule-item", "photo")] }] },
    ],
  },
  { id: "chain-capsule-open", ages: [27, 50], triggeredOnly: true, title: "The capsule is opened", text: "The school dug up your class's time capsule. Everyone gathered to see what was inside. Your {letter|toy|photo} was passed around, and some old classmates cried.", tone: "good", effects: [fx.happy(5)] },

  // ---------------------------------------------------------------- viral moment
  {
    id: "chain-viral-setup",
    ages: [13, 60],
    weight: 0.6,
    cooldown: 10,
    title: "Caught on camera",
    text: "Someone filmed you doing something silly in public and posted it online. It's gaining views fast.",
    choices: [
      { label: "Lean into it", outcomes: [{ weight: pass("charisma", 45), text: "You made a response video, and then another. You're now a minor internet celebrity.", tone: "major", effects: [fx.fame(4), fx.custom((ctx) => { ctx.player.followers += 30_000; }), fx.schedule("chain-viral-brand", [0, 1])] }, { weight: fail("charisma", 45), text: "Your response video was cringeworthy. The internet noticed.", tone: "bad", effects: [fx.happy(-5), fx.fame(1)] }] },
      { label: "Ask for it to be taken down", outcomes: [{ text: "The video was removed. It still lives on in a few corners.", tone: "neutral", effects: [fx.happy(-1)] }] },
      { label: "Ignore it", outcomes: [{ text: "By next week, the internet had moved on to a cat on a skateboard.", effects: [] }] },
    ],
  },
  { id: "chain-viral-brand", ages: [13, 70], triggeredOnly: true, title: "A brand deal", text: "A company has noticed your viral moment and wants to pay you to promote their product.", choices: [{ label: "Take the deal", outcomes: [{ text: "You made a quick ad. It paid well and your followers rolled their eyes.", tone: "neutral", effects: [fx.cash(8000), fx.fame(1)] }] }, { label: "Turn it down", outcomes: [{ text: "You kept your integrity and your followers' trust.", tone: "good", effects: [fx.karma(2), fx.happy(2)] }] }] },

  // ---------------------------------------------------------------- sibling and will
  {
    id: "chain-sibling-setup",
    ages: [30, 75],
    once: true,
    weight: 0.5,
    npc: { kind: "existing", roles: ["sibling"] },
    title: "The family home",
    text: "With your parent's health failing, {npc} wants to discuss what happens to the family home. 'We should sell,' {npc.he} says.",
    choices: [
      { label: "Agree to sell", outcomes: [{ text: "You split the proceeds evenly. It was practical, and sad.", tone: "neutral", effects: [fx.cash(30000), fx.close(6), fx.happy(-3)] }] },
      { label: "Insist on keeping it", outcomes: [{ weight: 1, text: "You bought out {npc}'s share. The house stays in the family.", tone: "good", effects: [fx.cash(-20000), fx.close(-4), fx.happy(5), fx.schedule("chain-sibling-reunion", [2, 6], true)] }, { weight: 1, text: "It escalated into a bitter family feud.", tone: "bad", effects: [fx.close(-35), fx.happy(-6)] }] },
      { label: "Let {npc.him} have it", outcomes: [{ text: "You walked away. {npc} was moved and shocked by your generosity.", tone: "good", effects: [fx.close(25), fx.karma(5), fx.happy(-1)] }] },
    ],
  },
  { id: "chain-sibling-reunion", ages: [32, 90], triggeredOnly: true, title: "Holidays at the old house", text: "Thanks to your decision, the whole family gathered at the old house for the holidays. {npc} brought the grandkids.", tone: "good", effects: [fx.happy(8), fx.close(10)] },

  // ---------------------------------------------------------------- the stray
  {
    id: "chain-stray-setup",
    ages: [8, 80],
    weight: 0.8,
    cooldown: 15,
    title: "A stray",
    text: "A scruffy stray {dog|cat} has been following you around the neighbourhood for days.",
    choices: [
      { label: "Take it in", outcomes: [{ text: "You fed it, washed it, and named it. It sleeps on your bed.", tone: "good", effects: [fx.happy(8), fx.karma(3), fx.custom((ctx) => { ctx.state.flags.strayAdopted = ctx.player.age; })] }] },
      { label: "Take it to a shelter", outcomes: [{ text: "The shelter found it a home within a week. You got a thank-you card.", tone: "good", effects: [fx.karma(4), fx.happy(2)] }] },
      { label: "Shoo it away", outcomes: [{ text: "It followed you for another block, then gave up.", tone: "bad", effects: [fx.karma(-2), fx.happy(-2)] }] },
    ],
  },

  // ---------------------------------------------------------------- the dare gone wrong
  {
    id: "chain-dare-setup",
    ages: [11, 19],
    weight: 0.8,
    title: "Triple dog dare",
    text: "Your friends dared you to sneak into the abandoned factory at the edge of town.",
    choices: [
      { label: "Do it", outcomes: [{ weight: 2, text: "You went in, grabbed a rusty sign, and ran out screaming. Legends are made of this.", tone: "good", effects: [fx.happy(5), fx.skill("streetSmarts", 2), fx.skill("charisma", 1)] }, { weight: 1, text: "You fell through a rotten floor and broke your wrist.", tone: "bad", effects: [fx.health(-12), fx.happy(-3), fx.cash(-1200)] }, { weight: 0.5, text: "A security guard caught you, called your parents, and gave you a lecture.", tone: "bad", effects: [fx.happy(-4), fx.karma(-1)] }] },
      { label: "Refuse", outcomes: [{ text: "You said no. Some friends teased you, but you kept your bones intact.", effects: [fx.happy(-1), fx.skill("streetSmarts", 1)] }] },
    ],
  },
  // ---------------------------------------------------------------- the offer you can't refuse (small)
  {
    id: "chain-recruit-setup",
    ages: [20, 55],
    weight: 0.5,
    cooldown: 15,
    title: "Join us",
    text: "A friendly stranger at the gym handed you a flyer: 'Be your own boss! Unlimited income! Join our team.' It sounds like a pyramid scheme.",
    choices: [
      { label: "Hear them out", outcomes: [{ weight: 5, text: "It was a pyramid scheme. You lost money, friends and dignity.", tone: "bad", effects: [fx.cash(-2500), fx.happy(-5), fx.skill("streetSmarts", 3)] }, { weight: 1, text: "It was a legitimate sales job, honestly. You made a modest living.", tone: "neutral", effects: [fx.cash(1500)] }] },
      { label: "Tell them no", outcomes: [{ text: "You kept your money, and they kept pestering other people.", effects: [fx.skill("streetSmarts", 1)] }] },
    ],
  },
  // ---------------------------------------------------------------- the old rival
  {
    id: "chain-rival-setup",
    ages: [25, 60],
    once: true,
    weight: 0.5,
    npc: { kind: "new", role: "rival", ageOffset: [-3, 3], closeness: 20 },
    title: "Your old rival",
    text: "{npc} from school is now up for the same promotion, award or opportunity you are. They've been working on you, one way or another.",
    choices: [
      { label: "Compete fairly", outcomes: [{ weight: pass("smarts", 55), text: "You earned it. {npc} shook your hand without enthusiasm.", tone: "good", effects: [fx.happy(5), fx.karma(2), fx.close(8)] }, { weight: fail("smarts", 55), text: "You lost, honestly. {npc} did a victory dance. A small one.", tone: "bad", effects: [fx.happy(-4), fx.close(-5)] }] },
      { label: "Undermine {npc.him}", outcomes: [{ weight: 1, text: "It worked. {npc} was sidelined and you got ahead. You don't feel great about it.", tone: "neutral", effects: [fx.happy(1), fx.karma(-5), fx.close(-25)] }, { weight: 1, text: "It backfired spectacularly and your plan was exposed.", tone: "bad", effects: [fx.happy(-6), fx.karma(-5), fx.close(-25)] }] },
      { label: "Withdraw gracefully", outcomes: [{ text: "You stepped aside and focused on your own path. A weight lifted.", tone: "good", effects: [fx.happy(3), fx.karma(2)] }] },
    ],
  },
]);
