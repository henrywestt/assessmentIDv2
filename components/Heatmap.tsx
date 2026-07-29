"use client";
import { useState } from "react";
import { Model, OVERALL, ENTITY } from "../lib/types";
import { sortedProps } from "../lib/parse";
import { fmt, shortLabel, scoreColor } from "../lib/score";

export default function Heatmap({ model }: { model: Model }) {
  const [gran, setGran] = useState<"cats" | "all">("cats");
  const order = sortedProps(model, OVERALL);

  // One column order, reused by header and body, so cells always sit under the right metric.
  const ordered = model.objOrder.flatMap((o) => model.byObj[o]);

  return (
    <section>
      <div className="sub-controls" style={{ marginBottom: 18 }}>
        <span className="lbl">Show</span>
        <button className={`chip ${gran === "cats" ? "on" : ""}`} onClick={() => setGran("cats")}>Objectives</button>
        <button className={`chip ${gran === "all" ? "on" : ""}`} onClick={() => setGran("all")}>All metrics</button>
      </div>

      <div className="heat-scroll">
        <table className="heat">
          {gran === "cats" ? (
            <>
              <thead>
                <tr>
                  <th className="p-lab">{ENTITY}</th>
                  {[...model.objOrder, OVERALL].map((c) => (
                    <th key={c}>{c === OVERALL ? "Overall" : shortLabel(c)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {order.map((p) => (
                  <tr key={p}>
                    <td className="p-lab">{p}</td>
                    {[...model.objOrder, OVERALL].map((c) => {
                      const v = model.roll[c][p];
                      const col = scoreColor(v, model.scaleMax);
                      return (
                        <td key={c} className={`cell ${c === OVERALL ? "ov" : ""}`} style={{ background: col.bg, color: col.fg }}>
                          {fmt(v)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </>
          ) : (
            <>
              <thead>
                <tr>
                  <th className="p-lab" rowSpan={2}>{ENTITY}</th>
                  {model.objOrder.map((o) => (
                    <th key={o} className="grp" colSpan={model.byObj[o].length}>{shortLabel(o)}</th>
                  ))}
                </tr>
                <tr>
                  {ordered.map((m) => (
                    <th key={m.m} className="vhead" title={m.m}><span>{m.m}</span></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {order.map((p) => (
                  <tr key={p}>
                    <td className="p-lab">{p}</td>
                    {ordered.map((m) => {
                      const v = m.s[p];
                      const col = scoreColor(v, model.scaleMax);
                      return (
                        <td key={m.m} className="cell" style={{ background: col.bg, color: col.fg }} title={`${m.m}: ${fmt(v)}`}>
                          {fmt(v)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </>
          )}
        </table>
      </div>
    </section>
  );
}
