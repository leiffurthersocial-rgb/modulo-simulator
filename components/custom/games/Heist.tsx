"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PrimaryButton } from "@/components/ui/Modal";
import { Sheet } from "@/components/ui/Sheet";
import { heistRounds, hit, markerAt } from "@/engine/minigames/heist";
import { useGame } from "@/store/gameStore";
import type { CustomUiProps } from "..";

const STAGES = ["Disable the cameras", "Crack the vault", "Beat the silent alarm"];
/** Ignore taps for a moment after each stop so a double-tap can't skip a stage. */
const COOLDOWN_MS = 350;

export function Heist({ state, onClose }: CustomUiProps) {
  const act = useGame((s) => s.act);
  const reduceMotion = useGame((s) => s.settings.reduceMotion);
  const difficulty = Math.max(0, 1 - state.player.skills.streetSmarts / 100);
  // Fresh zones every time the screen opens, so backing out and retrying can't be used to memorise them.
  const [rounds] = useState(() => heistRounds(difficulty, Math.random));
  const speedFactor = reduceMotion ? 0.35 : 1;

  const [round, setRound] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [pos, setPos] = useState(0);
  // Refs mirror state so event handlers never act on a stale render.
  const roundRef = useRef(0);
  const resultsRef = useRef<boolean[]>([]);
  const startRef = useRef(performance.now());
  const lockedUntil = useRef(0);
  const settled = useRef(false);
  const finished = results.length === 3;

  const positionNow = useCallback(
    (now: number) => {
      const r = rounds[Math.min(roundRef.current, 2)]!;
      return markerAt({ ...r, speed: r.speed * speedFactor }, (now - startRef.current) / 1000);
    },
    [rounds, speedFactor],
  );

  useEffect(() => {
    if (finished) return;
    let frame = 0;
    const tick = (now: number) => {
      setPos(positionNow(now));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [finished, positionNow]);

  const stop = () => {
    const now = performance.now();
    if (resultsRef.current.length >= 3 || now < lockedUntil.current) return;
    const ok = hit(rounds[roundRef.current]!, positionNow(now));
    resultsRef.current = [...resultsRef.current, ok];
    setResults(resultsRef.current);
    lockedUntil.current = now + COOLDOWN_MS;
    if (roundRef.current < 2) {
      roundRef.current += 1;
      startRef.current = now;
      setRound(roundRef.current);
      setPos(0);
    }
  };

  /** Settle the job once. Walking out after you've started counts as a botched job (missed stages fail). */
  const settleAndClose = () => {
    if (!settled.current && resultsRef.current.length > 0) {
      settled.current = true;
      act("crime-heist-settle", { score: resultsRef.current.filter(Boolean).length });
    }
    onClose();
  };

  const score = results.filter(Boolean).length;
  const r = rounds[Math.min(round, 2)]!;
  return (
    <Sheet title="The heist" onClose={settleAndClose}>
      <p className="mb-3 px-1 text-sm text-muted">Tap STOP when the marker is inside the green zone. Three chances. Street smarts make it easier. Leaving once you&apos;ve started counts as a botched job.</p>
      <ol className="mb-4 space-y-1">
        {STAGES.map((s, i) => (
          <li key={s} className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold ${i === round && !finished ? "bg-accent/15" : "bg-card"}`}>
            {s}
            <span className={results[i] === undefined ? "text-muted" : results[i] ? "text-good" : "text-bad"}>{results[i] === undefined ? "…" : results[i] ? "✓" : "✗"}</span>
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
        <PrimaryButton onClick={settleAndClose}>{score === 3 ? "Grab the money and run" : score === 2 ? "Make a break for it" : "Run!"}</PrimaryButton>
      ) : (
        <PrimaryButton onClick={stop}>STOP</PrimaryButton>
      )}
    </Sheet>
  );
}
