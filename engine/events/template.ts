import { formatMoney, capitalize } from "../util";
import type { EventContext, Npc, Pronouns, TextTemplate } from "../types";

/**
 * Template syntax
 *
 *   {first} {last} {name}         player's first / last / full name
 *   {age} {year} {country}        current age, calendar year, country name
 *   {money:500}                   500 USD-equivalent, scaled by the country's cost index, in local currency
 *   {amount}                      the last cash amount an effect applied (absolute), as money
 *   {school}                      current school / institution name
 *   {mom} {dad}                   parents' first names
 *   {npc} {npc.full}              bound NPC's first / full name
 *   {npc.he} {npc.him} {npc.his}  pronouns ("they"/"them"/"their" for they), plus {npc.He} {npc.His} {npc.Him}
 *   {npc.is} {npc.was} {npc.has}  agreeing verbs ("is"/"are", ...)
 *   {npc.s}                       verb suffix: "{npc.he} like{npc.s}" -> "she likes" / "they like"
 *   {npc.age} {npc.job}           bound NPC's age and occupation
 *   {a|b|c}                       random inline variation
 *   {anyVar}                      any key in ctx.vars
 *
 * Unknown placeholders are left in place so content tests can catch them.
 */

const PRONOUN_FORMS: Record<Pronouns, Record<string, string>> = {
  he: { he: "he", him: "him", his: "his", is: "is", was: "was", has: "has", s: "s", es: "es" },
  she: { he: "she", him: "her", his: "her", is: "is", was: "was", has: "has", s: "s", es: "es" },
  they: { he: "they", him: "them", his: "their", is: "are", was: "were", has: "have", s: "", es: "" },
};

function npcField(npc: Npc, field: string): string | undefined {
  switch (field) {
    case "full":
      return `${npc.firstName} ${npc.lastName}`;
    case "first":
      return npc.firstName;
    case "age":
      return String(npc.age);
    case "job":
      return npc.occupation;
  }
  const forms = PRONOUN_FORMS[npc.pronouns];
  const lower = field.toLowerCase();
  const form = forms[lower];
  if (form === undefined) return undefined;
  return field[0] === field[0]?.toUpperCase() && field !== lower ? capitalize(form) : form;
}

function resolveKey(key: string, ctx: EventContext): string | undefined {
  const { player, country, state } = ctx;
  if (key.includes("|")) return ctx.rng.pick(key.split("|"));
  if (key.startsWith("money:")) {
    const n = Number(key.slice(6));
    return Number.isFinite(n) ? formatMoney(country, n * country.costIndex) : undefined;
  }
  if (key === "npc") return ctx.npc?.firstName;
  if (key.startsWith("npc.")) return ctx.npc ? npcField(ctx.npc, key.slice(4)) : undefined;
  switch (key) {
    case "first":
      return player.firstName;
    case "last":
      return player.lastName;
    case "name":
      return `${player.firstName} ${player.lastName}`;
    case "age":
      return String(player.age);
    case "year":
      return String(state.year);
    case "country":
      return country.name;
    case "school":
      return player.education.enrolled?.institution;
    case "amount": {
      const v = ctx.vars.amount;
      return typeof v === "number" ? formatMoney(country, Math.abs(v)) : undefined;
    }
    case "mom":
    case "dad": {
      const role = key === "mom" ? "mother" : "father";
      return Object.values(state.npcs).find((n) => n.role === role)?.firstName;
    }
  }
  const v = ctx.vars[key];
  return v === undefined ? undefined : String(v);
}

export function fillPlaceholders(text: string, ctx: EventContext): string {
  return text.replace(/\{([^{}]+)\}/g, (match, key: string) => resolveKey(key, ctx) ?? match);
}

export function renderText(template: TextTemplate, ctx: EventContext): string {
  const raw =
    typeof template === "function"
      ? template(ctx)
      : typeof template === "string"
        ? template
        : ctx.rng.pick(template);
  return fillPlaceholders(raw, ctx);
}
