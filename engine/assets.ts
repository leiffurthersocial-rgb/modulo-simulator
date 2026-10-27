import { CATALOG, CATALOG_BY_ID, PET_NAMES, PET_UPKEEP, type CatalogItem } from "@/data/assets";
import { addLog } from "./log";
import { Rng, hashSeed } from "./rng";
import { adjustStat } from "./stats";
import type { Asset, AssetKind, Country, Debt, GameState } from "./types";
import { clamp } from "./util";

export const MORTGAGE_RATE = 0.065;
export const MORTGAGE_YEARS = 30;
export const CAR_LOAN_RATE = 0.075;

/** Fixed yearly payment that pays off `principal` over `years` at `rate`. */
export function amortizedPayment(principal: number, rate: number, years: number): number {
  if (rate === 0) return principal / years;
  return Math.round((principal * rate) / (1 - (1 + rate) ** -years));
}

export interface Listing {
  id: string;
  catalogId: string;
  name: string;
  price: number;
  condition: number;
}

const ADJECTIVES: Partial<Record<AssetKind, readonly string[]>> = {
  house: ["Charming", "Spacious", "Cozy", "Modern", "Historic", "Sunny", "Renovated", "Quirky"],
  car: ["Low-mileage", "Certified", "One-owner", "Sporty", "Reliable", "Mint"],
  boat: ["Seaworthy", "Sleek", "Classic", "Restored"],
};

/**
 * This year's listings for a kind of asset. Seeded from the life's seed and age so the
 * market is stable within a year and different the next.
 */
export function listingsFor(state: GameState, country: Country, kinds: readonly AssetKind[], count: number): Listing[] {
  const rng = new Rng(hashSeed(`${state.seed}:${state.player.age}:${kinds.join(",")}`));
  const pool = CATALOG.filter((c) => kinds.includes(c.kind) && (c.minAge ?? 0) <= state.player.age);
  const picks = kinds.includes("house") || kinds.includes("car") || kinds.includes("boat") ? Array.from({ length: count }, () => rng.pick(pool)) : pool;
  return picks.map((c, i) => {
    const condition = c.kind === "pet" ? 100 : c.id === "fixer-upper" ? rng.int(15, 40) : rng.int(55, 100);
    const adjective = ADJECTIVES[c.kind];
    return {
      id: `${c.id}:${i}`,
      catalogId: c.id,
      name: adjective ? `${rng.pick(adjective)} ${c.name}` : c.name,
      price: Math.round(c.price * country.costIndex * rng.float(0.85, 1.15) * (0.75 + condition / 400)),
      condition,
    };
  });
}

/** How a purchase would be financed, or why it can't be. */
export function financing(state: GameState, listing: Listing): { kind: "cash" } | { kind: "loan"; down: number; loan: number; payment: number } | { kind: "none"; reason: string } {
  const cash = state.player.finance.cash;
  if (cash >= listing.price) return { kind: "cash" };
  const item = CATALOG_BY_ID[listing.catalogId];
  if (!item || (item.kind !== "house" && item.kind !== "car")) return { kind: "none", reason: "Can't afford it." };
  if (state.flags.bankruptUntil !== undefined && Number(state.flags.bankruptUntil) > state.player.age) return { kind: "none", reason: "Your credit is ruined." };
  const income = state.player.finance.lastYearIncome;
  const downRate = item.kind === "house" ? 0.2 : 0.1;
  const down = Math.round(listing.price * downRate);
  if (cash < down) return { kind: "none", reason: `Needs a ${Math.round(downRate * 100)}% down payment.` };
  const loan = listing.price - down;
  const payment = item.kind === "house" ? amortizedPayment(loan, MORTGAGE_RATE, MORTGAGE_YEARS) : amortizedPayment(loan, CAR_LOAN_RATE, 5);
  if (payment > income * 0.4) return { kind: "none", reason: "Your income is too low for the loan." };
  return { kind: "loan", down, loan, payment };
}

