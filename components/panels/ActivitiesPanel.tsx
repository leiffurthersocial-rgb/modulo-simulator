"use client";

import { useState } from "react";
import { DEFAULT_CONTENT } from "@/data";
import { listActions, type ActionSection, type ActionView, type GameState } from "@/engine";
import { Icon } from "@/components/ui/Icon";
import { Section, Sheet } from "@/components/ui/Sheet";
import { ActionList, groupsOf } from "./ActionList";

export const ACTIVITY_SECTIONS: { section: ActionSection; title: string; icon: string; blurb: string }[] = [
  { section: "prison", title: "Prison", icon: "Lock", blurb: "Survive, scheme, or appeal" },
  { section: "activities", title: "Fitness & Fun", icon: "Dumbbell", blurb: "Gym, hobbies, travel" },
  { section: "health", title: "Health", icon: "HeartPulse", blurb: "Doctors, treatment, looks" },
  { section: "mind", title: "Mind", icon: "Brain", blurb: "Study, meditate, therapy" },
  { section: "love", title: "Love", icon: "Heart", blurb: "Dating and hookups" },
  { section: "nightlife", title: "Nightlife", icon: "Wine", blurb: "Clubs, bars, vices" },
  { section: "crime", title: "Crime", icon: "Siren", blurb: "Risky, profitable, illegal" },
  { section: "casino", title: "Casino", icon: "Dice5", blurb: "Blackjack, slots, roulette" },
  { section: "money", title: "Money", icon: "Coins", blurb: "Invest, lottery, loans" },
  { section: "fame", title: "Fame", icon: "Star", blurb: "Social media and stardom" },
  { section: "politics", title: "Politics", icon: "Landmark", blurb: "Run for office" },
  { section: "special", title: "Special", icon: "Sparkles", blurb: "The less ordinary" },
];

export function ActivitiesPanel({ state, onClose, onCustom }: { state: GameState; onClose: () => void; onCustom: (v: ActionView) => void }) {
  const [open, setOpen] = useState<ActionSection | null>(null);
  const meta = ACTIVITY_SECTIONS.find((s) => s.section === open);
  if (open && meta) {
    return (
      <Sheet title={meta.title} onClose={() => setOpen(null)}>
        {groupsOf(state, open).map((g) => (
          <Section key={g} title={g || undefined}>
            <ActionList state={state} section={open} group={g === "" ? undefined : g} onCustom={onCustom} />
          </Section>
        ))}
      </Sheet>
    );
  }
  const available = ACTIVITY_SECTIONS.filter((s) => listActions(state, DEFAULT_CONTENT, s.section).length > 0);
  return (
    <Sheet title="Activities" onClose={onClose}>
      {available.length === 0 ? (
        <p className="p-4 text-center text-muted">You&apos;re a little young for that. Give it a few years.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {available.map((s) => (
            <button key={s.section} onClick={() => setOpen(s.section)} className="flex flex-col items-start gap-1 rounded-2xl bg-card p-3 text-left shadow-sm transition hover:bg-card-2 active:scale-[0.98]">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/12 text-accent">
                <Icon name={s.icon} size={20} />
              </span>
              <span className="font-extrabold">{s.title}</span>
              <span className="text-xs text-muted">{s.blurb}</span>
            </button>
          ))}
        </div>
      )}
    </Sheet>
  );
}
