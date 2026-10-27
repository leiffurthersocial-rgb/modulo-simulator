import type { GameState } from "@/engine/types";
import type { AchievementDef } from "./achievements";

const a = (id: string, name: string, description: string, icon: string, check?: AchievementDef["check"], secret = false): AchievementDef => ({ id, name, description, icon, check, secret });

const n = (s: GameState, k: string) => Number(s.flags[k] ?? 0);
const held = (s: GameState, careerId: string) => s.player.career.job?.careerId === careerId || s.player.career.history.some((h) => h.careerId === careerId);
const distinctCareers = (s: GameState) => new Set([...s.player.career.history.map((h) => h.careerId), ...(s.player.career.job ? [s.player.career.job.careerId] : [])]).size;
const approachesTried = (s: GameState) => Object.keys(s.flags).filter((k) => k.startsWith("scn:")).length;
const done = (s: GameState, pursuit: string) => n(s, `pursuit:${pursuit}:done`) >= 1;

/** Achievements for the scenario, pursuit and extra-career content. */
export const MORE_ACHIEVEMENTS: readonly AchievementDef[] = [
  // ------------------------------------------------------------ choices
  a("decider", "Decisions, Decisions", "Make 10 choices of your own.", "Compass", (s) => n(s, "scenariosRun") >= 10),
  a("adventurer", "Adventurer", "Make 50 choices of your own.", "Compass", (s) => n(s, "scenariosRun") >= 50),
  a("seasoned", "Seasoned Traveller", "Make 150 choices of your own.", "Map", (s) => n(s, "scenariosRun") >= 150),
  a("life-explorer", "Life Explorer", "Make 400 choices of your own.", "Globe", (s) => n(s, "scenariosRun") >= 400),
  a("roads-not-taken", "Roads Not Taken", "Try 30 different approaches to things.", "Shuffle", (s) => approachesTried(s) >= 30),
  a("every-door", "Every Door", "Try 100 different approaches to things.", "Key", (s) => approachesTried(s) >= 100),
  // ------------------------------------------------------------ pursuits
  a("novelist", "Novelist", "Finish writing a novel.", "BookOpen", (s) => done(s, "novel")),
  a("record-made", "Gold-ish Record", "Record an album.", "Music", (s) => done(s, "album")),
  a("gearhead", "Gearhead", "Restore a classic car.", "Car", (s) => done(s, "restore-car")),
  a("fluent", "Fluent", "Become fluent in another language.", "Languages", (s) => done(s, "language")),
  a("virtuoso", "Virtuoso", "Master an instrument.", "Music", (s) => done(s, "instrument")),
  a("side-founder", "Side-Project Founder", "Finish a side project.", "Rocket", (s) => done(s, "startup-idea")),
  a("self-taught", "Self-Taught", "Teach yourself a skill.", "GraduationCap", (s) => done(s, "degree-online")),
  a("green-thumb", "Green Thumb", "Grow a prize garden.", "Leaf", (s) => done(s, "garden-allotment")),
  a("auteur", "Auteur", "Make a short film.", "Film", (s) => done(s, "film")),
  a("transformed", "Transformed", "Complete a total body transformation.", "Dumbbell", (s) => done(s, "fitness-transform")),
  a("on-air", "On Air", "Start a podcast and see it through.", "Mic", (s) => done(s, "podcast")),
  a("project-person", "Project Person", "Finish five long-term projects.", "Check", (s) => Object.keys(s.flags).filter((k) => k.startsWith("pursuit:") && k.endsWith(":done")).length >= 5),
  a("renaissance", "Renaissance Person", "Finish ten long-term projects.", "Crown", (s) => Object.keys(s.flags).filter((k) => k.startsWith("pursuit:") && k.endsWith(":done")).length >= 10),
  // ------------------------------------------------------------ careers
  a("jack-of-trades", "Jack of All Trades", "Hold ten different careers.", "Shuffle", (s) => distinctCareers(s) >= 10),
  a("renaissance-resume", "Renaissance Résumé", "Hold fifteen different careers.", "Shuffle", (s) => distinctCareers(s) >= 15),
  a("rocket-scientist", "Rocket Scientist", "Become an astronaut.", "Rocket", (s) => held(s, "astronaut")),
  a("dj-set", "Dropped the Beat", "Work as a DJ.", "Music", (s) => held(s, "dj")),
  a("action", "And... Action!", "Direct a film.", "Clapperboard", (s) => held(s, "film-director")),
  a("celeb-chef", "Celebrity Chef", "Become a celebrity chef.", "Utensils", (s) => held(s, "chef-tv")),
  a("pro-gamer", "Pro Gamer", "Go pro in esports.", "Gamepad2", (s) => held(s, "game-streamer-pro")),
  a("striker", "Star Striker", "Play professional football.", "Trophy", (s) => held(s, "soccer-pro")),
  a("contender", "Contender", "Box professionally.", "Swords", (s) => held(s, "boxer")),
  a("tour-pro", "On Tour", "Play professional golf.", "Flag", (s) => held(s, "golfer")),
  a("ambassador", "Your Excellency", "Become a diplomat.", "Globe", (s) => held(s, "diplomat")),
  a("lineman-tough", "Lineman Tough", "Work as a power lineman.", "Zap", (s) => held(s, "lineman")),
  a("deep-diver", "Deep Diver", "Work as a commercial diver.", "Waves", (s) => held(s, "diver")),
  a("big-top", "Big Top", "Join the circus.", "Tent", (s) => held(s, "circus")),
  a("tricks", "Pick a Card", "Become a stage magician.", "Wand", (s) => held(s, "magician")),
  a("creator", "Content Creator", "Make a living as a video creator.", "Video", (s) => held(s, "youtuber")),
  a("quant", "Quant", "Work as a stock trader.", "TrendingUp", (s) => held(s, "trader")),
  a("tattooist", "Inked", "Become a tattoo artist.", "Palette", (s) => held(s, "tattoo")),
  a("animal-magic", "Animal Magic", "Work as a zookeeper.", "PawPrint", (s) => held(s, "zookeeper")),
  a("tower-control", "Cleared for Landing", "Become an air traffic controller.", "Plane", (s) => held(s, "flight-dispatcher")),
  // ------------------------------------------------------------ the unexpected
  a("wallet-karma", "Good Samaritan", "Return a stranger's wallet and see it come back around.", "HandHeart", (s) => s.flags["wallet-job"] === true),
  a("leverage", "Insurance Policy", "Keep a copy of something you weren't meant to see.", "Eye", (s) => s.flags["have-leverage"] === true, true),
  a("bent", "Bent", "Take a bribe as a police officer.", "Shield", (s) => s.flags["bent-cop"] === true, true),
  a("good-neighbor", "Good Neighbour", "Rescue someone you were feuding with.", "Home", undefined),
];
