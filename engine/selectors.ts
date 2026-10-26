import { LEVEL_LABEL } from "./education";
import type { GameState, Npc, NpcRole } from "./types";

/** One-line status under the player's name. */
export function statusLabel(state: GameState): string {
  const { player } = state;
  if (state.status === "dead") return "Deceased";
  if (player.crime.prison) return `Inmate, ${player.crime.prison.facility}`;
  if (player.office) return player.office.title;
  if (player.career.job) return player.career.job.title;
  const school = player.education.enrolled;
  if (school) return school.major ? `${school.major} student` : `Student, ${LEVEL_LABEL[school.level]}`;
  if (player.business) return `Founder, ${player.business.name}`;
  if (player.age < 3) return "Baby";
  if (player.age < 6) return "Toddler";
  if (player.career.retired) return "Retired";
  if (player.age < 18) return "Kid";
  return "Unemployed";
}

export const ROLE_LABELS: Record<NpcRole, string> = {
  mother: "Mother",
  father: "Father",
  stepparent: "Stepparent",
  sibling: "Sibling",
  halfSibling: "Half-sibling",
  grandparent: "Grandparent",
  child: "Child",
  grandchild: "Grandchild",
  spouse: "Spouse",
  partner: "Partner",
  fiance: "Fiancé(e)",
  ex: "Ex",
  date: "Date",
  affair: "Affair",
  friend: "Friend",
  bestFriend: "Best friend",
  acquaintance: "Acquaintance",
  classmate: "Classmate",
  teacher: "Teacher",
  collegeRoommate: "College roommate",
  roommate: "Roommate",
  neighbor: "Neighbor",
  coworker: "Coworker",
  boss: "Boss",
  employee: "Employee",
  gymBuddy: "Gym buddy",
  bandmate: "Bandmate",
  teammate: "Teammate",
  cellmate: "Cellmate",
  rival: "Rival",
  nemesis: "Nemesis",
  travelBuddy: "Travel buddy",
  therapist: "Therapist",
  lawyer: "Lawyer",
  stranger: "Stranger",
};

/** Gendered family labels read better ("Brother" not "Sibling"). */
export function roleLabel(npc: Npc): string {
  const g = npc.gender;
  const pick = (m: string, f: string, n: string) => (g === "male" ? m : g === "female" ? f : n);
  switch (npc.role) {
    case "sibling":
      return pick("Brother", "Sister", "Sibling");
    case "halfSibling":
      return pick("Half-brother", "Half-sister", "Half-sibling");
    case "child":
      return pick("Son", "Daughter", "Child");
    case "grandchild":
      return pick("Grandson", "Granddaughter", "Grandchild");
    case "grandparent":
      return pick("Grandfather", "Grandmother", "Grandparent");
    case "spouse":
      return pick("Husband", "Wife", "Spouse");
    case "partner":
      return pick("Boyfriend", "Girlfriend", "Partner");
    case "stepparent":
      return pick("Stepfather", "Stepmother", "Stepparent");
    default:
      return ROLE_LABELS[npc.role];
  }
}

export type PeopleGroup = "Family" | "Love" | "Friends" | "Work & School" | "Others" | "In memory" | "Lost touch";

const GROUP_OF: Partial<Record<NpcRole, PeopleGroup>> = {
  mother: "Family",
  father: "Family",
  stepparent: "Family",
  sibling: "Family",
  halfSibling: "Family",
  grandparent: "Family",
  child: "Family",
  grandchild: "Family",
  spouse: "Love",
  partner: "Love",
  fiance: "Love",
  date: "Love",
  affair: "Love",
  friend: "Friends",
  bestFriend: "Friends",
  gymBuddy: "Friends",
  bandmate: "Friends",
  teammate: "Friends",
  travelBuddy: "Friends",
  classmate: "Work & School",
  teacher: "Work & School",
  collegeRoommate: "Work & School",
  coworker: "Work & School",
  boss: "Work & School",
  employee: "Work & School",
};

export function peopleGroups(state: GameState): { group: PeopleGroup; people: Npc[] }[] {
  const order: PeopleGroup[] = ["Love", "Family", "Friends", "Work & School", "Others", "Lost touch", "In memory"];
  const buckets = new Map<PeopleGroup, Npc[]>(order.map((g) => [g, []]));
  for (const npc of Object.values(state.npcs)) {
    if (npc.tags.includes("oneOff")) continue;
    const group: PeopleGroup = !npc.alive ? "In memory" : !npc.inContact ? "Lost touch" : (GROUP_OF[npc.role] ?? "Others");
    buckets.get(group)!.push(npc);
  }
  return order
    .map((group) => ({ group, people: buckets.get(group)!.sort((a, b) => b.closeness - a.closeness) }))
    .filter((g) => g.people.length > 0);
}
