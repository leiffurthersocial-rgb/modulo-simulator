import type { Content } from "../content";
import type { Rng } from "../rng";
import type { Amount, EventId, FlagValue, Gender, NpcId, SkillKey, StatKey } from "./common";
import type { Country } from "./country";
import type { Npc, NpcRole } from "./npc";
import type { AddictionKind, Player } from "./player";
import type { DeathCause, GameState, TemplateVars, Tone } from "./state";

/**
 * Everything an event's conditions, weights, templates, and effects can see.
 * `state` is the engine's working copy for this turn; `player` and `country` are shortcuts.
 */
export interface EventContext {
  state: GameState;
  player: Player;
  country: Country;
  rng: Rng;
  content: Content;
  /** The NPC bound to this event (see GameEvent.npc), if any. */
  npc?: Npc;
  vars: TemplateVars;
}

export type Predicate = (ctx: EventContext) => boolean;

/** A value that may be computed from context. */
export type Dyn<T> = T | ((ctx: EventContext) => T);

/**
 * Text with placeholders like {first}, {npc}, {he}, {money:500}, and inline
 * variations {pick|one|of these}. An array means "pick one variant at random".
 * See engine/events/template.ts for the full list.
 */
export type TextTemplate = string | readonly string[] | ((ctx: EventContext) => string);

/** Who an effect targets: the event's bound NPC, the first living NPC with a role, or a specific id. */
export type NpcRef = "bound" | NpcRole | { id: NpcId };

export type Effect =
  | { kind: "stat"; stat: StatKey; amount: Amount }
  | { kind: "skill"; skill: SkillKey; amount: Amount }
  /** Money in USD-equivalent units; displayed in local currency. */
  | { kind: "cash"; amount: Amount }
  | { kind: "karma"; amount: Amount }
  | { kind: "fame"; amount: Amount }
  | { kind: "closeness"; who: NpcRef; amount: Amount }
  | { kind: "npcTag"; who: NpcRef; tag: string }
  /** Drop the NPC from the player's active circle (moved away, cut off). */
  | { kind: "loseContact"; who: NpcRef }
  | { kind: "setFlag"; key: string; value: FlagValue }
  | { kind: "incFlag"; key: string; by?: number }
  /** Queue a future event. `withNpc` carries the bound NPC into it. */
  | { kind: "schedule"; eventId: EventId; inYears: Amount; withNpc?: boolean }
  | { kind: "achievement"; id: string }
  | { kind: "addiction"; addiction: AddictionKind; amount: Amount }
  | { kind: "die"; cause: DeathCause; text: TextTemplate }
  | { kind: "log"; text: TextTemplate; tone?: Tone }
  /** Escape hatch for one-off logic. Mutate ctx.state / ctx.player directly. */
  | { kind: "custom"; run: (ctx: EventContext) => void };

export type Effects = readonly Effect[] | ((ctx: EventContext) => readonly Effect[]);

export interface Outcome {
  /** Relative weight among this choice's outcomes. Use helpers like `check()` for skill-based odds. */
  weight?: Dyn<number>;
  /** Logged result. Omit for silent outcomes. */
  text?: TextTemplate;
  tone?: Tone;
  effects?: Effects;
  /** Immediately present another (usually `triggeredOnly`) event: multi-step chains. */
  next?: EventId;
}

export interface EventChoice {
  /** Stable id; defaults to the choice's index. */
  id?: string;
  label: TextTemplate;
  /** Hide this choice unless true. */
  condition?: Predicate;
  outcomes: readonly Outcome[];
}

/** Bind an NPC to the event, making {npc} etc. available in text and `"bound"` usable in effects. */
export type NpcBinding =
  | {
      kind: "existing";
      roles: readonly NpcRole[];
      filter?: (npc: Npc, ctx: EventContext) => boolean;
    }
  | {
      kind: "new";
      role: NpcRole;
      /** Age relative to the player, inclusive. Default [0, 0]. */
      ageOffset?: readonly [number, number];
      /** Absolute age range; overrides ageOffset. */
      age?: readonly [number, number];
      /** "attracted" picks a gender the player is attracted to (romance). Default random. */
      gender?: Gender | "attracted";
      /** Starting closeness. Default 50. */
      closeness?: Amount;
      /** Whether the new NPC joins the relationship list (default true). False = one-off stranger. */
      keep?: boolean;
      /** Friend cameos are only considered for "new" bindings with this flag (default true). */
      allowCameo?: boolean;
    };

export type EventCategory =
  | "baby"
  | "childhood"
  | "school"
  | "teen"
  | "family"
  | "friends"
  | "romance"
  | "college"
  | "career"
  | "money"
  | "health"
  | "crime"
  | "prison"
  | "fame"
  | "politics"
  | "phase"
  | "callback"
  | "rival"
  | "wild"
  | "random";

export interface GameEvent {
  id: EventId;
  category: EventCategory;
  /** Inclusive player age range in which this event can fire. */
  ages: readonly [number, number];
  /** Relative selection weight (default 1). Return 0 to make it ineligible. */
  weight?: Dyn<number>;
  condition?: Predicate;
  /** At most once per life. */
  once?: boolean;
  /** Minimum years between firings. */
  cooldown?: number;
  /** Where the player must be (default "free"). */
  where?: "free" | "prison" | "any";
  /** Only fires through `next` or `schedule`, never from the random pool. */
  triggeredOnly?: boolean;
  npc?: NpcBinding;
  /** Short heading for the popup card. */
  title?: TextTemplate;
  text: TextTemplate;
  tone?: Tone;
  /** Effects applied when an event without choices fires. Also applied before choices on a choice event. */
  effects?: Effects;
  /** 2-4 choices make this a popup that pauses the game. */
  choices?: readonly EventChoice[];
}
