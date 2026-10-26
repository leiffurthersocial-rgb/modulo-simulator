import type { SchoolLevel, SkillKey, StatKey } from "@/engine/types";

export type Field = "stem" | "health" | "business" | "humanities" | "arts" | "social" | "trade";

export interface Program {
  id: string;
  level: SchoolLevel;
  name: string;
  field: Field;
  years: number;
  /** Yearly tuition, US baseline (scaled by country cost index). */
  tuition: number;
  /** Smarts at which admission is a coin flip. */
  minSmarts: number;
  /** Degree you must already hold. */
  requires?: SchoolLevel;
  /** Fields of a prior college degree that qualify (medical school wants science). */
  requiresField?: readonly Field[];
}

const college = (id: string, name: string, field: Field, minSmarts: number): Program => ({
  id,
  level: "college",
  name,
  field,
  years: 4,
  tuition: 24_000,
  minSmarts,
  requires: "high",
});
const trade = (id: string, name: string): Program => ({ id, level: "trade", name, field: "trade", years: 2, tuition: 7_000, minSmarts: 20, requires: "high" });

export const PROGRAMS: readonly Program[] = [
  college("cs", "Computer Science", "stem", 62),
  college("engineering", "Engineering", "stem", 66),
  college("math", "Mathematics", "stem", 70),
  college("physics", "Physics", "stem", 74),
  college("chemistry", "Chemistry", "stem", 64),
  college("biology", "Biology", "health", 58),
  college("nursing", "Nursing", "health", 50),
  college("kinesiology", "Kinesiology", "health", 40),
  college("business", "Business", "business", 45),
  college("economics", "Economics", "business", 56),
  college("finance", "Finance", "business", 55),
  college("accounting", "Accounting", "business", 50),
  college("marketing", "Marketing", "business", 40),
  college("psychology", "Psychology", "social", 46),
  college("polisci", "Political Science", "social", 48),
  college("criminal-justice", "Criminal Justice", "social", 36),
  college("education", "Education", "social", 40),
  college("communications", "Communications", "humanities", 36),
  college("journalism", "Journalism", "humanities", 42),
  college("english", "English Literature", "humanities", 44),
  college("history", "History", "humanities", 44),
  college("philosophy", "Philosophy", "humanities", 50),
  college("architecture", "Architecture", "arts", 58),
  college("fine-arts", "Fine Arts", "arts", 30),
  college("music", "Music", "arts", 32),
  college("film", "Film Studies", "arts", 36),
  college("theater", "Theater", "arts", 30),
  trade("electrician", "Electrician Program"),
  trade("plumbing", "Plumbing Program"),
  trade("welding", "Welding Program"),
  trade("carpentry", "Carpentry Program"),
  trade("auto", "Auto Mechanics Program"),
  trade("hvac", "HVAC Program"),
  trade("cosmetology", "Cosmetology Program"),
  trade("culinary", "Culinary Arts Program"),
  { id: "mba", level: "grad", name: "MBA", field: "business", years: 2, tuition: 55_000, minSmarts: 58, requires: "college" },
  { id: "ms-cs", level: "grad", name: "Master's in Computer Science", field: "stem", years: 2, tuition: 35_000, minSmarts: 68, requires: "college", requiresField: ["stem"] },
  { id: "med-ed", level: "grad", name: "Master's in Education", field: "social", years: 2, tuition: 22_000, minSmarts: 45, requires: "college" },
  { id: "msw", level: "grad", name: "Master's in Social Work", field: "social", years: 2, tuition: 24_000, minSmarts: 45, requires: "college" },
  { id: "mfa", level: "grad", name: "Master of Fine Arts", field: "arts", years: 2, tuition: 30_000, minSmarts: 40, requires: "college" },
  { id: "medicine", level: "medical", name: "Medical School", field: "health", years: 4, tuition: 50_000, minSmarts: 78, requires: "college", requiresField: ["health", "stem"] },
  { id: "law", level: "law", name: "Law School", field: "social", years: 3, tuition: 48_000, minSmarts: 66, requires: "college" },
  { id: "phd-science", level: "phd", name: "PhD in the Sciences", field: "stem", years: 5, tuition: 0, minSmarts: 78, requires: "college", requiresField: ["stem", "health"] },
  { id: "phd-humanities", level: "phd", name: "PhD in the Humanities", field: "humanities", years: 6, tuition: 0, minSmarts: 72, requires: "college", requiresField: ["humanities", "social", "arts"] },
];

export const PROGRAM_BY_ID: Readonly<Record<string, Program>> = Object.fromEntries(PROGRAMS.map((p) => [p.id, p]));

export interface Club {
  id: string;
  name: string;
  skill: SkillKey | StatKey;
  icon: string;
}

export const CLUBS: readonly Club[] = [
  { id: "soccer", name: "Soccer team", skill: "athleticism", icon: "Target" },
  { id: "basketball", name: "Basketball team", skill: "athleticism", icon: "Target" },
  { id: "swim", name: "Swim team", skill: "athleticism", icon: "Zap" },
  { id: "track", name: "Track team", skill: "athleticism", icon: "Zap" },
  { id: "band", name: "School band", skill: "creativity", icon: "Music" },
  { id: "choir", name: "Choir", skill: "creativity", icon: "Mic" },
  { id: "drama", name: "Drama club", skill: "charisma", icon: "Film" },
  { id: "debate", name: "Debate team", skill: "charisma", icon: "MessageCircle" },
  { id: "chess", name: "Chess club", skill: "smarts", icon: "Brain" },
  { id: "robotics", name: "Robotics club", skill: "smarts", icon: "Laptop" },
  { id: "art", name: "Art club", skill: "creativity", icon: "Palette" },
  { id: "council", name: "Student council", skill: "charisma", icon: "Landmark" },
  { id: "yearbook", name: "Yearbook", skill: "creativity", icon: "Camera" },
];

export const CLUB_BY_ID: Readonly<Record<string, Club>> = Object.fromEntries(CLUBS.map((c) => [c.id, c]));
