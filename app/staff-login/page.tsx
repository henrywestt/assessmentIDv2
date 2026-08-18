"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StaffLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/staff-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Incorrect password");
      router.push("/");
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
      <h1>Staff sign in</h1>
      <p className="lede">Enter the shared staff password to continue.</p>
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
          {busy ? "Checking…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
