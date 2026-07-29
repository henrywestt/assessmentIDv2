"use client";
import { Benchmarks } from "../lib/types";
import { fmt, scoreColor } from "../lib/score";

export default function BenchmarksView({ benchmarks, scaleMax }: { benchmarks: Benchmarks | null; scaleMax: number }) {
  if (!benchmarks) {
    return (
      <section>
        <div className="cmp-empty">
          This workbook has no benchmarks sheet. Add a rubric sheet with Sub-Metric, Question, and a scored band row to populate this reference.
        </div>
      </section>
    );
  }

  const byObj: Record<string, typeof benchmarks.items> = {};
  benchmarks.objOrder.forEach((o) => (byObj[o] = benchmarks.items.filter((it) => it.o === o)));

  return (
    <section>
      <p className="bench-intro">
        Reference only. How each sub-metric is defined and the benchmark each score maps to. Higher bands read cooler.
      </p>
      {benchmarks.objOrder.map((o) => (
        <div className="bench-obj" key={o}>
          <div className="bench-obj-h">{o}</div>
          {byObj[o].map((it) => (
            <div className="bench-item" key={it.m}>
              <div className="bench-head">
                <span className="bench-name">{it.m}</span>
                {it.q && <span className="bench-q">{it.q}</span>}
              </div>
              <div className="bench-bands">
                {it.bands.map((b, i) => {
                  const c = scoreColor(b.score, scaleMax);
                  return (
                    <div className="bench-band" key={i}>
                      <span className="bscore" style={{ background: c.bg, color: c.fg }}>{fmt(b.score)}</span>
                      <span className="blabel">{b.label || "\u2013"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ))}
    </section>
  );
}
