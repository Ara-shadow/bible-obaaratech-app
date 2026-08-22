import { useEffect, useState } from "react";
import { MemberShell } from "../../components/member/MemberShell";

const API = import.meta.env.VITE_API_URL || "";

type MemberData = {
  id?: string;
  fullName?: string;
  email?: string;
  language?: string;
};

type DashboardStats = {
  conversations: number;
  searches: number;
  savedStudies: number;
};

export function MemberDashboardPage() {
  const [member, setMember] = useState<MemberData | null>(
    null
  );

  const [stats, setStats] = useState<DashboardStats>({
    conversations: 0,
    searches: 0,
    savedStudies: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        /*
         * Load the currently authenticated member.
         *
         * This expects the backend to expose:
         *
         * GET /api/member/me
         *
         * with the member session cookie.
         */
        const memberResponse = await fetch(
          `${API}/api/member/me`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!memberResponse.ok) {
          if (memberResponse.status === 401) {
            window.location.href = "/login";
            return;
          }

          throw new Error(
            "Unable to load member information."
          );
        }

        const memberData =
          await memberResponse.json();

        if (!active) {
          return;
        }

        setMember(
          memberData.member ||
            memberData.user ||
            memberData
        );

        /*
         * Dashboard statistics are intentionally
         * defensive.
         *
         * If the statistics endpoint is not available
         * yet, the dashboard simply displays zeroes
         * rather than breaking.
         */
        try {
          const statsResponse = await fetch(
            `${API}/api/member/dashboard`,
            {
              method: "GET",
              credentials: "include",
            }
          );

          if (statsResponse.ok) {
            const statsData =
              await statsResponse.json();

            if (!active) {
              return;
            }

            setStats({
              conversations:
                Number(
                  statsData.conversations ??
                    statsData.stats
                      ?.conversations ??
                    0
                ),
              searches:
                Number(
                  statsData.searches ??
                    statsData.stats?.searches ??
                    0
                ),
              savedStudies:
                Number(
                  statsData.savedStudies ??
                    statsData.stats
                      ?.savedStudies ??
                    0
                ),
            });
          }
        } catch {
          /*
           * Statistics are optional at this stage.
           * Keep the dashboard usable.
           */
        }
      } catch {
        if (!active) {
          return;
        }

        /*
         * If the member endpoint isn't implemented yet,
         * don't crash the dashboard.
         *
         * The production backend will provide the
         * authenticated member information.
         */
        setMember(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const displayName =
    member?.fullName?.trim() || "Bible AI Member";

  const firstName =
    displayName.split(/\s+/)[0] || "Friend";

  const language =
    formatLanguage(member?.language);

  return (
    <MemberShell activePage="dashboard">
      <section className="member-dashboard">
        {/* =====================================================
            WELCOME
            ===================================================== */}
        <div className="member-welcome">
          <div className="member-welcome-copy">
            <p className="member-section-eyebrow">
              WELCOME BACK
            </p>

            <h2>
              Hello, {firstName}.
            </h2>

            <p>
              Continue exploring Scripture,
              asking questions and growing in
              your understanding of God's Word.
            </p>
          </div>

          <div className="member-welcome-badge">
            <span>📖</span>

            <div>
              <strong>
                Scripture first
              </strong>

              <small>
                AI assisted Bible study
              </small>
            </div>
          </div>
        </div>

        {/* =====================================================
            QUICK ACTIONS
            ===================================================== */}
        <section className="member-dashboard-section">
          <div className="member-section-heading">
            <div>
              <p className="member-section-eyebrow">
                QUICK ACTIONS
              </p>

              <h3>
                Where would you like to begin?
              </h3>
            </div>
          </div>

          <div className="member-quick-grid">
            <a
              href="/"
              className="member-action-card primary"
            >
              <span className="member-action-icon">
                ✦
              </span>

              <span className="member-action-content">
                <strong>
                  Ask Bible AI
                </strong>

                <small>
                  Ask questions and explore
                  Scripture with AI assistance.
                </small>
              </span>

              <span className="member-action-arrow">
                →
              </span>
            </a>

            <a
              href="/?tab=search"
              className="member-action-card"
            >
              <span className="member-action-icon">
                ⌕
              </span>

              <span className="member-action-content">
                <strong>
                  Search Scripture
                </strong>

                <small>
                  Find Bible passages,
                  themes and related Scriptures.
                </small>
              </span>

              <span className="member-action-arrow">
                →
              </span>
            </a>

            <a
              href="/?tab=vibes"
              className="member-action-card"
            >
              <span className="member-action-icon">
                ♥
              </span>

              <span className="member-action-content">
                <strong>
                  Bible Vibes
                </strong>

                <small>
                  Discover daily reflections
                  and encouraging Scripture.
                </small>
              </span>

              <span className="member-action-arrow">
                →
              </span>
            </a>

            <a
              href="/?tab=sermon"
              className="member-action-card"
            >
              <span className="member-action-icon">
                ▤
              </span>

              <span className="member-action-content">
                <strong>
                  Sermon Prep
                </strong>

                <small>
                  Explore passages and prepare
                  your next Bible study or sermon.
                </small>
              </span>

              <span className="member-action-arrow">
                →
              </span>
            </a>
          </div>
        </section>

        {/* =====================================================
            OVERVIEW
            ===================================================== */}
        <section className="member-dashboard-section">
          <div className="member-section-heading">
            <div>
              <p className="member-section-eyebrow">
                YOUR OVERVIEW
              </p>

              <h3>
                Your Bible AI activity
              </h3>
            </div>
          </div>

          <div className="member-stats-grid">
            <article className="member-stat-card">
              <div className="member-stat-icon">
                ✦
              </div>

              <div>
                <span>
                  AI conversations
                </span>

                <strong>
                  {stats.conversations}
                </strong>
              </div>
            </article>

            <article className="member-stat-card">
              <div className="member-stat-icon">
                ⌕
              </div>

              <div>
                <span>
                  Bible searches
                </span>

                <strong>
                  {stats.searches}
                </strong>
              </div>
            </article>

            <article className="member-stat-card">
              <div className="member-stat-icon">
                ★
              </div>

              <div>
                <span>
                  Saved studies
                </span>

                <strong>
                  {stats.savedStudies}
                </strong>
              </div>
            </article>
          </div>
        </section>

        {/* =====================================================
            BIBLE STUDY CARD
            ===================================================== */}
        <section className="member-study-grid">
          <article className="member-scripture-card">
            <div className="member-scripture-card-top">
              <span className="member-card-label">
                VERSE FOR TODAY
              </span>

              <span className="member-scripture-icon">
                ✝
              </span>
            </div>

            <blockquote>
              “Your word is a lamp to my feet
              and a light to my path.”
            </blockquote>

            <div className="member-scripture-reference">
              Psalm 119:105
            </div>

            <p>
              Let Scripture guide your steps
              today. Take a moment to read the
              surrounding passage and reflect on
              what God may be teaching you.
            </p>

            <a
              href="/?tab=search"
              className="member-card-link"
            >
              Explore this Scripture
              <span>→</span>
            </a>
          </article>

          <article className="member-study-card">
            <div className="member-study-card-icon">
              📚
            </div>

            <p className="member-card-label">
              STUDY WITH PURPOSE
            </p>

            <h3>
              Keep Scripture at the center.
            </h3>

            <p>
              Bible AI can help you explore
              passages, compare themes and
              organize your thoughts. Always
              return to the biblical text itself
              as the foundation of your study.
            </p>

            <div className="member-study-points">
              <div>
                <span>✓</span>
                <p>
                  Read the biblical passage
                  first.
                </p>
              </div>

              <div>
                <span>✓</span>
                <p>
                  Compare related Scriptures.
                </p>
              </div>

              <div>
                <span>✓</span>
                <p>
                  Use AI as a study aid.
                </p>
              </div>
            </div>
          </article>
        </section>

        {/* =====================================================
            MEMBER INFORMATION
            ===================================================== */}
        <section className="member-dashboard-section">
          <div className="member-section-heading">
            <div>
              <p className="member-section-eyebrow">
                YOUR ACCOUNT
              </p>

              <h3>
                Study preferences
              </h3>
            </div>

            <a
              href="/member/profile"
              className="member-section-link"
            >
              Manage profile →
            </a>
          </div>

          <div className="member-preferences-card">
            <div className="member-preference">
              <span className="member-preference-icon">
                👤
              </span>

              <div>
                <small>
                  Full name
                </small>

                <strong>
                  {loading
                    ? "Loading..."
                    : displayName}
                </strong>
              </div>
            </div>

            <div className="member-preference">
              <span className="member-preference-icon">
                ✉
              </span>

              <div>
                <small>
                  Email address
                </small>

                <strong>
                  {loading
                    ? "Loading..."
                    : member?.email ||
                      "Not available"}
                </strong>
              </div>
            </div>

            <div className="member-preference">
              <span className="member-preference-icon">
                🌍
              </span>

              <div>
                <small>
                  Preferred language
                </small>

                <strong>
                  {loading
                    ? "Loading..."
                    : language}
                </strong>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            TRUST / SAFETY NOTE
            ===================================================== */}
        <aside className="member-dashboard-trust">
          <div className="member-dashboard-trust-icon">
            !
          </div>

          <div>
            <strong>
              Scripture first. Always.
            </strong>

            <p>
              Bible AI is designed to support
              Bible study. AI-generated
              explanations should be checked
              against Scripture and should not
              replace the Bible, prayer, sound
              teaching or wise pastoral counsel.
            </p>
          </div>
        </aside>
      </section>
    </MemberShell>
  );
}

function formatLanguage(
  language?: string
) {
  switch (language) {
    case "YORUBA":
      return "Yoruba";

    case "IGBO":
      return "Igbo";

    case "HAUSA":
      return "Hausa";

    case "PIDGIN":
      return "Nigerian Pidgin";

    case "FRENCH":
      return "French";

    case "ENGLISH":
      return "English";

    default:
      return "English";
  }
}