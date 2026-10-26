import type { Content } from "./content";
import { makeContext } from "./events/context";
import { renderText } from "./events/template";
import { addLog } from "./log";
import { postProcess } from "./postProcess";
import type { Rng } from "./rng";
import { Rng as RngClass } from "./rng";
import type { ActionParams, EventContext, GameAction, GameState, Notice } from "./types";

export function findAction(content: Content, id: string): GameAction | undefined {
  return content.actions.find((a) => a.id === id);
}

export interface ActionView {
  action: GameAction;
  label: string;
  description?: string;
  /** Why it can't be used right now, if it can't. */
  blocked?: string;
  cost?: number;
}

function usesLeft(action: GameAction, state: GameState): number {
  if (action.perYear === undefined) return Infinity;
  return action.perYear - (state.actionsThisYear[action.id] ?? 0);
}

function blockedReason(action: GameAction, ctx: EventContext, params: ActionParams): string | undefined {
  if (ctx.state.status !== "alive") return "You're dead.";
  if (ctx.state.pending.length > 0) return "Deal with what's in front of you first.";
  if (usesLeft(action, ctx.state) <= 0) return action.perYear === 1 ? "Already done this year." : "Done enough for this year.";
  return action.blocked?.(ctx, params);
}

/** The actions the UI should show for a section, with labels and availability resolved. */
export function listActions(
  state: GameState,
  content: Content,
  section: GameAction["section"],
  params: ActionParams = {},
): ActionView[] {
  const npc = typeof params.npcId === "string" ? state.npcs[params.npcId] : undefined;
  const ctx = makeContext(state, new RngClass(state.rngState), content, npc, { ...params });
  return content.actions
    .filter((a) => a.section === section && (!a.visible || a.visible(ctx)))
    .map((a) => {
      const cost = a.cost === undefined ? undefined : typeof a.cost === "function" ? a.cost(ctx) : a.cost;
      return {
        action: a,
        label: renderText(a.label, ctx),
        description: a.description ? renderText(a.description, ctx) : undefined,
        blocked: blockedReason(a, ctx, params),
        cost: cost === undefined ? undefined : Math.round(cost * ctx.country.costIndex),
      };
    });
}

export function pushNotice(state: GameState, rng: Rng, notice: Omit<Notice, "id">): void {
  state.notices.push({ ...notice, id: rng.id("ntc_") });
}

/** Perform an action. Pure: returns a new state (unchanged if the action is unavailable). */
export function performAction(prev: GameState, content: Content, actionId: string, params: ActionParams = {}): GameState {
  const action = findAction(content, actionId);
  if (!action) throw new Error(`Unknown action "${actionId}"`);
  const state = structuredClone(prev);
  const rng = new RngClass(state.rngState);
  const npc = typeof params.npcId === "string" ? state.npcs[params.npcId] : undefined;
  const ctx = makeContext(state, rng, content, npc, { ...params });
  if ((action.visible && !action.visible(ctx)) || blockedReason(action, ctx, params)) return prev;

  state.actionsThisYear[action.id] = (state.actionsThisYear[action.id] ?? 0) + 1;
  const result = action.run(ctx, params);
  if (result && state.status === "alive") {
    const text = renderText(result.text, ctx);
    if (result.log !== false) addLog(state, text, result.tone ?? "neutral");
    pushNotice(state, rng, { title: result.title, text, tone: result.tone ?? "neutral", npcId: ctx.npc?.id });
  }
  postProcess(state, rng, content);
  state.rngState = rng.state;
  return state;
}

export function dismissNotice(prev: GameState, id: string): GameState {
  return { ...prev, notices: prev.notices.filter((n) => n.id !== id) };
}
