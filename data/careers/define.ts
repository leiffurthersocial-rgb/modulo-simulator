import type { CareerCategory, CareerDef, CareerRequirements } from "@/engine/types";

export const EMPLOYERS: Record<string, readonly string[]> = {
  food: ["Burger Barn", "Taco Planet", "Golden Spoon Diner", "Pizza Palazzo", "Noodle Republic"],
  retail: ["MegaMart", "Thrifty's", "Urban Outpost", "Corner Goods", "ShopRight"],
  office: ["Pinnacle Corp", "Bluefield Group", "Northwind Partners", "Apex Holdings", "Meridian Inc."],
  finance: ["Goldbridge Capital", "Sterling & Pratt", "Ironclad Bank", "Harbor Trust", "Vantage Securities"],
  tech: ["Bytewave", "Cloudnine Labs", "Pixelforge", "Quantum Hive", "Nimbus Systems", "Loop Labs"],
  hospital: ["St. Mercy Hospital", "General Hospital", "Riverside Medical Center", "Hope Clinic", "University Hospital"],
  law: ["Dewey & Partners", "Holt Barrow LLP", "Kingsley Law Group", "Marsh & Cole", "Whitfield Legal"],
  city: ["City of Springfield", "County Services", "Metro Transit Authority", "Public Works Department"],
  school: ["Lincoln High School", "Westbrook Academy", "Maple Grove Elementary", "Eastfield Middle School"],
  uni: ["State University", "Ridgemont College", "Institute of Technology", "Northgate University"],
  trades: ["Sparks & Sons", "Reliable Repairs", "Ironworks Co.", "Summit Construction", "QuickFix Services"],
  media: ["Daily Ledger", "Channel 7", "Brightlight Studios", "Soundwave Records", "Pulse Media"],
  sports: ["the Thunder", "the Mariners", "City FC", "the Wolves", "the Comets"],
  hotel: ["Grand Plaza Hotel", "Seaside Resort", "The Lodge", "Skyline Suites"],
  transport: ["SkyHigh Airlines", "Continental Air", "Roadrunner Freight", "Swift Logistics"],
  self: ["Self-employed"],
};

type RankTuple = readonly [string, number];

export function career(
  id: string,
  name: string,
  category: CareerCategory,
  icon: string,
  requires: CareerRequirements,
  ranks: readonly RankTuple[],
  extra: Partial<Omit<CareerDef, "id" | "name" | "category" | "icon" | "requires" | "ranks">> & { employers?: readonly string[] } = {},
): CareerDef {
  return {
    id,
    name,
    category,
    icon,
    requires,
    ranks: ranks.map(([title, salary]) => ({ title, salary })),
    employers: extra.employers ?? EMPLOYERS.office!,
    ...extra,
  };
}

export const HS: CareerRequirements["degree"] = ["high", "trade", "college", "grad", "medical", "law", "phd"];
export const COLLEGE: CareerRequirements["degree"] = ["college", "grad", "medical", "law", "phd"];
