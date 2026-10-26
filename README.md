# Modulo Simulator

*Life, mod N. Everything wraps around eventually.*

A text-based life simulator in the spirit of BitLife: be born, grow up, go to school, fall in love, build a career (or a criminal empire), and see how it all ends. It runs entirely in the browser. There's no backend, saves live in `localStorage`, and the game works offline once loaded.

Built with Next.js (App Router), TypeScript (strict), Tailwind CSS 4, Zustand and Vitest.

## What's in it

| | |
| --- | --- |
| Events | 400+, from toddler tantrums to world events, many with 2–4 choices, multi-step chains and callbacks years later |
| Careers | 88, with rank ladders, requirements, promotions, firing, layoffs, hazards and pensions |
| Countries | 26, each with name pools, currency, salaries, cost of living, tax brackets and life expectancy |
| Achievements | 138 (some secret), plus end-of-life ribbons |
| Systems | School and higher education, money and taxes, homes/cars/boats/pets with mortgages, relationships, marriage and kids, health and addictions, crime/trials/prison, fame and social media, politics, casino minigames, stocks and crypto, life goals, a lifelong rival, the mob, a cult, a secret agency, legacy mode, "What if?" rewinds (casual mode) |
| Extras | Procedural SVG avatars, dark mode, shareable highlights image, 3 save slots, JSON export/import, PWA |

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build (what Vercel runs) |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Engine and content tests (Vitest) |
| `npm run simulate` | Balancing run: 1000 lives with a "typical player" autopilot (`LIVES=200 npm run simulate` for a quick one) |

## Deploying to Vercel

No configuration needed.

1. Push the repo to GitHub.
2. In Vercel, **Add New → Project**, import the repo. The framework is detected as Next.js; keep the defaults (build `next build`, output `.next`).
3. Deploy. There are no environment variables.

Or from the CLI: `npx vercel` (preview) then `npx vercel --prod`.

Everything is statically prerendered, so any static-capable Next.js host works too.

## Project layout

```
app/                  Next.js routes: the game (/), /debug/friends, /debug/avatars, manifest
components/           React UI
  avatar/             Procedural layered SVG avatar
  game/               Main screen: top bar, log, stats, nav, modals, death screen, life summary
  panels/             Occupation, Assets, People, Activities, Profile, Settings
  custom/             Option picker, asset detail, minigames (blackjack, slots, roulette, market, trivia, heist)
  screens/            Title, character creation, achievements, graveyard
store/                Zustand store, save slots, profile, settings
engine/               Pure TypeScript game engine. No React, no DOM.
  types/              Core types
  events/             Registry, selection, templating, effects, authoring helpers
  lifecycle/          New life, yearly age-up, death, legacy
  minigames/          Pure rules for casino games and the heist
  *.ts                Systems: career, finance, assets, family, health, crime, politics, fame, market, cameos...
data/                 Content: events, actions, careers, countries, friends, achievements, goals, ribbons, config
tests/                Vitest tests
scripts/              Balancing simulation
```

The engine is pure: every entry point (`newLife`, `ageUp`, `choose`, `performAction`) takes a state and returns a new one. A `GameState` is plain JSON, and the RNG state is a single number stored on it. So a life is fully reproducible from its seed and choices, and saves, export, import and rewinds are just snapshots.

Content (events, actions, careers, countries, friends) reaches the engine through a `Content` bundle (`data/index.ts` → `DEFAULT_CONTENT`), so tests can inject their own. Tunables live in **`data/config.ts`**.

## Adding content

All content is typed data, and the tests validate it: unique ids, valid references, no leftover template placeholders, and every achievement id used is defined. Run `npm test` after editing.

### Events

Events live in `data/events/*.ts`, grouped by theme. Register a new file in `data/events/index.ts`.

