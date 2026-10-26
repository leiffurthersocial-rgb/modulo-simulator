import type { WealthTier } from "@/engine/types";

/** Parent / adult NPC job labels by family wealth. Purely flavor until the career system assigns real jobs. */
export const OCCUPATIONS_BY_TIER: Record<WealthTier, readonly string[]> = {
  poor: ["Cashier", "Warehouse Worker", "Dishwasher", "Cleaner", "Day Laborer", "Unemployed", "Delivery Driver", "Farmhand"],
  working: ["Bus Driver", "Mechanic", "Hairdresser", "Line Cook", "Security Guard", "Plumber", "Retail Manager", "Nursing Assistant"],
  middle: ["Teacher", "Nurse", "Accountant", "Electrician", "Police Officer", "Office Manager", "Pharmacist", "Graphic Designer"],
  upper: ["Software Engineer", "Architect", "Dentist", "Marketing Director", "Engineer", "Pilot", "Professor", "Lawyer"],
  rich: ["Surgeon", "Investment Banker", "Company Founder", "Corporate Lawyer", "Real Estate Developer", "CEO", "Hedge Fund Manager", "Heir"],
};

/** Rough net worth (USD-equivalent, before country cost index) of a household per tier. */
export const WEALTH_BY_TIER: Record<WealthTier, readonly [number, number]> = {
  poor: [0, 5_000],
  working: [5_000, 40_000],
  middle: [40_000, 250_000],
  upper: [250_000, 1_500_000],
  rich: [2_000_000, 40_000_000],
};

export const WEALTH_TIER_WEIGHTS: readonly { value: WealthTier; weight: number }[] = [
  { value: "poor", weight: 15 },
  { value: "working", weight: 32 },
  { value: "middle", weight: 35 },
  { value: "upper", weight: 14 },
  { value: "rich", weight: 4 },
];

export const SCHOOL_NAME_STEMS: readonly string[] = [
  "Riverside",
  "Oakwood",
  "Lincoln",
  "Hillcrest",
  "Maple Grove",
  "Westbrook",
  "Northgate",
  "St. Agnes",
  "Pinecrest",
  "Lakeview",
  "Harbor",
  "Eastfield",
  "Ridgemont",
  "Valley",
  "Fairview",
  "Cedar Park",
];
