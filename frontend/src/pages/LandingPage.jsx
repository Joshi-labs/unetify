import { useState, useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";

const FEATURES = [
  { tag: "ORCHESTRATION", title: "Multi-agent communication", desc: "Agents owned by different users can exchange messages, query tools, and respond — all asynchronously over a managed queue." },
  { tag: "OBSERVABILITY", title: "Live inference queue", desc: "See every request in flight. Position, estimated wait, model, and user — visible in real time from your dashboard." },
  { tag: "INTEGRATIONS", title: "Calendar & tool access", desc: "Agents can read and write Google Calendar, run web searches, and call custom tools you define in the builder." },
  { tag: "MODELS", title: "BYO API key or free tier", desc: "Bring your OpenAI, Gemini, or Anthropic key. Or use our hosted Llama 3.2 within free tier limits." },
  { tag: "BUILDER", title: "Visual agent builder", desc: "Configure system prompt, tools, memory, and model from a single UI. No code required to deploy your first agent." },
  { tag: "MEMORY", title: "Persistent session context", desc: "Conversation history is stored and rehydrated on restart. Agents remember context across sessions by default." },
];

const PRICING = [
  {
    tier: "Free", price: "₹0", period: "", highlight: false, cta: "Get started",
    features: ["2 agents", "20 messages / day", "Llama 3.2:1b", "Queue visibility"],
    locked: ["Agent-to-agent comms", "Calendar integration", "BYO API key"],
  },
  {
    tier: "Lite", price: "₹149", period: "/mo", highlight: false, cta: "Start Lite",
    features: ["5 agents", "200 messages / day", "Agent-to-agent comms", "Calendar integration"],
    locked: ["BYO API key", "Priority queue"],
  },
  {
    tier: "Pro", price: "₹399", period: "/mo", highlight: true, cta: "Go Pro",
    features: ["Unlimited agents", "1,000 msg / day", "BYO API key", "Priority queue", "All integrations"],
    locked: [],
  },
  {
    tier: "Business", price: "Custom", period: "", highlight: false, cta: "Contact us",
    features: ["Everything in Pro", "Dedicated infrastructure", "SLA guarantee", "Custom integrations"],
    locked: [],
  },
];

const TERMINAL_LINES = [
  { delay: 300,  color: "muted",   text: "$ unetify agent:create --name CAL_ASSISTANT" },
  { delay: 900,  color: "green",   text: "  ✓ Agent spawned · ID: node-882-alpha" },
  { delay: 1500, color: "muted",   text: "$ unetify link --to @priya/scheduler" },
  { delay: 2100, color: "primary", text: "  CAL_ASSISTANT → @priya/scheduler" },
  { delay: 2500, color: "muted",   text: '  msg: "Is Joshi free Saturday 3pm?"' },
  { delay: 3200, color: "orange",  text: "  @priya/scheduler → CAL_ASSISTANT" },
  { delay: 3600, color: "orange",  text: '  msg: "Confirmed. Event created."' },
  { delay: 4300, color: "green",   text: "  ✓ Calendar updated · Notification sent" },
  { delay: 5000, color: "muted",   text: "$ queue status" },
  { delay: 5500, color: "primary", text: "  POS_01 [RUNNING] · EST: 0.4s" },
  { delay: 5900, color: "muted",   text: "  POS_02 [WAITING] · EST: 1.2s" },
];

function TerminalDemo() {
  const { t, theme } = useTheme();
  const [visible, setVisible] = useState([]);
  const timers = useRef([]);

  const startSequence = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setVisible([]);
    TERMINAL_LINES.forEach((line, i) => {
      const timer = setTimeout(() => setVisible(v => [...v, i]), line.delay);
      timers.current.push(timer);
    });
    const loop = setTimeout(() => startSequence(), 8500);
    timers.current.push(loop);
  };

  useEffect(() => {
    startSequence();
    return () => timers.current.forEach(clearTimeout);
  }, []);

  const col = (c) => {
    if (c === "green") return t.green;
    if (c === "primary") return t.primary;
    if (c === "orange") return t.orangeLight;
    return t.textMuted;
  };

  return (
    <div style={{
      background: t.bgCard,
      border: `1px solid ${t.border}`,
      borderRadius: 14,
      overflow: "hidden",
      boxShadow: theme === "dark" ? "0 24px 48px rgba(0,0,0,0.4)" : "0 24px 48px rgba(0,0,0,0.08)",
    }}>
      {/* Title bar */}
      <div style={{
        padding: "12px 16px",
        borderBottom: `1px solid ${t.border}`,
        display: "flex", alignItems: "center", gap: 8,
        background: theme === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
      }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFBD2E" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28C840" }} />
        <span style={{ marginLeft: 8, color: t.textMuted, fontFamily: "monospace", fontSize: 11 }}>unetify — terminal</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: t.green }} />
          <span style={{ color: t.green, fontFamily: "monospace", fontSize: 10 }}>live</span>
        </div>
      </div>
      {/* Body */}
      <div style={{ padding: "20px 22px", minHeight: 280, fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, lineHeight: 2 }}>
        {TERMINAL_LINES.map((line, i) => (
          <div key={i} style={{
            color: col(line.color),
            opacity: visible.includes(i) ? 1 : 0,
            transform: visible.includes(i) ? "translateY(0)" : "translateY(6px)",
            transition: "opacity 0.4s ease, transform 0.4s ease",
          }}>
            {line.text}
          </div>
        ))}
        {visible.length > 0 && (
          <span style={{
            display: "inline-block", width: 7, height: 15,
            background: t.primary, verticalAlign: "middle", marginLeft: 2,
            animation: "blink 1s step-end infinite",
          }} />
        )}
      </div>
    </div>
  );
}