```ts
import { defineEvents, fail, fx, pass, when } from "@/engine/events/helpers";

export const MY_EVENTS = defineEvents("random", [
  // A simple one-liner. {a|b|c} picks a random variation.
  {
    id: "found-a-fiver",
    ages: [8, 90],
    cooldown: 10,
    text: "You found {money:5} on the {sidewalk|bus|beach}.",
    tone: "good",
    effects: [fx.cash(5), fx.happy(2)],
  },
  // A popup with choices, a skill check, and a person bound to the event.
  {
    id: "neighbor-ladder",
    ages: [20, 80],
    once: true,
    condition: when.movedOut,
    npc: { kind: "new", role: "neighbor", ageOffset: [-10, 20], closeness: [30, 50] },
    title: "Can I borrow that?",
    text: "Your neighbor {npc} wants to borrow your ladder. {npc.He} {npc.has} a reputation.",
    choices: [
      {
        label: "Lend it",
        outcomes: [
          { weight: pass("charisma", 40), text: "{npc} returned it with a pie.", tone: "good", effects: [fx.close(15)] },
          { weight: fail("charisma", 40), text: "You never saw that ladder again.", effects: [fx.cash(-120)] },
        ],
      },
      { label: "Make an excuse", outcomes: [{ text: "You said it was broken. It wasn't.", effects: [fx.karma(-1)] }] },
    ],
  },
]);
```

**Fields.** `id`, `ages` (inclusive), `weight` (number or function), `condition`, `once`, `cooldown` (years), `where` (`"free"` / `"prison"` / `"any"`), `npc`, `title`, `text`, `tone`, `effects`, `choices` (2–4), `triggeredOnly`, `expects`.

**Templates.** `{first}` `{last}` `{name}` `{age}` `{year}` `{country}` `{school}` `{mom}` `{dad}` `{money:500}` (scaled to the country and shown in local currency) `{amount}` (the last cash effect) `{npc}` `{npc.full}` `{npc.he}` `{npc.him}` `{npc.his}` `{npc.He}` `{npc.is}` `{npc.has}` `{npc.s}` (verb suffix: "{npc.he} like{npc.s}") `{npc.age}` `{npc.job}`, plus any variable in `ctx.vars`. Variations `{a|b|c}` can nest placeholders. Templates can also be arrays (pick one) or functions of the context.

**Effects (`fx.*`).** `happy` `health` `smarts` `looks` `stat` `skill` `cash` (US-baseline money, scaled by country) `karma` `fame` `close` (relationship) `tag` `loseContact` `flag` `inc` `schedule(eventId, years, withNpc)` `achieve` `addiction` `die` `log` `custom(ctx => …)`.

**Conditions (`when.*`).** `inSchool(...levels)` `graduated` `employed` `unemployed` `flag` `hasFlag` `noFlag` `statAtLeast` `statBelow` `hasLiving(...roles)` `gender` `wealth(...tiers)` `countryTag` `single` `married` `hasKids` `movedOut` `inPrison` `club` `richerThan` `poorerThan`, combined with `all` / `any` / `not`.

**Odds.** `pass(stat, difficulty)` and `fail(stat, difficulty)` give matching outcome weights for a skill check (5–95%, nudged by karma).

**People.** `npc: { kind: "existing", roles: [...] }` binds someone the player knows. The event is skipped if there's nobody suitable. `npc: { kind: "new", role, ageOffset | age, gender: "attracted", keep }` introduces someone new. New people go through the friend-cameo system automatically.

**Chains and callbacks.** An outcome's `next: "event-id"` continues straight into another event (usually `triggeredOnly: true`). `fx.schedule("event-id", [10, 20], true)` brings an event back years later with the same person. Persistent `flags` let any later event check what happened earlier.

**Variety at scale.** `expand(items, item => event)` generates a family of events from a list.

### Actions (things the player chooses to do)

Actions live in `data/actions/*.ts`, registered in `data/actions/index.ts`. Each has a `section` (where it appears), an optional `group`, `visible`, `blocked` (returns a reason), `perYear` / `perYearPerPerson`, an optional `options(ctx)` picker, and `run(ctx, params)` returning a result text. People interactions use `section: "people"` and get `ctx.npc`.

### Careers

Careers live in `data/careers/*.ts`. Use the `career(...)` helper:

```ts
career("zookeeper", "Zookeeping", "service", "PawPrint",
  { minAge: 18, degree: HS, stats: { athleticism: 30 } },
  [["Keeper's Assistant", 28_000], ["Zookeeper", 40_000], ["Head Keeper", 58_000]],
  { employers: ["City Zoo"], difficulty: 25, trains: "athleticism", promoteYears: 3 })
```

Requirements can include `degree`, `programs` (majors from `data/education.ts`), `stats`, `experience`, `cleanRecord` and `followers`. Salaries are US-baseline and scaled by each country's `salaryIndex`.

### Countries

