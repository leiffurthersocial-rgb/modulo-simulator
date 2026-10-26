import type { DialogueSituation, PersonalityTrait } from "@/engine/types";

type Lines = Partial<Record<DialogueSituation, readonly string[]>>;

/** Generic lines anyone might say. {first} is the player's first name. */
export const GENERIC_LINES: Lines = {
  greeting: ["Hey, you!", "Oh good, it's you.", "Long time no see.", "There you are!"],
  compliment: ["Aw, stop it. Actually, keep going.", "That's really sweet of you.", "You're just saying that. But thanks."],
  insult: ["Wow. Okay.", "Did you really just say that?", "I'll remember this."],
  spendTime: ["This was nice. We should do it more.", "I needed this.", "Same time next week?"],
  gift: ["You didn't have to! I love it.", "Is this... for me? Thank you!", "You remembered!"],
  argue: ["You never listen!", "That's not what I said and you know it.", "Fine. Whatever."],
  askMoney: ["What's it for, exactly?", "I'm not a bank, you know.", "I guess I can help a little."],
  congratulate: ["I'm so proud of you.", "You earned it.", "Look at you go!"],
  console: ["It's going to be okay.", "I'm here for you.", "That's rough. I'm sorry."],
  farewell: ["Take care of yourself.", "See you around.", "Don't be a stranger."],
};

/** Trait-flavored lines. When an NPC has a trait, these get mixed in (and preferred). */
export const TRAIT_LINES: Partial<Record<PersonalityTrait, Lines>> = {
  funny: {
    any: ["I'd tell you a joke about time travel, but you didn't like it.", "I'm not saying I'm the funniest person here, but look around."],
    spendTime: ["I haven't laughed that hard in months.", "That's going in my top ten afternoons."],
    insult: ["Bold words from someone who {says|thinks} \"expresso.\""],
  },
  mean: {
    any: ["What do you want?", "Oh. It's you."],
    compliment: ["I know.", "Took you long enough to notice."],
    askMoney: ["Get a job.", "Absolutely not."],
  },
  kind: {
    any: ["How are you, really?", "I was just thinking about you!"],
    askMoney: ["Of course. Pay me back whenever, no pressure."],
    insult: ["I think you're having a hard day. That's okay."],
  },
  grumpy: {
    any: ["Hmph.", "Back in my day we didn't have whatever this is."],
    spendTime: ["That was... fine. Don't tell anyone I said so."],
  },
  generous: { askMoney: ["Say no more. How much?"], gift: ["You shouldn't have! Now I have to get you something better."] },
  greedy: { askMoney: ["What's my cut?", "Money doesn't grow on trees. Mine does, but it's mine."] },
  dramatic: {
    any: ["You will NOT believe what happened to me today.", "My life is a movie and I'm tired of being the lead."],
    argue: ["I can't believe you'd do this to me. After EVERYTHING."],
  },
  chill: { any: ["All good, all good.", "No stress."], argue: ["Eh. Let's just drop it."] },
  nerdy: { any: ["Have you read the new paper on {black holes|ant colonies|medieval bread}? Fascinating."], spendTime: ["I stand by it: a hot dog is a sandwich."] },
  sporty: { any: ["Wanna go for a run later?"], spendTime: ["Same time next week? I want a rematch."] },
  artsy: { any: ["I'm working on a new piece. It's about {loss|toast|the sea}."], gift: ["I'm going to paint this."] },
  romantic: { any: ["Have you ever just looked at the moon? Really looked?"], compliment: ["You always know what to say."] },
  jealous: { any: ["Who were you texting earlier?"], spendTime: ["I like it when it's just us."] },
  loyal: { any: ["You know I've always got your back."], console: ["Whatever you need. I'm in."] },
  flaky: { spendTime: ["Sorry I was late! And sorry about last time. And the time before."], any: ["We should totally hang out! I'll text you."] },
  honest: { compliment: ["Thanks. Your shirt's a little weird though."], any: ["Can I be honest with you? I'm always honest with you."] },
  sneaky: { any: ["Don't ask where I got this.", "Hypothetically, if someone needed an alibi..."] },
  ambitious: { any: ["I'm starting a podcast. And a company. And a podcast about the company."] },
  lazy: { any: ["I'd love to, but I just sat down.", "Can we do this lying down?"] },
  outgoing: { any: ["I know a great place! I know a lot of great places!"] },
  shy: { any: ["Oh! Um. Hi.", "..."] },
  party: { any: ["Tonight. You and me. Don't argue."], spendTime: ["Next time, we're going out-out."] },
  religious: { any: ["I'll keep you in my prayers."], console: ["Everything happens for a reason."] },
  musical: { any: ["I can't stop humming this one song."], spendTime: ["We should start a band. I'm serious this time."] },
  competitive: { any: ["Rematch. Right now."], spendTime: ["I won. It was close. It wasn't close."] },
  adventurous: { any: ["Let's do something we've never done before."], spendTime: ["Next time, let's just get in the car and drive."] },
  cautious: { any: ["Did you remember to lock the door?"] },
  serious: { any: ["We need to talk about something important."] },
};
