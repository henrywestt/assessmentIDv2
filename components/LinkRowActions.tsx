"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LinkRowActions({ slug, url, revoked }: { slug: string; url: string; revoked: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
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
