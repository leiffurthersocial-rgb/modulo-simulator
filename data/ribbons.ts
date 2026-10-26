import { netWorth } from "@/engine/finance";
import type { GameState } from "@/engine/types";

export interface RibbonDef {
  id: string;
  /** Label; a function lets it adapt to gender ("Family Man" / "Family Woman"). */
  label: string | ((s: GameState) => string);
  description: string;
  color: string;
  /** Higher wins when choosing the headline ribbon. */
  priority: number;
  check: (s: GameState, costIndex: number) => boolean;
}

const n = (s: GameState, k: string) => Number(s.flags[k] ?? 0);
const count = (s: GameState, role: string) => Object.values(s.npcs).filter((x) => x.role === role).length;
const gendered = (m: string, f: string, x: string) => (s: GameState) => (s.player.gender === "male" ? m : s.player.gender === "female" ? f : x);

export const RIBBONS: readonly RibbonDef[] = [
  { id: "villain", label: "Villain", description: "Left the world worse than they found it.", color: "#7f1d1d", priority: 95, check: (s) => n(s, "murders") >= 1 || s.player.karma <= -70 },
  { id: "kingpin", label: "Kingpin", description: "Ran a criminal empire.", color: "#1f2937", priority: 92, check: (s) => n(s, "mafiaRank") >= 4 },
  { id: "leader", label: "Head of State", description: "Led the nation.", color: "#1d4ed8", priority: 91, check: (s) => s.player.highestOfficeLevel >= 6 },
  { id: "tycoon", label: "Tycoon", description: "Built an enormous fortune.", color: "#a16207", priority: 90, check: (s, ci) => netWorth(s) >= 50_000_000 * ci },
  { id: "famous", label: "Famous", description: "A household name.", color: "#db2777", priority: 85, check: (s) => s.player.fame >= 70 },
  { id: "wealthy", label: "Wealthy", description: "Died rich.", color: "#ca8a04", priority: 80, check: (s, ci) => netWorth(s) >= 2_000_000 * ci },
  { id: "criminal", label: "Criminal", description: "Spent real time on the wrong side of the law.", color: "#374151", priority: 78, check: (s) => s.player.crime.record.filter((r) => r.convicted).length >= 2 || n(s, "crimesCommitted") >= 10 },
  { id: "scandalous", label: "Scandalous", description: "Never boring, rarely proper.", color: "#be123c", priority: 75, check: (s) => s.flags.scandalous === true || n(s, "cheated") >= 2 || n(s, "divorces") >= 2 },
  { id: "hero", label: "Hero", description: "A genuinely good person.", color: "#16a34a", priority: 74, check: (s) => s.player.karma >= 70 },
  { id: "politician", label: "Politician", description: "A life in public service.", color: "#2563eb", priority: 72, check: (s) => s.player.highestOfficeLevel >= 2 },
  { id: "mogul", label: "Mogul", description: "Built a business empire.", color: "#9333ea", priority: 70, check: (s) => s.flags.founder === true && (s.flags.soldForMillions === true || (s.player.business?.value ?? 0) > 1_000_000) },
  { id: "athlete", label: "Athlete", description: "Lived for the game.", color: "#ea580c", priority: 68, check: (s) => s.player.career.history.some((h) => h.careerId === "athlete") || s.player.career.job?.careerId === "athlete" },
  { id: "academic", label: "Academic", description: "Never stopped learning.", color: "#0f766e", priority: 66, check: (s) => s.player.education.degrees.some((d) => d.level === "phd" || d.level === "medical" || d.level === "law") },
  { id: "family", label: gendered("Family Man", "Family Woman", "Family Person"), description: "Built a big, loving family.", color: "#e11d48", priority: 64, check: (s) => count(s, "child") >= 3 && n(s, "marriages") >= 1 },
  { id: "lover", label: "Lover", description: "Loved often, and loudly.", color: "#f43f5e", priority: 62, check: (s) => n(s, "marriages") >= 3 },
  { id: "party", label: "Party Animal", description: "The life of every party.", color: "#7c3aed", priority: 60, check: (s) => (s.player.health.addictions.alcohol ?? 0) >= 50 || (s.player.health.addictions.drugs ?? 0) >= 50 },
  { id: "globetrotter", label: "Globetrotter", description: "Saw the world.", color: "#0284c7", priority: 58, check: (s) => n(s, "countriesVisited") >= 10 || n(s, "emigrated") >= 2 },
  { id: "genius", label: "Genius", description: "The smartest person in most rooms.", color: "#2563eb", priority: 56, check: (s) => s.player.stats.smarts >= 90 },
  { id: "elder", label: "Elder", description: "Outlived almost everyone.", color: "#64748b", priority: 54, check: (s) => s.player.age >= 95 },
  { id: "rich-kid", label: "Rich Kid", description: "Born on third base.", color: "#eab308", priority: 50, check: (s) => s.player.familyWealth === "rich" && s.player.career.history.length === 0 && !s.player.career.job },
  { id: "lazy", label: "Lazy", description: "Took it easy. Very easy.", color: "#a8a29e", priority: 48, check: (s) => s.player.age >= 30 && s.player.career.history.length === 0 && !s.player.career.job && !s.player.business },
  { id: "lonely", label: "Lonely", description: "Kept to themselves.", color: "#94a3b8", priority: 46, check: (s) => s.player.age >= 30 && !Object.values(s.npcs).some((x) => x.alive && x.inContact && x.closeness >= 50) },
  { id: "average", label: "Ordinary", description: "A quiet, ordinary life. Most are.", color: "#6b7280", priority: 0, check: () => true },
];
