"use client";
import { useMemo, useState } from "react";
import { Raw, Benchmarks, Model } from "../lib/types";
import { buildModel } from "../lib/parse";
import { fmtDate } from "../lib/format";
import Overview from "./Overview";
import Ranking from "./Ranking";
import Heatmap from "./Heatmap";
import Compare from "./Compare";
import BenchmarksView from "./Benchmarks";

type View = "overview" | "rank" | "heat" | "cmp" | "bench";

export default function Viewer({
  raw, benchmarks, title, readOnly = false, footNote = "",
  clientName, generatedAt, expiresAt,
}: {
  raw: Raw; benchmarks: Benchmarks | null; title: string; readOnly?: boolean; footNote?: string;
  clientName?: string; generatedAt?: string; expiresAt?: string;
}) {
  const [view, setView] = useState<View>("overview");
  const model: Model = useMemo(() => buildModel(raw), [raw]);
  const modelKey = title + ":" + model.props.length + ":" + model.metrics.length;

  return (
    <>
      {readOnly && clientName && (
        <header>
          <div className="head-top">
            <div>
              <img src="/bastion-logo.png" alt="Bastion" className="brand-logo" />
              <div className="eyebrow">Bastion Commercial Strategy</div>
              <h1>{clientName} AlignmentID Visualiser</h1>
            </div>
          </div>
          <p className="lede-wide">
            AlignmentID scores each property against the objectives and sub-metrics agreed with {clientName}, on a shared 0–{model.scaleMax} scale. Use the tabs below to move between an overview, a full ranking, a heatmap across every metric, and head-to-head comparisons between properties.
          </p>
        </header>
      )}

      <div className="scale-row">
        <span className="mono">weak</span>
        <div className="scale-bar" title="score scale" />
        <span className="mono">strong · 0–{model.scaleMax}</span>
      </div>

      <div className="controls">
        <div className="seg" role="tablist" aria-label="View">
          <button className={view === "overview" ? "on" : ""} role="tab" aria-selected={view === "overview"} onClick={() => setView("overview")}>Overview</button>
          <button className={view === "rank" ? "on" : ""} role="tab" aria-selected={view === "rank"} onClick={() => setView("rank")}>Ranking</button>
          <button className={view === "cmp" ? "on" : ""} role="tab" aria-selected={view === "cmp"} onClick={() => setView("cmp")}>Compare</button>
          <button className={view === "heat" ? "on" : ""} role="tab" aria-selected={view === "heat"} onClick={() => setView("heat")}>Heatmap</button>
          <button className={view === "bench" ? "on" : ""} role="tab" aria-selected={view === "bench"} onClick={() => setView("bench")}>Benchmarks</button>
        </div>
      </div>

      <main>
        {view === "overview" && <Overview key={modelKey} model={model} />}
        {view === "rank" && <Ranking key={modelKey} model={model} />}
        {view === "heat" && <Heatmap key={modelKey} model={model} />}
        {view === "cmp" && <Compare key={modelKey} model={model} exportName={title} readOnly={readOnly} />}
        {view === "bench" && <BenchmarksView benchmarks={benchmarks} scaleMax={model.scaleMax} />}
      </main>

      <div className="foot">
        <span>{footNote}</span>
        <span className="mono">Par = {(model.scaleMax / 2).toFixed(1)} · overall = mean of objective scores</span>
      </div>

      {readOnly && clientName && (
        <div className="watermark">
          Prepared for {clientName} · Generated {fmtDate(generatedAt)}
          {expiresAt ? ` · Expires ${fmtDate(expiresAt)}` : ""}
        </div>
      )}
    </>
  );
}
