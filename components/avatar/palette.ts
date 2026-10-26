import type { EyeColor, HairColor, SkinTone } from "@/engine/types";

export const SKIN: Record<SkinTone, string> = {
  porcelain: "#f9e4d4",
  fair: "#f3d3b8",
  light: "#eac4a0",
  medium: "#d9a77c",
  olive: "#c8996a",
  tan: "#b97f55",
  brown: "#8d5a3b",
  darkBrown: "#6b4128",
  deep: "#4a2c1c",
};

export const HAIR: Record<HairColor, string> = {
  black: "#1f1b1b",
  darkBrown: "#3b2619",
  brown: "#6a4429",
  lightBrown: "#8f6844",
  blonde: "#dcbb72",
  platinum: "#ece2c8",
  strawberry: "#d0905f",
  red: "#a8401f",
  auburn: "#7f3420",
  grey: "#a9a9a9",
  white: "#e8e8e8",
};

export const EYES: Record<EyeColor, string> = {
  darkBrown: "#3a2314",
  brown: "#6a3f1f",
  hazel: "#8a6d33",
  amber: "#b07a21",
  green: "#4d8a4a",
  blue: "#3f7fc4",
  grey: "#8a96a1",
};

export const SHIRTS = ["#6d4aff", "#ff5d73", "#ffb020", "#22b07d", "#2f9bff", "#ff7a3d", "#8e5cf7", "#14b8a6", "#e04f9c", "#475569"];
export const BACKDROPS = ["#e9e4ff", "#ffe3e8", "#fff1d6", "#dcf5ea", "#dceeff", "#ffe6da", "#efe3ff", "#d8f6f2", "#fde1ef", "#e5e9f0"];

/** Darken (amt < 0) or lighten (amt > 0) a hex color. */
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c + (amt < 0 ? c * amt : (255 - c) * amt))));
  const r = f((n >> 16) & 255);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

/** Stable small hash for picking decorative colors from an id. */
export function hashIndex(key: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return Math.abs(h) % mod;
}
