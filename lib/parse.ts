import * as XLSX from "xlsx";
import { Raw, Model, Metric, Score, OVERALL } from "./types";

// Thrown with a list of human-readable reasons the file didn't match the template.
export class TemplateError extends Error {
  reasons: string[];
  constructor(reasons: string[]) {
    super(reasons.join(" "));
    this.name = "TemplateError";
    this.reasons = reasons;
  }
}

type Grid = (string | number | boolean | null)[][];

// Reads the workbook by structure, not by content, so any client framework that
// follows the template parses the same way. Never trusts the sheet's own rollups.
export function parseWorkbook(wb: XLSX.WorkBook): Raw {
  const rx = /^\s*Property\s*:/i;

  // Assessment sheet = the one with the most "Property:" cells.
  let best: { A: Grid } | null = null;
  let bestCount = -1;
  for (const name of wb.SheetNames) {
    const A = XLSX.utils.sheet_to_json<Grid[number]>(wb.Sheets[name], {
      header: 1,
      raw: true,
      defval: null,
    }) as Grid;
    let count = 0;
    for (const row of A) for (const cell of row || []) {
      if (typeof cell === "string" && rx.test(cell)) count++;
    }
    if (count > bestCount) { bestCount = count; best = { A }; }
  }
  if (!best || bestCount <= 0) {
    throw new TemplateError(["No sheet with \u201cProperty:\u201d columns was found."]);
  }
  const A = best.A;

  let propRow = -1;
  A.forEach((r, i) => {
    if (r && r.some((x) => typeof x === "string" && rx.test(x))) propRow = i;
  });

  let labelRow = -1, objCol = -1, subCol = -1, qCol = -1;
  for (let i = 0; i < A.length; i++) {
    const r = A[i] || [];
    const s = r.findIndex((x) => typeof x === "string" && /sub[-\s]?metric/i.test(x));
    if (s > -1) {
      labelRow = i;
      subCol = s;
      objCol = r.findIndex((x) => typeof x === "string" && /objective/i.test(x));
      qCol = r.findIndex((x) => typeof x === "string" && /question/i.test(x));
      break;
    }
  }

  const errs: string[] = [];
  if (labelRow < 0 || subCol < 0) errs.push("Couldn\u2019t find a \u201cSub-Metric\u201d header column.");
  if (propRow < 0) errs.push("Couldn\u2019t find the \u201cProperty:\u201d header row.");
  if (errs.length) throw new TemplateError(errs);
  if (objCol < 0) objCol = Math.max(0, subCol - 1);

  const lab = A[labelRow] || [];
  const blocks: { name: string; sc: number; cm: number }[] = [];
  (A[propRow] || []).forEach((c, ci) => {
    if (typeof c === "string" && rx.test(c)) {
      const nm = c.replace(rx, "").trim();
      let sc = -1, cm = -1;
      for (let k = ci; k < ci + 6 && k < lab.length; k++) {
        const L = lab[k];
        if (typeof L !== "string") continue;
        if (/score/i.test(L) && sc < 0) sc = k;
        else if (/comment/i.test(L) && cm < 0) cm = k;
      }
      if (sc < 0) sc = ci + 1;
      if (cm < 0) cm = ci + 2;
      if (nm && !/^insert$/i.test(nm)) blocks.push({ name: nm, sc, cm });
    }
  });
  if (!blocks.length) {
    throw new TemplateError(["Found the header row but no named properties (all blank or \u201cINSERT\u201d)."]);
  }

  const metrics: Metric[] = [];
  let curObj: string | null = null;
  for (let i = labelRow + 1; i < A.length; i++) {
    const r = A[i] || [];
    const o = r[objCol];
    if (o != null && String(o).trim() !== "") curObj = String(o).trim();
    const sub = r[subCol];
    if (sub == null || String(sub).trim() === "") continue;
    const mName = String(sub).trim();
    if (/^overall score$/i.test(mName)) continue;

    const s: Record<string, Score> = {};
    const cc: Record<string, string> = {};
    blocks.forEach((b) => {
      const raw = r[b.sc];
      let v: Score = null;
      if (typeof raw === "number") v = raw;
      else if (raw != null && raw !== "" && !isNaN(parseFloat(String(raw)))) v = parseFloat(String(raw));
      s[b.name] = v;
      const x = r[b.cm];
      cc[b.name] = x != null ? String(x).trim() : "";
    });
    metrics.push({
      o: curObj || "Ungrouped",
      m: mName,
      q: qCol > -1 && r[qCol] != null ? String(r[qCol]).trim() : "",
      s,
      c: cc,
    });
  }
  if (!metrics.length) {
    throw new TemplateError(["Found properties but no metric rows under them."]);
  }

  const objOrder: string[] = [];
  metrics.forEach((m) => { if (!objOrder.includes(m.o)) objOrder.push(m.o); });

  return { props: blocks.map((b) => b.name), objOrder, metrics };
}

// Recomputes every rollup from raw scores with one explicit rule:
// category = mean of its metrics, overall = mean of category scores.
// Scale is detected from the data, not assumed.
export function buildModel(raw: Raw): Model {
  const { objOrder, metrics } = raw;

  let mx = 0;
  metrics.forEach((m) => raw.props.forEach((p) => {
    const v = m.s[p];
    if (typeof v === "number") mx = Math.max(mx, v);
  }));
  const scaleMax = mx <= 5 ? 5 : mx <= 10 ? 10 : Math.ceil(mx);

  const props = raw.props.filter((p) => metrics.some((m) => typeof m.s[p] === "number"));

  const roll: Record<string, Record<string, Score>> = { [OVERALL]: {} };
  objOrder.forEach((o) => (roll[o] = {}));

  props.forEach((p) => {
    const cats: number[] = [];
    objOrder.forEach((o) => {
      const vs = metrics.filter((m) => m.o === o).map((m) => m.s[p]).filter((v): v is number => typeof v === "number");
      const avg = vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : null;
      roll[o][p] = avg;
      if (avg != null) cats.push(avg);
    });
    roll[OVERALL][p] = cats.length ? cats.reduce((a, b) => a + b, 0) / cats.length : null;
  });

  const byObj: Record<string, Metric[]> = {};
  objOrder.forEach((o) => (byObj[o] = metrics.filter((m) => m.o === o)));

  return { props, objOrder, metrics, roll, scaleMax, byObj };
}

export function sortedProps(model: Model, key: string): string[] {
  return [...model.props].sort((a, b) => (model.roll[key][b] ?? -1) - (model.roll[key][a] ?? -1));
}
