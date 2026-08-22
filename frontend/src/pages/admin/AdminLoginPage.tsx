import { FormEvent, useState } from "react";

const API = import.meta.env.VITE_API_URL || "";

export function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function login(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const r = await fetch(`${API}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password })
      });
      if (!r.ok) throw new Error("Invalid username or password.");
      window.location.href = "/admin";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-shell">
      <div className="admin-login">
        <div className="admin-brand">
          <span className="admin-logo">✦</span>
          <div><strong>Obaaratech Bible AI</strong><small>Content Administration</small></div>
        </div>
        <h1>Welcome back</h1>
        <p className="muted">Sign in to manage Bible Vibes and Kids Bible Stories.</p>
        <form onSubmit={login} className="admin-form">
          <label>Username<input value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username" required /></label>
          <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required /></label>
          {error && <div className="admin-error">{error}</div>}
          <button className="primary-btn" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        </form>
        <a className="back-link" href="/">← Back to Bible AI</a>
      </div>
    </main>
  );
}
