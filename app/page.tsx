"use client";
import { useMemo, useState } from "react";
import { Raw, Model, Benchmarks, ENTITY_PLURAL } from "../lib/types";
import { buildModel } from "../lib/parse";
import { SAMPLE, SAMPLE_BENCHMARKS } from "../data/sample";
import Uploader from "../components/Uploader";
import Ranking from "../components/Ranking";
import Heatmap from "../components/Heatmap";
import Compare from "../components/Compare";
import BenchmarksView from "../components/Benchmarks";

type View = "rank" | "heat" | "cmp" | "bench";
type Banner = { kind: "ok" | "err"; reasons?: string[]; text?: string } | null;

const SAMPLE_SRC = "Bastion · internal working view. Sample: Spark B2C framework.";

export default function Page() {
  const [raw, setRaw] = useState<Raw>(SAMPLE);
  const [benchmarks, setBenchmarks] = useState<Benchmarks | null>(SAMPLE_BENCHMARKS);
  const [title, setTitle] = useState("Assessment comparison");
  const [src, setSrc] = useState(SAMPLE_SRC);
  const [view, setView] = useState<View>("rank");
  const [banner, setBanner] = useState<Banner>(null);
  const [loaded, setLoaded] = useState(false);

  // Rebuild the model (and reset per-view state via key) whenever the data changes.
  const model: Model = useMemo(() => buildModel(raw), [raw]);
  const modelKey = title + ":" + model.props.length + ":" + model.metrics.length;

  function onLoaded(r: Raw, b: Benchmarks | null, name: string) {
    setRaw(r);
    setBenchmarks(b);
    setTitle(name.replace(/\.(xlsx|xlsm)$/i, ""));
    setSrc("Loaded from " + name + " · parsed in-browser");
    setView("rank");
    setLoaded(true);
    const m = buildModel(r);
    setBanner({ kind: "ok", text: `Loaded ${name}. ${m.props.length} ${ENTITY_PLURAL} · ${m.metrics.length} metrics · ${m.objOrder.length} objectives · scale 0–${m.scaleMax}${b ? " · benchmarks found" : " · no benchmarks sheet"}. Parsed in your browser.` });
  }
  function onError(reasons: string[]) {
    setBanner({ kind: "err", reasons });
  }
  function onReset() {
    setRaw(SAMPLE);
    setBenchmarks(SAMPLE_BENCHMARKS);
    setTitle("Assessment comparison");
    setSrc(SAMPLE_SRC);
    setView("rank");
    setLoaded(false);
    setBanner(null);
  }

  return (
    <>
      <header>
        <div className="head-top">
          <div>
            <div className="eyebrow">Sponsorship Assessment</div>
            <h1>{title}</h1>
          </div>
          <div className="scale-legend">
            <span className="mono">weak</span>
            <div className="scale-bar" title="score scale" />
            <span className="mono">strong · 0–{model.scaleMax}</span>
          </div>
        </div>
        <p className="lede">
          Drop any framework workbook that follows the template and it renders here. Below par reads warm, above par reads cool. The file is parsed in your browser and never leaves this page.
        </p>

        <Uploader onLoaded={onLoaded} onError={onError} onReset={onReset} showReset={loaded} />

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

        <div className="meta">
          <span>{model.props.length} {ENTITY_PLURAL}</span>
          <span>{model.metrics.length} metrics</span>
          <span>{model.objOrder.length} objectives</span>
          <span>Scale 0–{model.scaleMax}</span>
        </div>
      </header>

      <div className="controls">
        <div className="seg" role="tablist" aria-label="View">
          <button className={view === "rank" ? "on" : ""} role="tab" aria-selected={view === "rank"} onClick={() => setView("rank")}>Ranking</button>
          <button className={view === "heat" ? "on" : ""} role="tab" aria-selected={view === "heat"} onClick={() => setView("heat")}>Heatmap</button>
          <button className={view === "cmp" ? "on" : ""} role="tab" aria-selected={view === "cmp"} onClick={() => setView("cmp")}>Compare</button>
          <button className={view === "bench" ? "on" : ""} role="tab" aria-selected={view === "bench"} onClick={() => setView("bench")}>Benchmarks</button>
        </div>
      </div>

      <main>
        {view === "rank" && <Ranking key={modelKey} model={model} />}
        {view === "heat" && <Heatmap key={modelKey} model={model} />}
        {view === "cmp" && <Compare key={modelKey} model={model} exportName={title} />}
        {view === "bench" && <BenchmarksView benchmarks={benchmarks} scaleMax={model.scaleMax} />}
      </main>

      <div className="foot">
        <span>{src}</span>
        <span className="mono">Par = {(model.scaleMax / 2).toFixed(1)} · overall = mean of objective scores</span>
      </div>
    </>
  );
}
