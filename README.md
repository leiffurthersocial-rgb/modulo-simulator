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

The engine never imports from `app/`, `components/`, or `store/`. Content in `data/` only depends on engine *types* and authoring helpers.
