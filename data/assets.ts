import type { AssetKind } from "@/engine/types";

export interface CatalogItem {
  id: string;
  kind: AssetKind;
  name: string;
  /** US-baseline price. */
  price: number;
  /** Yearly upkeep as a fraction of price (insurance, maintenance, food). */
  upkeep: number;
  /** Typical yearly value change (0.03 = +3%). */
  drift: number;
  /** Year-to-year volatility of value. */
  volatility: number;
  /** Pets: life expectancy. */
  lifespan?: number;
  icon: string;
  /** Minimum player age to buy. */
  minAge?: number;
}

const item = (id: string, kind: AssetKind, name: string, price: number, upkeep: number, drift: number, volatility: number, icon: string, extra: Partial<CatalogItem> = {}): CatalogItem => ({
  id,
  kind,
  name,
  price,
  upkeep,
  drift,
  volatility,
  icon,
  ...extra,
});

export const CATALOG: readonly CatalogItem[] = [
  item("fixer-upper", "house", "Fixer-Upper", 140_000, 0.02, 0.03, 0.06, "Home"),
  item("studio", "house", "Studio Apartment", 180_000, 0.015, 0.03, 0.05, "Building2"),
  item("rural-cabin", "house", "Rural Cabin", 150_000, 0.015, 0.02, 0.05, "Tent"),
  item("condo", "house", "City Condo", 290_000, 0.015, 0.035, 0.05, "Building2"),
  item("townhouse", "house", "Townhouse", 420_000, 0.015, 0.035, 0.05, "Home"),
  item("starter-home", "house", "Starter Home", 350_000, 0.015, 0.035, 0.05, "Home"),
  item("family-home", "house", "Family Home", 540_000, 0.015, 0.035, 0.05, "Home"),
  item("suburban", "house", "Suburban House", 690_000, 0.015, 0.035, 0.05, "Home"),
  item("beach-house", "house", "Beach House", 1_300_000, 0.02, 0.04, 0.07, "Home"),
  item("mansion", "house", "Mansion", 3_800_000, 0.02, 0.035, 0.07, "Crown"),
  item("penthouse", "house", "Penthouse", 5_500_000, 0.02, 0.035, 0.08, "Building2"),
  item("used-car", "car", "Used Hatchback", 6_000, 0.12, -0.12, 0.03, "Car", { minAge: 16 }),
  item("sedan", "car", "Compact Sedan", 24_000, 0.07, -0.13, 0.03, "Car", { minAge: 16 }),
  item("pickup", "car", "Pickup Truck", 42_000, 0.06, -0.12, 0.03, "Car", { minAge: 16 }),
  item("suv", "car", "SUV", 46_000, 0.06, -0.13, 0.03, "Car", { minAge: 16 }),
  item("electric", "car", "Electric Car", 48_000, 0.04, -0.14, 0.03, "Zap", { minAge: 16 }),
  item("motorcycle", "car", "Motorcycle", 12_000, 0.08, -0.1, 0.03, "Bike", { minAge: 16 }),
  item("luxury-sedan", "car", "Luxury Sedan", 78_000, 0.05, -0.15, 0.03, "Car", { minAge: 16 }),
  item("sports-car", "car", "Sports Car", 125_000, 0.05, -0.12, 0.04, "Car", { minAge: 16 }),
  item("vintage", "car", "Vintage Convertible", 62_000, 0.05, 0.04, 0.08, "Car", { minAge: 16 }),
  item("supercar", "car", "Supercar", 360_000, 0.05, -0.1, 0.05, "Rocket", { minAge: 16 }),
  item("fishing-boat", "boat", "Fishing Boat", 32_000, 0.06, -0.08, 0.04, "Ship", { minAge: 18 }),
  item("speedboat", "boat", "Speedboat", 95_000, 0.07, -0.09, 0.04, "Ship", { minAge: 18 }),
  item("sailboat", "boat", "Sailboat", 160_000, 0.06, -0.07, 0.04, "Ship", { minAge: 18 }),
  item("yacht", "boat", "Yacht", 2_600_000, 0.08, -0.06, 0.05, "Ship", { minAge: 18 }),
  item("gold-chain", "jewelry", "Gold Chain", 3_000, 0, 0.02, 0.06, "Gem"),
  item("earrings", "jewelry", "Diamond Earrings", 8_000, 0.005, 0.01, 0.05, "Gem"),
  item("ring", "jewelry", "Diamond Ring", 15_000, 0.005, 0.01, 0.05, "Gem"),
  item("watch", "jewelry", "Luxury Watch", 28_000, 0.005, 0.02, 0.06, "Clock"),
  item("tiara", "jewelry", "Diamond Tiara", 65_000, 0.005, 0.02, 0.06, "Crown"),
  item("handbag", "luxury", "Designer Handbag", 4_500, 0, -0.05, 0.05, "ShoppingBag"),
  item("painting", "luxury", "Original Painting", 85_000, 0.005, 0.03, 0.2, "Palette"),
  item("piano", "instrument", "Grand Piano", 72_000, 0.01, -0.01, 0.03, "Music"),
  item("guitar", "instrument", "Vintage Guitar", 9_000, 0.005, 0.02, 0.06, "Music"),
  item("jet", "luxury", "Private Jet", 16_000_000, 0.08, -0.06, 0.04, "Plane", { minAge: 18 }),
  item("dog", "pet", "Dog", 600, 0, 0, 0, "PawPrint", { lifespan: 13 }),
  item("cat", "pet", "Cat", 200, 0, 0, 0, "PawPrint", { lifespan: 15 }),
  item("parrot", "pet", "Parrot", 1_200, 0, 0, 0, "PawPrint", { lifespan: 40 }),
  item("rabbit", "pet", "Rabbit", 80, 0, 0, 0, "PawPrint", { lifespan: 9 }),
  item("snake", "pet", "Snake", 300, 0, 0, 0, "PawPrint", { lifespan: 20 }),
  item("hamster", "pet", "Hamster", 30, 0, 0, 0, "PawPrint", { lifespan: 3 }),
  item("horse", "pet", "Horse", 8_000, 0, 0, 0, "PawPrint", { lifespan: 28 }),
];

export const CATALOG_BY_ID: Readonly<Record<string, CatalogItem>> = Object.fromEntries(CATALOG.map((c) => [c.id, c]));

/** Yearly upkeep for pets (food, vet), US baseline. */
export const PET_UPKEEP: Readonly<Record<string, number>> = { dog: 1_500, cat: 900, parrot: 600, rabbit: 400, snake: 300, hamster: 150, horse: 6_000 };

export const PET_NAMES: readonly string[] = ["Biscuit", "Luna", "Max", "Pepper", "Mochi", "Rex", "Olive", "Captain", "Nugget", "Ziggy", "Bean", "Shadow", "Waffles", "Daisy", "Tofu", "Bandit"];
