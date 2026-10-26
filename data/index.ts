import type { Content } from "@/engine/content";
import { EventRegistry } from "@/engine/events/registry";
import { ALL_ACTIONS } from "./actions";
import { CAREERS } from "./careers";
import { COUNTRY_BY_ID } from "./countries";
import { ALL_EVENTS } from "./events";
import { FRIENDS } from "./friends";

/** The game's built-in content, wired into the engine. */
export const DEFAULT_CONTENT: Content = {
  events: new EventRegistry(ALL_EVENTS),
  countries: COUNTRY_BY_ID,
  friends: FRIENDS,
  actions: ALL_ACTIONS,
  careers: CAREERS,
};
