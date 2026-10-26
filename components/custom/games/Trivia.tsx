"use client";

import { useState } from "react";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Modal";
import { Sheet } from "@/components/ui/Sheet";
import { useMoney } from "@/components/game/useCountry";
import { TRIVIA } from "@/data/trivia";
import { DEFAULT_CONTENT } from "@/data";
import { countryOf } from "@/engine";
import { useGame } from "@/store/gameStore";
import type { CustomUiProps } from "..";
import { useMiniRng } from "./shared";

const LADDER = [0, 500, 2_000, 10_000, 50_000, 250_000];

export function Trivia({ state, onClose }: CustomUiProps) {
  const act = useGame((s) => s.act);
  const money = useMoney(state);
  const ci = countryOf(DEFAULT_CONTENT, state.player.countryId).costIndex;
  const rng = useMiniRng(state, "trivia");
  const [questions] = useState(() => rng.shuffle(TRIVIA).slice(0, 5));
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const q = questions[index]!;
  const correct = picked !== null && picked === q.answer;

  const finish = (score: number) => {
    setDone(true);
    act("special-gameshow-settle", { correct: score });
    onClose();
  };

  return (
    <Sheet title="Game show" onClose={() => (done ? onClose() : finish(index))}>
      <div className="mb-3 flex justify-between text-xs font-bold uppercase tracking-wider text-muted">
        <span>Question {index + 1} of 5</span>
        <span>Banked: {money(LADDER[index]! * ci)}</span>
      </div>
      <div className="mb-4 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-800 p-5 text-lg font-bold text-white shadow">{q.q}</div>
      <div className="grid gap-2">
        {q.options.map((o, i) => {
          const reveal = picked !== null;
          const cls = reveal ? (i === q.answer ? "bg-good text-white" : i === picked ? "bg-bad text-white" : "bg-card opacity-60") : "bg-card hover:bg-card-2";
          return (
            <button key={o} disabled={reveal} onClick={() => setPicked(i)} className={`rounded-2xl px-4 py-3 text-left font-semibold shadow-sm ${cls}`}>
              {String.fromCharCode(65 + i)}. {o}
            </button>
          );
        })}
      </div>
      <div className="mt-4 space-y-2" aria-live="polite">
        {picked !== null && !correct && (
          <PrimaryButton onClick={() => finish(index)}>Wrong! Leave with {money(LADDER[index]! * ci)}</PrimaryButton>
        )}
        {correct && index < 4 && (
          <>
            <PrimaryButton onClick={() => { setIndex(index + 1); setPicked(null); }}>Correct! Next question for {money(LADDER[index + 2]! * ci)}</PrimaryButton>
            <SecondaryButton onClick={() => finish(index + 1)}>Walk away with {money(LADDER[index + 1]! * ci)}</SecondaryButton>
          </>
        )}
        {correct && index === 4 && <PrimaryButton onClick={() => finish(5)}>You got them all! Collect {money(LADDER[5]! * ci)}</PrimaryButton>}
      </div>
    </Sheet>
  );
}
