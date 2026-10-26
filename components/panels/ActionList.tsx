"use client";

import { DEFAULT_CONTENT } from "@/data";
import { listActions, type ActionParams, type ActionSection, type ActionView, type GameState } from "@/engine";
import { Icon } from "@/components/ui/Icon";
import { Row } from "@/components/ui/Sheet";
import { useGame } from "@/store/gameStore";
import { useMoney } from "@/components/game/useCountry";

/** Lists the actions in a section as rows. Actions with a custom `ui` are handed to `onCustom`. */
export function ActionList({
  state,
  section,
  params,
  group,
  onCustom,
  empty,
}: {
  state: GameState;
  section: ActionSection;
  params?: ActionParams;
  group?: string;
  onCustom?: (view: ActionView) => void;
  empty?: string;
}) {
  const act = useGame((s) => s.act);
  const money = useMoney(state);
  const views = listActions(state, DEFAULT_CONTENT, section, params).filter((v) => group === undefined || v.action.group === group);
  if (views.length === 0) return empty ? <p className="px-3 py-4 text-sm text-muted">{empty}</p> : null;
  return (
    <>
      {views.map((v) => (
        <Row
          key={v.action.id}
          icon={<Icon name={v.action.icon} />}
          title={v.label}
          subtitle={v.blocked ?? v.description}
          right={v.cost ? money(v.cost) : undefined}
          disabled={v.blocked !== undefined}
          onClick={() => (v.action.ui && onCustom ? onCustom(v) : act(v.action.id, params))}
        />
      ))}
    </>
  );
}

/** Groups actions of a section under sub-headings. */
export function groupsOf(state: GameState, section: ActionSection, params?: ActionParams): string[] {
  const seen: string[] = [];
  for (const v of listActions(state, DEFAULT_CONTENT, section, params)) {
    const g = v.action.group ?? "";
    if (!seen.includes(g)) seen.push(g);
  }
  return seen;
}
