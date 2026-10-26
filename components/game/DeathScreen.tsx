"use client";

import { useState } from "react";
import { Avatar } from "@/components/avatar/Avatar";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Modal";
import { DEFAULT_CONTENT } from "@/data";
import { heirs, lifeRibbons, netWorth, type GameState } from "@/engine";
import { useGame } from "@/store/gameStore";
import { useMoney } from "./useCountry";

export function DeathScreen({ state, onSummary }: { state: GameState; onSummary: () => void }) {
  const { goTo, continueAsChild } = useGame();
  const money = useMoney(state);
  const [pickHeir, setPickHeir] = useState(false);
  const p = state.player;
  const { primary, others } = lifeRibbons(state, DEFAULT_CONTENT);
  const children = heirs(state);
  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-black/55 anim-fade" role="dialog" aria-modal="true" aria-label="You died">
      <div className="no-scrollbar anim-pop flex w-full max-w-[440px] flex-col items-center overflow-y-auto bg-bg p-6 text-center">
        <div className="mt-2 text-xs font-bold uppercase tracking-[0.3em] text-muted">Rest in peace</div>
        <div className="my-3">
          <Avatar appearance={p.appearance} age={p.age} size={120} colorKey="player" dead />
        </div>
        <h1 className="text-3xl font-black tracking-tight">
          {p.firstName} {p.lastName}
        </h1>
        <div className="text-sm font-semibold text-muted">
          {p.birthYear} – {state.year} · Age {p.age}
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          <span className="rounded-full px-4 py-1 text-sm font-black text-white shadow" style={{ background: primary.color }} title={primary.description}>
            {primary.label}
          </span>
          {others.map((r) => (
            <span key={r.id} className="rounded-full px-2.5 py-1 text-xs font-bold text-white opacity-90" style={{ background: r.color }} title={r.description}>
              {r.label}
            </span>
          ))}
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
        {pickHeir ? (
          <div className="w-full space-y-2">
            <div className="text-sm font-bold">Continue as…</div>
            {children.map((c) => (
              <button key={c.id} onClick={() => continueAsChild(c.id)} className="flex w-full items-center gap-3 rounded-2xl bg-card p-3 text-left shadow-sm hover:bg-card-2">
                <Avatar appearance={c.appearance} age={c.age} size={44} colorKey={c.id} />
                <span className="flex-1">
                  <span className="block font-bold">
                    {c.firstName} {c.lastName}
                  </span>
                  <span className="block text-xs text-muted">Age {c.age}</span>
                </span>
              </button>
            ))}
            <SecondaryButton onClick={() => setPickHeir(false)}>Back</SecondaryButton>
          </div>
        ) : (
          <div className="w-full space-y-2">
            <SecondaryButton onClick={onSummary}>Life summary</SecondaryButton>
            {children.length > 0 && <SecondaryButton onClick={() => setPickHeir(true)}>Continue as your child</SecondaryButton>}
            <PrimaryButton onClick={() => goTo("create")}>Start a new life</PrimaryButton>
          </div>
        )}
        <p className="mt-6 text-xs text-muted">Everything wraps around eventually.</p>
      </div>
    </div>
  );
}
