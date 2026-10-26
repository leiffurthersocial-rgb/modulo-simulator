import type { DeathCause } from "@/engine/types";

/** Death log lines. {age} and other template placeholders work here. */
export const DEATH_TEXTS: Record<DeathCause, readonly string[]> = {
  oldAge: [
    "You died peacefully in your sleep at {age}.",
    "At {age}, you closed your eyes after lunch and simply didn't open them again.",
    "You died of old age at {age}, mid-sentence in a story nobody will ever hear the end of.",
  ],
  heartDisease: [
    "Your heart gave out at {age}.",
    "You died of a heart attack at {age} while shoveling the driveway.",
    "Heart disease caught up with you at {age}.",
  ],
  cancer: ["You died of cancer at {age} after a long fight.", "Cancer took you at {age}. You were brave about it."],
  stroke: ["You suffered a fatal stroke at {age}.", "A sudden stroke ended your life at {age}."],
  illness: [
    "You died of a severe illness at {age}.",
    "A bout of pneumonia you kept ignoring turned out to be fatal at {age}.",
  ],
  complications: ["You died at {age} from complications nobody saw coming."],
  accident: [
    "You died at {age} after falling down the stairs.",
    "A freak accident at home ended your life at {age}.",
    "You died at {age} after slipping off a ladder you swore was stable.",
  ],
  carCrash: ["You died in a car crash at {age}.", "A drunk driver ran a red light. You died at {age}."],
  overdose: ["You died of an overdose at {age}."],
  murdered: ["You were murdered at {age}. The case went cold.", "You were killed in a mugging at {age}."],
  executed: ["You were executed by the state at {age}."],
  prisonFight: ["You were killed in a prison fight at {age}."],
  drowning: ["You drowned at {age} after swimming out farther than you should have."],
  animal: [
    "You were killed by a startled moose at {age}.",
    "You died at {age} after a very unlucky encounter with a bull.",
  ],
  misadventure: [
    "You died at {age} trying to retrieve a frisbee from a roof.",
    "You died at {age} after a camping trip went badly wrong.",
  ],
};
