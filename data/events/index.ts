import type { GameEvent } from "@/engine/types";
import { BABY_EVENTS } from "./baby";
import { CHILDHOOD_EVENTS } from "./childhood";
import { SCHOOL_EVENTS } from "./school";
import { TEEN_EVENTS } from "./teen";
import { COLLEGE_EVENTS } from "./college";
import { YOUNG_ADULT_EVENTS } from "./youngAdult";

/** Every event in the game. Add new event files here. */
export const ALL_EVENTS: readonly GameEvent[] = [...BABY_EVENTS, ...CHILDHOOD_EVENTS, ...SCHOOL_EVENTS, ...TEEN_EVENTS, ...COLLEGE_EVENTS, ...YOUNG_ADULT_EVENTS];
