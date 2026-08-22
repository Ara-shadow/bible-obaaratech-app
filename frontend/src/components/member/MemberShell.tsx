import { ReactNode, useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "";

type MemberShellProps = {
  children: ReactNode;
  activePage?: "dashboard" | "profile" | "studies" | "history";
};

type MemberData = {
  id?: string;
  fullName?: string;
  email?: string;
  language?: string;
};

export function MemberShell({
  children,
  activePage = "dashboard",
}: MemberShellProps) {
  const [member, setMember] = useState<MemberData | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadMember() {
      try {
        const response = await fetch(`${API}/api/member/me`, {
          method: "GET",
          credentials: "include",
        });

        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        if (!active) {
          return;
        }

        setMember(
          data.member ||
            data.user ||
            data ||
            null
        );
      } catch {
        /*
         * The dashboard itself will handle the
         * absence of member information gracefully.
         */
      }
    }

    void loadMember();

    return () => {
      active = false;
    };
  }, []);

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      /*
       * The backend should invalidate the current
       * member session through this endpoint.
       *
       * If the endpoint is temporarily unavailable,
       * we still return the user to the public page.
       */
      await fetch(`${API}/api/member/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /*
       * Navigation still happens below.
       */
    } finally {
      window.location.href = "/";
    }
  }

  const displayName =
    member?.fullName?.trim() || "Bible AI Member";

  const firstName =
    displayName.split(/\s+/)[0] || "Member";

  return (
    <div className="member-app">
      {/* =====================================================
          MOBILE OVERLAY
          ===================================================== */}
      {mobileOpen && (
        <button
          type="button"
          className="member-sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* =====================================================
          SIDEBAR
          ===================================================== */}
      <aside
        className={`member-sidebar ${
          mobileOpen ? "mobile-open" : ""
        }`}
      >
        <div className="member-sidebar-brand">
          <a
            href="/member"
            className="member-sidebar-logo"
            aria-label="Bible AI dashboard"
          >
            ✦
          </a>

          <div>
            <strong>Obaaratech</strong>

            <span>Bible AI</span>
          </div>

          <button
            type="button"
            className="member-sidebar-close"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          >
            ×
          </button>
        </div>

        {/* ===================================================
            PRIMARY NAVIGATION
            =================================================== */}
        <nav className="member-sidebar-nav">
          <p className="member-sidebar-label">
            YOUR BIBLE AI
          </p>

          <a
            href="/member"
            className={
              activePage === "dashboard"
                ? "member-nav-link active"
                : "member-nav-link"
            }
            onClick={() => setMobileOpen(false)}
          >
            <span className="member-nav-icon">
              ▦
            </span>

            <span>Dashboard</span>
          </a>

          <a
            href="/?tab=chat"
            className="member-nav-link"
            onClick={() => setMobileOpen(false)}
          >
            <span className="member-nav-icon">
              ✦
            </span>

            <span>Bible AI</span>
          </a>

          <a
            href="/?tab=search"
            className="member-nav-link"
            onClick={() => setMobileOpen(false)}
          >
            <span className="member-nav-icon">
              ⌕
            </span>

            <span>Bible Search</span>
          </a>

          <a
            href="/?tab=vibes"
            className="member-nav-link"
            onClick={() => setMobileOpen(false)}
          >
            <span className="member-nav-icon">
              ♥
            </span>

            <span>Bible Vibes</span>
          </a>

          <a
            href="/?tab=kids"
            className="member-nav-link"
            onClick={() => setMobileOpen(false)}
          >
            <span className="member-nav-icon">
              ★
            </span>

            <span>Kids Bible</span>
          </a>

          <a
            href="/?tab=sermon"
            className="member-nav-link"
            onClick={() => setMobileOpen(false)}
          >
            <span className="member-nav-icon">
              ▤
            </span>

            <span>Sermon Prep</span>
          </a>

          <p className="member-sidebar-label member-sidebar-label-spaced">
            ACCOUNT
          </p>

          <a
            href="/member/profile"
            className={
              activePage === "profile"
                ? "member-nav-link active"
                : "member-nav-link"
            }
            onClick={() => setMobileOpen(false)}
          >
            <span className="member-nav-icon">
              👤
            </span>

            <span>My Profile</span>
          </a>

          <a
            href="/member/studies"
            className={
              activePage === "studies"
                ? "member-nav-link active"
                : "member-nav-link"
            }
            onClick={() => setMobileOpen(false)}
          >
            <span className="member-nav-icon">
              📚
            </span>

            <span>Saved Studies</span>
          </a>

          <a
            href="/member/history"
            className={
              activePage === "history"
                ? "member-nav-link active"
                : "member-nav-link"
            }
            onClick={() => setMobileOpen(false)}
          >
            <span className="member-nav-icon">
              ◷
            </span>

            <span>Study History</span>
          </a>
        </nav>

        {/* ===================================================
            SIDEBAR FOOTER
            =================================================== */}
        <div className="member-sidebar-footer">
          <div className="member-sidebar-user">
            <div className="member-sidebar-avatar">
              {firstName.charAt(0).toUpperCase()}
            </div>

            <div className="member-sidebar-user-info">
              <strong>{firstName}</strong>

              <span>Member</span>
            </div>
          </div>

          <button
            type="button"
            className="member-logout-button"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
          >
            <span>↪</span>

            {loggingOut
              ? "Signing out..."
              : "Sign out"}
          </button>
        </div>
      </aside>

      {/* =====================================================
          MAIN AREA
          ===================================================== */}
      <div className="member-main">
        {/* ===================================================
            TOP BAR
            =================================================== */}
        <header className="member-topbar">
          <div className="member-topbar-left">
            <button
              type="button"
              className="member-menu-button"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <span />
              <span />
              <span />
            </button>

            <div className="member-topbar-title">
              <span>BIBLE AI</span>

              <strong>
                {activePage === "dashboard"
                  ? "Dashboard"
                  : activePage === "profile"
                  ? "My Profile"
                  : activePage === "studies"
                  ? "Saved Studies"
                  : activePage === "history"
                  ? "Study History"
                  : "Bible AI"}
              </strong>
            </div>
          </div>

          <div className="member-topbar-actions">
            <a
              href="/"
              className="member-view-site"
            >
              <span>↗</span>
              View Bible AI
            </a>

            <a
              href="/member/profile"
              className="member-topbar-avatar"
              aria-label="Open profile"
            >
              {firstName.charAt(0).toUpperCase()}
            </a>
          </div>
        </header>

        {/* ===================================================
            CONTENT
            =================================================== */}
        <main className="member-main-content">
          {children}
        </main>

        {/* ===================================================
            FOOTER
            =================================================== */}
        <footer className="member-footer">
          <div>
            © {new Date().getFullYear()} Obaaratech Bible AI
          </div>

          <div className="member-footer-links">
            <a href="/">Bible AI</a>

            <span>•</span>

            <a href="/?tab=search">
              Bible Search
            </a>

            <span>•</span>

            <a href="/member/profile">
              Profile
            </a>
          </div>

          <p>
            Scripture first · AI assisted Bible study
          </p>
        </footer>
      </div>
    </div>
  );
}