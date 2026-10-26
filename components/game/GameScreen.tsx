"use client";

import { useCallback, useState } from "react";
import { Undo2 } from "lucide-react";
import { CustomUiHost } from "@/components/custom";
import { ActivitiesPanel } from "@/components/panels/ActivitiesPanel";
import { AssetsPanel } from "@/components/panels/AssetsPanel";
import { OccupationPanel } from "@/components/panels/OccupationPanel";
import { ProfilePanel } from "@/components/panels/ProfilePanel";
import { RelationshipsPanel } from "@/components/panels/RelationshipsPanel";
import { SettingsPanel } from "@/components/panels/SettingsPanel";
import { canAgeUp, type ActionView, type GameState } from "@/engine";
import { useGame } from "@/store/gameStore";
import { SecondaryButton } from "@/components/ui/Modal";
import { AchievementsScreen } from "@/components/screens/AchievementsScreen";
import { BottomNav, type Panel } from "./BottomNav";
import { LifeSummary } from "./LifeSummary";
import { DeathScreen } from "./DeathScreen";
import { EventModal, NoticeModal } from "./EventModal";
import { LifeLog } from "./LifeLog";
import { StatBars } from "./StatBars";
import { TopBar } from "./TopBar";

type Overlay = Panel | "settings" | "profile" | "summary" | "achievements" | null;

export function GameScreen({ state }: { state: GameState }) {
  const { ageUp, choose, dismissNotice, rewind, undo } = useGame();
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [custom, setCustom] = useState<ActionView | null>(null);
  const close = useCallback(() => setOverlay(null), []);
  const pending = state.pending[0];
  const notice = state.notices[0];
  const canRewind = state.rewindsLeft > 0 && undo.length > 0;

  return (
    <div className="mx-auto flex h-dvh max-w-[440px] flex-col bg-bg shadow-xl">
      <TopBar state={state} onSettings={() => setOverlay("settings")} onProfile={() => setOverlay("profile")} />
      <LifeLog state={state} />
      {canRewind && state.status === "alive" && (
        <button onClick={rewind} className="mx-3 mb-1 flex items-center justify-center gap-1.5 rounded-xl bg-card-2 py-1.5 text-xs font-bold text-muted">
          <Undo2 size={14} /> What if? Rewind a year ({state.rewindsLeft} left)
        </button>
      )}
      <StatBars stats={state.player.stats} />
      <BottomNav onOpen={setOverlay} onAge={ageUp} canAge={canAgeUp(state)} />

      {overlay === "activities" && <ActivitiesPanel state={state} onClose={close} onCustom={setCustom} />}
      {overlay === "relationships" && <RelationshipsPanel state={state} onClose={close} onCustom={setCustom} />}
      {overlay === "occupation" && <OccupationPanel state={state} onClose={close} onCustom={setCustom} />}
      {overlay === "assets" && <AssetsPanel state={state} onClose={close} onCustom={setCustom} />}
      {overlay === "settings" && <SettingsPanel onClose={close} />}
      {overlay === "profile" && (
        <ProfilePanel
          state={state}
          onClose={close}
          extra={
            <div className="grid grid-cols-2 gap-2">
              <SecondaryButton onClick={() => setOverlay("summary")}>Life so far</SecondaryButton>
              <SecondaryButton onClick={() => setOverlay("achievements")}>Achievements</SecondaryButton>
            </div>
          }
        />
      )}
      {overlay === "summary" && <LifeSummary state={state} onClose={close} />}
      {overlay === "achievements" && <AchievementsScreen onClose={close} />}
      {custom && <CustomUiHost state={state} view={custom} onClose={() => setCustom(null)} />}

      {pending ? (
        <EventModal state={state} event={pending} onChoose={(id) => choose(pending.uid, id)} />
      ) : notice ? (
        <NoticeModal state={state} notice={notice} onClose={() => dismissNotice(notice.id)} />
      ) : null}
      {state.status === "dead" && !notice && overlay !== "summary" && <DeathScreen state={state} onSummary={() => setOverlay("summary")} />}
    </div>
  );
}
