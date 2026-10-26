"use client";

import { Moon, Settings, Sun } from "lucide-react";
import { Avatar } from "@/components/avatar/Avatar";
import { statusLabel, type GameState } from "@/engine";
import { useGame } from "@/store/gameStore";
import { useMoney } from "./useCountry";

export function TopBar({ state, onSettings, onProfile }: { state: GameState; onSettings: () => void; onProfile: () => void }) {
  const money = useMoney(state);
  const theme = useGame((s) => s.settings.theme);
  const setSettings = useGame((s) => s.setSettings);
  const dark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const p = state.player;
  return (
    <header className="flex items-center gap-3 bg-card px-3 py-2.5 shadow-sm">
      <button onClick={onProfile} className="shrink-0 rounded-full ring-2 ring-accent/30" aria-label="Your profile">
        <Avatar appearance={p.appearance} age={p.age} size={46} colorKey="player" dead={state.status === "dead"} />
      </button>
      <div className="min-w-0 flex-1">
        <div className="truncate text-base font-extrabold leading-tight">
          {p.firstName} {p.lastName}
        </div>
        <div className="truncate text-xs text-muted">
          <span className="font-bold text-fg">Age {p.age}</span> · {statusLabel(state)}
        </div>
      </div>
      <div className="text-right">
        <div className={`text-sm font-extrabold ${p.finance.cash < 0 ? "text-bad" : "text-good"}`}>{money(p.finance.cash)}</div>
        <div className="text-[10px] uppercase tracking-wider text-muted">Bank</div>
      </div>
      <button onClick={() => setSettings({ theme: dark ? "light" : "dark" })} className="rounded-full p-1.5 text-muted hover:bg-card-2" aria-label="Toggle dark mode">
        {dark ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      <button onClick={onSettings} className="rounded-full p-1.5 text-muted hover:bg-card-2" aria-label="Settings">
        <Settings size={18} />
      </button>
    </header>
  );
}
