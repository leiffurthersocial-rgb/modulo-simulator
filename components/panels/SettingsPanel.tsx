"use client";

import { useRef, useState } from "react";
import { Section, Sheet } from "@/components/ui/Sheet";
import { useGame } from "@/store/gameStore";
import type { DifficultyPreset, Theme } from "@/store/settings";
import type { GameMode } from "@/engine";

function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2.5 last:border-b-0">
      <span className="font-semibold">{label}</span>
      <div className="flex rounded-xl bg-card-2 p-0.5" role="radiogroup" aria-label={label}>
        {options.map(([v, text]) => (
          <button
            key={v}
            role="radio"
            aria-checked={value === v}
            onClick={() => onChange(v)}
            className={`rounded-lg px-2.5 py-1 text-sm font-bold ${value === v ? "bg-card shadow-sm" : "text-muted"}`}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { settings, setSettings, exportSave, importSave, resetEverything, game, goTo } = useGame();
  const [message, setMessage] = useState<string>();
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const doExport = () => {
    const json = exportSave();
    if (!json) return setMessage("No life to export yet.");
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `modulo-${game?.player.firstName ?? "life"}-age${game?.player.age ?? 0}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage("Save exported.");
  };

  const doImport = async (file: File) => {
    const error = importSave(await file.text());
    setMessage(error ?? "Save imported.");
    if (!error) onClose();
  };

  return (
    <Sheet title="Settings" onClose={onClose}>
      <Section title="Display">
        <Segmented<Theme> label="Theme" value={settings.theme} onChange={(theme) => setSettings({ theme })} options={[["system", "Auto"], ["light", "Light"], ["dark", "Dark"]]} />
        <Segmented<"on" | "off"> label="Reduce motion" value={settings.reduceMotion ? "on" : "off"} onChange={(v) => setSettings({ reduceMotion: v === "on" })} options={[["off", "Off"], ["on", "On"]]} />
      </Section>
      <Section title="New lives">
        <Segmented<DifficultyPreset> label="Difficulty" value={settings.difficulty} onChange={(difficulty) => setSettings({ difficulty })} options={[["easy", "Easy"], ["normal", "Normal"], ["hard", "Hard"]]} />
        <Segmented<GameMode> label="Mode" value={settings.mode} onChange={(mode) => setSettings({ mode })} options={[["normal", "Normal"], ["casual", "Casual"]]} />
        <p className="px-3 pb-3 text-xs text-muted">Casual mode gives you three &quot;What if?&quot; rewinds per life. Changes apply to your next life.</p>
      </Section>
      <Section title="Save data">
        <button onClick={doExport} className="w-full border-b border-line px-3 py-2.5 text-left font-semibold hover:bg-card-2">Export current life (JSON)</button>
        <button onClick={() => fileRef.current?.click()} className="w-full border-b border-line px-3 py-2.5 text-left font-semibold hover:bg-card-2">Import a life…</button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])} />
        <button onClick={() => { onClose(); goTo("title"); }} className="w-full border-b border-line px-3 py-2.5 text-left font-semibold hover:bg-card-2">Save slots & main menu</button>
        {confirmReset ? (
          <div className="flex gap-2 p-3">
            <button onClick={() => { resetEverything(); onClose(); }} className="flex-1 rounded-xl bg-bad px-3 py-2 font-bold text-white">Erase everything</button>
            <button onClick={() => setConfirmReset(false)} className="flex-1 rounded-xl bg-card-2 px-3 py-2 font-bold">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setConfirmReset(true)} className="w-full px-3 py-2.5 text-left font-semibold text-bad hover:bg-card-2">Reset all data</button>
        )}
      </Section>
      {message && <p className="px-2 text-sm font-semibold text-accent" role="status">{message}</p>}
      <p className="mt-6 text-center text-xs text-muted">Modulo Simulator · Everything wraps around eventually.</p>
    </Sheet>
  );
}
