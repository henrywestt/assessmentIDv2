"use client";
import { useState } from "react";
import { Model, OVERALL } from "../lib/types";
import { sortedProps } from "../lib/parse";
import { fmt, shortLabel } from "../lib/score";

const COLORS = ["#0E6E68", "#B96B2C", "#3A4DB8"];

function Radar({ model, sel }: { model: Model; sel: string[] }) {
  const size = 280, cx = size / 2, cy = size / 2, R = size / 2 - 46;
  const n = model.objOrder.length;
  const pt = (i: number, r: number): [number, number] => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  };

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" role="img" aria-label="Radar comparison">
      {[0.25, 0.5, 0.75, 1].map((g) => (
        <polygon key={g} points={model.objOrder.map((_, i) => pt(i, R * g).join(",")).join(" ")} fill="none" stroke="var(--line)" strokeWidth={1} />
      ))}
      {model.objOrder.map((o, i) => {
        const [x, y] = pt(i, R);
        return <line key={o} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--line)" />;
      })}
      {sel.map((p, idx) => {
        const col = COLORS[idx];
        const pts = model.objOrder.map((o, i) => pt(i, R * ((model.roll[o][p] || 0) / model.scaleMax)).join(",")).join(" ");
        return (
          <g key={p}>
            <polygon points={pts} fill={col} fillOpacity={0.13} stroke={col} strokeWidth={2} strokeLinejoin="round" />
            {model.objOrder.map((o, i) => {
              const [x, y] = pt(i, R * ((model.roll[o][p] || 0) / model.scaleMax));
              return <circle key={o} cx={x} cy={y} r={3} fill={col} />;
            })}
          </g>
        );
      })}
      {model.objOrder.map((o, i) => {
        const [lx, ly] = pt(i, R + 20);
        return (
          <text key={o} x={lx} y={ly} fontFamily="IBM Plex Mono" fontSize={10} fill="var(--ink-soft)" textAnchor="middle" dominantBaseline="middle">
            {shortLabel(o)}
          </text>
        );
      })}
    </svg>
  );
}

export default function Compare({ model }: { model: Model }) {
  const order = sortedProps(model, OVERALL);
  const [sel, setSel] = useState<string[]>(order.slice(0, 2));

  const toggle = (p: string) =>
    setSel((s) => (s.includes(p) ? s.filter((x) => x !== p) : s.length < 3 ? [...s, p] : s));

  return (
    <section>
      <div className="sub-controls" style={{ marginBottom: 22 }}>
        <span className="lbl">Pick up to 3</span>
      </div>
      <div className="cmp-pick">
        {order.map((p) => {
          const i = sel.indexOf(p);
          const on = i > -1;
          return (
            <button
              key={p}
              className={`chip ${on ? "on" : ""}`}
              style={on ? { background: COLORS[i], borderColor: COLORS[i], color: "#fff" } : undefined}
              onClick={() => toggle(p)}
            >
              {p}
            </button>
          );
        })}
      </div>

      {sel.length === 0 ? (
        <div className="cmp-empty">Select properties above to compare their profiles.</div>
      ) : (
        <div className="cmp-grid">
          <div className="radar-card">
            <h3>Profile shape</h3>
            <Radar model={model} sel={sel} />
            <div className="legend">
              {sel.map((p, i) => (
                <span key={p}><i style={{ background: COLORS[i] }} />{p}</span>
              ))}
            </div>
          </div>
          <div className="cmp-table-card">
            <h3>Objective scores</h3>
            {[...model.objOrder, OVERALL].map((o) => (
              <div className="cmp-row" key={o}>
                <div className="cmp-cat">{o === OVERALL ? "Overall" : o}</div>
                <div className="cmp-bars">
                  {sel.map((p, idx) => {
                    const v = model.roll[o][p];
                    return (
                      <div className="cmp-bar" key={p}>
                        <div className="track"><i style={{ width: `${(v || 0) / model.scaleMax * 100}%`, background: COLORS[idx] }} /></div>
                        <div className="v" style={{ color: COLORS[idx] }}>{fmt(v)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
