"use client";

import { useId } from "react";
import { ageBracket } from "@/engine/appearance";
import type { AgeBracket, Appearance, FaceShape, HairColor } from "@/engine/types";
import { HAIR_LAYERS } from "./hair";
import { BACKDROPS, EYES, HAIR, SHIRTS, SKIN, hashIndex, shade } from "./palette";

export interface AvatarProps {
  appearance: Appearance;
  age: number;
  /** Stable key (person id) used to pick shirt and backdrop colors. */
  colorKey?: string;
  size?: number;
  dead?: boolean;
  className?: string;
  title?: string;
}

const JAW: Record<FaceShape, number> = { oval: 0.55, round: 0.72, square: 0.8, heart: 0.38, long: 0.55 };

function headPath(w: number, h: number, jaw: number, cy: number): string {
  const j = w * jaw;
  return [
    `M ${50 - w} ${cy}`,
    `C ${50 - w} ${cy - h * 0.55} ${50 - w * 0.55} ${cy - h} 50 ${cy - h}`,
    `C ${50 + w * 0.55} ${cy - h} ${50 + w} ${cy - h * 0.55} ${50 + w} ${cy}`,
    `C ${50 + w} ${cy + h * 0.45} ${50 + j} ${cy + h * 0.88} 50 ${cy + h}`,
    `C ${50 - j} ${cy + h * 0.88} ${50 - w} ${cy + h * 0.45} ${50 - w} ${cy}`,
    "Z",
  ].join(" ");
}

/** Hair greys with age for people who grey; light hair goes white sooner. */
function agedHair(color: HairColor, age: number, greys: boolean): string {
  if (!greys || age < 55) return HAIR[color];
  if (age >= 72) return HAIR.white;
  return color === "blonde" || color === "platinum" ? HAIR.white : HAIR.grey;
}

interface FaceLayout {
  eyeY: number;
  eyeGap: number;
  eyeRx: number;
  eyeRy: number;
  browY: number;
  mouthY: number;
  noseY: number;
}

const LAYOUT: Record<AgeBracket, FaceLayout> = {
  baby: { eyeY: 53, eyeGap: 8.5, eyeRx: 3.6, eyeRy: 3.3, browY: 47, mouthY: 63, noseY: 57.5 },
  kid: { eyeY: 51, eyeGap: 8.8, eyeRx: 3.5, eyeRy: 2.9, browY: 45.5, mouthY: 63, noseY: 56.5 },
  teen: { eyeY: 49.5, eyeGap: 9, eyeRx: 3.3, eyeRy: 2.5, browY: 44.3, mouthY: 63, noseY: 55.5 },
  adult: { eyeY: 49, eyeGap: 9, eyeRx: 3.2, eyeRy: 2.4, browY: 44, mouthY: 63, noseY: 55.5 },
  elder: { eyeY: 49, eyeGap: 9, eyeRx: 3.1, eyeRy: 2.1, browY: 44, mouthY: 63.5, noseY: 56 },
};

