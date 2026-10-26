import type { Country, CountryId } from "@/engine/types";
import { egypt, nigeria, southAfrica, turkey } from "./africaMiddleEast";
import { argentina, canada, mexico } from "./americas";
import { australia, china, newZealand, philippines, southKorea } from "./asiaPacific";
import { brazil } from "./br";
import { germany } from "./de";
import { france, ireland, italy, netherlands, poland, russia, spain, sweden } from "./europe";
import { india } from "./in";
import { japan } from "./jp";
import { unitedKingdom } from "./uk";
import { unitedStates } from "./us";

export const COUNTRIES: readonly Country[] = [
  unitedStates,
  canada,
  mexico,
  brazil,
  argentina,
  unitedKingdom,
  ireland,
  france,
  germany,
  netherlands,
  spain,
  italy,
  sweden,
  poland,
  russia,
  turkey,
  egypt,
  nigeria,
  southAfrica,
  india,
  china,
  japan,
  southKorea,
  philippines,
  australia,
  newZealand,
];

export const COUNTRY_BY_ID: Readonly<Record<CountryId, Country>> = Object.fromEntries(COUNTRIES.map((c) => [c.id, c]));
