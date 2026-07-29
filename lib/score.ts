import { Score } from "./types";

export const fmt = (v: Score): string =>
  v == null ? "\u2013" : (Math.round(v * 10) / 10).toFixed(1);

// First word of the objective, used as a compact label.
export const shortLabel = (o: string): string =>
  (String(o).trim().split(/\s+/).filter((x) => x !== "&")[0] || o).replace(/[^A-Za-z0-9]/g, "");

// Diverging warm-to-cool ramp, normalised to the scale so any 0..N framework works.
const RAMP: [number, string][] = [
  [0, "#B96B2C"],
  [0.25, "#D9A96B"],
  [0.5, "#EDE9DC"],
  [0.75, "#4F9A8E"],
  [1, "#0E6E68"],
];

function h2r(h: string): [number, number, number] {
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}
function mix(a: string, b: string, t: number): string {
  const A = h2r(a), B = h2r(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",")})`;
}
function lum(rgb: string): number {
  const m = (rgb.match(/\d+/g) || ["0", "0", "0"]).map(Number);
  const s = m.map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
}

export interface Swatch { bg: string; fg: string; }

export function scoreColor(v: Score, scaleMax: number): Swatch {
  if (v == null) return { bg: "#F1F0EB", fg: "#A8A79F" };
  const f = Math.max(0, Math.min(1, v / scaleMax));
  let i = 0;
  while (i < RAMP.length - 1 && f > RAMP[i + 1][0]) i++;
  const t = (f - RAMP[i][0]) / (RAMP[i + 1][0] - RAMP[i][0] || 1);
  const bg = mix(RAMP[i][1], RAMP[i + 1][1], t);
  return { bg, fg: lum(bg) > 0.6 ? "#1A1B1E" : "#FFFFFF" };
}

// Text colour for a score shown as plain text (not on a filled cell).
export function scoreInk(v: Score, scaleMax: number): string {
  const { bg } = scoreColor(v, scaleMax);
  return lum(bg) < 0.55 ? bg : "var(--ink)";
}
