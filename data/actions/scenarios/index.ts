import type { GameAction } from "@/engine/types";
import { LEISURE_SCENARIOS } from "./leisure";
import { MONEY_SCENARIOS } from "./money";
import { PURSUITS } from "./pursuits";
import { SOCIAL_SCENARIOS } from "./social";
import { WORK_SCENARIOS } from "./work";

/** Choose-your-approach actions and long-running pursuits. Add new scenario files here. */
export const SCENARIO_ACTIONS: readonly GameAction[] = [...LEISURE_SCENARIOS, ...WORK_SCENARIOS, ...SOCIAL_SCENARIOS, ...MONEY_SCENARIOS, ...PURSUITS];
