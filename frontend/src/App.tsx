import { useEffect, useState } from "react";

import { AdminLoginPage } from "./pages/admin/AdminLoginPage";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { RequireAdmin } from "./components/admin/RequireAdmin";

import { MemberLoginPage } from "./pages/member/MemberLoginPage";
import { MemberRegisterPage } from "./pages/member/MemberRegisterPage";
import { MemberDashboardPage } from "./pages/member/MemberDashboardPage";

const API = import.meta.env.VITE_API_URL || "";

type ChatMessage = {
  role: "You" | "Bible AI";
  content: string;
};

type PublicTab =
  | "chat"
  | "search"
  | "vibes"
  | "kids"
  | "sermon";

export function App() {
  const path = window.location.pathname;

  /*
   * MEMBER AUTHENTICATION
   */

  if (path === "/login") {
    return <MemberLoginPage />;
  }

  if (path === "/register") {
    return <MemberRegisterPage />;
  }

  /*
   * ADMIN
   */

  if (path === "/admin/login") {
    return <AdminLoginPage />;
  }

  if (path === "/admin" || path.startsWith("/admin/")) {
    return (
      <RequireAdmin>
        <AdminDashboardPage />
      </RequireAdmin>
    );
  }

  /*
   * MEMBER DASHBOARD
   */

if (path === "/member" || path.startsWith("/member/")) {
    return <MemberDashboardPage />;
}

  /*
   * PUBLIC BIBLE AI
   */

  return <PublicApp />;
}

