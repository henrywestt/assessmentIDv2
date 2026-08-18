"use client";
import { useState, type CSSProperties } from "react";
import { Insight, COLOUR_OPTIONS, colourVar, makeInsightId } from "../lib/insights";
import Formatted from "./Formatted";

type Field = "heading" | "body";

export default function Overview({
  readOnly = false, insights, onInsightsChange, onReset,
}: {
  readOnly?: boolean;
  insights: Insight[];
  onInsightsChange?: (insights: Insight[]) => void;
  onReset?: () => void;
}) {
  const [editing, setEditing] = useState<{ id: string; field: Field } | null>(null);
  const [draft, setDraft] = useState("");

  if (readOnly && insights.length === 0) return null;

  function startEdit(id: string, field: Field, value: string) {
    setEditing({ id, field });
    setDraft(value);
  }

  function commitEdit() {
    if (!editing) return;
    const { id, field } = editing;
    const next = insights.map((ins) => (ins.id === id ? { ...ins, [field]: draft } : ins));
    setEditing(null);
    onInsightsChange?.(next);
  }

  function cancelEdit() {
    setEditing(null);
  }

  function addInsight() {
    const id = makeInsightId();
    const next = [...insights, { id, heading: "New insight", body: "Click to edit.", colour: "default" }];
    onInsightsChange?.(next);
    setEditing({ id, field: "heading" });
    setDraft("New insight");
  }

  function deleteInsight(id: string) {
    if (!confirm("Delete this insight?")) return;
    onInsightsChange?.(insights.filter((ins) => ins.id !== id));
  }

  function move(id: string, dir: -1 | 1) {
    const idx = insights.findIndex((ins) => ins.id === id);
    const swapWith = idx + dir;
    if (idx < 0 || swapWith < 0 || swapWith >= insights.length) return;
    const next = insights.slice();
    [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
    onInsightsChange?.(next);
  }

  function setColour(id: string, colour: string) {
    onInsightsChange?.(insights.map((ins) => (ins.id === id ? { ...ins, colour } : ins)));
  }

  function resetAll() {
    if (!confirm("Reset all insights to the auto-generated defaults? Your edits will be lost.")) return;
    onReset?.();
  }

  function renderField(ins: Insight, field: Field) {
    const value = ins[field];
    const isEditing = editing?.id === ins.id && editing.field === field;
    const Tag = field === "heading" ? "h3" : "p";
    const cls = field === "heading" ? "ins-heading" : "ins-body";

    if (readOnly) {
      return <Tag className={cls}><Formatted text={value} /></Tag>;
    }

    if (isEditing) {
      if (field === "heading") {
        return (
          <input
            className="ins-edit ins-edit-heading"
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); commitEdit(); }
              if (e.key === "Escape") { e.preventDefault(); cancelEdit(); }
            }}
          />
        );
      }
      return (
        <textarea
          className="ins-edit ins-edit-body"
          value={draft}
          autoFocus
          rows={3}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitEdit(); }
            if (e.key === "Escape") { e.preventDefault(); cancelEdit(); }
          }}
        />
      );
    }

    return (
      <Tag className={`${cls} ins-editable`} onClick={() => startEdit(ins.id, field, value)}>
        <Formatted text={value} />
        <span className="ins-pencil" aria-hidden="true">✎</span>
      </Tag>
    );
  }

  return (
    <section>
      {!readOnly && (
        <>
          <div className="ins-toolbar">
            <button type="button" className="btn" onClick={addInsight}>+ Add insight</button>
            <button type="button" className="btn" onClick={resetAll}>Reset to auto-generated</button>
          </div>
          <p className="ins-hint">Formatting: **bold** and *italic*.</p>
        </>
      )}

      {insights.length > 0 && (
        <div className="ov-grid ins-grid">
          {insights.map((ins, idx) => {
            const accent = colourVar(ins.colour);
            const cardStyle = accent ? ({ "--ins-accent": accent } as CSSProperties) : undefined;
            return (
              <div key={ins.id} className="ov-card ins-card" style={cardStyle}>
                {renderField(ins, "heading")}
                {renderField(ins, "body")}

                {!readOnly && (
                  <div className="ins-card-controls">
                    <div className="ins-swatches">
                      {COLOUR_OPTIONS.map((c) => (
                        <button
                          key={c.token}
                          type="button"
                          title={c.label}
                          aria-label={c.label}
                          className={`ins-swatch ${ins.colour === c.token ? "on" : ""}`}
                          style={{ background: colourVar(c.token) || "var(--card)" }}
                          onClick={() => setColour(ins.id, c.token)}
                        />
                      ))}
                    </div>
                    <div className="ins-order-controls">
                      <button type="button" className="ins-icon-btn" disabled={idx === 0} onClick={() => move(ins.id, -1)} title="Move up">↑</button>
                      <button type="button" className="ins-icon-btn" disabled={idx === insights.length - 1} onClick={() => move(ins.id, 1)} title="Move down">↓</button>
                      <button type="button" className="ins-icon-btn ins-delete" onClick={() => deleteInsight(ins.id)} title="Delete insight">Delete</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!readOnly && insights.length === 0 && (
        <div className="empty-panel">No insights yet — add one above.</div>
      )}
    </section>
  );
}