Add a `Country` object (see `data/countries/us.ts`) and list it in `data/countries/index.ts`. Money inside the engine is USD-equivalent: `currency.perUsd` converts for display, `salaryIndex` and `costIndex` scale pay and prices, `taxBrackets` are in USD-equivalent, and `mortalityFactor` adjusts life expectancy. Tags like `"presidential"` and `"deathPenalty"` change titles and outcomes.

### Achievements, goals and ribbons

- **Achievements** (`data/achievements.ts`): give one a `check(state, costIndex)` and it unlocks automatically, or omit `check` and unlock it from content with `fx.achieve("id")`.
- **Life goals** (`data/goals.ts`): same idea. Three are assigned at birth, with two more at 18 and at 40.
- **Ribbons** (`data/ribbons.ts`): the highest-priority ribbon whose check passes becomes the headline.

## Friend cameos

Real friends can turn up, rarely, as ordinary NPCs. They're configured in **`data/friends.ts`**:

| Field | Meaning |
| --- | --- |
| `name` | Real first name. The last name is generated. |
| `appearance` | Hair style and color and eye color are required. Glasses, facial hair, skin tone etc. are optional; anything unset uses sensible defaults. |
| `pronouns` | Drives event text, gender and the avatar's presentation. |
| `traits` | Personality traits (see `PERSONALITY_TRAITS` in `engine/types/npc.ts`). **Currently empty.** When filled in they change how the friend talks and behaves automatically. |
| `dialogue` | Custom lines per situation (`greeting`, `compliment`, `insult`, `spendTime`, `gift`, `argue`, `askMoney`, `congratulate`, `console`, `farewell`, or `any`). **Currently empty.** Custom lines win over trait lines, which win over generic ones. |
| `roles` | Contexts they can appear in (classmate, roommate, coworker, boss, teacher, cellmate...). |
| `rarity` | Multiplier on the per-life chance. |

How it works:

- **Per-life chance.** At birth, each friend independently rolls `baseChancePerLife × rarity` (4% by default, tunable in `data/config.ts`). On average that's about 0.33 cameos per life.
- **Where they show up.** A friend who's due takes a fitting new-NPC slot when one comes up. If none does, an ordinary chance-meeting event introduces them in a role that suits the player's life.
- **Ages that make sense.** In peer roles they're about the player's age; older-person roles like teacher or boss use `roleAgeOffsets`.
- **Once per life.** Each friend appears at most once per life.
- **Low-key.** Nothing announces them. The only marks are a barely visible ✦ (with a tooltip) on their profile and the secret "You Met a Legend" achievement.

**Testing.** `/debug/friends` (not linked from the game) lists every friend with their avatar and status in your current life, plus a **Force spawn** button. `/debug/avatars` shows every hairstyle, the age stages and all the friends.

## Balancing

`npm run simulate` plays 1000 lives with an autopilot that studies, works, dates, buys a home and sees a doctor. Latest results (US-baseline dollars):

- **Lifespan:** mean 75.8, median 79, 90th percentile 91
- **Net worth at death:** median ~$200k, 90th percentile ~$1.5M, ~16% millionaires
- **Life outcomes:** ~85% have children, ~70% marry
- **Friend cameos:** ~0.33 per life

A passive player who only presses Age also lands near real-world lifespans. The unit tests enforce that.

## Saves

- **Save slots:** three, autosaved after every change.
- **Export and import:** a save is plain JSON (Settings → Save data).
- **Versioning:** `GAME_CONFIG.saveVersion` is the schema version. When `GameState` changes shape, bump it and add a migration in `engine/save.ts`. Older saves upgrade on load; saves from a newer version are refused with a clear message.

## Offline and PWA

`app/manifest.ts` and `public/sw.js` make the game installable and playable offline. The service worker only registers in production builds. If you change caching behavior, bump `CACHE` in `sw.js`.

## Quality bar

- **Types:** strict TypeScript with no `any`.
- **Tests:** 116 Vitest tests covering the RNG, the age-up loop, event filtering and templates, finance math, debt and foreclosure, careers, education, family, crime, minigames, market, politics, achievements, legacy, saves, the friend cameo rate, and population lifespans.
- **Checks:** `npm run lint` and `npm run build` pass clean.

Modulo Simulator is an original work. It replicates the general mechanics of the life-sim genre, not any other game's assets, names or writing.
