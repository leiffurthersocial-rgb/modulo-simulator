/**
 * Heist timing game: a marker sweeps back and forth; stop it inside the target zone.
 * Pure helpers so the UI and tests agree on the rules.
 */
export interface HeistRound {
  /** Zone start and width, as fractions of the bar (0-1). */
  zoneStart: number;
  zoneWidth: number;
  /** Full sweeps per second. */
  speed: number;
}

export function heistRounds(difficulty: number, rand: () => number): HeistRound[] {
  return [0, 1, 2].map((i) => {
    const zoneWidth = Math.max(0.08, 0.24 - i * 0.05 - difficulty * 0.04);
    return { zoneWidth, zoneStart: rand() * (1 - zoneWidth), speed: 0.6 + i * 0.25 + difficulty * 0.2 };
  });
}

/** Marker position (0-1) after `t` seconds, ping-ponging across the bar. */
export function markerAt(round: HeistRound, t: number): number {
  const phase = (t * round.speed) % 2;
  return phase <= 1 ? phase : 2 - phase;
}

export function hit(round: HeistRound, position: number): boolean {
  return position >= round.zoneStart && position <= round.zoneStart + round.zoneWidth;
}
