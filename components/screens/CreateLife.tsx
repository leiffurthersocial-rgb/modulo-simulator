"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, Shuffle } from "lucide-react";
import { Avatar } from "@/components/avatar/Avatar";
import { EYES, HAIR, SKIN } from "@/components/avatar/palette";
import { PrimaryButton } from "@/components/ui/Modal";
import { DEFAULT_CONTENT } from "@/data";
import { COUNTRIES } from "@/data/countries";
import {
  EYE_COLORS,
  FACIAL_HAIR,
  GLASSES,
  HAIR_COLORS,
  HAIR_STYLES,
  SKIN_TONES,
  newLife,
  randomSeed,
  type Appearance,
  type Gender,
} from "@/engine";
import { useGame } from "@/store/gameStore";

function Swatches<T extends string>({ label, values, colors, value, onChange }: { label: string; values: readonly T[]; colors: Record<T, string>; value: T; onChange: (v: T) => void }) {
  return (
    <div className="mb-3">
      <div className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">{label}</div>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
        {values.map((v) => (
          <button
            key={v}
            role="radio"
            aria-checked={value === v}
            aria-label={v}
            onClick={() => onChange(v)}
            className={`h-7 w-7 rounded-full border-2 ${value === v ? "border-accent ring-2 ring-accent/40" : "border-line"}`}
            style={{ background: colors[v] }}
          />
        ))}
      </div>
    </div>
  );
}

function Chips<T extends string>({ label, values, value, onChange }: { label: string; values: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="mb-3">
      <div className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">{label}</div>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
        {values.map((v) => (
          <button
            key={v}
            role="radio"
            aria-checked={value === v}
            onClick={() => onChange(v)}
            className={`rounded-full px-3 py-1 text-sm font-semibold ${value === v ? "bg-accent text-accent-fg" : "bg-card-2"}`}
          >
            {v.replace(/([A-Z])/g, " $1").toLowerCase()}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CreateLife() {
  const { newGame, goTo, game } = useGame();
  const [seed, setSeed] = useState(randomSeed);
  const [gender, setGender] = useState<Gender | "random">("random");
  const [countryId, setCountryId] = useState<string>("random");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [look, setLook] = useState<Partial<Appearance>>({});
  const [customize, setCustomize] = useState(false);

  const options = {
    seed,
    gender: gender === "random" ? undefined : gender,
    countryId: countryId === "random" ? undefined : countryId,
    firstName: firstName.trim() || undefined,
    lastName: lastName.trim() || undefined,
    appearance: look,
  };
  // Preview the exact life these options produce (deterministic per seed).
  const preview = useMemo(() => newLife(DEFAULT_CONTENT, { ...options, year: 2000 }).player, [seed, gender, countryId, firstName, lastName, look]); // eslint-disable-line react-hooks/exhaustive-deps
  const app = preview.appearance;
  const country = DEFAULT_CONTENT.countries[preview.countryId]!;
  const setA = (patch: Partial<Appearance>) => setLook((l) => ({ ...l, ...patch }));

  return (
    <main className="mx-auto min-h-dvh max-w-[440px] px-4 pb-10">
      <header className="flex items-center gap-2 py-3">
        <button onClick={() => goTo(game ? "game" : "title")} className="rounded-full p-1.5 hover:bg-card-2" aria-label="Back">
          <ChevronLeft size={22} />
        </button>
        <h1 className="flex-1 text-xl font-black">A new life</h1>
        <button
          onClick={() => {
            setSeed(randomSeed());
            setLook({});
            setFirstName("");
            setLastName("");
          }}
          className="flex items-center gap-1 rounded-full bg-card px-3 py-1.5 text-sm font-bold shadow-sm"
        >
          <Shuffle size={15} /> Randomize
        </button>
      </header>

      <div className="mb-4 flex items-center gap-4 rounded-3xl bg-card p-4 shadow-sm">
        <Avatar appearance={app} age={24} size={96} colorKey="player" />
        <div className="min-w-0">
          <div className="truncate text-xl font-black">
            {preview.firstName} {preview.lastName}
          </div>
          <div className="text-sm text-muted">
            {country.flag} {country.name}
          </div>
          <div className="text-sm text-muted capitalize">{preview.gender} · {preview.familyWealth} family</div>
          <div className="mt-1 text-xs text-muted">Shown as an adult. You start as a baby.</div>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2">
        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={preview.firstName} aria-label="First name" className="rounded-xl bg-card px-3 py-2.5 shadow-sm outline-none focus:ring-2 focus:ring-accent" />
        <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={preview.lastName} aria-label="Last name" className="rounded-xl bg-card px-3 py-2.5 shadow-sm outline-none focus:ring-2 focus:ring-accent" />
      </div>
      <Chips<Gender | "random"> label="Gender" values={["random", "male", "female", "nonbinary"]} value={gender} onChange={(g) => { setGender(g); setLook({}); }} />
      <div className="mb-3">
        <div className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">Country</div>
        <select value={countryId} onChange={(e) => setCountryId(e.target.value)} aria-label="Country" className="w-full rounded-xl bg-card px-3 py-2.5 shadow-sm">
          <option value="random">🎲 Random</option>
          {COUNTRIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.flag} {c.name}
            </option>
          ))}
        </select>
      </div>

      <button onClick={() => setCustomize((c) => !c)} className="mb-3 text-sm font-bold text-accent">
        {customize ? "Hide appearance options" : "Customize appearance"}
      </button>
      {customize && (
        <div className="mb-4 rounded-2xl bg-card p-3 shadow-sm">
          <Swatches label="Skin" values={SKIN_TONES} colors={SKIN} value={app.skinTone} onChange={(skinTone) => setA({ skinTone })} />
          <Chips label="Hair style" values={HAIR_STYLES} value={app.hairStyle} onChange={(hairStyle) => setA({ hairStyle })} />
          <Swatches label="Hair color" values={HAIR_COLORS.filter((c) => c !== "grey" && c !== "white")} colors={HAIR} value={app.hairColor} onChange={(hairColor) => setA({ hairColor })} />
          <Swatches label="Eyes" values={EYE_COLORS} colors={EYES} value={app.eyeColor} onChange={(eyeColor) => setA({ eyeColor })} />
          <Chips label="Glasses" values={GLASSES} value={app.glasses} onChange={(glasses) => setA({ glasses })} />
          {preview.gender !== "female" && <Chips label="Facial hair (adult)" values={FACIAL_HAIR} value={app.facialHair} onChange={(facialHair) => setA({ facialHair })} />}
        </div>
      )}
      <PrimaryButton onClick={() => newGame(options)}>Be born</PrimaryButton>
    </main>
  );
}
