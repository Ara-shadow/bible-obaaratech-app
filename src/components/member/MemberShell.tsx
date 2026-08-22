import { ReactNode } from "react";

type MemberShellProps = {
  children: ReactNode;
  activePage?: string;
};

export function MemberShell({
  children,
  activePage = "dashboard",
}: MemberShellProps) {
  function logout() {
    /*
     * The backend should eventually expose a dedicated
     * logout endpoint that clears the member session cookie.
     *
     * For now, return the user to the public Bible AI page.
     */
    window.location.href = "/";
  }

  const navigation = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "⌂",
      href: "/member",
    },
    {
      id: "bible-ai",
      label: "Bible AI",
      icon: "✦",
      href: "/",
    },
    {
      id: "bible-search",
      label: "Bible Search",
      icon: "⌕",
      href: "/?tab=search",
    },
    {
      id: "bible-vibes",
      label: "Bible Vibes",
      icon: "♥",
      href: "/?tab=vibes",
    },
    {
      id: "kids-bible",
      label: "Kids Bible",
      icon: "★",
      href: "/?tab=kids",
    },
    {
      id: "sermon",
      label: "Sermon Prep",
      icon: "▤",
      href: "/?tab=sermon",
    },
  ];

  return (
    <div className="member-app">
      {/* =====================================================
          MOBILE TOP BAR
          ===================================================== */}
      <header className="member-mobile-header">
        <a
          href="/member"
          className="member-mobile-brand"
          aria-label="Bible AI member dashboard"
        >
          <span className="member-mobile-logo">✦</span>

          <span>
            <strong>Obaaratech</strong>
            <small>Bible AI</small>
          </span>
        </a>

        <a
          href="/"
          className="member-mobile-home"
          aria-label="Back to Bible AI"
        >
          ↗
        </a>
      </header>

      {/* =====================================================
          SIDEBAR
          ===================================================== */}
      <aside className="member-sidebar">
        <div className="member-sidebar-top">
          <a
            href="/member"
            className="member-sidebar-brand"
            aria-label="Bible AI member dashboard"
          >
            <span className="member-sidebar-logo">
              ✦
            </span>

            <span className="member-sidebar-brand-text">
              <strong>Obaaratech</strong>
              <small>Bible AI</small>
            </span>
          </a>
        </div>

        <div className="member-sidebar-label">
          YOUR STUDY
        </div>

        <nav className="member-sidebar-nav">
          {navigation.map((item) => {
            const isActive =
              activePage === item.id;

            return (
              <a
                key={item.id}
                href={item.href}
                className={
                  isActive
                    ? "member-nav-link active"
                    : "member-nav-link"
                }
                aria-current={
                  isActive ? "page" : undefined
                }
              >
                <span className="member-nav-icon">
                  {item.icon}
                </span>

                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        <div className="member-sidebar-divider" />

        <div className="member-sidebar-label">
          ACCOUNT
        </div>

        <nav className="member-sidebar-nav">
          <a
            href="/member/profile"
            className={
              activePage === "profile"
                ? "member-nav-link active"
                : "member-nav-link"
            }
          >
            <span className="member-nav-icon">
              ◉
            </span>

            <span>My Profile</span>
          </a>

          <a
            href="/member/settings"
            className={
              activePage === "settings"
                ? "member-nav-link active"
                : "member-nav-link"
            }
          >
            <span className="member-nav-icon">
              ⚙
            </span>

            <span>Settings</span>
          </a>
        </nav>

        <div className="member-sidebar-spacer" />

        <div className="member-sidebar-footer">
          <div className="member-sidebar-scripture">
            <span>“</span>

            <p>
              Your word is a lamp to my feet
              and a light to my path.
            </p>

            <small>Psalm 119:105</small>
          </div>

          <button
            type="button"
            className="member-logout-button"
            onClick={logout}
          >
            <span>↪</span>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* =====================================================
          MAIN AREA
          ===================================================== */}
      <div className="member-main">
        {/* Desktop top bar */}
        <header className="member-topbar">
          <div className="member-topbar-left">
            <div>
              <p className="member-topbar-eyebrow">
                BIBLE AI MEMBER AREA
              </p>

              <h1>
                Your Bible journey
              </h1>
            </div>
          </div>

          <div className="member-topbar-actions">
            <a
              href="/"
              className="member-view-public"
            >
              <span>↗</span>
              Bible AI
            </a>

            <a
              href="/member/profile"
              className="member-profile-button"
              aria-label="Open profile"
            >
              <span className="member-profile-avatar">
                M
              </span>

              <span className="member-profile-label">
                My Account
              </span>
            </a>
          </div>
        </header>

        {/* Page content */}
        <main className="member-content">
          {children}
        </main>

        {/* Footer */}
        <footer className="member-footer">
          <span>
            © {new Date().getFullYear()} Obaaratech
          </span>

          <span className="member-footer-dot">
            •
          </span>

          <span>
            Bible AI · Scripture first, AI assisted.
          </span>
        </footer>
      </div>
    </div>
  );
}