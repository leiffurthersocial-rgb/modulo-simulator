import type { HairStyle } from "@/engine/types";

/**
 * Hair is drawn in two layers around a fixed head (center 50,48; ~42 wide, ~50 tall):
 * `back` sits behind the head (only what sticks out past the face shows), `front`
 * sits over the forehead. Coordinates are in the avatar's 100x100 viewBox.
 */
interface HairLayers {
  back?: (color: string) => React.ReactNode;
  front?: (color: string, texture: string) => React.ReactNode;
}

const sleekCap = "M28 46 C27 30 37 20 50 20 C63 20 73 30 72 46 C70 38 64 32 50 31 C36 32 30 38 28 46 Z";
const longFront = "M27 56 C25 32 36 18 50 18 C64 18 75 32 73 56 C71.5 47 69 40 65 35.5 C58 33 47 34 39 38 C33.5 41 30 47 28.5 56 Z";

function circlesOnArc(cx: number, cy: number, radius: number, from: number, to: number, step: number, r: number, color: string) {
  const out: React.ReactNode[] = [];
  for (let a = from; a <= to; a += step) {
    const rad = (a * Math.PI) / 180;
    const x = Math.round((cx + radius * Math.cos(rad)) * 100) / 100;
    const y = Math.round((cy + radius * Math.sin(rad)) * 100) / 100;
    out.push(<circle key={a} cx={x} cy={y} r={r} fill={color} />);
  }
  return out;
}

