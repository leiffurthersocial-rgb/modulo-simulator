"use client";

import { useState } from "react";
import { PrimaryButton } from "@/components/ui/Modal";
import { Sheet } from "@/components/ui/Sheet";
import { useMoney } from "@/components/game/useCountry";
import { colorOf, rouletteNet, spinWheel, type RouletteBet } from "@/engine/minigames/roulette";
import { useGame } from "@/store/gameStore";
import type { CustomUiProps } from "..";
import { BetPicker, SessionTotal, useBets, useMiniRng } from "./shared";

const CHOICES: { label: string; bet: RouletteBet }[] = [
  { label: "Red", bet: { kind: "red" } },
  { label: "Black", bet: { kind: "black" } },
  { label: "Odd", bet: { kind: "odd" } },
  { label: "Even", bet: { kind: "even" } },
  { label: "1–18", bet: { kind: "low" } },
  { label: "19–36", bet: { kind: "high" } },
  { label: "1st 12", bet: { kind: "dozen", dozen: 1 } },
  { label: "2nd 12", bet: { kind: "dozen", dozen: 2 } },
  { label: "3rd 12", bet: { kind: "dozen", dozen: 3 } },
  { label: "Lucky 7", bet: { kind: "number", number: 7 } },
  { label: "Zero", bet: { kind: "number", number: 0 } },
  { label: "17", bet: { kind: "number", number: 17 } },
];

export function Roulette({ state, onClose }: CustomUiProps) {
  const act = useGame((s) => s.act);
  const money = useMoney(state);
  const rng = useMiniRng(state, "roulette");
  const bets = useBets(state);
  const [stake, setStake] = useState(bets[0] ?? 0);
  const [choice, setChoice] = useState(0);
  const [result, setResult] = useState<{ n: number; net: number } | null>(null);
  const [session, setSession] = useState(0);

  const go = () => {
    if (stake <= 0 || stake > state.player.finance.cash) return;
    const n = spinWheel(rng);
    const net = rouletteNet(CHOICES[choice]!.bet, n, stake);
    setResult({ n, net });
    setSession((s) => s + net);
    act("casino-settle", { bet: stake, net });
  };

  const color = result ? colorOf(result.n) : "green";
  return (
    <Sheet title="Roulette" onClose={() => { act("casino-log", { net: session }); onClose(); }}>
      <div className="flex flex-col items-center rounded-3xl bg-emerald-800 p-5 text-white shadow-inner">
        <div className={`flex h-24 w-24 items-center justify-center rounded-full border-8 border-amber-300 text-3xl font-black ${color === "red" ? "bg-red-600" : color === "black" ? "bg-neutral-900" : "bg-emerald-600"}`} aria-live="polite">
          {result ? result.n : "?"}
        </div>
        <div className="mt-2 h-6 font-black">{result ? (result.net > 0 ? `You win ${money(result.net)}!` : "The house wins.") : "Place your bet"}</div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Bet on">
        {CHOICES.map((c, i) => (
          <button key={c.label} role="radio" aria-checked={choice === i} onClick={() => setChoice(i)} className={`rounded-xl py-2 text-sm font-bold ${choice === i ? "bg-accent text-accent-fg" : "bg-card shadow-sm"}`}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        <BetPicker bets={bets} bet={stake} onPick={setStake} money={money} />
        <PrimaryButton onClick={go} disabled={stake <= 0 || stake > state.player.finance.cash}>
          Spin
        </PrimaryButton>
        <SessionTotal net={session} money={money} />
      </div>
    </Sheet>
  );
}
