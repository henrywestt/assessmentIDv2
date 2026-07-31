"use client";
import { useMemo, useState } from "react";
import { Raw, Model, Benchmarks } from "../lib/types";
import { buildModel } from "../lib/parse";
import Uploader from "../components/Uploader";
import Ranking from "../components/Ranking";
import Heatmap from "../components/Heatmap";
import Compare from "../components/Compare";
import BenchmarksView from "../components/Benchmarks";

type View = "rank" | "heat" | "cmp" | "bench";
type Banner = { kind: "ok" | "err"; reasons?: string[]; text?: string } | null;

const LANDING_TITLE = "AlignmentID Visualiser";

export default function Page() {
  const [raw, setRaw] = useState<Raw | null>(null);
  const [benchmarks, setBenchmarks] = useState<Benchmarks | null>(null);
  const [title, setTitle] = useState(LANDING_TITLE);
  const [src, setSrc] = useState("");
  const [view, setView] = useState<View>("rank");
  const [banner, setBanner] = useState<Banner>(null);

  // Model exists only once a workbook is loaded. Nothing client-specific ships in the bundle.
  const model: Model | null = useMemo(() => (raw ? buildModel(raw) : null), [raw]);
  const modelKey = model ? title + ":" + model.props.length + ":" + model.metrics.length : "empty";

  function onLoaded(r: Raw, b: Benchmarks | null, name: string) {
    setRaw(r);
    setBenchmarks(b);
    setTitle(name.replace(/\.(xlsx|xlsm)$/i, ""));
    setSrc("Loaded from " + name + " · parsed in-browser");
    setView("rank");
    const m = buildModel(r);
    setBanner({ kind: "ok", text: `Loaded ${name}. ${m.props.length} Properties · ${m.objOrder.length} objectives · ${m.metrics.length} sub-metrics · scale 0–${m.scaleMax}${b ? " · benchmarks found" : " · no benchmarks sheet"}. Parsed in your browser.` });
  }
  function onError(reasons: string[]) {
    setBanner({ kind: "err", reasons });
  }

  return (
    <>
      <header>
        <div className="head-top">
          <div>
            <div className="eyebrow">Bastion Commercial Strategy</div>
            <h1>{title}</h1>
          </div>
        </div>
        <p className="lede">
          Upload a client's Excel framework using the template, and it will be visualised here. The data is processed securely for display purposes only and is not uploaded or stored.
        </p>

        <Uploader onLoaded={onLoaded} onError={onError} />

        {banner && banner.kind === "ok" && (
          <div className="banner ok">{banner.text}</div>
        )}
        {banner && banner.kind === "err" && (
          <div className="banner err">
            <b>That file didn’t match the template.</b> The viewer needs an assessment sheet with these:
            <ul>{(banner.reasons || []).map((r, i) => <li key={i}>{r}</li>)}</ul>
            <span className="mono">Objective · Sub-Metric · Question columns, then one “Property: name / Score / Commentary” block per partnership.</span>
          </div>
        )}

        {model && (
          <div className="meta">
            <span>{model.props.length} Properties</span>
            <span>{model.objOrder.length} objectives</span>
            <span>{model.metrics.length} sub-metrics</span>
            <span>Scale 0–{model.scaleMax}</span>
          </div>
        )}
      </header>

      {model && (
        <div className="scale-row">
          <span className="mono">weak</span>
          <div className="scale-bar" title="score scale" />
          <span className="mono">strong · 0–{model.scaleMax}</span>
        </div>
      )}

      <div className="controls">
        <div className="seg" role="tablist" aria-label="View">
          <button className={view === "rank" ? "on" : ""} role="tab" aria-selected={view === "rank"} disabled={!model} onClick={() => setView("rank")}>Ranking</button>
          <button className={view === "cmp" ? "on" : ""} role="tab" aria-selected={view === "cmp"} disabled={!model} onClick={() => setView("cmp")}>Compare</button>
          <button className={view === "heat" ? "on" : ""} role="tab" aria-selected={view === "heat"} disabled={!model} onClick={() => setView("heat")}>Heatmap</button>
          <button className={view === "bench" ? "on" : ""} role="tab" aria-selected={view === "bench"} disabled={!model} onClick={() => setView("bench")}>Benchmarks</button>
        </div>
      </div>

      <main>
        {!model && (
          <div className="empty-panel">Your ranking will appear here once you upload a workbook.</div>
        )}
        {model && view === "rank" && <Ranking key={modelKey} model={model} />}
        {model && view === "heat" && <Heatmap key={modelKey} model={model} />}
        {model && view === "cmp" && <Compare key={modelKey} model={model} exportName={title} />}
        {model && view === "bench" && <BenchmarksView benchmarks={benchmarks} scaleMax={model.scaleMax} />}
      </main>

      {model && (
        <div className="foot">
          <span>{src}</span>
          <span className="mono">Par = {(model.scaleMax / 2).toFixed(1)} · overall = mean of objective scores</span>
        </div>
      )}
    </>
  );
}
