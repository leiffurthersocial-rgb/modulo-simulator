"use client";

import type { ActionView, GameState } from "@/engine";
import { OptionPicker } from "./OptionPicker";
import { AssetDetail } from "./AssetDetail";
import { Blackjack } from "./games/Blackjack";
import { Heist } from "./games/Heist";
import { Market } from "./games/Market";
import { Roulette } from "./games/Roulette";
import { Slots } from "./games/Slots";
import { Trivia } from "./games/Trivia";

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
  blackjack: Blackjack,
  slots: Slots,
  roulette: Roulette,
  market: Market,
  trivia: Trivia,
  heist: Heist,
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
