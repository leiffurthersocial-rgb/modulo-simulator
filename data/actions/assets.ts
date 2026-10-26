import { CATALOG_BY_ID } from "@/data/assets";
import { defineActions } from "@/engine/actionHelpers";
import { buyListing, financing, listingsFor, salePrice, sellAsset, type Listing } from "@/engine/assets";
import { adjustSkill, adjustStat } from "@/engine/stats";
import type { ActionOption, Asset, AssetKind, EventContext } from "@/engine/types";
import { clamp, formatMoney } from "@/engine/util";

const shopping = (ctx: EventContext) => ctx.vars.assetId === undefined && !ctx.player.crime.prison;
const assetOf = (ctx: EventContext): Asset | undefined => ctx.player.assets.find((a) => a.id === ctx.vars.assetId);
const owns = (...kinds: AssetKind[]) => (ctx: EventContext) => {
  const a = assetOf(ctx);
  return !!a && kinds.includes(a.kind);
};

function listingOptions(ctx: EventContext, kinds: AssetKind[], count: number): ActionOption[] {
  return listingsFor(ctx.state, ctx.country, kinds, count).map((l) => {
    const plan = financing(ctx.state, l);
    return {
      id: l.id,
      label: l.name,
      description:
        plan.kind === "none"
          ? undefined
          : plan.kind === "loan"
            ? `Condition ${l.condition}% · ${formatMoney(ctx.country, plan.down)} down, ${formatMoney(ctx.country, plan.payment)}/yr`
            : `Condition ${l.condition}% · pay in cash`,
      price: l.price,
      blocked: ctx.state.actionsThisYear[`bought:${l.id}`] ? "Sold." : plan.kind === "none" ? plan.reason : undefined,
      icon: CATALOG_BY_ID[l.catalogId]?.icon,
    };
  });
}

function buy(ctx: EventContext, kinds: AssetKind[], count: number, id: unknown) {
  const listing: Listing | undefined = listingsFor(ctx.state, ctx.country, kinds, count).find((l) => l.id === id);
  if (!listing) return;
  const plan = financing(ctx.state, listing);
  if (ctx.state.actionsThisYear[`bought:${listing.id}`]) return;
  const asset = buyListing(ctx.state, ctx.rng, ctx.country, listing);
  if (!asset) return;
  ctx.state.actionsThisYear[`bought:${listing.id}`] = 1;
  adjustStat(ctx.player, "happiness", asset.kind === "house" ? 10 : 5);
  const how = plan.kind === "loan" ? ` with a ${formatMoney(ctx.country, plan.down)} down payment` : "";
  return { title: "Purchased", text: `You bought a ${asset.name.toLowerCase()} for ${formatMoney(ctx.country, listing.price)}${how}.`, tone: "major" as const };
}

