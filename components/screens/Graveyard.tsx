"use client";

import { Sheet } from "@/components/ui/Sheet";
import { DEFAULT_CONTENT } from "@/data";
import { formatMoney } from "@/engine";
import { useGame } from "@/store/gameStore";

export function Graveyard({ onClose }: { onClose: () => void }) {
  const profile = useGame((s) => s.profile);
  return (
    <Sheet title="Graveyard" onClose={onClose}>
      {profile.graveyard.length === 0 ? (
        <p className="p-4 text-center text-muted">No lives lived yet. Everyone starts somewhere.</p>
      ) : (
        <>
          <div className="mb-3 grid grid-cols-3 gap-2 text-center">
            {[
              ["Lives", String(profile.lives)],
              ["Oldest", String(profile.oldestAge)],
              ["Richest", formatMoney(DEFAULT_CONTENT.countries.us!, profile.bestNetWorth)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-card p-2.5 shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted">{k}</div>
                <div className="truncate text-sm font-black">{v}</div>
              </div>
            ))}
          </div>
          <ul className="space-y-2">
            {profile.graveyard.map((g, i) => {
              const country = DEFAULT_CONTENT.countries[g.countryId];
              return (
                <li key={i} className="rounded-2xl bg-card p-3 shadow-sm">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-black">
                      🪦 {g.name}
                    </span>
                    <span className="text-xs text-muted">
                      {country?.flag} {g.year - g.age}–{g.year}
                    </span>
                  </div>
                  <p className="text-sm text-muted">{g.cause}</p>
                  <p className="text-xs text-muted">
                    Net worth {country ? formatMoney(country, g.netWorth) : g.netWorth} · {g.achievements} achievements
                  </p>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Sheet>
  );
}