function PublicApp() {
  const [tab, setTab] = useState<PublicTab>("chat");

  const [message, setMessage] = useState("");

  const [chat, setChat] = useState<ChatMessage[]>([]);

  const [query, setQuery] = useState("");

  const [results, setResults] = useState<any[]>([]);

  const [busy, setBusy] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  async function ask(question?: string) {
    const text = (question ?? message).trim();

    if (!text || busy) {
      return;
    }

    setChat((current) => [
      ...current,
      {
        role: "You",
        content: text,
      },
    ]);

    setMessage("");
    setBusy(true);

    try {
      const response = await fetch(`${API}/api/chat`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          message: text,
          language: "en",
        }),
      });

      const data = await response.json();

      setChat((current) => [
        ...current,
        {
          role: "Bible AI",
          content:
            data.content ||
            data.message ||
            data.error ||
            "No response.",
        },
      ]);
    } catch {
      setChat((current) => [
        ...current,
        {
          role: "Bible AI",
          content:
            "The Bible AI service is not reachable yet. Please try again shortly.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function search() {
    const text = query.trim();

    if (!text || busy) {
      return;
    }

    setBusy(true);

    try {
      const response = await fetch(
        `${API}/api/search?q=${encodeURIComponent(text)}`
      );

      const data = await response.json();

      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setBusy(false);
    }
  }

  function navigate(nextTab: PublicTab) {
    setTab(nextTab);
    setMobileMenuOpen(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <div className="public-app">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="public-header">
        <div className="public-header-inner">
          <button
            type="button"
            className="public-brand"
            onClick={() => navigate("chat")}
            aria-label="Go to Bible AI home"
          >
            <span className="public-brand-mark">
              ✦
            </span>

            <span className="public-brand-copy">
              <strong>Obaaratech</strong>
              <span>Bible AI</span>
            </span>
          </button>

          <nav
            className={`public-nav ${
              mobileMenuOpen
                ? "public-nav-open"
                : ""
            }`}
          >
            <button
              type="button"
              className={
                tab === "chat"
                  ? "public-nav-link active"
                  : "public-nav-link"
              }
              onClick={() => navigate("chat")}
            >
              Bible AI
            </button>

            <button
              type="button"
              className={
                tab === "search"
                  ? "public-nav-link active"
                  : "public-nav-link"
              }
              onClick={() => navigate("search")}
            >
              Bible Search
            </button>

            <button
              type="button"
              className={
                tab === "vibes"
                  ? "public-nav-link active"
                  : "public-nav-link"
              }
              onClick={() => navigate("vibes")}
            >
              Bible Vibes
            </button>

            <button
              type="button"
              className={
                tab === "kids"
                  ? "public-nav-link active"
                  : "public-nav-link"
              }
              onClick={() => navigate("kids")}
            >
              Kids Bible
            </button>

            <button
              type="button"
              className={
                tab === "sermon"
                  ? "public-nav-link active"
                  : "public-nav-link"
              }
              onClick={() => navigate("sermon")}
            >
              Sermon Prep
            </button>

            <div className="public-nav-actions">
              <a href="/login">Member Login</a>

              <a
                href="/register"
                className="public-nav-register"
              >
                Create account
              </a>
            </div>
          </nav>

          <button
            type="button"
            className="public-menu-button"
            onClick={() =>
              setMobileMenuOpen(
                (current) => !current
              )
            }
            aria-label="Toggle navigation"
            aria-expanded={mobileMenuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <main className="public-main">
        {tab === "chat" && (
          <>
            {/* =================================================
                HERO
            ================================================= */}

            <section className="bible-hero">
              <div className="bible-hero-background">
                <div className="hero-orb hero-orb-one" />
                <div className="hero-orb hero-orb-two" />
              </div>

              <div className="bible-hero-content">
                <div className="bible-hero-copy">
                  <div className="hero-badge">
                    <span className="hero-badge-dot" />
                    AI-POWERED BIBLE STUDY
                  </div>

                  <h1>
                    Explore Scripture with
                    <span>
                      clarity, context and care.
                    </span>
                  </h1>

                  <p className="hero-description">
                    Ask questions, explore passages
                    and discover biblical themes with
                    an AI study companion designed to
                    keep Scripture at the center.
                  </p>

                  <div className="hero-actions">
                    <button
                      type="button"
                      className="hero-primary-button"
                      onClick={() =>
                        document
                          .getElementById(
                            "bible-ai-workspace"
                          )
                          ?.scrollIntoView({
                            behavior: "smooth",
                          })
                      }
                    >
                      Start studying
                      <span>→</span>
                    </button>

                    <button
                      type="button"
                      className="hero-secondary-button"
                      onClick={() =>
                        navigate("search")
                      }
                    >
                      Explore Bible Search
                    </button>
                  </div>

                  <div className="hero-trust-row">
                    <span>✓ Scripture first</span>
                    <span>✓ Study-focused</span>
                    <span>✓ Built for everyone</span>
                  </div>
                </div>

                {/* HERO SCRIPTURE CARD */}

                <div className="hero-scripture-card">
                  <div className="hero-scripture-top">
                    <span>VERSE FOR TODAY</span>

                    <span className="hero-scripture-icon">
                      ✦
                    </span>
                  </div>

                  <blockquote>
                    "Your word is a lamp for my
                    feet, a light on my path."
                  </blockquote>

                  <div className="hero-scripture-reference">
                    Psalm 119:105
                  </div>

                  <div className="hero-scripture-line" />

                  <p>
                    Begin your study with Scripture,
                    then use Bible AI to explore
                    context and connections.
                  </p>
                </div>
              </div>
            </section>

            {/* =================================================
                AI WORKSPACE
            ================================================= */}

            <section
              id="bible-ai-workspace"
              className="ai-workspace-section"
            >
              <div className="section-heading centered">
                <div className="section-kicker">
                  BIBLE AI
                </div>

                <h2>
                  What would you like to explore?
                </h2>

                <p>
                  Ask a Bible question in your own
                  words. Bible AI will help you explore
                  Scripture and biblical context.
                </p>
              </div>

              <div className="ai-workspace">
                <div className="ai-workspace-header">
                  <div className="ai-workspace-title">
                    <div className="ai-avatar">
                      ✦
                    </div>

                    <div>
                      <strong>Bible AI</strong>

                      <span>
                        Scripture study assistant
                      </span>
                    </div>
                  </div>

                  <div className="ai-status">
                    <span />
                    Ready to study
                  </div>
                </div>

                <div className="ai-messages">
                  {chat.length === 0 ? (
                    <div className="ai-empty-state">
                      <div className="ai-empty-icon">
                        📖
                      </div>

                      <h3>
                        Start with a question
                      </h3>

                      <p>
                        Explore a passage, biblical
                        theme, character or question
                        you've been thinking about.
                      </p>

                      <div className="suggested-questions">
                        <button
                          type="button"
                          onClick={() =>
                            void ask(
                              "What does Psalm 23 teach about God's care?"
                            )
                          }
                        >
                          What does Psalm 23 teach
                          about God's care?
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void ask(
                              "What does the Bible teach about faith?"
                            )
                          }
                        >
                          What does the Bible teach
                          about faith?
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void ask(
                              "Tell me about the life of Joseph in the Bible."
                            )
                          }
                        >
                          Tell me about Joseph's
                          life in the Bible.
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="chat-history">
                      {chat.map((item, index) => (
                        <div
                          className={
                            item.role === "You"
                              ? "chat-message chat-message-user"
                              : "chat-message chat-message-ai"
                          }
                          key={`${item.role}-${index}`}
                        >
                          <div className="chat-message-avatar">
                            {item.role === "You"
                              ? "You"
                              : "✦"}
                          </div>

                          <div className="chat-message-body">
                            <div className="chat-message-name">
                              {item.role}
                            </div>

                            <p>{item.content}</p>
                          </div>
                        </div>
                      ))}

                      {busy && (
                        <div className="chat-message chat-message-ai">
                          <div className="chat-message-avatar">
                            ✦
                          </div>

                          <div className="chat-message-body">
                            <div className="chat-message-name">
                              Bible AI
                            </div>

                            <div className="typing-indicator">
                              <span />
                              <span />
                              <span />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="ai-composer">
                  <textarea
                    value={message}
                    onChange={(event) =>
                      setMessage(event.target.value)
                    }
                    placeholder="Ask Bible AI about Scripture..."
                    disabled={busy}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        (event.ctrlKey ||
                          event.metaKey)
                      ) {
                        event.preventDefault();

                        void ask();
                      }
                    }}
                  />

                  <div className="ai-composer-bottom">
                    <span>
                      Ctrl + Enter to send
                    </span>

                    <button
                      type="button"
                      onClick={() => void ask()}
                      disabled={
                        busy ||
                        !message.trim()
                      }
                    >
                      {busy
                        ? "Thinking..."
                        : "Ask Bible AI"}

                      <span>→</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* =================================================
                SCRIPTURE FIRST
            ================================================= */}

            <section className="scripture-first-section">
              <div className="scripture-first-inner">
                <div className="scripture-first-icon">
                  ✦
                </div>

                <div>
                  <div className="section-kicker">
                    OUR APPROACH
                  </div>

                  <h2>
                    Scripture remains at the
                    center.
                  </h2>

                  <p>
                    Bible AI is a study aid. It helps
                    you explore questions, discover
                    connections and understand context
                    while keeping the Bible, prayer and
                    wise pastoral counsel at the heart
                    of your journey.
                  </p>
                </div>
              </div>
            </section>

            {/* =================================================
                FEATURES
            ================================================= */}

            <section className="features-section">
              <div className="section-heading centered">
                <div className="section-kicker">
                  EXPLORE BIBLE AI
                </div>

                <h2>
                  Everything you need for deeper
                  Bible study.
                </h2>

                <p>
                  Move beyond a single conversation.
                  Explore Scripture, discover daily
                  inspiration and prepare to teach.
                </p>
              </div>

              <div className="feature-grid">
                <button
                  type="button"
                  className="feature-card"
                  onClick={() => navigate("chat")}
                >
                  <div className="feature-icon blue">
                    ✦
                  </div>

                  <div>
                    <h3>Bible AI</h3>

                    <p>
                      Ask questions and explore
                      biblical themes with an
                      intelligent study companion.
                    </p>

                    <span>
                      Start studying →
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  className="feature-card"
                  onClick={() => navigate("search")}
                >
                  <div className="feature-icon sky">
                    ⌕
                  </div>

                  <div>
                    <h3>Bible Search</h3>

                    <p>
                      Search indexed Scripture and
                      discover related passages and
                      cross-references.
                    </p>

                    <span>
                      Search Scripture →
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  className="feature-card"
                  onClick={() => navigate("vibes")}
                >
                  <div className="feature-icon gold">
                    ✨
                  </div>

                  <div>
                    <h3>Bible Vibes</h3>

                    <p>
                      Receive uplifting biblical
                      reflections designed for daily
                      encouragement.
                    </p>

                    <span>
                      Explore Bible Vibes →
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  className="feature-card"
                  onClick={() => navigate("kids")}
                >
                  <div className="feature-icon green">
                    ♡
                  </div>

                  <div>
                    <h3>Kids Bible</h3>

                    <p>
                      Help children discover Bible
                      stories through simple,
                      engaging content.
                    </p>

                    <span>
                      Explore Kids Bible →
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  className="feature-card"
                  onClick={() => navigate("sermon")}
                >
                  <div className="feature-icon purple">
                    ◈
                  </div>

                  <div>
                    <h3>Sermon Prep</h3>

                    <p>
                      Organize topics, passages and
                      AI-assisted study material for
                      sermon preparation.
                    </p>

                    <span>
                      Prepare a sermon →
                    </span>
                  </div>
                </button>

                <a
                  href="/register"
                  className="feature-card feature-card-member"
                >
                  <div className="feature-icon dark">
                    👤
                  </div>

                  <div>
                    <h3>Member Journey</h3>

                    <p>
                      Create a free account and keep
                      your conversations, studies and
                      personal Bible journey together.
                    </p>

                    <span>
                      Create free account →
                    </span>
                  </div>
                </a>
              </div>
            </section>

            {/* =================================================
                MEMBER CTA
            ================================================= */}

            <section className="member-cta">
              <div className="member-cta-content">
                <div>
                  <div className="section-kicker light">
                    YOUR BIBLE JOURNEY
                  </div>

                  <h2>
                    Study today. Grow tomorrow.
                  </h2>

                  <p>
                    Create your free Bible AI account
                    and build a personal space for your
                    conversations, studies and
                    discoveries.
                  </p>
                </div>

                <a
                  href="/register"
                  className="member-cta-button"
                >
                  Create your free account
                  <span>→</span>
                </a>
              </div>
            </section>
          </>
        )}

        {tab === "search" && (
          <section className="content public-inner-page">
            <div className="inner-page-header">
              <div>
                <div className="section-kicker">
                  SCRIPTURE EXPLORER
                </div>

                <h2>Bible Search</h2>

                <p>
                  Search indexed Bible passages and
                  discover related themes and
                  cross-references.
                </p>
              </div>
            </div>

            <div className="searchbar public-searchbar">
              <input
                value={query}
                onChange={(event) =>
                  setQuery(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void search();
                  }
                }}
                placeholder="e.g. protection, faith, Psalm 23:1"
              />

              <button
                type="button"
                onClick={() => void search()}
                disabled={busy}
              >
                {busy ? "Searching..." : "Search"}
              </button>
            </div>

            <div className="cards public-result-grid">
              {results.map((result) => (
                <article
                  key={
                    result.reference ||
                    result.id
                  }
                >
                  <strong>
                    {result.reference}
                  </strong>

                  <p>{result.text}</p>

                  <small>
                    {result.bookName} ·{" "}
                    {result.testament} ·{" "}
                    {result.genre}
                  </small>

                  <CrossRefs
                    reference={result.reference}
                  />
                </article>
              ))}
            </div>

            {results.length === 0 && (
              <div className="empty-content-card">
                <div>📖</div>

                <h3>
                  Search the Scriptures
                </h3>

                <p>
                  Enter a verse, Bible reference,
                  theme or keyword above to begin.
                </p>
              </div>
            )}
          </section>
        )}

        {tab === "vibes" && (
          <ContentFeed
            endpoint="/api/content/vibes"
            title="Bible Vibes"
            field="reflection"
          />
        )}

        {tab === "kids" && (
          <ContentFeed
            endpoint="/api/content/stories"
            title="Kids Bible"
            field="body"
          />
        )}

        {tab === "sermon" && <Sermon />}
      </main>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="public-footer">
        <div className="public-footer-inner">
          <div className="footer-brand">
            <div className="footer-brand-mark">
              ✦
            </div>

            <div>
              <strong>Obaaratech Bible AI</strong>

              <p>
                Building technology. Creating
                possibilities. Helping people explore
                Scripture with care.
              </p>
            </div>
          </div>

          <div className="footer-links">
            <button
              type="button"
              onClick={() => navigate("chat")}
            >
              Bible AI
            </button>

            <button
              type="button"
              onClick={() => navigate("search")}
            >
              Bible Search
            </button>

            <button
              type="button"
              onClick={() => navigate("vibes")}
            >
              Bible Vibes
            </button>

            <button
              type="button"
              onClick={() => navigate("kids")}
            >
              Kids Bible
            </button>

            <button
              type="button"
              onClick={() => navigate("sermon")}
            >
              Sermon Prep
            </button>

            <a href="/login">Member Login</a>

            <a href="/admin/login">Admin</a>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} Obaaratech
            · Bible AI
          </span>

          <span>
            Scripture first · AI assisted
          </span>
        </div>
      </footer>
    </div>
  );
}

