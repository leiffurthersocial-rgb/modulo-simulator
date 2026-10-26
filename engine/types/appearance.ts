/** Parameters for the procedural layered SVG avatar. Age is not stored here: it is passed at render time. */

export const SKIN_TONES = ["porcelain", "fair", "light", "medium", "olive", "tan", "brown", "darkBrown", "deep"] as const;
export type SkinTone = (typeof SKIN_TONES)[number];

export const HAIR_STYLES = [
  "mod", // textured fringe, mid length
  "short",
  "curly",
  "middlePart",
  "sweptBack", // short sides, longer textured top swept back with a side part
  "buzz",
  "long",
  "bald",
  "bun",
  "ponytail",
  "bob",
  "afro",
  "braids",
  "spiky",
  "wavy",
  "pixie",
] as const;
export type HairStyle = (typeof HAIR_STYLES)[number];

export const HAIR_COLORS = [
  "black",
  "darkBrown",
  "brown",
  "lightBrown",
  "blonde",
  "platinum",
  "strawberry",
  "red",
  "auburn",
  "grey",
  "white",
] as const;
export type HairColor = (typeof HAIR_COLORS)[number];

export const EYE_COLORS = ["darkBrown", "brown", "hazel", "amber", "green", "blue", "grey"] as const;
export type EyeColor = (typeof EYE_COLORS)[number];

export const GLASSES = ["none", "round", "square"] as const;
export type Glasses = (typeof GLASSES)[number];

export const FACIAL_HAIR = ["none", "stubble", "goatee", "beard", "mustache"] as const;
export type FacialHair = (typeof FACIAL_HAIR)[number];

export const FACE_SHAPES = ["oval", "round", "square", "heart", "long"] as const;
export type FaceShape = (typeof FACE_SHAPES)[number];

export type GenderPresentation = "masculine" | "feminine" | "androgynous";

export interface Appearance {
  skinTone: SkinTone;
  hairStyle: HairStyle;
  hairColor: HairColor;
  eyeColor: EyeColor;
  glasses: Glasses;
  facialHair: FacialHair;
  faceShape: FaceShape;
  presentation: GenderPresentation;
  /** Whether this person greys with age (some people dye, some go bald instead). */
  greysWithAge: boolean;
}

/** Age bracket the avatar renderer uses to pick face proportions. */
export type AgeBracket = "baby" | "kid" | "teen" | "adult" | "elder";
