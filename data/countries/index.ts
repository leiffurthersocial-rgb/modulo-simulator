import type { Country, CountryId } from "@/engine/types";
import { brazil } from "./br";
import { germany } from "./de";
import { india } from "./in";
import { japan } from "./jp";
import { unitedKingdom } from "./uk";
import { unitedStates } from "./us";

export const COUNTRIES: readonly Country[] = [unitedStates, unitedKingdom, germany, japan, brazil, india];

export const COUNTRY_BY_ID: Readonly<Record<CountryId, Country>> = Object.fromEntries(
  COUNTRIES.map((c) => [c.id, c]),
);
