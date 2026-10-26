import type { Dyn, EventContext, TextTemplate } from "./event";
import type { Tone } from "./state";

/** Where an action shows up in the UI. */
export type ActionSection =
  | "activities"
  | "health"
  | "mind"
  | "love"
  | "nightlife"
  | "crime"
  | "money"
  | "casino"
  | "fame"
  | "politics"
  | "prison"
  | "school"
  | "career"
  | "special"
  /** Interactions with one person; receive params.npcId and ctx.npc. */
  | "people"
  | "assets";

export type ActionParams = Record<string, string | number>;

/** One choice in an action's picker (a college program, a job opening, a car for sale). */
export interface ActionOption {
  id: string;
  label: string;
  description?: string;
  /** Already country-scaled money shown on the row. */
  price?: number;
  /** Shown disabled with this reason. */
  blocked?: string;
  icon?: string;
}

export interface ActionResult {
  title?: string;
  text: string;
  tone?: Tone;
  /** Log the result in the life log as well as showing it (default true). */
  log?: boolean;
}

/**
 * Something the player chooses to do outside of aging up: hit the gym, apply for a job,
 * shoplift. Parameterized actions (which person, which house) receive `params`.
 */
export interface GameAction {
  id: string;
  section: ActionSection;
  /** Sub-heading within the section. */
  group?: string;
  label: TextTemplate;
  description?: TextTemplate;
  /** lucide-react icon name (PascalCase). */
  icon?: string;
  /** Hidden entirely unless true. */
  visible?: (ctx: EventContext) => boolean;
  /** Shown but disabled with this reason. */
  blocked?: (ctx: EventContext, params: ActionParams) => string | undefined;
  /** Max uses per year. */
  perYear?: number;
  /** Max uses per year per person (people actions, keyed by params.npcId). */
  perYearPerPerson?: number;
  /**
   * If present, the UI shows these as a picker first and runs the action with
   * params.option set to the chosen id.
   */
  options?: (ctx: EventContext, params: ActionParams) => ActionOption[];
  /** Custom UI that collects input before running (e.g. "blackjack"). */
  ui?: string;
  /** Cost shown on the button (US-baseline money, scaled by country). */
  cost?: Dyn<number>;
  run: (ctx: EventContext, params: ActionParams) => ActionResult | void;
}
