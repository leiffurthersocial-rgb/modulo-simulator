import type { GameEvent } from "@/engine/types";
import { BABY_EVENTS } from "./baby";
import { CHILDHOOD_EVENTS } from "./childhood";
import { SCHOOL_EVENTS } from "./school";
import { TEEN_EVENTS } from "./teen";
import { COLLEGE_EVENTS } from "./college";
import { YOUNG_ADULT_EVENTS } from "./youngAdult";
import { WORK_EVENTS } from "./work";
import { MONEY_EVENTS } from "./money";
import { ROMANCE_EVENTS } from "./romance";
import { FAMILY_EVENTS } from "./family";
import { CRIME_EVENTS, PRISON_EVENTS } from "./crime";
import { HEALTH_EVENTS } from "./health";
import { FAME_EVENTS } from "./fame";
import { SPECIAL_EVENTS } from "./special";
import { WILD_EVENTS } from "./wild";
import { EVERYDAY_EVENTS, KID_EXTRA_EVENTS } from "./everyday";

/** Every event in the game. Add new event files here. */
export const ALL_EVENTS: readonly GameEvent[] = [...BABY_EVENTS, ...CHILDHOOD_EVENTS, ...SCHOOL_EVENTS, ...TEEN_EVENTS, ...COLLEGE_EVENTS, ...YOUNG_ADULT_EVENTS, ...WORK_EVENTS, ...MONEY_EVENTS, ...ROMANCE_EVENTS, ...FAMILY_EVENTS, ...CRIME_EVENTS, ...PRISON_EVENTS, ...HEALTH_EVENTS, ...FAME_EVENTS, ...SPECIAL_EVENTS, ...WILD_EVENTS, ...EVERYDAY_EVENTS, ...KID_EXTRA_EVENTS];
