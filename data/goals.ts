import { netWorth } from "@/engine/finance";
import type { GameState } from "@/engine/types";

export interface GoalDef {
  id: string;
  title: string;
  description: string;
  /** Only assign once the player is at least this old. */
  assignFrom?: number;
  check: (s: GameState, costIndex: number) => boolean;
}

const has = (s: GameState, role: string) => Object.values(s.npcs).some((n) => n.role === role);
const flagNum = (s: GameState, k: string) => Number(s.flags[k] ?? 0);

export const GOALS: readonly GoalDef[] = [
  { id: "millionaire", title: "Become a millionaire", description: "Reach a net worth of a million.", check: (s, ci) => netWorth(s) >= 1_000_000 * ci },
  { id: "marry", title: "Get married", description: "Find someone and make it official.", check: (s) => flagNum(s, "marriages") > 0 },
  { id: "parent", title: "Have a child", description: "Become a parent, by birth or adoption.", check: (s) => has(s, "child") },
  { id: "grandparent", title: "Become a grandparent", description: "Live to see your grandchildren.", check: (s) => has(s, "grandchild") },
  { id: "college", title: "Earn a college degree", description: "Graduate from university.", check: (s) => s.player.education.degrees.some((d) => d.level === "college") },
  { id: "doctorate", title: "Become a doctor of something", description: "Finish medical school, law school, or a PhD.", assignFrom: 16, check: (s) => s.player.education.degrees.some((d) => d.level === "phd" || d.level === "medical" || d.level === "law") },
  { id: "travel", title: "See the world", description: "Take vacations to five places.", check: (s) => flagNum(s, "countriesVisited") >= 5 },
  { id: "homeowner", title: "Own a home", description: "Buy your own place.", check: (s) => s.player.assets.some((a) => a.kind === "house") },
  { id: "famous", title: "Become famous", description: "Reach 60% fame.", check: (s) => s.player.fame >= 60 },
  { id: "marathon", title: "Run a marathon", description: "Finish 26.2 miles.", assignFrom: 14, check: (s) => s.achievements.includes("marathoner") },
  { id: "ninety", title: "Live to 90", description: "Stick around.", check: (s) => s.player.age >= 90 },
  { id: "language", title: "Learn a language", description: "Become conversational in another language.", check: (s) => flagNum(s, "languages") >= 1 },
  { id: "business", title: "Start a business", description: "Be your own boss.", check: (s) => s.flags.founder === true },
  { id: "debt-free", title: "Be debt-free", description: "Pay off a debt and owe nothing.", assignFrom: 18, check: (s) => s.flags.debtFree === true },
  { id: "volunteer", title: "Give back", description: "Volunteer for five years.", check: (s) => flagNum(s, "volunteerYears") >= 5 },
  { id: "top-job", title: "Reach the top", description: "Hit the highest rank in any career.", assignFrom: 16, check: (s) => s.flags.topOfCareer === true },
  { id: "book", title: "Write a book", description: "Publish something with your name on it.", check: (s) => s.flags.publishedBook === true },
  { id: "office", title: "Hold public office", description: "Win an election.", assignFrom: 16, check: (s) => s.player.highestOfficeLevel >= 1 },
  { id: "pet", title: "Adopt a pet", description: "Give an animal a home.", check: (s) => s.player.assets.some((a) => a.kind === "pet") },
  { id: "black-belt", title: "Earn a black belt", description: "Train in martial arts until you master it.", check: (s) => flagNum(s, "beltRank") >= 7 },
  { id: "followers", title: "Go viral", description: "Reach 100,000 followers.", check: (s) => s.player.followers >= 100_000 },
  { id: "early-retire", title: "Retire early", description: "Retire before 55.", assignFrom: 18, check: (s) => typeof s.flags.retiredAt === "number" && (s.flags.retiredAt as number) < 55 },
  { id: "clean", title: "Keep your nose clean", description: "Reach 60 without a single arrest.", check: (s) => s.player.age >= 60 && s.player.crime.record.length === 0 },
  { id: "best-friend", title: "Friends for life", description: "Have a best friend you're 90% close with.", check: (s) => Object.values(s.npcs).some((n) => n.role === "bestFriend" && n.alive && n.closeness >= 90) },
  { id: "dream-car", title: "Buy your dream car", description: "Own a sports car or a supercar.", check: (s) => s.player.assets.some((a) => a.catalogId === "sports-car" || a.catalogId === "supercar") },
  { id: "musician", title: "Play an instrument well", description: "Reach 70% creativity.", check: (s) => s.player.skills.creativity >= 70 },
  { id: "fit", title: "Get in peak shape", description: "Reach 80% athleticism.", check: (s) => s.player.skills.athleticism >= 80 },
  { id: "genius", title: "Be the smartest in the room", description: "Reach 95% smarts.", check: (s) => s.player.stats.smarts >= 95 },
  { id: "saint", title: "Be a good person", description: "Reach 60 karma.", check: (s) => s.player.karma >= 60 },
  { id: "happy", title: "Find happiness", description: "Hit 95% happiness as an adult.", assignFrom: 18, check: (s) => s.player.age >= 18 && s.player.stats.happiness >= 95 },
];

export const GOAL_BY_ID: Readonly<Record<string, GoalDef>> = Object.fromEntries(GOALS.map((g) => [g.id, g]));
