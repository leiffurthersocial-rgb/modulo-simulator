"use client";

import type { ActionView, GameState } from "@/engine";
import { OptionPicker } from "./OptionPicker";
import { AssetDetail } from "./AssetDetail";

export interface CustomUiProps {
  state: GameState;
  view: ActionView;
  onClose: () => void;
}

type CustomUi = (props: CustomUiProps) => React.ReactNode;

/**
 * Custom UIs for actions with a `ui` key (minigames, shops, pickers).
 * Keys may carry an argument after a colon, e.g. "asset:<id>".
 */
const REGISTRY: Record<string, CustomUi> = {
  asset: AssetDetail,
};

export function registerCustomUi(key: string, ui: CustomUi): void {
  REGISTRY[key] = ui;
}

export function CustomUiHost(props: CustomUiProps) {
  const key = (props.view.action.ui ?? "").split(":")[0] ?? "";
  const Ui = REGISTRY[key];
  if (Ui) return <Ui {...props} />;
  if (props.view.action.options) return <OptionPicker {...props} params={props.view.params} />;
  return null;
}
