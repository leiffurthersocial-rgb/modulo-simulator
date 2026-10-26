import type { GameAction } from "@/engine/types";
import { ASSET_ACTIONS } from "./assets";
import { CAREER_ACTIONS } from "./career";
import { MONEY_ACTIONS } from "./money";
import { SCHOOL_ACTIONS } from "./school";

/** Every player action in the game. Add new action files here. */
export const ALL_ACTIONS: readonly GameAction[] = [...SCHOOL_ACTIONS, ...CAREER_ACTIONS, ...ASSET_ACTIONS, ...MONEY_ACTIONS];
