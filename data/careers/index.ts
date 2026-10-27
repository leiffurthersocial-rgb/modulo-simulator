import type { CareerDef } from "@/engine/types";
import { CREATIVE_CAREERS, SPORTS_CAREERS } from "./creative";
import { EXTRA_CAREERS } from "./extra";
import { EDUCATION_CAREERS, LAW_CAREERS, MEDICAL_CAREERS, PUBLIC_CAREERS } from "./professional";
import { PART_TIME_CAREERS, SERVICE_CAREERS } from "./service";
import { CORPORATE_CAREERS, TECH_CAREERS, TRADES_CAREERS } from "./skilled";

/** Every career in the game. Add new career files here. */
export const CAREERS: readonly CareerDef[] = [
  ...SERVICE_CAREERS,
  ...PART_TIME_CAREERS,
  ...TRADES_CAREERS,
  ...CORPORATE_CAREERS,
  ...TECH_CAREERS,
  ...MEDICAL_CAREERS,
  ...LAW_CAREERS,
  ...PUBLIC_CAREERS,
  ...EDUCATION_CAREERS,
  ...CREATIVE_CAREERS,
  ...SPORTS_CAREERS,
  ...EXTRA_CAREERS,
];