export const ASSET_ACTIONS = defineActions("assets", [
  {
    id: "assets-home",
    group: "Shop",
    label: "Buy a home",
    icon: "Home",
    visible: (ctx) => shopping(ctx) && ctx.player.age >= 18,
    options: (ctx) => listingOptions(ctx, ["house"], 7),
    run: (ctx, p) => buy(ctx, ["house"], 7, p.option),
  },
  {
    id: "assets-car",
    group: "Shop",
    label: "Car dealership",
    icon: "Car",
    visible: (ctx) => shopping(ctx) && ctx.player.age >= 16,
    options: (ctx) => listingOptions(ctx, ["car"], 7),
    run: (ctx, p) => buy(ctx, ["car"], 7, p.option),
  },
  {
    id: "assets-boat",
    group: "Shop",
    label: "Boat dealer",
    icon: "Ship",
    visible: (ctx) => shopping(ctx) && ctx.player.age >= 18,
    options: (ctx) => listingOptions(ctx, ["boat"], 4),
    run: (ctx, p) => buy(ctx, ["boat"], 4, p.option),
  },
  {
    id: "assets-luxury",
    group: "Shop",
    label: "Jewelry & luxury",
    icon: "Gem",
    visible: (ctx) => shopping(ctx) && ctx.player.age >= 14,
    options: (ctx) => listingOptions(ctx, ["jewelry", "luxury", "instrument"], 0),
    run: (ctx, p) => buy(ctx, ["jewelry", "luxury", "instrument"], 0, p.option),
  },
  {
    id: "assets-pet",
    group: "Shop",
    label: "Adopt a pet",
    icon: "PawPrint",
    perYear: 2,
    visible: (ctx) => shopping(ctx) && ctx.player.age >= 10,
    options: (ctx) => listingOptions(ctx, ["pet"], 0),
    run(ctx, p) {
      const listing = listingsFor(ctx.state, ctx.country, ["pet"], 0).find((l) => l.id === p.option);
      if (!listing) return;
      const asset = buyListing(ctx.state, ctx.rng, ctx.country, listing);
      if (!asset) return;
      adjustStat(ctx.player, "happiness", 8);
      return { title: "New friend", text: `You adopted ${asset.name}.`, tone: "good" };
    },
  },
  {
    id: "assets-move-out",
    group: "Home",
    label: "Move out on your own",
    description: "Rent a place. Living costs apply from now on.",
    icon: "Home",
    visible: (ctx) => shopping(ctx) && ctx.player.livesWithParents && ctx.player.age >= 18,
    run(ctx) {
      ctx.player.livesWithParents = false;
      adjustStat(ctx.player, "happiness", 4);
      return { text: `You moved into a ${ctx.rng.pick(["small apartment", "shared flat", "studio above a laundromat"])}. Freedom smells like other people's cooking.`, tone: "major" };
    },
  },
  {
    id: "assets-move-home",
    group: "Home",
    label: "Move back in with your parents",
    icon: "Home",
    visible: (ctx) =>
      shopping(ctx) &&
      !ctx.player.livesWithParents &&
      ctx.player.age >= 18 &&
      Object.values(ctx.state.npcs).some((n) => (n.role === "mother" || n.role === "father") && n.alive && n.inContact),
    run(ctx) {
      const parent = Object.values(ctx.state.npcs).filter((n) => (n.role === "mother" || n.role === "father") && n.alive && n.inContact).sort((a, b) => b.closeness - a.closeness)[0]!;
      if (parent.closeness < 35) return { text: `${parent.firstName} said no. Not in so many words, but no.`, tone: "bad" };
      ctx.player.livesWithParents = true;
      adjustStat(ctx.player, "happiness", -3);
      return { text: `You moved back into your childhood bedroom. ${parent.firstName} kept your posters up.` };
    },
  },
  // ------------------------------------------------------------ manage an owned asset (params.assetId)
  {
    id: "asset-sell",
    group: "Manage",
    label: "Sell",
    icon: "HandCoins",
    visible: (ctx) => {
      const a = assetOf(ctx);
      return !!a && a.kind !== "pet";
    },
    description: (ctx) => {
      const a = assetOf(ctx);
      return a ? `Estimated ${formatMoney(ctx.country, salePrice(a))}` : "";
    },
    run(ctx) {
      const a = assetOf(ctx)!;
      const net = sellAsset(ctx.state, a.id);
      return { text: `You sold your ${a.name.toLowerCase()}. After paying off any loan, you pocketed ${formatMoney(ctx.country, net)}.`, tone: "good" };
    },
  },
  {
    id: "asset-renovate",
    group: "Manage",
    label: "Renovate",
    icon: "Hammer",
    perYear: 1,
    visible: owns("house"),
    description: (ctx) => {
      const a = assetOf(ctx);
      return a ? `About ${formatMoney(ctx.country, a.value * 0.06)}` : "";
    },
    blocked: (ctx) => {
      const a = assetOf(ctx);
      return a && ctx.player.finance.cash < a.value * 0.06 ? "Not enough cash." : a && a.condition >= 95 ? "It's already in great shape." : undefined;
    },
    run(ctx) {
      const a = assetOf(ctx)!;
      const cost = Math.round(a.value * 0.06);
      ctx.player.finance.cash -= cost;
      a.condition = clamp(a.condition + ctx.rng.int(25, 45));
      a.value = Math.round(a.value + cost * ctx.rng.float(0.8, 1.6));
      return { text: `You renovated the ${ctx.rng.pick(["kitchen", "bathrooms", "roof", "whole place"])} for ${formatMoney(ctx.country, cost)}. It looks fantastic.`, tone: "good" };
    },
  },
  {
    id: "asset-rent-out",
    group: "Manage",
    label: (ctx) => (assetOf(ctx)?.rentedOut ? "Stop renting it out" : "Rent it out"),
    icon: "Coins",
    visible: owns("house"),
    run(ctx) {
      const a = assetOf(ctx)!;
      a.rentedOut = !a.rentedOut;
      if (!a.rentedOut) return { text: `You stopped renting out your ${a.name.toLowerCase()}.` };
      const tenants = ctx.rng.pick(["a quiet young couple", "three graduate students", "a man with an alarming number of aquariums", "a retired pianist"]);
      return { text: `You rented your ${a.name.toLowerCase()} to ${tenants}. Rent: about ${formatMoney(ctx.country, a.value * 0.045)} a year.`, tone: "good" };
    },
  },
  {
    id: "asset-party",
    group: "Manage",
    label: "Throw a party here",
    icon: "Wine",
    perYear: 1,
    visible: (ctx) => owns("house")(ctx) && !assetOf(ctx)!.rentedOut,
    run(ctx) {
      adjustStat(ctx.player, "happiness", ctx.rng.int(4, 8));
      adjustSkill(ctx.player, "charisma", 1);
      const a = assetOf(ctx)!;
      a.condition = clamp(a.condition - ctx.rng.int(1, 6));
      return { text: ctx.rng.pick(["You threw a party. Someone broke a lamp, but it was worth it.", "You hosted a dinner party. Your lasagna got a standing ovation.", "You threw a party that the neighbors will be discussing for years."]), tone: "good" };
    },
  },
  {
    id: "asset-repair",
    group: "Manage",
    label: "Get it serviced",
    icon: "Hammer",
    perYear: 1,
    visible: owns("car", "boat"),
    description: (ctx) => {
      const a = assetOf(ctx);
      return a ? `About ${formatMoney(ctx.country, Math.max(150, a.value * 0.05))}` : "";
    },
    run(ctx) {
      const a = assetOf(ctx)!;
      const cost = Math.round(Math.max(150 * ctx.country.costIndex, a.value * 0.05));
      if (ctx.player.finance.cash < cost) return { text: "You can't afford the repair right now.", tone: "bad", log: false };
      ctx.player.finance.cash -= cost;
      a.condition = clamp(a.condition + ctx.rng.int(20, 40));
      return { text: `The mechanic fixed up your ${a.name.toLowerCase()} for ${formatMoney(ctx.country, cost)}.` };
    },
  },
  {
    id: "asset-drive",
    group: "Manage",
    label: (ctx) => (assetOf(ctx)?.kind === "boat" ? "Take it out on the water" : "Take it for a spin"),
    icon: "Car",
    perYear: 1,
    visible: owns("car", "boat"),
    run(ctx) {
      const a = assetOf(ctx)!;
      if (a.condition < 20 && ctx.rng.chance(0.35)) {
        adjustStat(ctx.player, "health", -ctx.rng.int(5, 15));
        a.condition = clamp(a.condition - 10);
        return { text: `Your ${a.name.toLowerCase()} broke down at the worst possible moment. You got hurt getting it to safety.`, tone: "bad" };
      }
      adjustStat(ctx.player, "happiness", ctx.rng.int(3, 6));
      return { text: a.kind === "boat" ? "You spent a perfect afternoon on the water." : "You took a long drive with the windows down. Good for the soul.", tone: "good" };
    },
  },
  {
    id: "asset-wear",
    group: "Manage",
    label: "Wear it out",
    icon: "Sparkles",
    perYear: 1,
    visible: owns("jewelry", "luxury"),
    run(ctx) {
      adjustStat(ctx.player, "looks", ctx.rng.int(1, 3));
      adjustStat(ctx.player, "happiness", 2);
      return { text: "You wore it out on the town. Several people complimented it. One stranger asked if it was real." };
    },
  },
  {
    id: "asset-play-instrument",
    group: "Manage",
    label: "Play it",
    icon: "Music",
    perYear: 1,
    visible: owns("instrument"),
    run(ctx) {
      adjustSkill(ctx.player, "creativity", ctx.rng.int(1, 3));
      adjustStat(ctx.player, "happiness", 3);
      return { text: "You practiced every evening. Your neighbors have opinions." };
    },
  },
  {
    id: "asset-pet-play",
    group: "Manage",
    label: "Play together",
    icon: "Heart",
    perYear: 2,
    visible: owns("pet"),
    run(ctx) {
      const a = assetOf(ctx)!;
      adjustStat(ctx.player, "happiness", ctx.rng.int(3, 6));
      return { text: `You spent the afternoon with ${a.name}. Pure joy.`, tone: "good" };
    },
  },
  {
    id: "asset-pet-rehome",
    group: "Manage",
    label: "Rehome",
    icon: "X",
    visible: owns("pet"),
    run(ctx) {
      const a = assetOf(ctx)!;
      ctx.player.assets = ctx.player.assets.filter((x) => x.id !== a.id);
      ctx.player.karma = clamp(ctx.player.karma - 2, -100, 100);
      adjustStat(ctx.player, "happiness", -4);
      return { text: `You found ${a.name} a new home. You think about them sometimes.` };
    },
  },
]);
