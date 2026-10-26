"use client";

import { useEffect, useRef, useState } from "react";
import { PrimaryButton } from "@/components/ui/Modal";
import { Sheet } from "@/components/ui/Sheet";
import { heistRounds, hit, markerAt } from "@/engine/minigames/heist";
import { useGame } from "@/store/gameStore";
import type { CustomUiProps } from "..";
import { useMiniRng } from "./shared";

const STAGES = ["Disable the cameras", "Crack the vault", "Beat the silent alarm"];

export function Heist({ state, onClose }: CustomUiProps) {
  const act = useGame((s) => s.act);
  const reduceMotion = useGame((s) => s.settings.reduceMotion);
  const rng = useMiniRng(state, "heist");
  const difficulty = Math.max(0, 1 - state.player.skills.streetSmarts / 100);
  const [rounds] = useState(() => heistRounds(difficulty, () => rng.next()));
  // Reduced motion: the marker moves at a third of the speed.
  const speedFactor = reduceMotion ? 0.35 : 1;
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [pos, setPos] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const start = useRef(performance.now());
  const frame = useRef(0);
  const finished = results.length === 3;

  useEffect(() => {
    if (finished) return;
    start.current = performance.now();
    const tick = (now: number) => {
      const r = rounds[round]!;
      setPos(markerAt({ ...r, speed: r.speed * speedFactor }, (now - start.current) / 1000));
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [round, rounds, finished, speedFactor]);

  const stop = () => {
    if (finished) return;
    const ok = hit(rounds[round]!, pos);
    const next = [...results, ok];
    setResults(next);
    if (ok) setScore((s) => s + 1);
    if (round < 2) setRound(round + 1);
  };

  const r = rounds[Math.min(round, 2)]!;
  return (
    <Sheet title="The heist" onClose={() => { if (finished) { act("crime-heist-settle", { score }); } onClose(); }}>
      <p className="mb-3 px-1 text-sm text-muted">Tap STOP when the marker is inside the green zone. Three chances. Street smarts make it easier.</p>
      <ol className="mb-4 space-y-1">
        {STAGES.map((s, i) => (
          <li key={s} className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold ${i === round && !finished ? "bg-accent/15" : "bg-card"}`}>
            {s}
            <span>{results[i] === undefined ? "…" : results[i] ? "✓" : "✗"}</span>
          </li>
        ))}
      </ol>
      {!finished && (
        <div className="relative mb-4 h-12 overflow-hidden rounded-2xl bg-neutral-800" role="img" aria-label="Timing bar">
          <div className="absolute inset-y-0 bg-green-500/80" style={{ left: `${r.zoneStart * 100}%`, width: `${r.zoneWidth * 100}%` }} />
          <div className="absolute inset-y-0 w-1.5 bg-white shadow" style={{ left: `calc(${pos * 100}% - 3px)` }} />
        </div>
      )}
      {finished ? (
        <PrimaryButton onClick={() => { act("crime-heist-settle", { score }); onClose(); }}>{score === 3 ? "Grab the money and run" : score === 2 ? "Make a break for it" : "Run!"}</PrimaryButton>
      ) : (
        <PrimaryButton onClick={stop}>STOP</PrimaryButton>
      )}
    </Sheet>
  );
}
