import { DEFAULT_CONTENT } from "@/data";
import type { Content } from "@/engine/content";
import { makeContext } from "@/engine/events/context";
import { EventRegistry } from "@/engine/events/registry";
import { newLife } from "@/engine/lifecycle/newLife";
import { Rng } from "@/engine/rng";
import type { EventContext, FriendConfig, GameEvent, GameState } from "@/engine/types";

export function contentWith(events: readonly GameEvent[], friends: readonly FriendConfig[] = []): Content {
  return { ...DEFAULT_CONTENT, events: new EventRegistry(events), friends };
}

export function freshLife(seed = "test", content: Content = DEFAULT_CONTENT): GameState {
  return newLife(content, { seed, year: 2000, countryId: "us" });
}

/** A state of a given age without running the yearly simulation. */
export function lifeAtAge(age: number, seed = "test", content: Content = DEFAULT_CONTENT): GameState {
  const s = freshLife(seed, content);
  s.player.age = age;
  s.year += age;
  return s;
}

export function ctxFor(state: GameState, content: Content = DEFAULT_CONTENT, seed = "ctx"): EventContext {
  return makeContext(state, Rng.fromSeed(seed), content);
}
