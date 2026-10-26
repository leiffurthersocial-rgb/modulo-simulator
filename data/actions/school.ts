import { CLUBS, CLUB_BY_ID, PROGRAMS, PROGRAM_BY_ID, type Program } from "@/data/education";
import { defineActions, roll } from "@/engine/actionHelpers";
import { admissionChance, dropOut, enrollProgram, isCompulsory, programBlocked, tuitionFor } from "@/engine/education";
import { fx } from "@/engine/events/helpers";
import { applyEffects } from "@/engine/events/effects";
import { adjustSkill, adjustStat } from "@/engine/stats";
import type { ActionOption, EventContext, SchoolLevel } from "@/engine/types";
import { clamp } from "@/engine/util";

const enrolled = (ctx: EventContext) => ctx.player.education.enrolled !== undefined;
const inCompulsory = (ctx: EventContext) => !!ctx.player.education.enrolled && isCompulsory(ctx.player.education.enrolled.level);

function programOptions(ctx: EventContext, levels: readonly SchoolLevel[]): ActionOption[] {
  return PROGRAMS.filter((p) => levels.includes(p.level)).map((p) => {
    const blocked = programBlocked(ctx.state, p);
    const odds = Math.round(admissionChance(ctx.state, p) * 100);
    return {
      id: p.id,
      label: p.name,
      description: blocked ? undefined : `${p.years} years · ${odds}% admission odds`,
      price: tuitionFor(p, ctx.country),
      blocked,
      icon: "GraduationCap",
    };
  });
}

function apply(ctx: EventContext, program: Program | undefined) {
  if (!program) return;
  if (!ctx.rng.chance(admissionChance(ctx.state, program))) {
    adjustStat(ctx.player, "happiness", -4);
    return { title: "Rejected", text: `${program.name} rejected your application. The letter used the word "unfortunately" three times.`, tone: "bad" as const };
  }
  const { scholarship } = enrollProgram(ctx.state, ctx.rng, ctx.country, program);
  adjustStat(ctx.player, "happiness", 8);
  const school = ctx.player.education.enrolled!.institution;
  return {
    title: "Accepted!",
    text: `You were accepted into ${program.name} at ${school}${scholarship ? " on a full scholarship" : ""}.`,
    tone: "major" as const,
  };
}

