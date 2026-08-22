import { FormEvent, useState } from "react";

const API = import.meta.env.VITE_API_URL || "";

type LanguageCode =
  | "ENGLISH"
  | "YORUBA"
  | "IGBO"
  | "HAUSA"
  | "PIDGIN"
  | "FRENCH";

export function MemberRegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [language, setLanguage] =
    useState<LanguageCode>("ENGLISH");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setError("Please enter your full name.");
      return;
    }

    if (cleanName.length < 2) {
      setError("Your name must contain at least 2 characters.");
      return;
    }

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please create a password.");
      return;
    }

    if (password.length < 8) {
      setError(
        "Your password must contain at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setBusy(true);

    try {
      const response = await fetch(
        `${API}/api/member/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            fullName: cleanName,
            email: cleanEmail,
            password,
            language,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            data.message ||
            "Unable to create your account. Please try again."
        );

        return;
      }

      /*
       * Registration is successful.
       *
       * Your backend already creates the member session,
       * so we can take the new member directly to the
       * member dashboard.
       */
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
        {/* BRAND */}
        <div className="member-auth-brand">
          <a href="/" className="member-logo">
            ✦
          </a>

          <div>
            <strong>Obaaratech</strong>
            <span>Bible AI</span>
          </div>
        </div>

        {/* REGISTER CARD */}
        <div className="member-auth-card">
          <div className="member-auth-heading">
            <div className="member-auth-icon">
              ✨
            </div>

            <p className="member-auth-eyebrow">
              JOIN BIBLE AI
            </p>

            <h1>
              Start your Bible journey.
            </h1>

            <p>
              Create your free account and keep your
              Bible studies, notes, conversations and
              personal learning journey together in one
              place.
            </p>
          </div>

          {/* ERROR */}
          {error && (
            <div className="member-auth-error">
              <span>!</span>

              <p>{error}</p>
            </div>
          )}

          {/* FORM */}
          <form
            className="member-auth-form"
            onSubmit={handleSubmit}
          >
            {/* FULL NAME */}
            <label htmlFor="member-full-name">
              Full name
            </label>

            <div className="member-input-wrap">
              <span className="member-input-icon">
                👤
              </span>

              <input
                id="member-full-name"
                type="text"
                autoComplete="name"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(event) =>
                  setFullName(event.target.value)
                }
                disabled={busy}
              />
            </div>

            {/* EMAIL */}
            <label htmlFor="member-register-email">
              Email address
            </label>

            <div className="member-input-wrap">
              <span className="member-input-icon">
                ✉
              </span>

              <input
                id="member-register-email"
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

            {/* PASSWORD */}
            <label htmlFor="member-register-password">
              Password
            </label>

            <div className="member-input-wrap">
              <span className="member-input-icon">
                🔒
              </span>

              <input
                id="member-register-password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                autoComplete="new-password"
                placeholder="Create a password"
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
                  setShowPassword(
                    (value) => !value
                  )
                }
                tabIndex={-1}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <small className="member-password-hint">
              Use at least 8 characters.
            </small>

            {/* CONFIRM PASSWORD */}
            <label htmlFor="member-confirm-password">
              Confirm password
            </label>

            <div className="member-input-wrap">
              <span className="member-input-icon">
                🔐
              </span>

              <input
                id="member-confirm-password"
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                autoComplete="new-password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                disabled={busy}
              />

              <button
                type="button"
                className="member-password-toggle"
                onClick={() =>
                  setShowConfirmPassword(
                    (value) => !value
                  )
                }
                tabIndex={-1}
              >
                {showConfirmPassword
                  ? "Hide"
                  : "Show"}
              </button>
            </div>

            {/* LANGUAGE */}
            <label htmlFor="member-language">
              Preferred Bible language
            </label>

            <div className="member-input-wrap">
              <span className="member-input-icon">
                🌍
              </span>

              <select
                id="member-language"
                value={language}
                onChange={(event) =>
                  setLanguage(
                    event.target
                      .value as LanguageCode
                  )
                }
                disabled={busy}
              >
                <option value="ENGLISH">
                  English
                </option>

                <option value="YORUBA">
                  Yoruba
                </option>

                <option value="IGBO">
                  Igbo
                </option>

                <option value="HAUSA">
                  Hausa
                </option>

                <option value="PIDGIN">
                  Nigerian Pidgin
                </option>

                <option value="FRENCH">
                  French
                </option>
              </select>
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              className="member-login-button"
              disabled={busy}
            >
              {busy ? (
                <>
                  <span className="member-spinner" />
                  Creating account...
                </>
              ) : (
                <>
                  Create my account
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          {/* LOGIN LINK */}
          <div className="member-divider">
            <span>
              Already have an account?
            </span>
          </div>

          <a
            href="/login"
            className="member-register-button"
          >
            Sign in to Bible AI
          </a>

          {/* NOTE */}
          <p className="member-auth-footer-note">
            By creating an account, you agree to use
            Bible AI as a study aid while keeping
            Scripture at the center of your study.
          </p>
        </div>

        {/* BOTTOM NAV */}
        <div className="member-auth-bottom">
          <a href="/">
            ← Back to Bible AI
          </a>

          <span>•</span>

          <a href="/admin/login">
            Admin
          </a>
        </div>
      </div>
    </div>
  );
}
