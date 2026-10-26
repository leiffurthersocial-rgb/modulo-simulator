import { Briefcase, Heart, Home, Sparkles } from "lucide-react";

export type Panel = "occupation" | "assets" | "relationships" | "activities";

function NavButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-bold text-muted transition hover:text-fg active:scale-95">
      {children}
      {label}
    </button>
  );
}

export function BottomNav({ onOpen, onAge, canAge }: { onOpen: (p: Panel) => void; onAge: () => void; canAge: boolean }) {
  return (
    <nav className="relative flex items-end border-t border-line bg-card px-1 pb-[max(env(safe-area-inset-bottom),0.25rem)]" aria-label="Main">
      <NavButton label="Occupation" onClick={() => onOpen("occupation")}>
        <Briefcase size={22} />
      </NavButton>
      <NavButton label="Assets" onClick={() => onOpen("assets")}>
        <Home size={22} />
      </NavButton>
      <div className="flex flex-1 justify-center">
        <button
          onClick={onAge}
          disabled={!canAge}
          aria-label="Age up one year"
          className="-mt-7 flex h-[72px] w-[72px] flex-col items-center justify-center rounded-full border-4 border-card bg-accent text-accent-fg shadow-lg transition active:scale-95 disabled:opacity-60"
        >
          <span className="text-2xl font-black leading-none">+1</span>
          <span className="text-[10px] font-bold tracking-wider">AGE</span>
        </button>
      </div>
      <NavButton label="People" onClick={() => onOpen("relationships")}>
        <Heart size={22} />
      </NavButton>
      <NavButton label="Activities" onClick={() => onOpen("activities")}>
        <Sparkles size={22} />
      </NavButton>
    </nav>
  );
}
