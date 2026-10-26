# Modulo Simulator

*Life, mod N.* A text-based life simulator. Next.js (App Router) + TypeScript + Tailwind + Zustand, fully client-side.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build (what Vercel runs) |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest engine tests |

## Layout

```
app/          Next.js routes (UI only)
components/   React components
store/        Zustand store: wires the engine to the UI, persistence
engine/       Pure TypeScript game engine. No React, no DOM.
  types/      Core types: player, NPCs, events, friends, countries, game state
  events/     Event registry, selection, templating, effects, authoring helpers
  lifecycle/  New life, yearly age-up loop, death
  rng.ts      Seeded, serializable RNG
data/         Content: events, countries, careers, friends, config
tests/        Vitest tests for the engine
```

The engine never imports from `app/`, `components/`, or `store/`. Content (events, countries, friends) reaches it through a `Content` bundle (`data/index.ts` → `DEFAULT_CONTENT`), so tests can inject their own. The engine reads only the tunables in `data/config.ts` and a couple of flavor tables directly.

## Engine at a glance

```ts
import { DEFAULT_CONTENT } from "@/data";
import { newLife, ageUp, choose } from "@/engine";

let s = newLife(DEFAULT_CONTENT, { seed: "abc" }); // deterministic per seed
s = ageUp(s, DEFAULT_CONTENT);                      // pure: returns a new state
if (s.pending[0]) s = choose(s, DEFAULT_CONTENT, s.pending[0].uid, s.pending[0].choices[0]!.id);
```

`GameState` is plain JSON (the RNG state is a single number on it), so saves, export/import and rewinds are just snapshots.
