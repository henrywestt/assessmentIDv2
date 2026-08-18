"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Unlock({ slug, clientName }: { slug: string; clientName: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Incorrect password");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="unlock-panel">
      <img src="/bastion-logo.png" alt="Bastion" className="brand-logo" />
      <h1>{clientName}</h1>
      <p className="lede">Enter the password you were given to view this assessment.</p>
      <form onSubmit={submit}>
        <input
          className="text-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        {error && <span className="unlock-error">{error}</span>}
        <button className="btn primary" type="submit" disabled={busy || !password}>
          {busy ? "Checking…" : "View assessment"}
        </button>
      </form>
    </div>
  );
}
