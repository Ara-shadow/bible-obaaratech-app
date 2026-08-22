import { FormEvent, useState } from "react";

const API = import.meta.env.VITE_API_URL || "";

export function MemberLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const response = await fetch(`${API}/api/member/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            data.message ||
            "Unable to sign in. Please check your details."
        );
        return;
      }

      window.location.href = "/member";
    } catch {
      setError(
        "The Bible AI service is not reachable. Please try again shortly."
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

      <div className="member-auth-shell">
        <div className="member-auth-brand">
          <a href="/" className="member-logo">
            ✦
          </a>

          <div>
            <strong>Obaaratech</strong>
            <span>Bible AI</span>
          </div>
        </div>

        <div className="member-auth-card">
          <div className="member-auth-heading">
            <div className="member-auth-icon">📖</div>

            <p className="member-auth-eyebrow">
              WELCOME BACK
            </p>

            <h1>Continue your Bible journey.</h1>

            <p>
              Sign in to keep your Bible studies, notes,
              conversations and personal learning journey
              together in one place.
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
            <label htmlFor="member-email">
              Email address
            </label>

            <div className="member-input-wrap">
              <span className="member-input-icon">
                ✉
              </span>

              <input
                id="member-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                disabled={busy}
              />
            </div>

            <label htmlFor="member-password">
              Password
            </label>

            <div className="member-input-wrap">
              <span className="member-input-icon">
                🔒
              </span>

              <input
                id="member-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                disabled={busy}
              />

              <button
                type="button"
                className="member-password-toggle"
                onClick={() =>
                  setShowPassword((value) => !value)
                }
                tabIndex={-1}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <div className="member-form-options">
              <label className="member-remember">
                <input type="checkbox" />

                <span>Remember me</span>
              </label>

              <button
                type="button"
                className="member-forgot"
                onClick={() => {
                  alert(
                    "Password recovery will be available soon."
                  );
                }}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="member-login-button"
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

          <div className="member-divider">
            <span>New to Bible AI?</span>
          </div>

          <a
            href="/register"
            className="member-register-button"
          >
            Create your free account
          </a>

          <p className="member-auth-footer-note">
            By continuing, you agree to use Bible AI as a
            study aid while keeping Scripture at the center
            of your study.
          </p>
        </div>

        <div className="member-auth-bottom">
          <a href="/">← Back to Bible AI</a>

          <span>•</span>

          <a href="/admin/login">Admin</a>
        </div>
      </div>
    </div>
  );
}