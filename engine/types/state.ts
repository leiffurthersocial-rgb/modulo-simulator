import type { EventId, FlagValue, NpcId, Stats } from "./common";
import type { CameoRecord, FriendDestiny } from "./friend";
import type { Npc } from "./npc";
import type { Player } from "./player";

export type Tone = "good" | "bad" | "neutral" | "major";

export interface LogEntry {
  text: string;
  tone: Tone;
}

/** All log entries for one year of the player's life. */
export interface LogYear {
  age: number;
  year: number;
  entries: LogEntry[];
}

export type TemplateVars = Record<string, string | number>;

/** A choice event waiting for the player. Text is already rendered, so this is plain JSON. */
export interface PendingEvent {
  uid: string;
  eventId: EventId;
  title?: string;
  text: string;
  choices: { id: string; label: string }[];
  npcId?: NpcId;
  vars: TemplateVars;
}

/** A future event: chains, callbacks ("that kid you bullied is now your boss"), delayed consequences. */
export interface ScheduledEvent {
  eventId: EventId;
  atAge: number;
  npcId?: NpcId;
  vars?: TemplateVars;
}

export type DeathCause =
  | "oldAge"
  | "heartDisease"
  | "cancer"
  | "stroke"
  | "illness"
  | "accident"
  | "carCrash"
  | "overdose"
  | "murdered"
  | "executed"
  | "prisonFight"
  | "drowning"
  | "animal"
  | "misadventure"
  | "complications";

export interface DeathInfo {
  age: number;
  year: number;
  cause: DeathCause;
  text: string;
}

/** A message popup without choices (action results, big news). Dismissed by the player. */
export interface Notice {
  id: string;
  title?: string;
  text: string;
  tone: Tone;
  npcId?: NpcId;
}

export interface MarketState {
  /** Current price per unit, USD-equivalent. */
  prices: Record<string, number>;
  /** Yearly price history, oldest first. */
  history: Record<string, number[]>;
}

/** One point per year for summary charts. */
export interface TimelinePoint {
  age: number;
  netWorth: number;
  stats: Stats;
}

/** Things carried over when continuing as your child (legacy mode). */
export interface Legacy {
  parentName: string;
  inheritance: number;
}

export type GameMode = "normal" | "casual";

export interface Difficulty {
  /** Multiplier on yearly mortality risk. */
  mortality: number;
  /** Multiplier on event frequency. */
  eventRate: number;
  /** Multiplier on salaries. */
  economy: number;
}

export interface GameState {
  /** Save schema version, bumped whenever the shape changes (see engine/save.ts migrations). */
  version: number;
  seed: string;
  rngState: number;
  mode: GameMode;
  difficulty: Difficulty;
  /** Legacy mode generation counter, 1 for a fresh family line. */
  generation: number;
  /** Current calendar year. */
  year: number;
  player: Player;
  npcs: Record<NpcId, Npc>;
  log: LogYear[];
  pending: PendingEvent[];
  scheduled: ScheduledEvent[];
  /** Persistent life flags: the memory used by callback events. */
  flags: Record<string, FlagValue>;
  /** Event id -> ages at which it fired. Drives `once` and `cooldown`. */
  fired: Record<EventId, number[]>;
  /** Achievement ids unlocked during this life. */
  achievements: string[];
  cameos: {
    destined: FriendDestiny[];
    met: CameoRecord[];
  };
  status: "alive" | "dead";
  death?: DeathInfo;
  notices: Notice[];
  /** Action id -> uses this year. Reset on age up. */
  actionsThisYear: Record<string, number>;
  market: MarketState;
  timeline: TimelinePoint[];
  /** "What if?" rewinds left (casual mode). */
  rewindsLeft: number;
  legacy?: Legacy;
}
