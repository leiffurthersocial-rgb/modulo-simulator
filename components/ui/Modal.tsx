"use client";

import { useEffect, useRef } from "react";

/** Centered card that blocks the game (event popups, notices). Focus moves to its first button. */
export function Modal({ children, label }: { children: React.ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [label, children]);
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4 anim-fade" role="dialog" aria-modal="true" aria-label={label}>
      <div ref={ref} className="anim-pop w-full max-w-[400px] rounded-3xl bg-card p-5 shadow-2xl">
        {children}
      </div>
    </div>
  );
}

export function PrimaryButton({ children, onClick, disabled, className = "" }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-2xl bg-accent px-4 py-3 font-bold text-accent-fg shadow-sm transition active:scale-[0.98] disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, onClick, disabled, className = "" }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-2xl bg-card-2 px-4 py-3 font-semibold transition active:scale-[0.98] disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}
