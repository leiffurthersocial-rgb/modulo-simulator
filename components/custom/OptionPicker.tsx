"use client";

import { DEFAULT_CONTENT } from "@/data";
import { actionOptions, type ActionParams } from "@/engine";
import { Icon } from "@/components/ui/Icon";
import { Row, Section, Sheet } from "@/components/ui/Sheet";
import { useMoney } from "@/components/game/useCountry";
import { useGame } from "@/store/gameStore";
import type { CustomUiProps } from ".";

/** Generic picker for actions that expose `options`. */
export function OptionPicker({ state, view, onClose, params = {} }: CustomUiProps & { params?: ActionParams }) {
  const act = useGame((s) => s.act);
  const money = useMoney(state);
  const options = actionOptions(state, DEFAULT_CONTENT, view.action.id, params);
  return (
    <Sheet title={view.label} onClose={onClose}>
      {view.description && <p className="mb-3 px-1 text-sm text-muted">{view.description}</p>}
      <Section>
        {options.length === 0 && <p className="px-3 py-4 text-sm text-muted">Nothing available right now.</p>}
        {options.map((o) => (
          <Row
            key={o.id}
            icon={<Icon name={o.icon ?? view.action.icon} />}
            title={o.label}
            subtitle={o.blocked ?? o.description}
            right={o.price !== undefined ? money(o.price) : undefined}
            disabled={o.blocked !== undefined}
            onClick={() => {
              act(view.action.id, { ...params, option: o.id });
              onClose();
            }}
          />
        ))}
      </Section>
    </Sheet>
  );
}
