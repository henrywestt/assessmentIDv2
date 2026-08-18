import { Model, OVERALL } from "./types";
import { sortedProps } from "./parse";
import { fmt } from "./score";

export interface Insight {
  id: string;
  heading: string;
  body: string;
  colour: string;
}

export interface ColourOption {
  token: string;
  label: string;
}

// Token names reference existing CSS custom properties in globals.css.
// "default" means no accent — inherit the plain card look.
export const COLOUR_OPTIONS: ColourOption[] = [
  { token: "default", label: "Default" },
  { token: "teal-deep", label: "Teal" },
  { token: "amber", label: "Amber" },
  { token: "brand-yellow", label: "Yellow" },
  { token: "ink", label: "Ink" },
];

export function colourVar(token: string): string | undefined {
  return token && token !== "default" ? `var(--${token})` : undefined;
}

export function makeInsightId(): string {
  return `ins-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function defaultInsights(model: Model): Insight[] {
  const par = model.scaleMax / 2;

  const ranked = sortedProps(model, OVERALL);
  const top = ranked[0];
  const topScore = model.roll[OVERALL][top];

  const objAvg = model.objOrder.map((o) => {
    const vs = model.props.map((p) => model.roll[o][p]).filter((v): v is number => typeof v === "number");
    return { o, avg: vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : null };
  });
  const withVals = objAvg.filter((x) => x.avg != null) as { o: string; avg: number }[];
  const strongestObj = withVals.slice().sort((a, b) => b.avg - a.avg)[0];
  const weakestObj = withVals.slice().sort((a, b) => a.avg - b.avg)[0];

  const scored = model.props.map((p) => model.roll[OVERALL][p]).filter((v): v is number => typeof v === "number");
  const abovePar = scored.filter((v) => v > par).length;

  return [
    {
      id: "top",
      heading: "Top ranked",
      body: `**${top}** is highest overall at ${fmt(topScore)} out of ${model.scaleMax}.`,
      colour: "default",
    },
    {
      id: "strength",
      heading: "Portfolio strength",
      body: strongestObj
        ? `**${strongestObj.o}** is the strongest objective, averaging ${fmt(strongestObj.avg)} across the portfolio.`
        : "No objective data available.",
      colour: "default",
    },
    {
      id: "gap",
      heading: "Biggest gap",
      body: weakestObj
        ? `**${weakestObj.o}** is the weakest objective, averaging ${fmt(weakestObj.avg)}. The clearest place to focus.`
        : "No objective data available.",
      colour: "default",
    },
    {
      id: "benchmark",
      heading: "Above benchmark",
      body: `**${abovePar} of ${model.props.length}** properties score above par (${fmt(par)}) overall.`,
      colour: "default",
    },
  ];
}

// Resolves whatever is stored in a snapshot into the array Overview renders.
//
// - An array (even []) means the staff used the new editor — its exact
//   contents, including "none", are the deliberate final state and must be
//   respected as-is (this is what lets a staff member reduce to zero
//   insights and have the section actually hide for the client).
// - Anything else — undefined, null, or the old per-card override map from
//   the previous editor ({ top?, strength?, gap?, benchmark? }) — has no real
//   insights array and falls back to freshly computed defaults, carrying
//   forward any legacy body overrides so earlier edits aren't lost.
export function resolveInsights(stored: unknown, model: Model): Insight[] {
  if (Array.isArray(stored)) return stored as Insight[];

  const defaults = defaultInsights(model);
  if (stored && typeof stored === "object") {
    const legacy = stored as Record<string, unknown>;
    return defaults.map((d) => {
      const override = legacy[d.id];
      return typeof override === "string" && override.trim() ? { ...d, body: override } : d;
    });
  }
  return defaults;
}
