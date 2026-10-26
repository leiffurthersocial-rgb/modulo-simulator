"use client";

import type { ActionView, GameState } from "@/engine";

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
const REGISTRY: Record<string, CustomUi> = {};

export function registerCustomUi(key: string, ui: CustomUi): void {
  REGISTRY[key] = ui;
}

export function CustomUiHost(props: CustomUiProps) {
  const key = (props.view.action.ui ?? "").split(":")[0] ?? "";
  const Ui = REGISTRY[key];
  return Ui ? <Ui {...props} /> : null;
}
