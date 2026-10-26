import type { Player, SkillKey, StatKey } from "./types";
import { clamp } from "./util";

export function adjustStat(player: Player, stat: StatKey, delta: number): void {
  player.stats[stat] = clamp(Math.round(player.stats[stat] + delta));
}

export function adjustSkill(player: Player, skill: SkillKey, delta: number): void {
  player.skills[skill] = clamp(Math.round(player.skills[skill] + delta));
}

export function adjustKarma(player: Player, delta: number): void {
  player.karma = clamp(Math.round(player.karma + delta), -100, 100);
}
