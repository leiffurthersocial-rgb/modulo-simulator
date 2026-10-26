import { Brain, HeartPulse, Smile, Star } from "lucide-react";
import type { StatKey, Stats } from "@/engine";

const META: { key: StatKey; label: string; Icon: typeof Smile; color: string }[] = [
  { key: "happiness", label: "Happiness", Icon: Smile, color: "var(--stat-happiness)" },
  { key: "health", label: "Health", Icon: HeartPulse, color: "var(--stat-health)" },
  { key: "smarts", label: "Smarts", Icon: Brain, color: "var(--stat-smarts)" },
  { key: "looks", label: "Looks", Icon: Star, color: "var(--stat-looks)" },
];

export function StatBars({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-1 gap-1.5 bg-card px-3 py-2.5">
      {META.map(({ key, label, Icon, color }) => (
        <div key={key} className="flex items-center gap-2">
          <Icon size={16} style={{ color }} aria-hidden />
          <span className="w-20 text-xs font-bold">{label}</span>
          <div
            className="h-3 flex-1 overflow-hidden rounded-full bg-card-2"
            role="meter"
            aria-label={label}
            aria-valuenow={stats[key]}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${stats[key]}%`, background: color }} />
          </div>
          <span className="w-9 text-right text-xs font-bold tabular-nums">{stats[key]}%</span>
        </div>
      ))}
    </div>
  );
}
