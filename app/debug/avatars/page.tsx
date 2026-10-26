"use client";

import { Avatar } from "@/components/avatar/Avatar";
import { APPEARANCE_DEFAULTS } from "@/engine/appearance";
import { HAIR_STYLES, type Appearance } from "@/engine/types";
import { FRIENDS } from "@/data/friends";

const AGES = [1, 8, 15, 32, 78];

export default function AvatarGallery() {
  const base = (over: Partial<Appearance>): Appearance => ({ ...APPEARANCE_DEFAULTS, ...over });
  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="mb-3 text-xl font-bold">Avatar gallery</h1>
      <h2 className="mt-4 font-semibold">Hair styles (adult)</h2>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
        {HAIR_STYLES.map((h, i) => (
          <figure key={h} className="text-center text-xs">
            <Avatar appearance={base({ hairStyle: h, hairColor: i % 2 ? "brown" : "black", presentation: i % 2 ? "masculine" : "feminine" })} age={30} size={80} colorKey={h} />
            <figcaption>{h}</figcaption>
          </figure>
        ))}
      </div>
      <h2 className="mt-4 font-semibold">Ages</h2>
      <div className="flex gap-3">
        {AGES.map((age) => (
          <Avatar key={age} appearance={base({ hairStyle: "mod", hairColor: "blonde", facialHair: "beard", presentation: "masculine" })} age={age} size={80} colorKey={String(age)} />
        ))}
        {AGES.map((age) => (
          <Avatar key={`f${age}`} appearance={base({ hairStyle: "long", hairColor: "red", presentation: "feminine", skinTone: "brown" })} age={age} size={80} colorKey={`f${age}`} />
        ))}
      </div>
      <h2 className="mt-4 font-semibold">Friends</h2>
      <div className="flex flex-wrap gap-3">
        {FRIENDS.map((f) => (
          <figure key={f.id} className="text-center text-xs">
            <Avatar appearance={base({ presentation: "masculine", ...f.appearance })} age={28} size={96} colorKey={f.id} />
            <figcaption>{f.name}</figcaption>
          </figure>
        ))}
      </div>
    </main>
  );
}
