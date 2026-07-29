"use client";
import { useState } from "react";
import { Model, OVERALL, ENTITY } from "../lib/types";
import { sortedProps } from "../lib/parse";
import { fmt, shortLabel, scoreColor, scoreInk } from "../lib/score";

function Glyph({ model, p }: { model: Model; p: string }) {
  return (
    <div className="glyph" aria-hidden="true">
      {model.objOrder.map((o) => {
        const v = model.roll[o][p];
        const c = scoreColor(v, model.scaleMax);
        return (
          <div className="g-col" key={o}>
            <div className="g-bar" style={{ height: v == null ? 0 : (v / model.scaleMax) * 28, background: c.bg }} />
            <div className="g-lab">{shortLabel(o)[0]}</div>
          </div>
        );
      })}
    </div>
  );
}

type SortMode = "default" | "desc" | "asc";

function orderMetrics(list: Model["metrics"], p: string, mode: SortMode): Model["metrics"] {
  if (mode === "default") return list;
  const rank = (v: number | null) => (v == null ? (mode === "desc" ? -Infinity : Infinity) : v);
  return [...list].sort((a, b) => (mode === "desc" ? rank(b.s[p]) - rank(a.s[p]) : rank(a.s[p]) - rank(b.s[p])));
}

function Detail({ model, p }: { model: Model; p: string }) {
  const [sort, setSort] = useState<SortMode>("default");
  const scored = model.metrics.map((m) => ({ m: m.m, s: m.s[p] })).filter((x) => x.s != null) as { m: string; s: number }[];
  const top = [...scored].sort((a, b) => b.s - a.s).slice(0, 3);
  const bot = [...scored].sort((a, b) => a.s - b.s).slice(0, 3);
  const modes: { k: SortMode; label: string }[] = [
    { k: "default", label: "Sheet order" },
    { k: "desc", label: "High to low" },
    { k: "asc", label: "Low to high" },
  ];

  return (
    <div className="detail-pad">
      <div className="sg">
        <div className="sg-card">
          <h4>Top strengths</h4>
          <ul>
            {top.map((x) => (
              <li key={x.m}><span>{x.m}</span><b style={{ color: scoreInk(x.s, model.scaleMax) }}>{fmt(x.s)}</b></li>
            ))}
          </ul>
        </div>
        <div className="sg-card">
          <h4>Biggest gaps</h4>
          <ul>
            {bot.map((x) => (
              <li key={x.m}><span>{x.m}</span><b style={{ color: scoreInk(x.s, model.scaleMax) }}>{fmt(x.s)}</b></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="sub-controls detail-sort">
        <span className="lbl">Sort sub-metrics</span>
        {modes.map((mo) => (
          <button key={mo.k} className={`chip ${sort === mo.k ? "on" : ""}`} onClick={() => setSort(mo.k)}>{mo.label}</button>
        ))}
      </div>

      {model.objOrder.map((o) => (
        <div className="obj-block" key={o}>
          <div className="obj-title">
            <span className="n">{o}</span>
            <span className="avg mono">{fmt(model.roll[o][p])}</span>
          </div>
          {orderMetrics(model.byObj[o], p, sort).map((m) => {
            const v = m.s[p];
            const c = scoreColor(v, model.scaleMax);
            const cm = (m.c[p] || "").trim();
            return (
              <div className="metric" key={m.m}>
                <div className="m-name">{m.m}</div>
                <div className="m-score" style={{ background: c.bg, color: c.fg }}>{fmt(v)}</div>
                <div className="m-bar-wrap">
                  {v == null ? (
                    <span className="m-na">Not applicable, excluded from score</span>
                  ) : (
                    <div className="m-bar"><i style={{ width: `${(v / model.scaleMax) * 100}%`, background: c.bg }} /></div>
                  )}
                  {cm && <div className="m-comment">{cm}</div>}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default function Ranking({ model }: { model: Model }) {
  const [sortKey, setSortKey] = useState(OVERALL);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const order = sortedProps(model, sortKey);
  const keys = [OVERALL, ...model.objOrder];

  return (
    <section>
      <div className="sub-controls" style={{ marginBottom: 18 }}>
        <span className="lbl">Sort by</span>
        {keys.map((k) => (
          <button key={k} className={`chip ${k === sortKey ? "on" : ""}`} onClick={() => setSortKey(k)}>
            {k === OVERALL ? "Overall" : shortLabel(k)}
          </button>
        ))}
      </div>

      <div className="rank-head">
        <div>#</div>
        <div>{ENTITY}</div>
        <div>Overall</div>
        <div className="rk-cats">
          {model.objOrder.map((o) => <span key={o}>{shortLabel(o).slice(0, 5)}</span>)}
        </div>
        <div />
      </div>

      <div className="list">
        {order.map((p, i) => {
          const ov = model.roll[OVERALL][p];
          const c = scoreColor(ov, model.scaleMax);
          const isOpen = !!open[p];
          return (
            <div className={`row-wrap ${isOpen ? "open" : ""}`} key={p}>
              <button className="row" aria-expanded={isOpen} onClick={() => setOpen((s) => ({ ...s, [p]: !s[p] }))}>
                <span className={`rk mono ${i < 3 ? "top" : ""}`}>{String(i + 1).padStart(2, "0")}</span>
                <span><span className="p-name">{p}</span></span>
                <span className="ov">
                  <span className="ov-num" style={{ color: scoreInk(ov, model.scaleMax) }}>{fmt(ov)}</span>
                  <span className="ov-track"><i style={{ left: `${(ov ?? 0) / model.scaleMax * 100}%`, background: c.bg }} /></span>
                </span>
                <Glyph model={model} p={p} />
                <span className="caret" aria-hidden="true">▾</span>
              </button>
              <div className="detail"><div className="detail-in"><Detail model={model} p={p} /></div></div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
