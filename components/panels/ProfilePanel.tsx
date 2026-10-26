"use client";

import { Avatar } from "@/components/avatar/Avatar";
import { Section, Sheet } from "@/components/ui/Sheet";
import { DEFAULT_CONTENT } from "@/data";
import { countryOf, statusLabel, type GameState, type SkillKey } from "@/engine";

const SKILLS: [SkillKey, string][] = [
  ["charisma", "Charisma"],
  ["creativity", "Creativity"],
  ["athleticism", "Athleticism"],
  ["streetSmarts", "Street smarts"],
];

function Bar({ label, value, min = 0, max = 100 }: { label: string; value: number; min?: number; max?: number }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex items-center gap-2 border-b border-line px-3 py-2 last:border-b-0">
      <span className="w-28 text-sm font-semibold">{label}</span>
      <span className="h-2 flex-1 overflow-hidden rounded-full bg-card-2">
        <span className="block h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
      </span>
      <span className="w-10 text-right text-xs font-bold tabular-nums">{value}</span>
    </div>
  );
}

export function ProfilePanel({ state, onClose, extra }: { state: GameState; onClose: () => void; extra?: React.ReactNode }) {
  const p = state.player;
  const country = countryOf(DEFAULT_CONTENT, p.countryId);
  return (
    <Sheet title="You" onClose={onClose}>
      <div className="mb-4 flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm">
        <Avatar appearance={p.appearance} age={p.age} size={92} colorKey="player" dead={state.status === "dead"} />
        <div>
          <div className="text-xl font-black">
            {p.firstName} {p.lastName}
          </div>
          <div className="text-sm text-muted">
            {country.flag} {country.name} · Age {p.age}
          </div>
          <div className="text-sm text-muted">{statusLabel(state)}</div>
        </div>
      </div>
      <Section title="Skills">
        {SKILLS.map(([k, label]) => (
          <Bar key={k} label={label} value={p.skills[k]} />
        ))}
      </Section>
      <Section title="Reputation">
        <Bar label="Karma" value={p.karma} min={-100} max={100} />
        <Bar label="Fame" value={p.fame} />
        <Bar label="Notoriety" value={p.crime.notoriety} />
      </Section>
      {extra}
    </Sheet>
  );
}
