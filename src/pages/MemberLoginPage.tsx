import { FormEvent, useState } from "react";

const API = import.meta.env.VITE_API_URL || "";

export function MemberLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const response = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Unable to sign in. Please check your details."
        );
        return;
      }

      window.location.href = "/account";
    } catch {
      setError(
        "Unable to connect to Bible AI. Please try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="member-auth-page">
      <div className="member-auth-background">
        <div className="member-auth-glow member-auth-glow-one" />
        <div className="member-auth-glow member-auth-glow-two" />
      </div>

      <div className="member-auth-container">
        <a href="/" className="member-auth-brand">
          <span className="member-auth-logo">OB</span>

          <span>
            <strong>Obaaratech</strong>
            <small>Bible AI</small>
          </span>
        </a>

        <div className="member-auth-card">
          <div className="member-auth-icon">
            ✦
          </div>

          <div className="member-auth-heading">
            <p className="member-auth-eyebrow">
              WELCOME BACK
            </p>

            <h1>Continue your Bible journey.</h1>

            <p>
              Sign in to access your conversations,
              notes, saved Scriptures and personal
              Bible study space.
            </p>
          </div>

          {error && (
            <div className="member-auth-error">
              <span>!</span>
              <p>{error}</p>
            </div>
          )}

          <form
            className="member-auth-form"
            onSubmit={handleSubmit}
          >
            <label>
              Email address

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                autoComplete="email"
                disabled={busy}
              />
            </label>

            <label>
              Password

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={busy}
              />
            </label>

            <button
              type="submit"
              className="member-auth-submit"
              disabled={busy}
            >
              {busy ? (
                <>
                  <span className="member-spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          <div className="member-auth-divider">
            <span />
            <small>OR</small>
            <span />
          </div>

          <p className="member-auth-register">
            Don't have an account yet?
            <a href="/register">
              Create your free account
            </a>
          </p>

          <p className="member-auth-back">
            <a href="/">
              ← Back to Bible AI
            </a>
          </p>
        </div>

        <div className="member-auth-trust">
          <span>🔒</span>
          <p>
            Your Bible study space is private and
            protected.
          </p>
        </div>
      </div>
    </div>
  );
}