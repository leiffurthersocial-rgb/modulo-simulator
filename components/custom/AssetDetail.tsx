"use client";

import { ActionList } from "@/components/panels/ActionList";
import { useMoney } from "@/components/game/useCountry";
import { Section, Sheet } from "@/components/ui/Sheet";
import type { CustomUiProps } from ".";

export function AssetDetail({ state, view, onClose }: CustomUiProps) {
  const money = useMoney(state);
  const assetId = (view.action.ui ?? "").split(":")[1] ?? "";
  const asset = state.player.assets.find((a) => a.id === assetId);
  if (!asset) return null;
  const loan = state.player.finance.debts.find((d) => d.assetId === asset.id);
  const rows: [string, string][] =
    asset.kind === "pet"
      ? [["Age", String(asset.age ?? 0)], ["Yearly costs", money(asset.yearlyUpkeep)]]
      : [
          ["Value", money(asset.value)],
          ["Paid", money(asset.purchasePrice)],
          ["Condition", `${asset.condition}%`],
          ["Yearly upkeep", money(asset.yearlyUpkeep)],
          ...(loan ? ([["Loan balance", money(loan.balance)]] as [string, string][]) : []),
        ];
  return (
    <Sheet title={asset.name} onClose={onClose}>
      <div className="mb-4 rounded-2xl bg-card p-4 shadow-sm">
        <dl className="grid grid-cols-2 gap-y-1 text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted">{k}</dt>
              <dd className="text-right font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <Section title="Manage">
        <ActionList state={state} section="assets" params={{ assetId: asset.id }} />
      </Section>
    </Sheet>
  );
}