export const HAIR_LAYERS: Record<HairStyle, HairLayers> = {
  short: {
    front: (c, t) => (
      <>
        <path d="M28 47 C27 31 36 20 50 20 C64 20 73 31 72 47 C71 41 69 37 66 35 C60 32 54 33 50 32 C45 33 39 33 34 35 C31 37 29 41 28 47 Z" fill={c} />
        <path d="M42 24 Q45 28 44 32 M54 23 Q57 27 57 32" stroke={t} strokeWidth="0.8" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  buzz: {
    front: (c) => (
      <path d="M29.5 42 C30 29 39 22.5 50 22.5 C61 22.5 70 29 70.5 42 C68 36 63 32.5 50 32.5 C37 32.5 32 36 29.5 42 Z" fill={c} opacity={0.6} />
    ),
  },
  mod: {
    back: (c) => <path d="M26 58 C25 40 28 28 36 22 L64 22 C72 28 75 40 74 58 C72 60 71 60 70 58 L30 58 C29 60 28 60 26 58 Z" fill={c} />,
    front: (c, t) => (
      <>
        <path
          d="M27.5 52 C26 32 36 18.5 50 18.5 C64 18.5 74 32 72.5 52 C71.5 46 70.5 42 68.5 40 L66 43 L63 39.5 L60 42.5 L57 39 L54 42 L51 38.5 L48 42 L45 38.5 L42 42 L39 39 L36 42.5 L33.5 39.5 L31.5 43 C30 46 29 49 27.5 52 Z"
          fill={c}
        />
        <path d="M38 23 Q36 31 37.5 38 M45 21 Q44 30 45.5 37 M52 21 Q53 29 52 36 M59 22 Q61 30 60 37 M65 25 Q67 32 66 39" stroke={t} strokeWidth="0.8" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  sweptBack: {
    front: (c, t) => (
      <>
        <path
          d="M29 46 C28.5 38 30 31 33 27 C36 22 42 18.5 49 17.5 C57 16.5 65 18.5 69 23 C72 27 72 36 71 46 C70 40 68.5 36 66 33.5 C61 30 55 29.5 49 30 C46 30.3 43.5 30.8 41.5 31.5 L40 28 C37 31 33 35 31 40 Z"
          fill={c}
        />
        <path d="M43.5 30 Q50 21.5 63 21 M47.5 29.5 Q56 23.5 67.5 26 M41.5 28 Q44 20.5 53 18.6 M51 29.6 Q60 26 69 30" stroke={t} strokeWidth="0.8" fill="none" strokeLinecap="round" />
        <path d="M40.3 28.5 L37.2 22.5" stroke={t} strokeWidth="0.9" strokeLinecap="round" />
      </>
    ),
  },
  middlePart: {
    back: (c) => <path d="M25 62 C24 38 32 19 50 19 C68 19 76 38 75 62 C72 64 69 63 68 60 L32 60 C31 63 28 64 25 62 Z" fill={c} />,
    front: (c, t) => (
      <>
        <path
          d="M27 60 C25 34 36 19.5 50 19.5 C64 19.5 75 34 73 60 C71.5 60 70.5 59 70 57 C70 47 67 38 60 32 C56 29 52.5 27.5 50 25.5 C47.5 27.5 44 29 40 32 C33 38 30 47 30 57 C29.5 59 28.5 60 27 60 Z"
          fill={c}
        />
        <path d="M50 21 L50 25.5 M44 27 Q36 34 33 46 M56 27 Q64 34 67 46" stroke={t} strokeWidth="0.8" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  curly: {
    front: (c) => (
      <>
        <path d="M27 50 C26 30 37 19 50 19 C63 19 74 30 73 50 C70 40 64 35 50 35 C36 35 30 40 27 50 Z" fill={c} />
        {circlesOnArc(50, 40, 21, 160, 380, 20, 6.4, c)}
        {[35, 42, 50, 58, 65].map((x) => (
          <circle key={x} cx={x} cy={34.5} r={4.3} fill={c} />
        ))}
      </>
    ),
  },
  afro: {
    back: (c) => <circle cx={50} cy={40} r={31} fill={c} />,
    front: (c) => (
      <>
        <path d="M27 48 C26 30 37 20 50 20 C63 20 74 30 73 48 C70 39 63 34.5 50 34.5 C37 34.5 30 39 27 48 Z" fill={c} />
        {[34, 41, 48, 55, 62, 67].map((x) => (
          <circle key={x} cx={x} cy={33.5} r={4} fill={c} />
        ))}
      </>
    ),
  },
  long: {
    back: (c) => <path d="M23 50 C21 28 34 16 50 16 C66 16 79 28 77 50 L80 88 C72 92 66 90 63 86 L37 86 C34 90 28 92 20 88 Z" fill={c} />,
    front: (c, t) => (
      <>
        <path d={longFront} fill={c} />
        <path d="M40 23 Q52 26 62 34" stroke={t} strokeWidth="0.8" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  bob: {
    back: (c) => <path d="M24 50 C22 28 35 17 50 17 C65 17 78 28 76 50 L77 70 C70 73 66 72 64 69 L36 69 C34 72 30 73 23 70 Z" fill={c} />,
    front: (c) => <path d="M27 58 C25 32 36 18 50 18 C64 18 75 32 73 58 C72 52 71 46 69.5 41 L30.5 41 C29 46 28 52 27 58 Z" fill={c} />,
  },
  ponytail: {
    back: (c) => (
      <>
        <path d="M58 22 C70 20 80 28 79 42 C78 54 74 62 70 70 C72 58 72 48 68 40 C66 34 62 30 58 28 Z" fill={c} />
      </>
    ),
    front: (c, t) => (
      <>
        <path d={sleekCap} fill={c} />
        <circle cx={63} cy={24.5} r={2.4} fill={t} />
      </>
    ),
  },
  bun: {
    back: (c) => <circle cx={50} cy={16} r={9.5} fill={c} />,
    front: (c, t) => (
      <>
        <path d={sleekCap} fill={c} />
        <path d="M43 22 Q50 24 57 22" stroke={t} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  braids: {
    back: (c) => (
      <>
        {[56, 63.5, 71, 78.5, 86].map((y) => (
          <g key={y}>
            <ellipse cx={29} cy={y} rx={4} ry={4.6} fill={c} />
            <ellipse cx={71} cy={y} rx={4} ry={4.6} fill={c} />
          </g>
        ))}
      </>
    ),
    front: (c, t) => (
      <>
        <path d="M28 48 C27 30 37 20 50 20 C63 20 73 30 72 48 C70 38 62 31 50 30.5 C38 31 30 38 28 48 Z" fill={c} />
        <path d="M50 20.5 L50 30.5" stroke={t} strokeWidth="0.9" />
      </>
    ),
  },
  spiky: {
    front: (c) => (
      <path d="M28 46 C28 36 31 30 34 27 L33 19 L39 24 L41 15 L46 22 L50 13 L54 22 L59 15 L61 24 L67 19 L66 27 C69 30 72 36 72 46 C70 39 66 34 60 33 C54 32 46 32 40 33 C34 34 30 39 28 46 Z" fill={c} />
    ),
  },
  wavy: {
    back: (c) => (
      <path d="M24 50 C22 28 35 17 50 17 C65 17 78 28 76 50 L78 74 Q74.5 79 71 74 Q67.5 79 64 74 L36 74 Q32.5 79 29 74 Q25.5 79 22 74 Z" fill={c} />
    ),
    front: (c, t) => (
      <>
        <path d={longFront} fill={c} />
        <path d="M33 44 Q31 50 33 56 M67 42 Q69 49 67 56" stroke={t} strokeWidth="0.8" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  pixie: {
    front: (c, t) => (
      <>
        <path d="M28 50 C26 31 36 19 50 19 C64 19 74 31 72 46 C70 40 67 36 62 34 C55 33 46 35 40 39 C35 42 31 46 28 50 Z" fill={c} />
        <path d="M44 24 Q50 30 58 31" stroke={t} strokeWidth="0.8" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  bald: {
    front: () => <ellipse cx={42} cy={28} rx={5} ry={2.2} fill="#ffffff" opacity={0.18} />,
  },
};
