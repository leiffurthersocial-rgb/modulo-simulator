import type { GameAction } from "@/engine/types";
import { SCHOOL_ACTIONS } from "./school";

/** Every player action in the game. Add new action files here. */
export const ALL_ACTIONS: readonly GameAction[] = [...SCHOOL_ACTIONS];