export const SCHOOL_ACTIONS = defineActions("school", [
  {
    id: "school-study",
    label: "Study harder",
    icon: "BookOpen",
    perYear: 2,
    visible: enrolled,
    run(ctx) {
      const e = ctx.player.education.enrolled!;
      e.performance = clamp(e.performance + ctx.rng.int(4, 10));
      adjustStat(ctx.player, "smarts", ctx.rng.int(1, 3));
      adjustStat(ctx.player, "happiness", -1);
      return { text: ctx.rng.pick(["You hit the books. Your grades improved.", "You studied every night. It showed.", "You made flashcards for everything, including flashcards."]), tone: "good" };
    },
  },
  {
    id: "school-skip",
    label: "Skip class",
    icon: "Ghost",
    perYear: 2,
    visible: (ctx) => enrolled(ctx) && ctx.player.age >= 11,
    run(ctx) {
      const e = ctx.player.education.enrolled!;
      e.performance = clamp(e.performance - ctx.rng.int(3, 8));
      if (inCompulsory(ctx) && !roll(ctx, "streetSmarts", 40)) {
        applyEffects([fx.happy(-3), fx.close(-4, "mother"), fx.inc("detentions")], ctx);
        return { text: "You skipped class and got caught. Detention, plus a phone call home.", tone: "bad" };
      }
      adjustStat(ctx.player, "happiness", ctx.rng.int(2, 5));
      return { text: ctx.rng.pick(["You skipped class and nobody noticed.", "You spent the afternoon at the mall instead of in chemistry.", "You skipped class to sit in a parking lot with friends. It was great."]) };
    },
  },
  {
    id: "school-teacher-help",
    label: "Ask a teacher for help",
    icon: "MessageCircle",
    perYear: 1,
    visible: inCompulsory,
    run(ctx) {
      const e = ctx.player.education.enrolled!;
      if (roll(ctx, "charisma", 25)) {
        e.performance = clamp(e.performance + ctx.rng.int(3, 7));
        return { text: "Your teacher stayed after school to help you. It actually clicked.", tone: "good" };
      }
      return { text: "Your teacher told you to \"re-read the chapter\" and went back to grading." };
    },
  },
  {
    id: "school-class-clown",
    label: "Be the class clown",
    icon: "Smile",
    perYear: 1,
    visible: (ctx) => inCompulsory(ctx) && ctx.player.age >= 7,
    run(ctx) {
      if (roll(ctx, "charisma", 35)) {
        adjustSkill(ctx.player, "charisma", 2);
        adjustStat(ctx.player, "happiness", 4);
        ctx.state.flags.classClown = true;
        return { text: "Your impression of the principal brought the house down. Legend status.", tone: "good" };
      }
      ctx.player.education.enrolled!.performance = clamp(ctx.player.education.enrolled!.performance - 4);
      ctx.state.flags.detentions = Number(ctx.state.flags.detentions ?? 0) + 1;
      return { text: "Nobody laughed. You got detention anyway.", tone: "bad" };
    },
  },
  {
    id: "school-join-club",
    label: "Join a club or team",
    icon: "Users",
    perYear: 1,
    visible: (ctx) => enrolled(ctx) && ctx.player.age >= 8 && ctx.state.flags.club === undefined,
    options: () => CLUBS.map((c) => ({ id: c.id, label: c.name, icon: c.icon })),
    run(ctx, params) {
      const club = CLUB_BY_ID[String(params.option)];
      if (!club) return;
      const tryout = club.skill === "athleticism" ? roll(ctx, "athleticism", 30) : true;
      if (!tryout) return { text: `You tried out for the ${club.name.toLowerCase()} and didn't make the cut.`, tone: "bad" };
      ctx.state.flags.club = club.id;
      ctx.state.flags[`club:${club.id}`] = true;
      return { text: `You joined the ${club.name.toLowerCase()}.`, tone: "good" };
    },
  },
  {
    id: "school-quit-club",
    label: "Quit your club",
    icon: "X",
    visible: (ctx) => typeof ctx.state.flags.club === "string",
    run(ctx) {
      const club = CLUB_BY_ID[String(ctx.state.flags.club)];
      delete ctx.state.flags.club;
      return { text: `You quit the ${club?.name.toLowerCase() ?? "club"}.` };
    },
  },
  {
    id: "school-drop-out",
    label: "Drop out",
    icon: "AlertTriangle",
    visible: (ctx) => enrolled(ctx) && (!inCompulsory(ctx) || (ctx.player.education.enrolled!.level === "high" && ctx.player.age >= 16)),
    run(ctx) {
      dropOut(ctx.state);
      adjustStat(ctx.player, "happiness", 2);
      ctx.state.flags.dropout = true;
      return { text: "You dropped out. Your parents' faces did a thing.", tone: "bad", log: false };
    },
  },
  {
    id: "school-ged",
    label: "Take the GED",
    icon: "GraduationCap",
    perYear: 1,
    visible: (ctx) => ctx.player.age >= 17 && !enrolled(ctx) && ctx.player.education.droppedOut.includes("high") && !ctx.player.education.degrees.some((d) => d.level === "high"),
    run(ctx) {
      if (roll(ctx, "smarts", 35)) {
        ctx.player.education.degrees.push({ level: "high", institution: "GED", graduatedAtAge: ctx.player.age, honors: false });
        return { text: "You passed the GED. High school, technically, complete.", tone: "good" };
      }
      return { text: "You failed the GED. The math section was not your friend.", tone: "bad" };
    },
  },
  {
    id: "school-college",
    group: "Higher education",
    label: "Apply to college",
    description: "Four-year degrees",
    icon: "GraduationCap",
    perYear: 3,
    visible: (ctx) => ctx.player.age >= 17 && !enrolled(ctx),
    options: (ctx) => programOptions(ctx, ["college"]),
    run: (ctx, params) => apply(ctx, PROGRAM_BY_ID[String(params.option)]),
  },
  {
    id: "school-trade",
    group: "Higher education",
    label: "Apply to trade school",
    description: "Two-year vocational programs",
    icon: "Hammer",
    perYear: 3,
    visible: (ctx) => ctx.player.age >= 17 && !enrolled(ctx),
    options: (ctx) => programOptions(ctx, ["trade"]),
    run: (ctx, params) => apply(ctx, PROGRAM_BY_ID[String(params.option)]),
  },
  {
    id: "school-grad",
    group: "Higher education",
    label: "Apply to grad school",
    description: "Master's, medical, law, PhD",
    icon: "BookOpen",
    perYear: 3,
    visible: (ctx) => !enrolled(ctx) && ctx.player.education.degrees.some((d) => d.level === "college"),
    options: (ctx) => programOptions(ctx, ["grad", "medical", "law", "phd"]),
    run: (ctx, params) => apply(ctx, PROGRAM_BY_ID[String(params.option)]),
  },
]);
