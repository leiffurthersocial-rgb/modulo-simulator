"use client";

import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { ACHIEVEMENTS } from "@/data/achievements";
import { useGame } from "@/store/gameStore";

export function AchievementsScreen({ onClose }: { onClose: () => void }) {
  const { profile, game } = useGame();
  const current = new Set(game?.achievements ?? []);
  const earned = (id: string) => (profile.achievements[id] ?? 0) > 0 || current.has(id);
  const total = ACHIEVEMENTS.filter((a) => earned(a.id)).length;
  return (
    <Sheet title="Achievements" onClose={onClose}>
      <div className="mb-3 px-1 text-sm text-muted">
        {total} of {ACHIEVEMENTS.length} unlocked across all your lives.
      </div>
      <div className="mb-4 h-2.5 overflow-hidden rounded-full bg-card-2">
        <div className="h-full rounded-full bg-accent" style={{ width: `${(total / ACHIEVEMENTS.length) * 100}%` }} />
      </div>
      <ul className="grid grid-cols-1 gap-2">
        {ACHIEVEMENTS.map((a) => {
          const got = earned(a.id);
          const hidden = a.secret && !got;
          return (
            <li key={a.id} className={`flex items-center gap-3 rounded-2xl bg-card p-3 shadow-sm ${got ? "" : "opacity-55"}`}>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${got ? "bg-accent text-accent-fg" : "bg-card-2 text-muted"}`}>
                <Icon name={hidden ? "Lock" : a.icon} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold">{hidden ? "???" : a.name}</span>
                <span className="block text-xs text-muted">{hidden ? "Secret achievement" : a.description}</span>
              </span>
              {(profile.achievements[a.id] ?? 0) > 1 && <span className="text-xs font-bold text-muted">×{profile.achievements[a.id]}</span>}
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}
