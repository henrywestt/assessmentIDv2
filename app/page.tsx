"use client";
import { useEffect, useMemo, useState } from "react";
import { Raw, Model, Benchmarks } from "../lib/types";
import { buildModel } from "../lib/parse";
import { Insight, resolveInsights } from "../lib/insights";
import Uploader from "../components/Uploader";
import Viewer from "../components/Viewer";

type Banner = { kind: "ok" | "err"; reasons?: string[]; text?: string } | null;
type Share = { url: string; password: string } | null;

const LANDING_TITLE = "AlignmentID Visualiser";

export default function Page() {
  const [raw, setRaw] = useState<Raw | null>(null);
  const [benchmarks, setBenchmarks] = useState<Benchmarks | null>(null);
  const [title, setTitle] = useState(LANDING_TITLE);
  const [src, setSrc] = useState("");
  const [banner, setBanner] = useState<Banner>(null);
  // undefined = "use the auto-generated defaults"; a concrete array (even []) means
  // the staff has customized insights via the editor and that exact list is final.
  const [insights, setInsights] = useState<Insight[] | undefined>(undefined);

  const [clientName, setClientName] = useState("");
  const [days, setDays] = useState(30);
  const [busy, setBusy] = useState(false);
  const [share, setShare] = useState<Share>(null);

  // Update mode: present when the page was reached via /?update={slug}.
  const [updateSlug, setUpdateSlug] = useState<string | null>(null);
  const [updateClientName, setUpdateClientName] = useState("");
  const [carriedInsights, setCarriedInsights] = useState<Insight[]>([]);
  const [oldPropsCount, setOldPropsCount] = useState(0);
  const [resetInsightsOnUpdate, setResetInsightsOnUpdate] = useState(false);
  const [updateDone, setUpdateDone] = useState(false);

  // Model exists only once a workbook is loaded. Nothing client-specific ships in the bundle.
  const model: Model | null = useMemo(() => (raw ? buildModel(raw) : null), [raw]);

  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("update");
    if (!slug) return;
    setUpdateSlug(slug);
    fetch(`/api/share/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Could not load that link");
        return res.json();
      })
      .then((data) => {
        setUpdateClientName(data.clientName || "");
        const carried = Array.isArray(data.insights) ? data.insights : [];
        setCarriedInsights(carried);
        setOldPropsCount(typeof data.propsCount === "number" ? data.propsCount : 0);
        setInsights(carried);
      })
      .catch(() => {
        setBanner({ kind: "err", reasons: ["Could not load the link to update. It may have been revoked or removed."] });
      });
  }, []);

  function onLoaded(r: Raw, b: Benchmarks | null, name: string) {
    setRaw(r);
    setBenchmarks(b);
    setTitle(name.replace(/\.(xlsx|xlsm)$/i, ""));
    setSrc("Loaded from " + name + " · parsed in-browser");
    setShare(null);
    setUpdateDone(false);
    // In update mode, insights are already seeded from the existing link (or
    // reset via the checkbox below) — a fresh upload shouldn't clobber that.
    if (!updateSlug) setInsights(undefined);
    const m = buildModel(r);
    setBanner({ kind: "ok", text: `Loaded ${name}. ${m.props.length} Properties · ${m.objOrder.length} objectives · ${m.metrics.length} sub-metrics · scale 0–${m.scaleMax}${b ? " · benchmarks found" : " · no benchmarks sheet"}. Parsed in your browser.` });
  }
  function onError(reasons: string[]) {
    setBanner({ kind: "err", reasons });
  }

  function toggleResetInsights(checked: boolean) {
    setResetInsightsOnUpdate(checked);
    setInsights(checked ? undefined : carriedInsights);
  }

  async function createLink() {
    if (!raw || !model) return;
    setBusy(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: clientName.trim() || title, title, raw, benchmarks, days,
          insights: resolveInsights(insights, model),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create link");
      setShare({
        url: `${window.location.origin}/c/${data.slug}`,
        password: data.password,
      });
    } catch (e) {
      setBanner({ kind: "err", reasons: [e instanceof Error ? e.message : String(e)] });
    } finally {
      setBusy(false);
    }
  }

  async function updateLink() {
    if (!raw || !model || !updateSlug) return;
    const name = updateClientName || updateSlug;
    const msg = `${name}: ${oldPropsCount} properties → ${model.props.length} properties. This replaces what the client currently sees.`;
    if (!confirm(msg)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/share/${updateSlug}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw, benchmarks, insights: resolveInsights(insights, model) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update link");
      setUpdateDone(true);
    } catch (e) {
      setBanner({ kind: "err", reasons: [e instanceof Error ? e.message : String(e)] });
    } finally {
      setBusy(false);
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <>
      <header>
        <div className="head-top">
          <div>
            <img src="/bastion-logo.png" alt="Bastion" className="brand-logo" />
            <div className="eyebrow">Bastion Commercial Strategy</div>
            <h1>{title}</h1>
          </div>
          <a className="btn" href="/links">Client links →</a>
        </div>
        <p className="lede">
          Upload a client's Excel framework using the template, and it will be visualised here. The workbook itself is never uploaded or stored — a client link saves only the derived scores, and only when you create one.
        </p>

        {updateSlug && (
          <div className="banner info">
            Updating link for {updateClientName || "…"} — the URL and password will not change.
          </div>
        )}

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

        {model && updateSlug && (
          <div className="share-panel">
            {updateDone ? (
              <div className="share-result">
                <p className="share-note">Link updated for {updateClientName}. The URL and password are unchanged.</p>
                <a className="btn" href="/links">Back to client links</a>
              </div>
            ) : (
              <div className="share-create">
                <label className="update-reset-check">
                  <input
                    type="checkbox"
                    checked={resetInsightsOnUpdate}
                    onChange={(e) => toggleResetInsights(e.target.checked)}
                  />
                  Reset insights to auto-generated instead of carrying them forward
                </label>
                <button className="btn primary" disabled={busy} onClick={updateLink}>
                  {busy ? "Updating…" : "Update this link"}
                </button>
              </div>
            )}
          </div>
        )}

        {model && !updateSlug && (
          <div className="share-panel">
            {share ? (
              <div className="share-result">
                <div className="share-result-row">
                  <span className="share-lbl">Link</span>
                  <span className="mono share-value">{share.url}</span>
                  <button className="btn" onClick={() => copy(share.url)}>Copy</button>
                </div>
                <div className="share-result-row">
                  <span className="share-lbl">Password</span>
                  <span className="mono share-value">{share.password}</span>
                  <button className="btn" onClick={() => copy(share.password)}>Copy</button>
                </div>
                <p className="share-note">This password won’t be shown again — copy it now.</p>
                <button className="btn" onClick={() => setShare(null)}>Create another link</button>
              </div>
            ) : (
              <div className="share-create">
                <input
                  className="text-input"
                  placeholder="Client name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
                <select className="text-input" value={days} onChange={(e) => setDays(Number(e.target.value))}>
                  <option value={7}>Expires in 7 days</option>
                  <option value={14}>Expires in 14 days</option>
                  <option value={30}>Expires in 30 days</option>
                  <option value={90}>Expires in 90 days</option>
                </select>
                <button className="btn primary" disabled={busy} onClick={createLink}>
                  {busy ? "Creating…" : "Create client link"}
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {model && raw && (
        <Viewer
          raw={raw}
          benchmarks={benchmarks}
          title={title}
          footNote={src}
          insights={insights}
          onInsightsChange={setInsights}
          onInsightsReset={() => setInsights(undefined)}
        />
      )}

      {!model && (
        <main>
          <div className="empty-panel">Your overview will appear here once you upload a workbook.</div>
        </main>
      )}
    </>
  );
}
