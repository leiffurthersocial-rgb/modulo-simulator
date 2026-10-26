import { OFFICES, OFFICE_BY_ID, type Office } from "@/data/politics";
import { addLog } from "./log";
import type { Rng } from "./rng";
import { adjustStat } from "./stats";
import type { Country, GameState } from "./types";
import { clamp } from "./util";

export function officeTitle(office: Office, country: Country): string {
  return country.tags.includes("presidential") ? office.title.presidential : office.title.parliamentary;
}

/** Offices the player could run for now (one step above their best, or any lower). */
export function availableOffices(state: GameState): Office[] {
  return OFFICES.filter((o) => o.level <= state.player.highestOfficeLevel + 1);
}

export function campaignBlocked(state: GameState, office: Office, country: Country): string | undefined {
  const { player } = state;
  if (player.age < office.minAge) return `Must be at least ${office.minAge}.`;
  if (player.office && player.office.officeId === office.id) return "You already hold this office.";
  if (player.fame < office.fame) return "Nobody knows who you are yet.";
  if (player.finance.cash < office.cost * country.costIndex) return "You can't fund the campaign.";
  if (player.crime.record.some((r) => r.convicted) && office.level >= 4) return "Your criminal record would sink you.";
  return undefined;
}

/** Odds of winning an election (before the campaign-style choice). */
export function electionOdds(state: GameState, office: Office): number {
  const p = state.player;
  let odds = 0.35 + (p.skills.charisma - 50) / 150 + (p.fame - office.fame) / 200 + p.karma / 400 + (p.stats.smarts - 50) / 400;
  odds -= p.crime.notoriety / 150;
  if (p.office) odds += (p.office.approval - 50) / 200;
  if (state.flags.studentPresident) odds += 0.03;
  return clamp(odds, 0.05, 0.9);
}

export function takeOffice(state: GameState, office: Office, country: Country): void {
  const p = state.player;
  const prevTerms = p.office?.officeId === office.id ? p.office.termsServed : 0;
  p.office = {
    officeId: office.id,
    title: officeTitle(office, country),
    termEndsAtAge: p.age + office.term,
    approval: 55,
    termsServed: prevTerms + 1,
  };
  p.highestOfficeLevel = Math.max(p.highestOfficeLevel, office.level);
  p.fame = clamp(p.fame + office.level * 4);
}

export function officeSalary(state: GameState, country: Country): number {
  const o = state.player.office ? OFFICE_BY_ID[state.player.office.officeId] : undefined;
  return o ? Math.round(o.salary * country.salaryIndex) : 0;
}

/** Yearly politics tick: approval drifts, terms end. */
export function runPoliticsYear(state: GameState, rng: Rng): void {
  const office = state.player.office;
  if (!office) return;
  office.approval = clamp(Math.round(office.approval + rng.normal(-1, 6) + state.player.karma / 50));
  if (state.player.age >= office.termEndsAtAge) {
    state.scheduled.push({ eventId: "politics-term-end", atAge: state.player.age });
  }
  if (office.approval < 15 && rng.chance(0.3)) {
    addLog(state, `With approval at ${office.approval}%, you were forced to resign as ${office.title}.`, "bad");
    state.player.office = undefined;
    adjustStat(state.player, "happiness", -10);
  }
}
