"use client";

import { Icon } from "@/components/ui/Icon";
import { Row, Section, Sheet } from "@/components/ui/Sheet";
import { useMoney } from "@/components/game/useCountry";
import { netWorth, totalDebt, type ActionView, type AssetKind, type GameState } from "@/engine";
import { ActionList, groupsOf } from "./ActionList";

const KIND_ICON: Record<AssetKind, string> = {
  house: "Home",
  car: "Car",
  boat: "Ship",
  jewelry: "Gem",
  luxury: "ShoppingBag",
  instrument: "Music",
  pet: "PawPrint",
};

export function AssetsPanel({ state, onClose, onCustom }: { state: GameState; onClose: () => void; onCustom: (v: ActionView) => void }) {
  const money = useMoney(state);
  const fin = state.player.finance;
  const debt = totalDebt(state);
  return (
    <Sheet title="Assets" onClose={onClose}>
      <div className="mb-4 grid grid-cols-3 gap-2 text-center">
        {[
          ["Bank", fin.cash, ""],
          ["Debt", -debt, debt > 0 ? "text-bad" : ""],
          ["Net worth", netWorth(state), ""],
        ].map(([label, value, cls]) => (
          <div key={label as string} className="rounded-2xl bg-card p-3 shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</div>
            <div className={`truncate text-sm font-black ${cls}`}>{money(value as number)}</div>
          </div>
        ))}
      </div>
      {state.player.assets.length > 0 && (
        <Section title="Owned">
          {state.player.assets.map((a) => (
            <Row
              key={a.id}
              icon={<Icon name={KIND_ICON[a.kind]} />}
              title={a.name}
              subtitle={a.kind === "pet" ? `Age ${a.age ?? 0}` : `Condition ${a.condition}%${a.rentedOut ? " · rented out" : ""}`}
              right={a.kind === "pet" ? undefined : money(a.value)}
              onClick={() => onCustom({ action: { id: "asset-detail", section: "assets", label: a.name, run: () => undefined, ui: `asset:${a.id}` }, label: a.name })}
            />
          ))}
        </Section>
      )}
      {fin.debts.length > 0 && (
        <Section title="Debts">
          {fin.debts.map((d) => (
            <Row key={d.id} icon={<Icon name="AlertTriangle" />} title={d.label} subtitle={`${Math.round(d.rate * 100)}% interest · ${money(d.yearlyPayment)}/yr`} right={money(d.balance)} />
          ))}
        </Section>
      )}
      {(["assets", "money"] as const).flatMap((section) =>
        groupsOf(state, section).map((g) => (
          <Section key={section + g} title={g || "Shop"}>
            <ActionList state={state} section={section} group={g === "" ? undefined : g} onCustom={onCustom} />
          </Section>
        )),
      )}
    </Sheet>
  );
}
