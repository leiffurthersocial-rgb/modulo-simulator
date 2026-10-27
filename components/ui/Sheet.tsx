"use client";

import { ChevronLeft } from "lucide-react";
import { useEffect, useRef } from "react";

/** Full-height panel over the game column, with a back button. */
export function Sheet({ title, onClose, children, actions }: { title: string; onClose: () => void; children: React.ReactNode; actions?: React.ReactNode }) {
  // Keep the latest onClose in a ref so inline callbacks don't re-register the listener on every render.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeRef.current();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return (
    <div className="fixed inset-0 z-30 flex justify-center bg-black/30 anim-fade" role="dialog" aria-modal="true" aria-label={title}>
      <div className="anim-sheet flex h-full w-full max-w-[440px] flex-col bg-bg">
        <header className="flex items-center gap-2 border-b border-line bg-card px-3 py-3">
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-card-2" aria-label="Back">
            <ChevronLeft size={22} />
          </button>
          <h2 className="flex-1 text-lg font-extrabold tracking-tight">{title}</h2>
          {actions}
        </header>
        <div className="no-scrollbar flex-1 overflow-y-auto p-3 pb-10">{children}</div>
      </div>
    </div>
  );
}

export function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="mb-4">
      {title && <h3 className="mb-1.5 px-1 text-xs font-bold uppercase tracking-wider text-muted">{title}</h3>}
      <div className="overflow-hidden rounded-2xl bg-card shadow-sm">{children}</div>
    </section>
  );
}

/** A tappable list row. */
export function Row({
  icon,
  title,
  subtitle,
  right,
  onClick,
  disabled,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const content = (
    <>
      {icon && <span className="tint-chip flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">{icon}</span>}
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate font-semibold">{title}</span>
        {subtitle && <span className="block text-sm text-muted">{subtitle}</span>}
      </span>
      {right && <span className="shrink-0 text-sm text-muted">{right}</span>}
    </>
  );
  const cls = "tint-row flex w-full items-center gap-3 border-b border-line px-3 py-2.5 last:border-b-0";
  return onClick ? (
    <button onClick={onClick} disabled={disabled} className={`${cls} disabled:opacity-45`}>
      {content}
    </button>
  ) : (
    <div className={cls}>{content}</div>
  );
}
