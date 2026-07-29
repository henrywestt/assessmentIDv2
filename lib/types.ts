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

// User-facing label for each scored entity. The workbook calls these "properties";
// change this one value to relabel every column header, picker, and count.
export const ENTITY = "AssessmentID";
export const ENTITY_PLURAL = "AssessmentIDs";

export interface Band {
  score: Score;
  label: string;   // the benchmark description for this band
}

export interface BenchItem {
  o: string;       // objective
  m: string;       // sub-metric
  q: string;       // question
  bands: Band[];
}

export interface Benchmarks {
  objOrder: string[];
  items: BenchItem[];
}
