/** Text logo with the modulo sign. */
export function Logo({ size = "lg" }: { size?: "sm" | "lg" }) {
  const big = size === "lg";
  return (
    <div className="flex items-center gap-2 select-none" aria-label="Modulo Simulator">
      <span
        className={`flex items-center justify-center rounded-2xl bg-accent font-black text-accent-fg shadow-md ${big ? "h-14 w-14 text-4xl" : "h-8 w-8 text-xl"}`}
        aria-hidden
      >
        %
      </span>
      <span className={`font-black leading-none tracking-tight ${big ? "text-4xl" : "text-xl"}`}>
        Modulo
        <span className={`block font-bold text-muted ${big ? "text-lg tracking-[0.3em]" : "text-[10px] tracking-[0.25em]"}`}>SIMULATOR</span>
      </span>
    </div>
  );
}
