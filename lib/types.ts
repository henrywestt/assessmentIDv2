export type Score = number | null;

export interface Metric {
  o: string;                       // objective
  m: string;                       // sub-metric name
  q: string;                       // question
  s: Record<string, Score>;        // score per property
  c: Record<string, string>;       // commentary per property
}

export interface Raw {
  props: string[];
  objOrder: string[];
  metrics: Metric[];
}

export interface Model {
  props: string[];
  objOrder: string[];
  metrics: Metric[];
  roll: Record<string, Record<string, Score>>;  // "Overall Score" + each objective
  scaleMax: number;
  byObj: Record<string, Metric[]>;
}

export const OVERALL = "Overall Score";
