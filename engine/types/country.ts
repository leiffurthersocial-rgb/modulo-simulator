import type { CountryId } from "./common";

export interface NamePool {
  male: readonly string[];
  female: readonly string[];
  /** Used for nonbinary characters in addition to drawing from both lists. */
  neutral: readonly string[];
  last: readonly string[];
}

export interface TaxBracket {
  /** Lower bound of this bracket, in USD-equivalent units. */
  from: number;
  rate: number;
}

export interface Country {
  id: CountryId;
  name: string;
  /** Flag emoji, purely decorative. */
  flag: string;
  currency: {
    code: string;
    symbol: string;
    /** Local currency units per 1 internal (USD-equivalent) unit. */
    perUsd: number;
    /** Symbol position when formatting. */
    symbolAfter?: boolean;
  };
  /** Multiplier on career salaries (1 = US baseline). */
  salaryIndex: number;
  /** Multiplier on living costs and asset prices (1 = US baseline). */
  costIndex: number;
  /** Progressive income tax brackets on USD-equivalent gross income. */
  taxBrackets: readonly TaxBracket[];
  /** Multiplier on yearly mortality risk (1 = US baseline, lower = longer lives). */
  mortalityFactor: number;
  /** Whether college tuition is mostly free (affects student-loan events). */
  freeCollege: boolean;
  /** Mandatory military service at 18. */
  conscription: boolean;
  /** Tags events can test for ("monarchy", "gunsCommon", "island", ...). */
  tags: readonly string[];
  names: NamePool;
}
