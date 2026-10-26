"use client";

import { useEffect, useRef } from "react";
import type { GameState, Tone } from "@/engine";

const DOT: Record<Tone, string> = {
  good: "bg-good",
  bad: "bg-bad",
  neutral: "bg-muted/50",
  major: "bg-major",
};

export function LifeLog({ state }: { state: GameState }) {
  const endRef = useRef<HTMLDivElement>(null);
  const last = state.log[state.log.length - 1];
  const entryCount = last?.entries.length ?? 0;
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [state.log.length, entryCount]);

  return (
    <div className="no-scrollbar flex-1 overflow-y-auto px-3 py-3" aria-live="polite">
      {state.log.map((year) => (
        <section key={year.age} className="mb-3">
          <h3 className="mb-1.5 flex items-baseline gap-2">
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-extrabold text-accent-fg">Age {year.age}</span>
            <span className="text-[11px] font-semibold text-muted">{year.year}</span>
          </h3>
          {year.entries.length === 0 ? (
            <p className="pl-1 text-sm text-muted italic">A quiet year.</p>
          ) : (
            <ul className="space-y-1">
              {year.entries.map((e, i) => (
                <li key={i} className={`flex gap-2 rounded-xl bg-card px-3 py-2 text-[15px] leading-snug shadow-sm ${e.tone === "major" ? "font-semibold" : ""}`}>
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[e.tone]}`} aria-hidden />
                  <span>{e.text}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
      <div ref={endRef} />
    </div>
  );
}
