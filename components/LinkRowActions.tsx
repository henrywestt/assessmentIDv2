"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LinkRowActions({ slug, url, revoked }: { slug: string; url: string; revoked: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

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

  return (
    <div className="links-actions">
      <button className="btn" onClick={copy}>Copy</button>
      {!revoked && (
        <button className="btn" onClick={revoke} disabled={busy}>
          {busy ? "Revoking…" : "Revoke"}
        </button>
      )}
    </div>
  );
}
