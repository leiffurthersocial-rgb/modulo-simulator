import type { GameEvent } from "@/engine/types";
import { BABY_EVENTS } from "./baby";
import { CHILDHOOD_EVENTS } from "./childhood";

/** Every event in the game. Add new event files here. */
export const ALL_EVENTS: readonly GameEvent[] = [...BABY_EVENTS, ...CHILDHOOD_EVENTS];