export function buyListing(state: GameState, rng: Rng, country: Country, listing: Listing, petName?: string): Asset | undefined {
  const item = CATALOG_BY_ID[listing.catalogId];
  const plan = financing(state, listing);
  if (!item || plan.kind === "none") return undefined;
  const asset: Asset = {
    id: rng.id("a_"),
    kind: item.kind,
    name: item.kind === "pet" ? `${petName ?? rng.pick(PET_NAMES)} the ${item.name}` : listing.name,
    value: item.kind === "pet" ? 0 : listing.price,
    purchasePrice: listing.price,
    boughtAtAge: state.player.age,
    condition: listing.condition,
    yearlyUpkeep: Math.round((item.kind === "pet" ? (PET_UPKEEP[item.id] ?? 500) : item.price * item.upkeep) * country.costIndex),
    rentedOut: false,
    catalogId: item.id,
    age: item.kind === "pet" ? rng.int(0, 2) : undefined,
  };
  const fin = state.player.finance;
  if (plan.kind === "cash") {
    fin.cash -= listing.price;
  } else {
    fin.cash -= plan.down;
    const debt: Debt = {
      id: rng.id("d_"),
      kind: item.kind === "house" ? "mortgage" : "car",
      label: `${item.kind === "house" ? "Mortgage" : "Car loan"}: ${asset.name}`,
      balance: plan.loan,
      rate: item.kind === "house" ? MORTGAGE_RATE : CAR_LOAN_RATE,
      yearlyPayment: plan.payment,
      assetId: asset.id,
    };
    fin.debts.push(debt);
  }
  state.player.assets.push(asset);
  if (item.kind === "house" && state.player.livesWithParents && state.player.age >= 18) state.player.livesWithParents = false;
  return asset;
}

/** Sale price: market value, discounted for poor condition. */
export function salePrice(asset: Asset): number {
  return Math.round(asset.value * (0.7 + asset.condition / 333));
}

/** Sell an asset; any loan secured on it is paid off from the proceeds. Returns net proceeds. */
export function sellAsset(state: GameState, assetId: string): number {
  const { player } = state;
  const asset = player.assets.find((a) => a.id === assetId);
  if (!asset) return 0;
  const price = salePrice(asset);
  const secured = player.finance.debts.filter((d) => d.assetId === assetId);
  const owed = secured.reduce((s, d) => s + d.balance, 0);
  player.finance.debts = player.finance.debts.filter((d) => d.assetId !== assetId);
  player.assets = player.assets.filter((a) => a.id !== assetId);
  const net = Math.round(price - owed);
  player.finance.cash += net;
  return net;
}

/** Yearly asset tick: market drift, wear, aging pets. */
export function runAssetYear(state: GameState, rng: Rng): void {
  const { player } = state;
  for (const asset of [...player.assets]) {
    const item: CatalogItem | undefined = CATALOG_BY_ID[asset.catalogId];
    if (asset.kind === "pet") {
      asset.age = (asset.age ?? 0) + 1;
      const lifespan = item?.lifespan ?? 12;
      if (asset.age >= lifespan - 2 && rng.chance(asset.age >= lifespan ? 0.7 : 0.25)) {
        player.assets = player.assets.filter((a) => a.id !== asset.id);
        addLog(state, `${asset.name} died peacefully at ${asset.age}. The house feels emptier.`, "bad");
        adjustStat(player, "happiness", -8);
      }
      continue;
    }
    if (!item) continue;
    asset.condition = clamp(asset.condition - rng.int(asset.kind === "house" ? 0 : 2, asset.kind === "house" ? 3 : 7));
    const change = rng.normal(item.drift, item.volatility);
    asset.value = Math.max(0, Math.round(asset.value * (1 + change)));
  }
}

/** A pet that simply turns up in your life (a stray, a rescue, a gift). Returns it, or undefined for an unknown species. */
export function giftPet(state: GameState, rng: Rng, country: Country, catalogId: string): Asset | undefined {
  const item = CATALOG_BY_ID[catalogId];
  if (!item || item.kind !== "pet") return undefined;
  const asset: Asset = {
    id: rng.id("a_"),
    kind: "pet",
    name: `${rng.pick(PET_NAMES)} the ${item.name}`,
    value: 0,
    purchasePrice: 0,
    boughtAtAge: state.player.age,
    condition: 100,
    yearlyUpkeep: Math.round((PET_UPKEEP[item.id] ?? 500) * country.costIndex),
    rentedOut: false,
    catalogId: item.id,
    age: rng.int(0, 3),
  };
  state.player.assets.push(asset);
  return asset;
}
