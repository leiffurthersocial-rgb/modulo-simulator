export interface Security {
  symbol: string;
  name: string;
  kind: "stock" | "crypto" | "index";
  /** Starting price, USD. */
  price: number;
  /** Mean yearly return. */
  drift: number;
  /** Yearly volatility (std dev of return). */
  vol: number;
}

export const SECURITIES: readonly Security[] = [
  { symbol: "MODX", name: "Modulo Index Fund", kind: "index", price: 100, drift: 0.07, vol: 0.16 },
  { symbol: "BYTW", name: "Bytewave", kind: "stock", price: 180, drift: 0.1, vol: 0.32 },
  { symbol: "PNCL", name: "Pinnacle Corp", kind: "stock", price: 64, drift: 0.06, vol: 0.2 },
  { symbol: "GLDB", name: "Goldbridge Capital", kind: "stock", price: 92, drift: 0.07, vol: 0.24 },
  { symbol: "HLXB", name: "Helix Biotech", kind: "stock", price: 41, drift: 0.09, vol: 0.45 },
  { symbol: "BRGT", name: "Brightline Energy", kind: "stock", price: 28, drift: 0.05, vol: 0.3 },
  { symbol: "BNTH", name: "Bean There Coffee", kind: "stock", price: 55, drift: 0.05, vol: 0.18 },
  { symbol: "TTNA", name: "Titan Aerospace", kind: "stock", price: 140, drift: 0.08, vol: 0.35 },
  { symbol: "MODC", name: "ModCoin", kind: "crypto", price: 3, drift: 0.2, vol: 1.1 },
  { symbol: "RMDR", name: "Remainder", kind: "crypto", price: 0.4, drift: 0.15, vol: 1.4 },
  { symbol: "LOOP", name: "LoopToken", kind: "crypto", price: 12, drift: 0.12, vol: 0.9 },
];

export const SECURITY_BY_SYMBOL: Readonly<Record<string, Security>> = Object.fromEntries(SECURITIES.map((s) => [s.symbol, s]));