/* =========================================================
   CONTENT FEED
========================================================= */

function ContentFeed({
  endpoint,
  title,
  field,
}: {
  endpoint: string;
  title: string;
  field: string;
}) {
  const [items, setItems] = useState<any[] | null>(
    null
  );

  useEffect(() => {
    let active = true;

    fetch(`${API}${endpoint}`)
      .then((response) => response.json())
      .then((data) => {
        if (active) {
          setItems(
            Array.isArray(data)
              ? data
              : data.items || []
          );
        }
      })
      .catch(() => {
        if (active) {
          setItems([]);
        }
      });

    return () => {
      active = false;
    };
  }, [endpoint]);

  return (
    <section className="content public-inner-page">
      <div className="inner-page-header">
        <div>
          <div className="section-kicker">
            OBAARATECH
          </div>

          <h2>{title}</h2>

          <p>
            Explore biblical content created to
            encourage, teach and help you grow.
          </p>
        </div>
      </div>

      {items === null ? (
        <div className="empty-content-card">
          <div className="content-loader" />

          <p>Loading content...</p>
        </div>
      ) : items.length > 0 ? (
        <div className="cards public-result-grid">
          {items.map((item) => (
            <article key={item.id}>
              <div className="feed-card-label">
                {item.publishDate
                  ? new Date(
                      item.publishDate
                    ).toLocaleDateString()
                  : "Bible AI"}
              </div>

              <h3>
                {item.title || "Bible AI"}
              </h3>

              <p>{item[field]}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-content-card">
          <div>✦</div>

          <h3>
            No published content yet.
          </h3>

          <p>
            New Bible content will appear here
            when it is published.
          </p>
        </div>
      )}
    </section>
  );
}

/* =========================================================
   CROSS REFERENCES
========================================================= */

function CrossRefs({
  reference,
}: {
  reference: string;
}) {
  const [items, setItems] = useState<any[] | null>(
    null
  );

  const [open, setOpen] = useState(false);

  async function load() {
    if (items !== null) {
      setOpen((value) => !value);
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/cross-references?reference=${encodeURIComponent(
          reference
        )}&limit=8`
      );

      const data = await response.json();

      setItems(data.crossReferences || []);

      setOpen(true);
    } catch {
      setItems([]);

      setOpen(true);
    }
  }

  return (
    <div className="crossrefs">
      <button
        type="button"
        className="link-button"
        onClick={() => void load()}
      >
        {open
          ? "Hide related Scriptures"
          : "Related Scriptures"}
      </button>

      {open && (
        <div className="crossref-list">
          {items && items.length > 0 ? (
            items.map((item) => (
              <div key={item.reference}>
                <b>{item.reference}</b>

                <span>{item.text}</span>
              </div>
            ))
          ) : (
            <small>
              No indexed cross-references found.
            </small>
          )}

          <small className="source-note">
            Cross-reference source: OpenBible.info,
            primarily TSK-derived (CC BY).
          </small>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   SERMON PREPARATION
========================================================= */

function Sermon() {
  const [topic, setTopic] = useState("");

  const [data, setData] = useState<any>(null);

  const [busy, setBusy] = useState(false);

  async function go() {
    const text = topic.trim();

    if (!text || busy) {
      return;
    }

    setBusy(true);

    try {
      const response = await fetch(
        `${API}/api/sermon-prep`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            topic: text,
            language: "en",
          }),
        }
      );

      setData(await response.json());
    } catch {
      setData({
        error:
          "Sermon preparation is temporarily unavailable.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="content public-inner-page">
      <div className="inner-page-header">
        <div>
          <div className="section-kicker">
            TEACH · PREPARE · STUDY
          </div>

          <h2>Sermon Preparation</h2>

          <p>
            Use indexed passages and
            cross-references as a study aid.
            AI-assisted commentary is clearly
            separated from Scripture.
          </p>
        </div>
      </div>

      <div className="sermon-workspace">
        <div className="searchbar public-searchbar">
          <input
            value={topic}
            onChange={(event) =>
              setTopic(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void go();
              }
            }}
            placeholder="Enter a sermon topic"
          />

          <button
            type="button"
            onClick={() => void go()}
            disabled={busy}
          >
            {busy ? "Preparing..." : "Prepare"}
          </button>
        </div>

        {data && (
          <div className="sermon-result">
            {data.error ? (
              <p className="admin-error">
                {data.error}
              </p>
            ) : (
              <>
                <div className="sermon-section">
                  <div className="section-kicker">
                    SCRIPTURE
                  </div>

                  <h3>Primary passages</h3>

                  {data.primaryPassages?.map(
                    (passage: any) => (
                      <div
                        className="sermon-passage"
                        key={
                          passage.reference
                        }
                      >
                        <strong>
                          {passage.reference}
                        </strong>

                        <p>
                          {passage.text}
                        </p>
                      </div>
                    )
                  )}
                </div>

                <div className="sermon-section ai-commentary">
                  <div className="section-kicker">
                    AI-ASSISTED STUDY
                  </div>

                  <h3>
                    AI-assisted commentary
                  </h3>

                  <p>{data.synthesis}</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
