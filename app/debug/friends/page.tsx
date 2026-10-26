"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Avatar } from "@/components/avatar/Avatar";
import { GAME_CONFIG } from "@/data/config";
import { FRIENDS } from "@/data/friends";
import { APPEARANCE_DEFAULTS, presentationFor } from "@/engine/appearance";
import { ROLE_LABELS } from "@/engine";
import { useGame } from "@/store/gameStore";

/** Hidden page for testing friend cameos. Not linked from the game. */
export default function FriendsDebug() {
  const { hydrated, hydrate, game, forceCameo } = useGame();
  useEffect(() => hydrate(), [hydrate]);

  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="text-2xl font-black">Friend cameos</h1>
      <p className="mb-4 text-sm text-muted">
        Base chance per life: {(GAME_CONFIG.friendCameos.baseChancePerLife * 100).toFixed(1)}% per friend (× rarity). Earliest age{" "}
        {GAME_CONFIG.friendCameos.minAge}. Tune in <code>data/config.ts</code>; edit friends in <code>data/friends.ts</code>.
      </p>
      {!hydrated ? (
        <p>Loading…</p>
      ) : !game ? (
        <p className="mb-4 rounded-xl bg-card p-3 text-sm">No life in progress. Start one, then come back to force-spawn friends into it.</p>
      ) : (
        <p className="mb-4 rounded-xl bg-card p-3 text-sm">
          Current life: <b>{game.player.firstName} {game.player.lastName}</b>, age {game.player.age}. <Link href="/" className="font-bold text-accent underline">Back to the game</Link>
        </p>
      )}
      <ul className="space-y-3">
        {FRIENDS.map((f) => {
          const gender = f.pronouns === "he" ? "male" : f.pronouns === "she" ? "female" : "nonbinary";
          const appearance = { ...APPEARANCE_DEFAULTS, presentation: presentationFor(gender), ...f.appearance };
          const met = game?.cameos.met.find((m) => m.friendId === f.id);
          const destined = game?.cameos.destined.find((d) => d.friendId === f.id);
          const status = !game ? "" : met ? `Met as ${ROLE_LABELS[met.role].toLowerCase()} at age ${met.age}` : destined ? `Destined to appear from age ${destined.earliestAge}` : "Not in this life";
          return (
            <li key={f.id} className="flex items-center gap-4 rounded-2xl bg-card p-3 shadow-sm">
              <Avatar appearance={appearance} age={28} size={88} colorKey={f.id} title={f.name} />
              <div className="min-w-0 flex-1">
                <div className="text-lg font-black">
                  {f.name} <span className="text-sm font-semibold text-muted">({f.pronouns ?? "they"})</span>
                </div>
                <div className="text-xs text-muted">
                  {f.appearance.hairColor} {f.appearance.hairStyle} hair · {f.appearance.eyeColor} eyes
                  {f.appearance.glasses && f.appearance.glasses !== "none" ? ` · ${f.appearance.glasses} glasses` : ""}
                  {f.appearance.facialHair && f.appearance.facialHair !== "none" ? ` · ${f.appearance.facialHair}` : ""}
                  {f.appearance.skinTone ? ` · ${f.appearance.skinTone} skin` : ""}
                </div>
                <div className="text-xs text-muted">
                  Rarity ×{f.rarity} · {f.traits.length} traits · {Object.keys(f.dialogue).length} dialogue situations · {f.roles.length} roles
                </div>
                {status && <div className="mt-1 text-xs font-bold">{status}</div>}
              </div>
              <button
                disabled={!game || game.status !== "alive" || !!met}
                onClick={() => forceCameo(f.id)}
                className="shrink-0 rounded-xl bg-accent px-3 py-2 text-sm font-bold text-accent-fg disabled:opacity-40"
              >
                Force spawn
              </button>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
