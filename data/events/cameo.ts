import { cameoRoleFor, overdueDestinies, spawnFriendNpc } from "@/engine/cameos";
import { defineEvents, fx } from "@/engine/events/helpers";
import type { EventContext, NpcRole } from "@/engine/types";

const INTROS: Partial<Record<NpcRole, string>> = {
  classmate: "A new kid named {npc} joined your class and sat next to you. {npc.He} lent you a pencil and never asked for it back.",
  teammate: "{npc} joined your team this season. You were paired up for drills and got along right away.",
  collegeRoommate: "Your new roommate {npc} moved in with three boxes, a lamp, and excellent taste in music.",
  coworker: "{npc} started at your work this year. You bonded over the terrible coffee machine.",
  boss: "Your new manager, {npc}, turned out to be surprisingly decent.",
  gymBuddy: "{npc}, a regular at your gym, started spotting you on bench press. Now you train together.",
  bandmate: "{npc} answered your ad for a bandmate and showed up with a {guitar|keyboard|kazoo, as a joke, then a real bass}.",
  travelBuddy: "You met {npc} at a hostel and ended up traveling together for two weeks.",
  neighbor: "{npc} moved in next door and came over to borrow a ladder. {npc.He} stayed for dinner.",
  friend: "You met {npc} at a friend's barbecue. You talked until the grill went cold.",
  cellmate: "Your new cellmate, {npc}, seems alright. {npc.He} snores, but {npc.he} shares commissary snacks.",
};

/**
 * Fallback for friend cameos: if a friend is destined to appear and no fitting new-NPC
 * slot has come along, they show up in an ordinary, context-appropriate introduction.
 * Nothing in the text marks them as special.
 */
export const CAMEO_EVENTS = defineEvents("friends", [
  {
    id: "cameo-chance-meeting",
    ages: [5, 120],
    where: "any",
    weight: 4,
    condition: (ctx) => overdueDestinies(ctx.state).length > 0,
    effects: [
      fx.custom((ctx: EventContext) => {
        const destiny = overdueDestinies(ctx.state)[0];
        const friend = destiny && ctx.content.friends.find((f) => f.id === destiny.friendId);
        if (!friend) return;
        const role = cameoRoleFor(ctx.state, friend);
        if (!role) return;
        ctx.npc = spawnFriendNpc(ctx.state, ctx.rng, ctx.country, friend, role, ctx.rng.int(45, 60));
        ctx.vars.cameoRole = role;
      }),
    ],
    text: (ctx) => INTROS[ctx.vars.cameoRole as NpcRole] ?? INTROS.friend!,
    tone: "good",
  },
]);
