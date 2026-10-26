"use client";

import { useState } from "react";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Modal";
import { Sheet } from "@/components/ui/Sheet";
import { useMoney } from "@/components/game/useCountry";
import { dealerPlay, handValue, isBlackjack, newDeck, settleHand, type Card } from "@/engine/minigames/blackjack";
import { useGame } from "@/store/gameStore";
import type { CustomUiProps } from "..";
import { BetPicker, SessionTotal, useBets, useMiniRng } from "./shared";

function CardView({ card, hidden }: { card: Card; hidden?: boolean }) {
  const red = card.suit === "♥" || card.suit === "♦";
  return (
    <div className={`flex h-20 w-14 flex-col items-center justify-center rounded-xl border-2 border-line text-xl font-black shadow-sm ${hidden ? "bg-accent text-accent-fg" : "bg-white"} ${red && !hidden ? "text-red-600" : hidden ? "" : "text-neutral-900"}`}>
      {hidden ? "%" : (
        <>
          <span>{card.rank}</span>
          <span>{card.suit}</span>
        </>
      )}
    </div>
  );
}

type Phase = "bet" | "play" | "done";

export function Blackjack({ state, onClose }: CustomUiProps) {
  const act = useGame((s) => s.act);
  const money = useMoney(state);
  const rng = useMiniRng(state, "blackjack");
  const bets = useBets(state);
  const [bet, setBet] = useState(bets[0] ?? 0);
  const [deck, setDeck] = useState<Card[]>([]);
  const [player, setPlayer] = useState<Card[]>([]);
  const [dealer, setDealer] = useState<Card[]>([]);
  const [phase, setPhase] = useState<Phase>("bet");
  const [result, setResult] = useState<number | null>(null);
  const [session, setSession] = useState(0);
  const [stake, setStake] = useState(0);

  const finish = (p: Card[], d: Card[], deckNow: Card[], stakeNow: number) => {
    const finalDealer = handValue(p) > 21 ? d : dealerPlay(deckNow, d);
    const net = settleHand(p, finalDealer, stakeNow);
    setDealer(finalDealer);
    setResult(net);
    setSession((s) => s + net);
    setPhase("done");
    act("casino-settle", { bet: stakeNow, net });
  };

  const deal = () => {
    if (bet <= 0 || bet > state.player.finance.cash) return;
    const d = newDeck(rng);
    const p = [d.pop()!, d.pop()!];
    const dl = [d.pop()!, d.pop()!];
    setDeck(d);
    setPlayer(p);
    setDealer(dl);
    setStake(bet);
    setResult(null);
    if (isBlackjack(p) || isBlackjack(dl)) finish(p, dl, d, bet);
    else setPhase("play");
  };

  const hit = () => {
    const d = [...deck];
    const p = [...player, d.pop()!];
    setDeck(d);
    setPlayer(p);
    if (handValue(p) >= 21) finish(p, dealer, d, stake);
  };

  const double = () => {
    const d = [...deck];
    const p = [...player, d.pop()!];
    setDeck(d);
    setPlayer(p);
    finish(p, dealer, d, stake * 2);
  };

  const close = () => {
    act("casino-log", { net: session });
    onClose();
  };

  return (
    <Sheet title="Blackjack" onClose={close}>
      <div className="space-y-5 rounded-3xl bg-emerald-800 p-4 text-white shadow-inner">
        <div>
          <div className="mb-1 text-xs font-bold uppercase tracking-wider opacity-80">Dealer {phase === "done" ? `· ${handValue(dealer)}` : ""}</div>
          <div className="flex gap-2">
            {dealer.map((c, i) => (
              <CardView key={i} card={c} hidden={phase === "play" && i === 1} />
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1 text-xs font-bold uppercase tracking-wider opacity-80">You {player.length ? `· ${handValue(player)}` : ""}</div>
          <div className="flex flex-wrap gap-2">
            {player.map((c, i) => (
              <CardView key={i} card={c} />
            ))}
          </div>
        </div>
        {result !== null && (
          <div className="rounded-xl bg-black/25 p-2 text-center font-black" role="status">
            {result > 0 ? `You win ${money(result)}!` : result < 0 ? `You lose ${money(-result)}.` : "Push. Your bet is returned."}
          </div>
        )}
      </div>
      <div className="mt-4 space-y-3">
        {phase === "play" ? (
          <div className="grid grid-cols-3 gap-2">
            <PrimaryButton onClick={hit}>Hit</PrimaryButton>
            <SecondaryButton onClick={() => finish(player, dealer, [...deck], stake)}>Stand</SecondaryButton>
            <SecondaryButton onClick={double} disabled={player.length !== 2 || stake * 2 > state.player.finance.cash}>
              Double
            </SecondaryButton>
          </div>
        ) : (
          <>
            <BetPicker bets={bets} bet={bet} onPick={setBet} money={money} />
            <PrimaryButton onClick={deal} disabled={bet <= 0 || bet > state.player.finance.cash}>
              Deal {bet > 0 ? money(bet) : ""}
            </PrimaryButton>
          </>
        )}
        <SessionTotal net={session} money={money} />
      </div>
    </Sheet>
  );
}
