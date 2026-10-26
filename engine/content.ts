import type { EventRegistry } from "./events/registry";
import type { Country, CountryId, FriendConfig, GameAction } from "./types";

/**
 * Everything data-driven the engine needs. Passed into engine entry points so the
 * engine never imports /data directly and tests can inject their own content.
 */
export interface Content {
  events: EventRegistry;
  countries: Readonly<Record<CountryId, Country>>;
  friends: readonly FriendConfig[];
  actions: readonly GameAction[];
}

export function countryOf(content: Content, id: CountryId): Country {
  const c = content.countries[id];
  if (!c) throw new Error(`Unknown country "${id}"`);
  return c;
}
