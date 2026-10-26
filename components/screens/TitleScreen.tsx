"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Modal";
import { SettingsPanel } from "@/components/panels/SettingsPanel";
import { AchievementsScreen } from "./AchievementsScreen";
import { Graveyard } from "./Graveyard";
import { DEFAULT_CONTENT } from "@/data";
import { useGame } from "@/store/gameStore";
import { slotSummaries, type SlotSummary } from "@/store/persistence";

export function TitleScreen({ extra }: { extra?: React.ReactNode }) {
  const { game, slot, goTo, openSlot, deleteSlot, profile } = useGame();
  const [slots, setSlots] = useState<(SlotSummary | undefined)[]>([]);
  const [settings, setSettings] = useState(false);
  const [sheet, setSheet] = useState<"achievements" | "graveyard" | null>(null);
  const [confirm, setConfirm] = useState<number | null>(null);
  useEffect(() => setSlots(slotSummaries()), [game]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-[440px] flex-col px-5 py-10">
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        <Logo />
        <p className="mt-2 text-muted">Life, mod N.</p>
      </div>
      <div className="space-y-2">
        {game && game.status === "alive" && (
          <PrimaryButton onClick={() => goTo("game")}>
            Continue as {game.player.firstName} (age {game.player.age})
          </PrimaryButton>
        )}
        {game && game.status === "dead" ? (
          <PrimaryButton onClick={() => goTo("game")}>See how {game.player.firstName} ended</PrimaryButton>
        ) : null}
        <SecondaryButton onClick={() => goTo("create")}>New life in slot {slot + 1}</SecondaryButton>
      </div>
      <h2 className="mt-6 mb-2 text-xs font-bold uppercase tracking-wider text-muted">Save slots</h2>
      <div className="space-y-2">
        {slots.map((s, i) => (
          <div key={i} className={`flex items-center gap-2 rounded-2xl bg-card p-3 shadow-sm ${i === slot ? "ring-2 ring-accent" : ""}`}>
            <button className="flex-1 text-left" onClick={() => openSlot(i)}>
              <div className="font-bold">{s ? s.name : `Empty slot ${i + 1}`}</div>
              <div className="text-xs text-muted">
                {s ? `${DEFAULT_CONTENT.countries[s.countryId]?.flag ?? ""} Age ${s.age}${s.alive ? "" : " · deceased"}` : "Tap to start a life here"}
              </div>
            </button>
            {s &&
              (confirm === i ? (
                <button className="rounded-lg bg-bad px-2 py-1 text-xs font-bold text-white" onClick={() => { deleteSlot(i); setConfirm(null); setSlots(slotSummaries()); }}>
                  Delete
                </button>
              ) : (
                <button aria-label={`Delete slot ${i + 1}`} className="rounded-lg p-1.5 text-muted hover:bg-card-2" onClick={() => setConfirm(i)}>
                  <Trash2 size={16} />
                </button>
              ))}
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <SecondaryButton onClick={() => setSheet("achievements")}>Achievements</SecondaryButton>
        <SecondaryButton onClick={() => setSheet("graveyard")}>Graveyard</SecondaryButton>
      </div>
      {extra}
      <div className="mt-6 flex items-center justify-between text-xs text-muted">
        <span>{profile.lives} {profile.lives === 1 ? "life" : "lives"} lived</span>
        <button className="font-bold underline" onClick={() => setSettings(true)}>
          Settings
        </button>
      </div>
      {settings && <SettingsPanel onClose={() => setSettings(false)} />}
      {sheet === "achievements" && <AchievementsScreen onClose={() => setSheet(null)} />}
      {sheet === "graveyard" && <Graveyard onClose={() => setSheet(null)} />}
    </main>
  );
}