export function Avatar({ appearance: a, age, colorKey = "x", size = 48, dead, className, title }: AvatarProps) {
  const clipId = useId();
  const bracket = ageBracket(age);
  const L = LAYOUT[bracket];
  const masculine = a.presentation === "masculine";
  const feminine = a.presentation === "feminine";
  const skin = SKIN[a.skinTone];
  const skinShadow = shade(skin, -0.14);
  const hair = agedHair(a.hairColor, age, a.greysWithAge);
  const texture = shade(hair, hair === HAIR.white || hair === HAIR.platinum ? -0.18 : -0.32);
  const shirt = SHIRTS[hashIndex(colorKey, SHIRTS.length)]!;
  const backdrop = BACKDROPS[hashIndex(colorKey + "bg", BACKDROPS.length)]!;
  const small = bracket === "baby" || bracket === "kid";
  const jaw = Math.min(0.9, JAW[a.faceShape] + (masculine && !small ? 0.08 : 0) - (feminine ? 0.05 : 0));
  const headH = a.faceShape === "long" ? 27 : a.faceShape === "round" ? 23.5 : 25;
  const headW = bracket === "baby" ? 23 : a.faceShape === "round" ? 22.5 : 21;
  const layers = bracket === "baby" ? undefined : HAIR_LAYERS[a.hairStyle];
  const showFacialHair = !small && bracket !== "teen" ? a.facialHair : bracket === "teen" && age >= 16 && a.facialHair === "stubble" ? "stubble" : "none";
  const brow = shade(hair === HAIR.white ? HAIR.grey : hair, -0.15);
  const lx = 50 - L.eyeGap;
  const rx = 50 + L.eyeGap;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      style={dead ? { filter: "grayscale(1)", opacity: 0.75 } : undefined}
      role="img"
      aria-label={title ?? "Avatar"}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="50" cy="50" r="50" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width="100" height="100" fill={backdrop} />
        {layers?.back?.(hair, masculine)}
        {/* neck and shoulders */}
        <rect x={small ? 44.5 : 43.5} y={66} width={small ? 11 : 13} height={18} fill={skinShadow} />
        <path
          d={small ? "M24 100 C24 89 35 84 50 84 C65 84 76 89 76 100 Z" : "M15 100 C15 87 30 81 50 81 C70 81 85 87 85 100 Z"}
          fill={shirt}
        />
        <path d={small ? "M44 84.3 L50 90 L56 84.3" : "M43 81.3 L50 89 L57 81.3"} fill={skinShadow} />
        {/* ears */}
        <ellipse cx={50 - headW + 0.3} cy={51} rx={3.2} ry={5} fill={skinShadow} />
        <ellipse cx={50 + headW - 0.3} cy={51} rx={3.2} ry={5} fill={skinShadow} />
        <path d={headPath(headW, headH, jaw, 48)} fill={skin} />
        {/* cheeks */}
        {(small || feminine) && (
          <>
            <circle cx={lx - 2} cy={L.eyeY + 8} r={3.2} fill="#ff8a8a" opacity={small ? 0.28 : 0.16} />
            <circle cx={rx + 2} cy={L.eyeY + 8} r={3.2} fill="#ff8a8a" opacity={small ? 0.28 : 0.16} />
          </>
        )}
        {/* elder lines */}
        {bracket === "elder" && (
          <path
            d={`M40 35 Q50 33 60 35 M42 38.5 Q50 37 58 38.5 M37 58 Q36 62 38.5 66 M63 58 Q64 62 61.5 66 M${lx - 3} ${L.eyeY + 3.6} Q${lx} ${L.eyeY + 5} ${lx + 3} ${L.eyeY + 3.6} M${rx - 3} ${L.eyeY + 3.6} Q${rx} ${L.eyeY + 5} ${rx + 3} ${L.eyeY + 3.6}`}
            stroke={shade(skin, -0.25)}
            strokeWidth="0.7"
            fill="none"
            strokeLinecap="round"
          />
        )}
        {/* eyes */}
        {[lx, rx].map((x) => (
          <g key={x}>
            <ellipse cx={x} cy={L.eyeY} rx={L.eyeRx} ry={L.eyeRy} fill="#ffffff" />
            <circle cx={x} cy={L.eyeY + 0.2} r={L.eyeRy * 0.82} fill={EYES[a.eyeColor]} />
            <circle cx={x} cy={L.eyeY + 0.2} r={L.eyeRy * 0.4} fill="#141414" />
            <circle cx={x + 0.7} cy={L.eyeY - 0.6} r={0.55} fill="#ffffff" />
          </g>
        ))}
        {feminine && !small && (
          <path
            d={`M${lx - L.eyeRx + 0.3} ${L.eyeY - 1.2} l-1.5 -1.3 M${lx - L.eyeRx + 1.6} ${L.eyeY - 2} l-1.1 -1.5 M${rx + L.eyeRx - 0.3} ${L.eyeY - 1.2} l1.5 -1.3 M${rx + L.eyeRx - 1.6} ${L.eyeY - 2} l1.1 -1.5`}
            stroke="#1b1b1b"
            strokeWidth="0.7"
            strokeLinecap="round"
          />
        )}
        {/* brows */}
        {bracket !== "baby" && (
          <path
            d={
              masculine
                ? `M${lx - 4} ${L.browY + 0.4} Q${lx} ${L.browY - 1.2} ${lx + 4} ${L.browY} M${rx - 4} ${L.browY} Q${rx} ${L.browY - 1.2} ${rx + 4} ${L.browY + 0.4}`
                : `M${lx - 3.8} ${L.browY + 0.6} Q${lx - 0.5} ${L.browY - 2} ${lx + 3.6} ${L.browY} M${rx - 3.6} ${L.browY} Q${rx + 0.5} ${L.browY - 2} ${rx + 3.8} ${L.browY + 0.6}`
            }
            stroke={brow}
            strokeWidth={masculine ? 1.7 : 1.05}
            fill="none"
            strokeLinecap="round"
          />
        )}
        {/* nose */}
        <path d={`M50 ${L.noseY - 4} Q48.2 ${L.noseY} 50.6 ${L.noseY + 0.8}`} stroke={shade(skin, -0.28)} strokeWidth="0.9" fill="none" strokeLinecap="round" />
        {/* facial hair */}
        {showFacialHair === "stubble" && (
          <path d="M30 55 C31 66 38 73.5 50 74.5 C62 73.5 69 66 70 55 C66 61 61 60 57 60.5 C54 60 52 59.6 50 59.6 C48 59.6 46 60 43 60.5 C39 60 34 61 30 55 Z" fill={hair} opacity={0.3} />
        )}
        {showFacialHair === "beard" && (
          <path d="M29 51 C29 66 37 77 50 78 C63 77 71 66 71 51 C69 57 66 59.5 61 60.5 C57 61 54 59.5 50 59.5 C46 59.5 43 61 39 60.5 C34 59.5 31 57 29 51 Z" fill={hair} />
        )}
        {(showFacialHair === "goatee" || showFacialHair === "beard" || showFacialHair === "mustache") && (
          <path d="M43.5 61.2 C46 58.8 49 59.3 50 60.2 C51 59.3 54 58.8 56.5 61.2 C54 61.6 52 61.8 50 62 C48 61.8 46 61.6 43.5 61.2 Z" fill={hair} />
        )}
        {showFacialHair === "goatee" && (
          <path d="M44.5 65 C44.5 70 46.5 73.3 50 73.8 C53.5 73.3 55.5 70 55.5 65 C53.5 66.6 52 67 50 67 C48 67 46.5 66.6 44.5 65 Z" fill={hair} />
        )}
        {/* mouth */}
        {feminine && !small ? (
          <path d={`M45.5 ${L.mouthY - 0.4} Q50 ${L.mouthY - 1.8} 54.5 ${L.mouthY - 0.4} Q50 ${L.mouthY + 3.2} 45.5 ${L.mouthY - 0.4} Z`} fill="#c45e66" />
        ) : (
          <path
            d={bracket === "baby" ? `M47.5 ${L.mouthY} Q50 ${L.mouthY + 2} 52.5 ${L.mouthY}` : `M45.5 ${L.mouthY - 0.5} Q50 ${L.mouthY + 2.8} 54.5 ${L.mouthY - 0.5}`}
            stroke={shade(skin, -0.45)}
            strokeWidth="1.1"
            fill="none"
            strokeLinecap="round"
          />
        )}
        {/* glasses */}
        {a.glasses !== "none" && bracket !== "baby" && (
          <g stroke="#202020" strokeWidth="1.1" fill="#ffffff" fillOpacity={0.12}>
            {a.glasses === "round" ? (
              <>
                <circle cx={lx} cy={L.eyeY} r={5.4} />
                <circle cx={rx} cy={L.eyeY} r={5.4} />
              </>
            ) : (
              <>
                <rect x={lx - 5.8} y={L.eyeY - 4.2} width={11.6} height={8.4} rx={1.8} />
                <rect x={rx - 5.8} y={L.eyeY - 4.2} width={11.6} height={8.4} rx={1.8} />
              </>
            )}
            <path d={`M${lx + 5.3} ${L.eyeY - 0.5} Q50 ${L.eyeY - 2} ${rx - 5.3} ${L.eyeY - 0.5}`} fill="none" />
            <path d={`M${lx - 5.6} ${L.eyeY - 0.8} L${50 - headW} ${L.eyeY - 1.6} M${rx + 5.6} ${L.eyeY - 0.8} L${50 + headW} ${L.eyeY - 1.6}`} fill="none" />
          </g>
        )}
        {/* hair front */}
        {bracket === "baby" ? (
          a.hairStyle !== "bald" && (
            <path d="M45 26 Q49 18 52 25 Q54 20 57 26" stroke={hair} strokeWidth="1.8" fill="none" strokeLinecap="round" />
          )
        ) : (
          layers?.front?.(hair, texture, masculine)
        )}
      </g>
    </svg>
  );
}
