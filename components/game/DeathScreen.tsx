"use client";

import { Avatar } from "@/components/avatar/Avatar";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Modal";
import { netWorth, type GameState } from "@/engine";
import { useGame } from "@/store/gameStore";
import { useMoney } from "./useCountry";

export function DeathScreen({ state, onSummary, extraActions }: { state: GameState; onSummary?: () => void; extraActions?: React.ReactNode }) {
  const goTo = useGame((s) => s.goTo);
  const money = useMoney(state);
  const p = state.player;
  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-black/55 anim-fade">
      <div className="no-scrollbar anim-pop flex w-full max-w-[440px] flex-col items-center overflow-y-auto bg-bg p-6 text-center">
        <div className="mt-4 text-xs font-bold uppercase tracking-[0.3em] text-muted">Rest in peace</div>
        <div className="my-3">
          <Avatar appearance={p.appearance} age={p.age} size={120} colorKey="player" dead />
        </div>
        <h1 className="text-3xl font-black tracking-tight">
          {p.firstName} {p.lastName}
        </h1>
        <div className="text-sm font-semibold text-muted">
          {p.birthYear} – {state.year} · Age {p.age}
        </div>
        <p className="my-4 rounded-2xl bg-card p-4 text-[15px] shadow-sm">{state.death?.text}</p>
        <div className="mb-5 grid w-full grid-cols-2 gap-2">
          <div className="rounded-2xl bg-card p-3 shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Net worth</div>
            <div className="font-black">{money(netWorth(state))}</div>
          </div>
          <div className="rounded-2xl bg-card p-3 shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted">Achievements</div>
            <div className="font-black">{state.achievements.length}</div>
          </div>
        </div>
        <div className="w-full space-y-2">
          {onSummary && <SecondaryButton onClick={onSummary}>Life summary</SecondaryButton>}
          {extraActions}
          <PrimaryButton onClick={() => goTo("create")}>Start a new life</PrimaryButton>
        </div>
        <p className="mt-6 text-xs text-muted">Everything wraps around eventually.</p>
      </div>
    </div>
  );
}
