"use client";

import { useRef } from "react";
import { Rng, hashSeed, type GameState } from "@/engine";
import { DEFAULT_CONTENT } from "@/data";
import { countryOf } from "@/engine";

/** A per-session RNG for minigames, seeded from the life so it isn't trivially predictable. */
export function useMiniRng(state: GameState, salt: string): Rng {
  const ref = useRef<Rng | null>(null);
  if (!ref.current) ref.current = new Rng(hashSeed(`${state.seed}:${state.player.age}:${salt}:${state.rngState}`));
  return ref.current;
}

/** Bet sizes scaled to the country and filtered by what you can afford. */
export function useBets(state: GameState): number[] {
  const ci = countryOf(DEFAULT_CONTENT, state.player.countryId).costIndex;
  return [10, 50, 250, 1000, 10000].map((b) => Math.round(b * ci)).filter((b) => b <= state.player.finance.cash);
}

export function BetPicker({ bets, bet, onPick, money }: { bets: number[]; bet: number; onPick: (b: number) => void; money: (n: number) => string }) {
  if (bets.length === 0) return <p className="text-center text-sm text-muted">You can&apos;t afford the minimum bet.</p>;
  return (
    <div className="flex flex-wrap justify-center gap-1.5" role="radiogroup" aria-label="Bet">
      {bets.map((b) => (
        <button key={b} role="radio" aria-checked={bet === b} onClick={() => onPick(b)} className={`rounded-full px-3 py-1.5 text-sm font-bold ${bet === b ? "bg-accent text-accent-fg" : "bg-card-2"}`}>
          {money(b)}
        </button>
      ))}
    </div>
  );
}

export function SessionTotal({ net, money }: { net: number; money: (n: number) => string }) {
  return (
    <div className={`text-center text-sm font-bold ${net > 0 ? "text-good" : net < 0 ? "text-bad" : "text-muted"}`}>
      Session: {net >= 0 ? "+" : ""}
      {money(net)}
    </div>
  );
}
