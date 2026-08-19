"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LinkRowActions({
  slug, url, revoked, hasPrevious,
}: { slug: string; url: string; revoked: boolean; hasPrevious: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);

  function copy() {
    navigator.clipboard.writeText(url);
  }

  async function revoke() {
    if (!confirm("Revoke this link? The client will no longer be able to view it.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/share/${slug}/revoke`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not revoke link");
      }
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function revert() {
    if (!confirm("Revert to the previous version? This replaces what the client currently sees.")) return;
    setReverting(true);
    try {
      const res = await fetch(`/api/share/${slug}/revert`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not revert link");
      }
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setReverting(false);
    }
  }

  async function resetPassword() {
    if (!confirm("Reset this link's password? The current password will stop working immediately, including for anyone already viewing it.")) return;
    setResetting(true);
    try {
      const res = await fetch(`/api/share/${slug}/reset-password`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not reset password");
      setNewPassword(data.password);
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally {
      setResetting(false);
    }
  }

  function copyPassword() {
    if (newPassword) navigator.clipboard.writeText(newPassword);
  }

  return (
    <>
      <div className="links-actions">
        <button className="btn" onClick={copy}>Copy</button>
        {!revoked && (
          <a className="btn" href={`/?update=${slug}`}>Update</a>
        )}
        {!revoked && (
          <button className="btn" onClick={revert} disabled={!hasPrevious || reverting} title={hasPrevious ? undefined : "No previous version to revert to"}>
            {reverting ? "Reverting…" : "Revert"}
          </button>
        )}
        {!revoked && (
          <button className="btn" onClick={resetPassword} disabled={resetting}>
            {resetting ? "Resetting…" : "Reset password"}
          </button>
        )}
        {!revoked && (
          <button className="btn" onClick={revoke} disabled={busy}>
            {busy ? "Revoking…" : "Revoke"}
          </button>
        )}
      </div>
      {newPassword && (
        <div className="reset-result">
          <span className="mono">{newPassword}</span>
          <button className="btn" onClick={copyPassword}>Copy</button>
          <span className="reset-note">Won't be shown again</span>
        </div>
      )}
    </>
  );
}
