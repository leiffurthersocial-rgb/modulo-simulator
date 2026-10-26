import { COUNTRIES } from "@/data/countries";
import { MAFIA_RANKS } from "@/data/events/special";
import { defineActions, pay, roll } from "@/engine/actionHelpers";
import { leaveJob } from "@/engine/career";
import { adjustKarma, adjustStat } from "@/engine/stats";
import type { EventContext } from "@/engine/types";
import { clamp, formatMoney } from "@/engine/util";
import { arrestFor } from "./crime";

const mafiaRank = (ctx: EventContext) => Number(ctx.state.flags.mafiaRank ?? 0);

export const SPECIAL_ACTIONS = defineActions("special", [
  {
    id: "special-mafia-job",
    group: "The family",
    label: (ctx) => `Do a job for the family (${MAFIA_RANKS[mafiaRank(ctx) - 1] ?? "Associate"})`,
    icon: "Briefcase",
    perYear: 2,
    visible: (ctx) => mafiaRank(ctx) >= 1 && ctx.player.age >= 18,
    run(ctx) {
      const rank = mafiaRank(ctx);
      adjustKarma(ctx.player, -3);
      if (roll(ctx, "streetSmarts", 40 + rank * 4)) {
        const cut = Math.round(ctx.rng.int(3_000, 12_000) * rank * rank * ctx.country.costIndex);
        ctx.player.finance.cash += cut;
        ctx.player.crime.notoriety = clamp(ctx.player.crime.notoriety + 2);
        if (ctx.rng.chance(0.15) && rank < 5) {
          ctx.state.flags.mafiaRank = rank + 1;
          return { title: "Made", text: `The job went smoothly. Your cut: ${formatMoney(ctx.country, cut)}. The boss promoted you to ${MAFIA_RANKS[rank]}.`, tone: "major" };
        }
        return { text: `You ${ctx.rng.pick(["collected protection money", "moved a truck of untaxed cigarettes", "fixed a boxing match", "laundered cash through a laundromat"])}. Your cut: ${formatMoney(ctx.country, cut)}.`, tone: "good" };
      }
      if (ctx.rng.chance(0.5)) {
        arrestFor(ctx, "racketeering", [3, 12]);
        return;
      }
      adjustStat(ctx.player, "health", -ctx.rng.int(5, 15));
      return { text: "The job went sideways. You got out, bruised, with nothing.", tone: "bad" };
    },
  },
  {
    id: "special-emigrate",
    group: "Life changes",
    label: "Emigrate",
    description: "Start over in a new country",
    icon: "Plane",
    perYear: 1,
    visible: (ctx) => ctx.player.age >= 18,
    options: (ctx) =>
      COUNTRIES.filter((c) => c.id !== ctx.player.countryId).map((c) => ({
        id: c.id,
        label: `${c.flag} ${c.name}`,
        price: Math.round(5_000 * ctx.country.costIndex),
        blocked: ctx.player.finance.cash < 5_000 * ctx.country.costIndex ? "You can't afford the move." : undefined,
      })),
    run(ctx, p) {
      const target = COUNTRIES.find((c) => c.id === p.option);
      if (!target || !pay(ctx, 5_000)) return;
      if (ctx.player.career.job) leaveJob(ctx.state, "quit");
      ctx.player.countryId = target.id;
      ctx.player.livesWithParents = false;
      for (const n of Object.values(ctx.state.npcs)) {
        const close = ["spouse", "partner", "fiance", "child"].includes(n.role);
        const family = ["mother", "father", "sibling", "grandparent", "grandchild", "bestFriend"].includes(n.role);
        if (!close && !family) n.inContact = false;
        else if (family) n.closeness = clamp(n.closeness - 10);
      }
      ctx.state.flags.emigrated = Number(ctx.state.flags.emigrated ?? 0) + 1;
      adjustStat(ctx.player, "happiness", 4);
      return { title: "New beginnings", text: `You packed your life into four suitcases and moved to ${target.name}.`, tone: "major" };
    },
  },
  {
    id: "special-psychic",
    group: "Life changes",
    label: "See a psychic",
    icon: "Eye",
    perYear: 1,
    cost: 60,
    visible: (ctx) => ctx.player.age >= 14,
    run(ctx) {
      pay(ctx, 60);
      const line = ctx.rng.pick([
        "The psychic said you'd come into money. You did not, that year.",
        "The psychic said a door would open. Your car door fell off the following week.",
        "The psychic said you were a lighthouse keeper in a past life. It explains a lot.",
        "The psychic looked at your palm, frowned, and refunded you.",
      ]);
      return { text: line };
    },
  },
]);
