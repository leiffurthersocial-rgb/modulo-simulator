"use client";

import { Avatar } from "@/components/avatar/Avatar";
import { Modal, PrimaryButton, SecondaryButton } from "@/components/ui/Modal";
import { roleLabel, type GameState, type Notice, type PendingEvent } from "@/engine";

function NpcHeader({ state, npcId }: { state: GameState; npcId?: string }) {
  const npc = npcId ? state.npcs[npcId] : undefined;
  if (!npc) return null;
  return (
    <div className="mb-3 flex items-center gap-3">
      <Avatar appearance={npc.appearance} age={npc.age} size={52} colorKey={npc.id} dead={!npc.alive} />
      <div>
        <div className="font-extrabold">
          {npc.firstName} {npc.lastName}
        </div>
        <div className="text-xs text-muted">
          {roleLabel(npc)} · {npc.age}
        </div>
      </div>
    </div>
  );
}

export function EventModal({ state, event, onChoose }: { state: GameState; event: PendingEvent; onChoose: (id: string) => void }) {
  return (
    <Modal label={event.title ?? "Event"}>
      <NpcHeader state={state} npcId={event.npcId} />
      {event.title && <h2 className="mb-1 text-xl font-black tracking-tight">{event.title}</h2>}
      <p className="mb-4 text-[15px] leading-relaxed">{event.text}</p>
      <div className="space-y-2">
        {event.choices.map((c, i) =>
          i === 0 ? (
            <PrimaryButton key={c.id} onClick={() => onChoose(c.id)}>
              {c.label}
            </PrimaryButton>
          ) : (
            <SecondaryButton key={c.id} onClick={() => onChoose(c.id)}>
              {c.label}
            </SecondaryButton>
          ),
        )}
      </div>
    </Modal>
  );
}

const TONE_RING: Record<Notice["tone"], string> = {
  good: "border-good",
  bad: "border-bad",
  neutral: "border-line",
  major: "border-major",
};

export function NoticeModal({ state, notice, onClose }: { state: GameState; notice: Notice; onClose: () => void }) {
  return (
    <Modal label={notice.title ?? "Result"}>
      <div className={`border-l-4 pl-3 ${TONE_RING[notice.tone]}`}>
        <NpcHeader state={state} npcId={notice.npcId} />
        {notice.title && <h2 className="mb-1 text-xl font-black tracking-tight">{notice.title}</h2>}
        <p className="text-[15px] leading-relaxed">{notice.text}</p>
      </div>
      <PrimaryButton className="mt-4" onClick={onClose}>
        OK
      </PrimaryButton>
    </Modal>
  );
}
