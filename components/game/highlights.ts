import type { GameState, Ribbon } from "@/engine";

/** Major moments worth putting on a highlight reel, oldest first. */
export function highlights(state: GameState, limit = 12): { age: number; text: string }[] {
  const out: { age: number; text: string }[] = [];
  for (const year of state.log) {
    for (const e of year.entries) {
      if (e.tone === "major" && !e.text.startsWith("🏆")) out.push({ age: year.age, text: e.text });
    }
  }
  if (out.length <= limit) return out;
  // Keep the first and last, sample evenly in between.
  const step = (out.length - 1) / (limit - 1);
  return Array.from({ length: limit }, (_, i) => out[Math.round(i * step)]!);
}

function escape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function wrap(text: string, max: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > max) {
      lines.push(line.trim());
      line = w;
    } else line += " " + w;
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

/** A 1080x1350 shareable card as SVG markup. `avatarSvg` is the player's avatar markup. */
export function highlightsSvg(state: GameState, ribbon: Ribbon, worth: string, avatarSvg: string, dark: boolean): string {
  const p = state.player;
  const bg = dark ? "#0d0f15" : "#eef0f7";
  const card = dark ? "#181b25" : "#ffffff";
  const fg = dark ? "#eef0f6" : "#16181d";
  const muted = dark ? "#9aa1b2" : "#6b7280";
  const items = highlights(state, 9);
  let y = 560;
  const rows: string[] = [];
  for (const h of items) {
    const lines = wrap(h.text, 52).slice(0, 3);
    rows.push(`<circle cx="110" cy="${y - 10}" r="9" fill="#6d4aff"/><text x="140" y="${y}" font-size="26" font-weight="800" fill="#6d4aff">${h.age}</text>`);
    lines.forEach((l, i) => rows.push(`<text x="210" y="${y + i * 34}" font-size="28" fill="${fg}">${escape(l)}</text>`));
    y += Math.max(1, lines.length) * 34 + 26;
    if (y > 1180) break;
  }
  const avatar = `<svg x="80" y="90" width="220" height="220" viewBox="0 0 220 220">${avatarSvg}</svg>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350" font-family="Inter, -apple-system, Segoe UI, Roboto, sans-serif">
  <rect width="1080" height="1350" fill="${bg}"/>
  <rect x="40" y="40" width="1000" height="1270" rx="48" fill="${card}"/>
  ${avatar}
  <text x="340" y="160" font-size="64" font-weight="900" fill="${fg}">${escape(`${p.firstName} ${p.lastName}`)}</text>
  <text x="340" y="215" font-size="32" fill="${muted}">${p.birthYear} – ${state.year} · Age ${p.age}</text>
  <rect x="340" y="245" rx="22" width="${ribbon.label.length * 20 + 60}" height="56" fill="${ribbon.color}"/>
  <text x="370" y="284" font-size="30" font-weight="800" fill="#ffffff">${escape(ribbon.label)}</text>
  <text x="80" y="390" font-size="28" fill="${muted}">Net worth</text>
  <text x="80" y="440" font-size="44" font-weight="900" fill="${fg}">${escape(worth)}</text>
  <text x="600" y="390" font-size="28" fill="${muted}">Achievements</text>
  <text x="600" y="440" font-size="44" font-weight="900" fill="${fg}">${state.achievements.length}</text>
  <text x="80" y="510" font-size="30" font-weight="800" fill="${fg}">Highlights</text>
  ${rows.join("\n  ")}
  <text x="80" y="1270" font-size="30" font-weight="900" fill="#6d4aff">% Modulo Simulator</text>
  <text x="1000" y="1270" font-size="24" text-anchor="end" fill="${muted}">Life, mod N.</text>
</svg>`;
}

/** Render SVG markup to a PNG blob via canvas. */
export async function svgToPng(svg: string, width = 1080, height = 1350): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Could not render image"));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Export failed"))), "image/png"));
  } finally {
    URL.revokeObjectURL(url);
  }
}
