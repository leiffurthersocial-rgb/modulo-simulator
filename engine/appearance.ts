import type { Rng } from "./rng";
import {
  EYE_COLORS,
  FACE_SHAPES,
  type AgeBracket,
  type Appearance,
  type FacialHair,
  type Gender,
  type GenderPresentation,
  type HairColor,
  type HairStyle,
  type SkinTone,
  SKIN_TONES,
} from "./types";

export function ageBracket(age: number): AgeBracket {
  if (age < 3) return "baby";
  if (age < 13) return "kid";
  if (age < 18) return "teen";
  if (age < 60) return "adult";
  return "elder";
}

export function presentationFor(gender: Gender): GenderPresentation {
  return gender === "male" ? "masculine" : gender === "female" ? "feminine" : "androgynous";
}

/** Hair styles random generation may give each presentation. Duplicates weight common styles. */
export const HAIR_BY_PRESENTATION: Record<GenderPresentation, readonly HairStyle[]> = {
  masculine: ["short", "short", "mod", "sweptBack", "buzz", "curly", "spiky", "middlePart", "wavy", "afro", "bald"],
  feminine: ["long", "long", "ponytail", "bun", "bob", "curly", "wavy", "braids", "middlePart", "pixie", "afro"],
  androgynous: ["mod", "short", "curly", "bob", "middlePart", "pixie", "wavy", "long", "buzz"],
};

const HAIR_COLOR_WEIGHTS: readonly { value: HairColor; weight: number }[] = [
  { value: "black", weight: 30 },
  { value: "darkBrown", weight: 25 },
  { value: "brown", weight: 20 },
  { value: "lightBrown", weight: 10 },
  { value: "blonde", weight: 8 },
  { value: "platinum", weight: 1 },
  { value: "strawberry", weight: 2 },
  { value: "red", weight: 2 },
  { value: "auburn", weight: 2 },
];

/** Fills in any appearance fields not given. Used for friends and player customization. */
export const APPEARANCE_DEFAULTS: Appearance = {
  skinTone: "light",
  hairStyle: "short",
  hairColor: "brown",
  eyeColor: "brown",
  glasses: "none",
  facialHair: "none",
  faceShape: "oval",
  presentation: "androgynous",
  greysWithAge: true,
};

/**
 * Make an appearance read correctly for a gender: presentation follows gender, women never
 * get facial hair, and hair styles outside the gender's pool are replaced. Applied to every
 * generated NPC so men look like men and women look like women.
 */
export function fitAppearanceToGender(rng: Rng, appearance: Appearance, gender: Gender): Appearance {
  const presentation = presentationFor(gender);
  const pool = HAIR_BY_PRESENTATION[presentation];
  return {
    ...appearance,
    presentation,
    facialHair: presentation === "feminine" ? "none" : appearance.facialHair,
    hairStyle: pool.includes(appearance.hairStyle) ? appearance.hairStyle : rng.pick(pool),
  };
}

export function randomAppearance(rng: Rng, gender: Gender): Appearance {
  const presentation = presentationFor(gender);
  const facialHair: FacialHair =
    presentation === "masculine" && rng.chance(0.3) ? rng.pick(["stubble", "goatee", "beard", "mustache"] as const) : "none";
  return {
    skinTone: rng.pick(SKIN_TONES),
    hairStyle: rng.pick(HAIR_BY_PRESENTATION[presentation]),
    hairColor: rng.weighted(HAIR_COLOR_WEIGHTS) ?? "brown",
    eyeColor: rng.pick(EYE_COLORS),
    glasses: rng.chance(0.2) ? rng.pick(["round", "square"] as const) : "none",
    facialHair,
    faceShape: rng.pick(FACE_SHAPES),
    presentation,
    greysWithAge: rng.chance(0.85),
  };
}

/** Skin tones are ordered light to dark; a child lands between the parents. */
function blendSkin(rng: Rng, a: SkinTone, b: SkinTone): SkinTone {
  const ia = SKIN_TONES.indexOf(a);
  const ib = SKIN_TONES.indexOf(b);
  const lo = Math.min(ia, ib);
  const hi = Math.max(ia, ib);
  return SKIN_TONES[rng.int(lo, hi)] ?? a;
}

/** A child's appearance, inheriting coloring from one or two parents. */
export function inheritAppearance(rng: Rng, gender: Gender, parents: readonly Appearance[]): Appearance {
  const base = randomAppearance(rng, gender);
  const [p1, p2] = parents;
  if (!p1) return base;
  const other = p2 ?? p1;
  return {
    ...base,
    skinTone: blendSkin(rng, p1.skinTone, other.skinTone),
    hairColor: rng.chance(0.85) ? rng.pick([p1.hairColor, other.hairColor]) : base.hairColor,
    eyeColor: rng.chance(0.85) ? rng.pick([p1.eyeColor, other.eyeColor]) : base.eyeColor,
    faceShape: rng.chance(0.6) ? rng.pick([p1.faceShape, other.faceShape]) : base.faceShape,
    // Glasses and facial hair are adult choices; kids start without.
    glasses: "none",
    facialHair: "none",
  };
}
