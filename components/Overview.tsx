"use client";
import { useState } from "react";
import { Model, OVERALL, Insights } from "../lib/types";
import { sortedProps } from "../lib/parse";
import { fmt, scoreInk } from "../lib/score";

export default function Overview({
  model, readOnly = false, insights = {}, onInsightsChange,
}: {
  model: Model;
  readOnly?: boolean;
  insights?: Insights;
  onInsightsChange?: (insights: Insights) => void;
}) {
  const par = model.scaleMax / 2;
  const [editingKey, setEditingKey] = useState<keyof Insights | null>(null);
  const [draft, setDraft] = useState("");

  function commit(key: keyof Insights, defaultText: string) {
    const trimmed = draft.trim();
    setEditingKey(null);
    if (!onInsightsChange) return;
    const next = { ...insights };
    if (!trimmed || trimmed === defaultText) delete next[key];
    else next[key] = trimmed;
    onInsightsChange(next);
  }

  function revert(key: keyof Insights) {
    if (!onInsightsChange) return;
    const next = { ...insights };
    delete next[key];
    onInsightsChange(next);
  }

  function renderInsight(key: keyof Insights, defaultText: string) {
    const override = insights[key];
    const text = override ?? defaultText;

    if (readOnly) return <span className="d">{text}</span>;

    if (editingKey === key) {
      return (
        <textarea
          className="d-edit"
          value={draft}
          autoFocus
          rows={2}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => commit(key, defaultText)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commit(key, defaultText); }
            if (e.key === "Escape") { e.preventDefault(); setEditingKey(null); }
          }}
        />
      );
    }

    return (
      <span className="d d-editable" onClick={() => { setDraft(text); setEditingKey(key); }}>
        {text}
        <span className="d-pencil" aria-hidden="true">✎</span>
        {override !== undefined && (
          <button
            type="button"
            className="d-revert"
            title="Revert to auto-generated text"
            onClick={(e) => { e.stopPropagation(); revert(key); }}
          >
            Revert
          </button>
        )}
      </span>
    );
  }

  // 1. Strongest partnership
  const ranked = sortedProps(model, OVERALL);
  const top = ranked[0];
  const topScore = model.roll[OVERALL][top];

  // Objective averages across all properties
  const objAvg = model.objOrder.map((o) => {
    const vs = model.props.map((p) => model.roll[o][p]).filter((v): v is number => typeof v === "number");
    return { o, avg: vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : null };
  });
  const withVals = objAvg.filter((x) => x.avg != null) as { o: string; avg: number }[];
  const strongestObj = withVals.slice().sort((a, b) => b.avg - a.avg)[0];
  const weakestObj = withVals.slice().sort((a, b) => a.avg - b.avg)[0];

  // 4. Above benchmark
  const scored = model.props.map((p) => model.roll[OVERALL][p]).filter((v): v is number => typeof v === "number");
  const abovePar = scored.filter((v) => v > par).length;

  return (
    <section>
      <div className="ov-grid">
        <div className="ov-card">
          <span className="ov-tag">Top ranked</span>
          <span className="v" style={{ color: scoreInk(topScore, model.scaleMax) }}>{top}</span>
          {renderInsight("top", `Highest overall at ${fmt(topScore)} out of ${model.scaleMax}.`)}
        </div>

        <div className="ov-card">
          <span className="k">Portfolio strength</span>
          <span className="v" style={{ color: strongestObj ? scoreInk(strongestObj.avg, model.scaleMax) : undefined }}>
            {strongestObj ? strongestObj.o : "–"}
          </span>
          {renderInsight("strength", `Strongest objective, averaging ${strongestObj ? fmt(strongestObj.avg) : "–"} across the portfolio.`)}
        </div>

        <div className="ov-card">
          <span className="k">Biggest gap</span>
          <span className="v" style={{ color: weakestObj ? scoreInk(weakestObj.avg, model.scaleMax) : undefined }}>
            {weakestObj ? weakestObj.o : "–"}
          </span>
          {renderInsight("gap", `Weakest objective, averaging ${weakestObj ? fmt(weakestObj.avg) : "–"}. The clearest place to focus.`)}
        </div>

        <div className="ov-card">
          <span className="k">Above benchmark</span>
          <span className="v">{abovePar}<span className="v-sub"> / {model.props.length}</span></span>
          {renderInsight("benchmark", `Properties scoring above par (${fmt(par)}) overall.`)}
        </div>
      </div>
    </section>
  );
}
