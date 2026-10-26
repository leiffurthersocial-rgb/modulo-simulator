import type { GameAction } from "@/engine/types";
import { ACTIVITY_ACTIONS } from "./activities";
import { ASSET_ACTIONS } from "./assets";
import { CAREER_ACTIONS } from "./career";
import { CRIME_ACTIONS, DARK_ACTIONS, PRISON_ACTIONS } from "./crime";
import { LOVE_ACTIONS } from "./love";
import { MONEY_ACTIONS } from "./money";
import { PEOPLE_ACTIONS } from "./people";
import { SCHOOL_ACTIONS } from "./school";

/** Every player action in the game. Add new action files here. */
export const ALL_ACTIONS: readonly GameAction[] = [
  ...SCHOOL_ACTIONS,
  ...CAREER_ACTIONS,
  ...ASSET_ACTIONS,
  ...MONEY_ACTIONS,
  ...PEOPLE_ACTIONS,
  ...LOVE_ACTIONS,
  ...ACTIVITY_ACTIONS,
  ...CRIME_ACTIONS,
  ...DARK_ACTIONS,
  ...PRISON_ACTIONS,
];
