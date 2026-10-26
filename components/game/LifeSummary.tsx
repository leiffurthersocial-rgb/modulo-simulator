"use client";

import { useState } from "react";
import { Avatar } from "@/components/avatar/Avatar";
import { PrimaryButton } from "@/components/ui/Modal";
import { Section, Sheet } from "@/components/ui/Sheet";
import { DEFAULT_CONTENT } from "@/data";
import { ACHIEVEMENT_BY_ID } from "@/data/achievements";
import { lifeRibbons, netWorth, roleLabel, type GameState } from "@/engine";
import { highlights, highlightsSvg, svgToPng } from "./highlights";
import { useMoney } from "./useCountry";

function Chart({ state }: { state: GameState }) {
  const pts = state.timeline;
  if (pts.length < 2) return null;
  const W = 320;
  const H = 120;
  const worths = pts.map((p) => p.netWorth);
  const min = Math.min(0, ...worths);
  const max = Math.max(1, ...worths);
  const x = (i: number) => (i / (pts.length - 1)) * W;
  const yWorth = (v: number) => H - ((v - min) / (max - min)) * (H - 10) - 5;
  const yHappy = (v: number) => H - (v / 100) * (H - 10) - 5;
  const line = (f: (i: number) => number) => pts.map((_, i) => `${x(i).toFixed(1)},${f(i).toFixed(1)}`).join(" ");
  return (
    <figure className="mb-4 rounded-2xl bg-card p-3 shadow-sm">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Net worth and happiness over your life">
        <polyline points={line((i) => yHappy(pts[i]!.stats.happiness))} fill="none" stroke="var(--stat-happiness)" strokeWidth="1.5" opacity="0.8" />
        <polyline points={line((i) => yWorth(pts[i]!.netWorth))} fill="none" stroke="var(--accent)" strokeWidth="2.5" />
      </svg>
      <figcaption className="mt-1 flex justify-between text-xs text-muted">
        <span>Age {pts[0]!.age}</span>
        <span>
          <span className="font-bold text-accent">Net worth</span> · <span className="font-bold" style={{ color: "var(--stat-happiness)" }}>Happiness</span>
        </span>
        <span>Age {pts[pts.length - 1]!.age}</span>
      </figcaption>
    </figure>
  );
}

export function LifeSummary({ state, onClose }: { state: GameState; onClose: () => void }) {
  const money = useMoney(state);
  const { primary, others } = lifeRibbons(state, DEFAULT_CONTENT);
  const p = state.player;
  const [sharing, setSharing] = useState<string>();
  const people = Object.values(state.npcs);
  const spouses = people.filter((n) => n.role === "spouse" || (n.role === "ex" && Number(state.flags.marriages ?? 0) > 0));
  const kids = people.filter((n) => n.role === "child");

  const share = async () => {
    try {
      setSharing("Rendering…");
      const dark = document.documentElement.classList.contains("dark");
      // Loaded on demand so the server renderer stays out of the main bundle.
      const { renderToStaticMarkup } = await import("react-dom/server");
      const avatar = renderToStaticMarkup(<Avatar appearance={p.appearance} age={p.age} size={220} colorKey="player" />);
      const blob = await svgToPng(highlightsSvg(state, primary, money(netWorth(state)), avatar, dark));
      const file = new File([blob], `${p.firstName}-${p.lastName}-highlights.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${p.firstName} ${p.lastName}`, text: "My life in Modulo Simulator" });
        setSharing("Shared!");
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
        setSharing("Image saved.");
      }
    } catch {
      setSharing("Couldn't create the image on this device.");
    }
  };

  return (
    <Sheet title="Life summary" onClose={onClose}>
      <div className="mb-4 flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm">
        <Avatar appearance={p.appearance} age={p.age} size={84} colorKey="player" dead={state.status === "dead"} />
        <div className="min-w-0">
          <div className="text-xl font-black">
            {p.firstName} {p.lastName}
          </div>
          <div className="text-sm text-muted">
            {p.birthYear} – {state.status === "dead" ? state.year : "present"} · Age {p.age}
            {state.generation > 1 ? ` · Generation ${state.generation}` : ""}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {[primary, ...others].map((r) => (
              <span key={r.id} title={r.description} className="rounded-full px-2.5 py-0.5 text-xs font-extrabold text-white" style={{ background: r.color }}>
                {r.label}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="mb-4 grid grid-cols-3 gap-2 text-center">
        {[
          ["Net worth", money(netWorth(state))],
          ["Achievements", String(state.achievements.length)],
          ["Goals done", `${p.goals.filter((g) => g.completedAtAge !== undefined).length}/${p.goals.length}`],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-card p-2.5 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted">{k}</div>
            <div className="truncate text-sm font-black">{v}</div>
          </div>
        ))}
      </div>
      <Chart state={state} />
      <Section title="Highlights">
        {highlights(state, 14).map((h, i) => (
          <div key={i} className="flex gap-3 border-b border-line px-3 py-2 text-sm last:border-b-0">
            <span className="w-8 shrink-0 font-black text-accent">{h.age}</span>
            <span>{h.text}</span>
          </div>
        ))}
      </Section>
      {(spouses.length > 0 || kids.length > 0) && (
        <Section title="Family">
          {[...spouses, ...kids].map((n) => (
            <div key={n.id} className="flex justify-between border-b border-line px-3 py-2 text-sm last:border-b-0">
              <span className="font-semibold">
                {n.firstName} {n.lastName}
              </span>
              <span className="text-muted">{roleLabel(n)}</span>
            </div>
          ))}
        </Section>
      )}
      {p.career.history.length > 0 && (
        <Section title="Career">
          {p.career.history.map((h, i) => (
            <div key={i} className="flex justify-between gap-2 border-b border-line px-3 py-2 text-sm last:border-b-0">
              <span className="truncate font-semibold">{h.title}</span>
              <span className="shrink-0 text-muted">
                {h.startAge}–{h.endAge}
              </span>
            </div>
          ))}
        </Section>
      )}
      {state.achievements.length > 0 && (
        <Section title="Achievements this life">
          <div className="flex flex-wrap gap-1.5 p-3">
            {state.achievements.map((id) => (
              <span key={id} className="rounded-full bg-card-2 px-2.5 py-1 text-xs font-bold">
                🏆 {ACHIEVEMENT_BY_ID[id]?.name ?? id}
              </span>
            ))}
          </div>
        </Section>
      )}
      <PrimaryButton onClick={share}>Share highlights as an image</PrimaryButton>
      {sharing && <p className="mt-2 text-center text-sm text-muted" role="status">{sharing}</p>}
    </Sheet>
  );
}