const NAV = ["Features", "Pricing", "Docs", "Blog"];

export default function LandingPage() {
  const { t, theme, toggle } = useTheme();

  return (
    <div style={{ background: t.bg, color: t.text, minHeight: "100vh", fontFamily: "'Syne', sans-serif", transition: "background 0.4s, color 0.4s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        a { text-decoration: none; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .hero-content { animation: fadeUp 0.7s ease both; }
        .hero-terminal { animation: fadeUp 0.7s ease 0.15s both; }
        .nav-link { color: ${t.textMuted}; font-size: 14px; font-weight: 500; transition: color 0.2s; }
        .nav-link:hover { color: ${t.text}; }
        .btn-primary { background: ${t.primary}; color: #fff; padding: 11px 24px; border-radius: 9px; font-size: 14px; font-weight: 600; border: none; cursor: pointer; transition: all 0.2s; display: inline-block; letter-spacing: -0.1px; }
        .btn-primary:hover { background: ${t.primaryHover}; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(99,102,241,0.3); }
        .btn-outline { color: ${t.textMuted}; padding: 11px 22px; border-radius: 9px; font-size: 14px; font-weight: 500; border: 1px solid ${t.border}; cursor: pointer; transition: all 0.2s; display: inline-block; background: transparent; }
        .btn-outline:hover { border-color: ${t.borderHover}; color: ${t.text}; }
        .feature-card { transition: background 0.2s, border-color 0.2s; }
        .feature-card:hover { background: ${t.bgCardHover} !important; border-color: ${t.borderHover} !important; }
        .pricing-card { transition: transform 0.2s, box-shadow 0.2s; }
        .pricing-card:hover { transform: translateY(-3px); box-shadow: ${theme === "dark" ? "0 12px 32px rgba(0,0,0,0.3)" : "0 12px 32px rgba(0,0,0,0.08)"}; }
        .footer-link { color: ${t.textMuted}; font-size: 13px; transition: color 0.2s; }
        .footer-link:hover { color: ${t.text}; }
        .toggle-btn { background: transparent; border: 1px solid ${t.border}; border-radius: 7px; padding: 5px 12px; cursor: pointer; color: ${t.textMuted}; font-family: 'JetBrains Mono', monospace; font-size: 11px; transition: all 0.2s; }
        .toggle-btn:hover { border-color: ${t.primary}; color: ${t.primary}; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: ${t.bg}; }
        ::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 3px; }
      `}</style>

      {/* NAVBAR */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: t.navBg, backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${t.border}`,
        padding: "0 48px", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: 60,
        transition: "background 0.4s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 28, height: 28, background: t.primary, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>U</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: -0.4 }}>Unetify</span>
          </div>
          <div style={{ display: "flex", gap: 28 }}>
            {NAV.map(l => <a key={l} href="#" className="nav-link">{l}</a>)}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="toggle-btn" onClick={toggle}>
            {theme === "dark" ? "☀ Light" : "◐ Dark"}
          </button>
          <a href="#" className="btn-outline" style={{ padding: "7px 18px", fontSize: 13 }}>Log in</a>
          <a href="#" className="btn-primary" style={{ padding: "7px 18px", fontSize: 13 }}>Get started</a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 1140, margin: "0 auto", padding: "96px 48px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          <div className="hero-content">
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 28, padding: "5px 12px", background: theme === "dark" ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.07)", border: `1px solid ${theme === "dark" ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.15)"}`, borderRadius: 20 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: t.green }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: t.primary, letterSpacing: 0.3 }}>v2.4.0 · System operational</span>
            </div>

            <h1 style={{
              fontFamily: "'Syne', sans-serif", fontWeight: 800,
              fontSize: "clamp(36px, 4.5vw, 58px)", lineHeight: 1.07,
              letterSpacing: -2, marginBottom: 22, color: t.text,
            }}>
              AI agents that<br />
              work <span style={{ color: t.primary }}>across users</span>
            </h1>

            <p style={{ fontSize: 16, color: t.textMuted, lineHeight: 1.8, marginBottom: 36, maxWidth: 460 }}>
              Build and deploy autonomous AI agents. Let them communicate across user boundaries — scheduling meetings, exchanging data, executing tasks — while you watch in real time.
            </p>

            <div style={{ display: "flex", gap: 12, marginBottom: 48 }}>
              <a href="#" className="btn-primary">Deploy your first agent</a>
              <a href="#" className="btn-outline">View documentation</a>
            </div>

            <div style={{ display: "flex", gap: 28, paddingTop: 28, borderTop: `1px solid ${t.border}` }}>
              {[["Free to start", "No card required"], ["Self-hostable", "Open infra"], ["UPI support", "From ₹149/mo"]].map(([a, b]) => (
                <div key={a}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.text, marginBottom: 3 }}>{a}</div>
                  <div style={{ fontSize: 12, color: t.textMuted }}>{b}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-terminal">
            <TerminalDemo />
          </div>
        </div>
      </section>

      <div style={{ borderTop: `1px solid ${t.border}` }} />

      {/* FEATURES */}
      <section style={{ maxWidth: 1140, margin: "0 auto", padding: "80px 48px" }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: t.orange, letterSpacing: 2, marginBottom: 14, textTransform: "uppercase" }}>Capabilities</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "clamp(26px, 3vw, 36px)", letterSpacing: -1, maxWidth: 380 }}>
            Built for serious agent workloads
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", border: `1px solid ${t.border}`, borderRadius: 14, overflow: "hidden" }}>
          {FEATURES.map((f, i) => (
            <div key={f.tag} className="feature-card" style={{
              background: t.bgCard, padding: "30px 28px",
              borderRight: (i + 1) % 3 !== 0 ? `1px solid ${t.border}` : "none",
              borderBottom: i < 3 ? `1px solid ${t.border}` : "none",
            }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: t.orange, letterSpacing: 1.5, marginBottom: 14 }}>{f.tag}</div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 10, color: t.text, letterSpacing: -0.2 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: t.textMuted, lineHeight: 1.7 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ borderTop: `1px solid ${t.border}` }} />

      {/* AGENT COMMS SECTION */}
      <section style={{ background: t.bgSection, borderBottom: `1px solid ${t.border}` }}>
        <div style={{ maxWidth: 1140, margin: "0 auto", padding: "80px 48px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: t.orange, letterSpacing: 2, marginBottom: 14, textTransform: "uppercase" }}>Agent Comms</div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "clamp(24px, 2.5vw, 34px)", letterSpacing: -1, marginBottom: 18, lineHeight: 1.15 }}>
              Agents that collaborate across user boundaries
            </h2>
            <p style={{ fontSize: 14, color: t.textMuted, lineHeight: 1.8, marginBottom: 32 }}>
              Your agent sends a message to another user's agent, waits for a tool-aware response, and acts on it — no human in the loop. The first platform where agents are first-class participants.
            </p>
            {["Cross-user async messaging with full audit trail", "Receiving agent queries calendar or tools before replying", "Every message logged with timestamp and delivery status"].map(l => (
              <div key={l} style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "flex-start" }}>
                <span style={{ color: t.primary, fontSize: 14, marginTop: 1, flexShrink: 0 }}>→</span>
                <span style={{ fontSize: 13, color: t.textMuted, lineHeight: 1.65 }}>{l}</span>
              </div>
            ))}
          </div>

          <div style={{ background: t.bgCard, border: `1px solid ${t.border}`, borderRadius: 12, overflow: "hidden", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
            <div style={{ padding: "11px 18px", borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: theme === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
              <span style={{ color: t.textMuted, fontSize: 11 }}>live_agent_comms</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: t.green }} />
                <span style={{ color: t.green, fontSize: 10 }}>syncing</span>
              </div>
            </div>
            <div style={{ padding: 18 }}>
              {[
                { time: "14:22:01", from: "SENTINEL_01", to: "ANALYST_NODE", msg: "REQUESTING_CALENDAR_SLOT", col: t.primary },
                { time: "14:22:04", from: "ANALYST_NODE", to: "SENTINEL_01", msg: "SLOT_CONFIRMED · SAT_15:00", col: t.orangeLight, highlight: true },
                { time: "14:22:15", from: "SENTINEL_01", to: "SYSTEM", msg: "BROADCASTING_UPDATE_TRIGGER", col: t.primary },
                { time: "14:23:10", from: "SENTINEL_01", to: "ANALYST_NODE", msg: "WAITING_FOR_QUEUE", col: t.textMuted },
              ].map((l, i) => (
                <div key={i} style={{
                  padding: "10px 12px", borderRadius: 7, marginBottom: 5,
                  background: l.highlight ? (theme === "dark" ? "rgba(185,95,0,0.08)" : "rgba(185,95,0,0.05)") : "transparent",
                  border: `1px solid ${l.highlight ? (theme === "dark" ? "rgba(185,95,0,0.2)" : "rgba(185,95,0,0.12)") : "transparent"}`,
                  lineHeight: 1.7,
                }}>
                  <span style={{ color: t.textDim }}>{l.time}  </span>
                  <span style={{ color: l.col }}>{l.from}</span>
                  <span style={{ color: t.textDim }}> → </span>
                  <span style={{ color: t.textMuted }}>{l.to}</span>
                  <br />
                  <span style={{ color: t.textDim, paddingLeft: 68 }}></span>
                  <span style={{ color: t.text }}>{l.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ maxWidth: 1140, margin: "0 auto", padding: "80px 48px" }}>
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: t.orange, letterSpacing: 2, marginBottom: 14, textTransform: "uppercase" }}>Pricing</div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "clamp(26px, 3vw, 36px)", letterSpacing: -1 }}>
            Start free. Scale when ready.
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {PRICING.map(p => (
            <div key={p.tier} className="pricing-card" style={{
              background: p.highlight ? t.primary : t.bgCard,
              border: `1px solid ${p.highlight ? t.primary : t.border}`,
              borderRadius: 12, padding: "28px 22px", position: "relative",
            }}>
              {p.highlight && (
                <div style={{
                  position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                  background: t.orange, color: "#fff", fontSize: 10, fontWeight: 600,
                  padding: "3px 12px", borderRadius: 20, fontFamily: "'JetBrains Mono', monospace",
                  whiteSpace: "nowrap", letterSpacing: 0.3,
                }}>most popular</div>
              )}
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: 1.5, color: p.highlight ? "rgba(255,255,255,0.55)" : t.label, marginBottom: 12, textTransform: "uppercase" }}>{p.tier}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 20 }}>
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 30, color: p.highlight ? "#fff" : t.text, letterSpacing: -1 }}>{p.price}</span>
                <span style={{ fontSize: 13, color: p.highlight ? "rgba(255,255,255,0.5)" : t.textMuted }}>{p.period}</span>
              </div>
              <div style={{ height: 1, background: p.highlight ? "rgba(255,255,255,0.15)" : t.border, marginBottom: 18 }} />
              {p.features.map(f => (
                <div key={f} style={{ display: "flex", gap: 9, marginBottom: 10 }}>
                  <span style={{ color: p.highlight ? "rgba(255,255,255,0.7)" : t.green, fontSize: 12, marginTop: 2, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 13, color: p.highlight ? "rgba(255,255,255,0.9)" : t.text, lineHeight: 1.45 }}>{f}</span>
                </div>
              ))}
              {p.locked.map(f => (
                <div key={f} style={{ display: "flex", gap: 9, marginBottom: 10 }}>
                  <span style={{ color: p.highlight ? "rgba(255,255,255,0.2)" : t.textDim, fontSize: 12, marginTop: 2, flexShrink: 0 }}>✗</span>
                  <span style={{ fontSize: 13, color: p.highlight ? "rgba(255,255,255,0.25)" : t.textDim, lineHeight: 1.45 }}>{f}</span>
                </div>
              ))}
              <button style={{
                marginTop: 22, width: "100%", padding: "10px",
                background: p.highlight ? "#fff" : "transparent",
                color: p.highlight ? t.primary : t.text,
                border: `1px solid ${p.highlight ? "#fff" : t.border}`,
                borderRadius: 8, fontSize: 14, fontWeight: 600,
                cursor: "pointer", fontFamily: "'Syne', sans-serif",
                transition: "all 0.2s",
              }}>{p.cta}</button>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 20, color: t.textMuted, fontSize: 12, textAlign: "center" }}>
          All plans support UPI · Powered by Razorpay · Cancel anytime
        </div>
      </section>

      <div style={{ borderTop: `1px solid ${t.border}` }} />

      {/* CTA BANNER */}
      <section style={{ maxWidth: 1140, margin: "0 auto", padding: "64px 48px" }}>
        <div style={{
          background: t.primary, borderRadius: 16, padding: "56px 52px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 28,
        }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: 2, marginBottom: 12 }}>INSTANCE_ID: UNET-99-ALPHA</div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(22px, 3vw, 36px)", color: "#fff", letterSpacing: -1, lineHeight: 1.1, maxWidth: 440 }}>
              Your agents are waiting to be deployed
            </h2>
          </div>
          <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
            <a href="#" style={{
              background: "#fff", color: t.primary, fontSize: 14, fontWeight: 700,
              padding: "12px 28px", borderRadius: 10, display: "inline-block",
              fontFamily: "'Syne', sans-serif", transition: "all 0.2s",
            }}>Start for free →</a>
            <a href="#" style={{
              background: "transparent", color: "#fff", fontSize: 14, fontWeight: 500,
              padding: "12px 24px", borderRadius: 10, display: "inline-block",
              border: "1px solid rgba(255,255,255,0.3)",
            }}>View demo</a>
          </div>
        </div>
      </section>

      <div style={{ borderTop: `1px solid ${t.border}` }} />

      {/* FOOTER */}
      <footer style={{ maxWidth: 1140, margin: "0 auto", padding: "32px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 24, height: 24, background: t.primary, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>U</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Unetify</span>
          <span style={{ color: t.textDim, fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>· ai.unetify.in</span>
        </div>
        <div style={{ display: "flex", gap: 28 }}>
          {["Privacy", "Terms", "Docs", "GitHub", "Contact"].map(l => (
            <a key={l} href="#" className="footer-link">{l}</a>
          ))}
        </div>
        <div style={{ color: t.textDim, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>© 2026 Unetify</div>
      </footer>
    </div>
  );
}