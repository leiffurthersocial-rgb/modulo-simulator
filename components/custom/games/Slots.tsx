"use client";

import { useState } from "react";
import { PrimaryButton } from "@/components/ui/Modal";
import { Sheet } from "@/components/ui/Sheet";
import { useMoney } from "@/components/game/useCountry";
import { slotNet, spin, type SlotSymbol } from "@/engine/minigames/slots";
import { useGame } from "@/store/gameStore";
import type { CustomUiProps } from "..";
import { BetPicker, SessionTotal, useBets, useMiniRng } from "./shared";

export function Slots({ state, onClose }: CustomUiProps) {
  const act = useGame((s) => s.act);
  const money = useMoney(state);
  const rng = useMiniRng(state, "slots");
  const bets = useBets(state);
  const [bet, setBet] = useState(bets[0] ?? 0);
  const [reels, setReels] = useState<SlotSymbol[]>(["7", "7", "7"]);
  const [last, setLast] = useState<number | null>(null);
  const [session, setSession] = useState(0);

  const pull = () => {
    if (bet <= 0 || bet > state.player.finance.cash) return;
    const r = spin(rng);
    const net = slotNet(r, bet);
    setReels(r);
    setLast(net);
    setSession((s) => s + net);
    act("casino-settle", { bet, net });
  };

  return (
    <Sheet title="Slot machines" onClose={() => { act("casino-log", { net: session }); onClose(); }}>
      <div className="rounded-3xl bg-gradient-to-b from-fuchsia-700 to-purple-900 p-5 text-center text-white shadow-inner">
        <div className="mx-auto mb-3 flex max-w-xs justify-center gap-2" aria-live="polite" aria-label={`Reels: ${reels.join(" ")}`}>
          {reels.map((s, i) => (
            <div key={i} className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-4xl font-black text-red-600 shadow">
              {s}
            </div>
          ))}
        </div>
        <div className="h-6 font-black">{last === null ? "Good luck!" : last > 0 ? `WIN ${money(last)}` : last === 0 ? "Money back" : "No luck"}</div>
      </div>
      <div className="mt-4 space-y-3">
        <BetPicker bets={bets} bet={bet} onPick={setBet} money={money} />
        <PrimaryButton onClick={pull} disabled={bet <= 0 || bet > state.player.finance.cash}>
          Pull the lever
        </PrimaryButton>
        <SessionTotal net={session} money={money} />
        <p className="text-center text-xs text-muted">💎💎💎 pays 150× · 7 7 7 pays 50× · ⭐/7/💎 pairs pay 2.5×</p>
      </div>
    </Sheet>
  );
}
