"use client";

import { useState } from "react";
import { Avatar } from "@/components/avatar/Avatar";
import { Row, Section, Sheet } from "@/components/ui/Sheet";
import { peopleGroups, roleLabel, type ActionView, type GameState, type Npc } from "@/engine";
import { ActionList, groupsOf } from "./ActionList";

function Closeness({ value }: { value: number }) {
  return (
    <span className="flex w-20 items-center gap-1.5" aria-label={`Relationship ${value}%`}>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-card-2">
        <span className="block h-full rounded-full bg-accent" style={{ width: `${value}%` }} />
      </span>
    </span>
  );
}

export function PersonPanel({ state, npc, onClose, onCustom }: { state: GameState; npc: Npc; onClose: () => void; onCustom: (v: ActionView) => void }) {
  const params = { npcId: npc.id };
  return (
    <Sheet title={npc.firstName} onClose={onClose}>
      <div className="mb-4 flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm">
        <Avatar appearance={npc.appearance} age={npc.age} size={84} colorKey={npc.id} dead={!npc.alive} />
        <div className="min-w-0 flex-1">
          <div className="text-xl font-black leading-tight">
            {npc.firstName} {npc.lastName}
            {/* A friend cameo carries a barely-there mark; hover it if you know. */}
            {npc.friendId && (
              <span title="A familiar face" className="ml-1 cursor-default align-super text-[10px] text-muted/40">
                ✦
              </span>
            )}
          </div>
          <div className="text-sm text-muted">
            {roleLabel(npc)} · {npc.alive ? `Age ${npc.age}` : `Died at ${npc.deathAge}`}
          </div>
          <div className="text-sm text-muted">{npc.occupation}</div>
          <div className="mt-2 flex items-center gap-2 text-xs font-bold">
            Relationship <Closeness value={npc.closeness} /> {npc.closeness}%
          </div>
        </div>
      </div>
      {npc.alive ? (
        groupsOf(state, "people", params).map((g) => (
          <Section key={g} title={g || "Interact"}>
            <ActionList state={state} section="people" params={params} group={g} onCustom={onCustom} />
          </Section>
        ))
      ) : (
        <p className="px-2 text-sm text-muted">Gone, but not forgotten.</p>
      )}
    </Sheet>
  );
}

export function RelationshipsPanel({ state, onClose, onCustom }: { state: GameState; onClose: () => void; onCustom: (v: ActionView) => void }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const npc = openId ? state.npcs[openId] : undefined;
  if (npc) return <PersonPanel state={state} npc={npc} onClose={() => setOpenId(null)} onCustom={onCustom} />;
  const groups = peopleGroups(state);
  return (
    <Sheet title="People" onClose={onClose}>
      {groups.map(({ group, people }) => (
        <Section key={group} title={group}>
          {people.map((n) => (
            <Row
              key={n.id}
              icon={<Avatar appearance={n.appearance} age={n.age} size={36} colorKey={n.id} dead={!n.alive} />}
              title={`${n.firstName} ${n.lastName}`}
              subtitle={`${roleLabel(n)} · ${n.alive ? n.age : `†${n.deathAge}`}`}
              right={n.alive && n.inContact ? <Closeness value={n.closeness} /> : undefined}
              onClick={() => setOpenId(n.id)}
            />
          ))}
        </Section>
      ))}
    </Sheet>
  );
}
