"use client";

import { useState } from "react";
import { Section, Sheet } from "@/components/ui/Sheet";
import { useMoney } from "@/components/game/useCountry";
import { SECURITIES } from "@/data/market";
import { DEFAULT_CONTENT } from "@/data";
import { countryOf } from "@/engine";
import { priceOf, portfolioValue } from "@/engine/market";
import { useGame } from "@/store/gameStore";
import type { CustomUiProps } from "..";

function change(history: number[] | undefined): number | undefined {
  if (!history || history.length < 2) return undefined;
  const a = history[history.length - 2]!;
  const b = history[history.length - 1]!;
  return a > 0 ? (b - a) / a : undefined;
}

function Spark({ values }: { values: number[] }) {
  if (values.length < 2) return <span className="inline-block w-16" />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 60},${18 - ((v - min) / (max - min || 1)) * 16}`).join(" ");
  const up = values[values.length - 1]! >= values[0]!;
  return (
    <svg width="60" height="20" aria-hidden className="shrink-0">
      <polyline points={pts} fill="none" stroke={up ? "var(--good)" : "var(--bad)"} strokeWidth="1.5" />
    </svg>
  );
}

export function Market({ state, onClose }: CustomUiProps) {
  const act = useGame((s) => s.act);
  const money = useMoney(state);
  const ci = countryOf(DEFAULT_CONTENT, state.player.countryId).costIndex;
  const [open, setOpen] = useState<string | null>(null);
  const holdings = state.player.finance.holdings;
  const amounts = [100, 1_000, 10_000, 100_000].map((a) => Math.round(a * ci));

  return (
    <Sheet title="Stocks & crypto" onClose={onClose}>
      <div className="mb-4 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-2xl bg-card p-3 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Cash</div>
          <div className="font-black">{money(state.player.finance.cash)}</div>
        </div>
        <div className="rounded-2xl bg-card p-3 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Portfolio</div>
          <div className="font-black">{money(portfolioValue(state))}</div>
        </div>
      </div>
      {holdings.length > 0 && (
        <Section title="Your holdings">
          {holdings.map((h) => {
            const value = h.units * priceOf(state, h.symbol);
            const gain = value - h.costBasis;
            return (
              <div key={h.symbol} className="flex items-center gap-2 border-b border-line px-3 py-2.5 last:border-b-0">
                <span className="w-14 font-black">{h.symbol}</span>
                <span className="flex-1 text-sm">{money(value)}</span>
                <span className={`text-sm font-bold ${gain >= 0 ? "text-good" : "text-bad"}`}>{gain >= 0 ? "+" : ""}{money(gain)}</span>
                <button className="rounded-lg bg-card-2 px-2 py-1 text-xs font-bold" onClick={() => act("market-sell", { symbol: h.symbol, fraction: 0.5 })}>
                  Sell ½
                </button>
                <button className="rounded-lg bg-card-2 px-2 py-1 text-xs font-bold" onClick={() => act("market-sell", { symbol: h.symbol, fraction: 1 })}>
                  Sell all
                </button>
              </div>
            );
          })}
        </Section>
      )}
      <Section title="Market">
        {SECURITIES.map((s) => {
          const price = priceOf(state, s.symbol) * ci;
          const ch = change(state.market.history[s.symbol]);
          return (
            <div key={s.symbol} className="border-b border-line last:border-b-0">
              <button className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-card-2" onClick={() => setOpen(open === s.symbol ? null : s.symbol)} aria-expanded={open === s.symbol}>
                <span className="w-14 font-black">{s.symbol}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-muted">
                  {s.name}
                  {s.kind === "crypto" ? " · crypto" : s.kind === "index" ? " · index" : ""}
                </span>
                <Spark values={state.market.history[s.symbol] ?? []} />
                <span className="w-24 text-right text-sm font-semibold">{money(price / ci)}</span>
                {ch !== undefined && <span className={`w-12 text-right text-xs font-bold ${ch >= 0 ? "text-good" : "text-bad"}`}>{(ch * 100).toFixed(0)}%</span>}
              </button>
              {open === s.symbol && (
                <div className="flex flex-wrap gap-1.5 px-3 pb-3">
                  {amounts.map((a) => (
                    <button key={a} disabled={a > state.player.finance.cash} className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-fg disabled:opacity-40" onClick={() => act("market-buy", { symbol: s.symbol, amount: a })}>
                      Buy {money(a)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </Section>
      <p className="px-2 text-xs text-muted">Prices update once a year. Past performance is, famously, no guarantee.</p>
    </Sheet>
  );
}
