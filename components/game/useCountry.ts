import { DEFAULT_CONTENT } from "@/data";
import { countryOf, formatMoney, type GameState } from "@/engine";

export function useMoney(state: GameState) {
  const country = countryOf(DEFAULT_CONTENT, state.player.countryId);
  return (usd: number) => formatMoney(country, usd);
}
