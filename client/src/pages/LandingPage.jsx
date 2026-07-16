import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Wallet, Users, TrendingUp, Check, Shield, Zap, Sparkles, ChevronDown } from "lucide-react";
import { useAppStore } from "../store/useAppStore";

export default function LandingPage() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Force dark class on html tag to bypass browser auto-inversion, allowing us to render light white natively
    const html = document.documentElement;
    const originalTheme = localStorage.getItem("theme") || "light";
    html.classList.add("dark");
    return () => {
      // Revert if next route is light theme
      if (originalTheme !== "dark") {
        html.classList.remove("dark");
      }
    };
  }, []);

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScrollScrolled = (e) => {
      const target = e.target;
      const scrollPos = window.pageYOffset || 
                        document.documentElement.scrollTop || 
                        document.body.scrollTop || 
                        (target && target.scrollTop) || 0;
      
      if (scrollPos > 12) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    // Capture scroll events from any container bubbling up to document
    document.addEventListener("scroll", handleScrollScrolled, true);
    
    // Fallback manual check on mount
    const initialScroll = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    if (initialScroll > 12) setIsScrolled(true);

    return () => document.removeEventListener("scroll", handleScrollScrolled, true);
  }, []);

  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "Is my personal ledger data private?",
      a: "Yes. Fintra is built with a personal-first blueprint. We secure your transaction sheets with encrypted Firebase Firestore vaults. We never sell your transaction schemas or share financial metrics with ad brokers."
    },
    {
      q: "How do shared workspaces compute group splits?",
      a: "You can create dedicated shared workspaces for household expenses or group trips. When you add a new transaction and split the bill, Fintra's balance engine compiles individual weights and generates the optimal settlement matrix."
    },
    {
      q: "How do the monthly budget insights help me?",
      a: "Each workspace maintains its own target budget. The built-in insights engine calculates your current spending pace, alerts you when you exceed target curves, and suggests category optimizations based on Recharts daily breakdowns."
    }
  ];

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lp-root {
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: linear-gradient(to bottom, #c6c5b9 0%, #e3e1d7 50%, #f3f2ea 100%) !important;
          color: #0d0d12 !important;
          display: flex;
          flex-direction: column;
        }

        /* ── Header ── */
        .lp-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 8%;
          border-bottom: none !important;
          position: sticky;
          top: 0;
          backdrop-filter: none;
          background: transparent;
          z-index: 100;
          transition: background 0.3s ease, backdrop-filter 0.3s ease, padding 0.3s ease, box-shadow 0.3s ease;
        }
        .lp-header.scrolled {
          background: rgba(255, 255, 255, 0.15) !important;
          border-bottom: none !important;
          backdrop-filter: blur(10px) !important;
          -webkit-backdrop-filter: blur(10px) !important;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.02), inset 0 1px 0 rgba(255, 255, 255, 0.3) !important;
          padding: 12px 8%;
        }
        .lp-logo {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 800;
          font-size: 19px;
          cursor: pointer;
          color: #0d0d12 !important;
        }
        .lp-logo-dot {
          width: 26px;
          height: 26px;
          background: #0d0d12 !important;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .lp-logo-dot svg {
          stroke: #ffffff !important;
          width: 13px;
          height: 13px;
        }
        .lp-nav-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .lp-btn-login {
          font-size: 14px;
          font-weight: 600;
          color: #444 !important;
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.2s;
        }
        .lp-btn-login:hover {
          color: #000 !important;
        }
        .lp-btn-signup {
          font-size: 14px;
          font-weight: 700;
          color: #ffffff !important;
          background: #242426 !important;
          border: none;
          padding: 8px 16px;
          border-radius: 9px;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .lp-btn-signup:hover {
          opacity: 0.9;
        }

        /* ── Hero Section ── */
        .lp-hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 100px 5% 60px;
          max-width: 1000px;
          margin: 0 auto;
        }
        .lp-hero h1 {
          font-size: clamp(34px, 6vw, 64px);
          font-weight: 900;
          line-height: 1.1;
          letter-spacing: -0.03em;
          margin-bottom: 20px;
          background: linear-gradient(135deg, #000000, #333333);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .lp-hero p {
          font-size: clamp(16px, 2.5vw, 19px);
          line-height: 1.6;
          color: #555 !important;
          max-width: 680px;
          margin-bottom: 32px;
        }
        .lp-hero-ctas {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 48px;
        }
        .lp-hero-cta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 700;
          color: #ffffff !important;
          background: #242426 !important;
          border: none;
          padding: 14px 28px;
          border-radius: 12px;
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }
        .lp-hero-cta:hover {
          transform: translateY(-2px);
          opacity: 0.95;
        }
        .lp-hero-sec {
          font-size: 15px;
          font-weight: 700;
          color: #0d0d12 !important;
          background: none;
          border: 1px solid rgba(0,0,0,0.15) !important;
          padding: 14px 28px;
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .lp-hero-sec:hover {
          background: rgba(0,0,0,0.03);
        }

        /* ── Metric Stats Banner ── */
        .lp-stats {
          width: 100%;
          border-top: 1px solid rgba(0,0,0,0.06);
          border-bottom: 1px solid rgba(0,0,0,0.06);
          background: rgba(0,0,0,0.02) !important;
          padding: 40px 8%;
          display: flex;
          flex-wrap: wrap;
          justify-content: space-around;
          gap: 30px;
        }
        .lp-stat-box {
          text-align: center;
        }
        .lp-stat-val {
          font-size: 32px;
          font-weight: 800;
          color: #0d0d12 !important;
        }
        .lp-stat-lbl {
          font-size: 13px;
          color: #666 !important;
          margin-top: 4px;
        }

        /* ── Features Grid ── */
        .lp-features-section {
          padding: 100px 8% 80px;
          background: transparent;
        }
        .lp-features-title {
          text-align: center;
          margin-bottom: 60px;
        }
        .lp-features-title h2 {
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 16px;
        }
        .lp-features-title p {
          font-size: 15px;
          color: #666 !important;
          max-width: 500px;
          margin: 0 auto;
        }
        .lp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 28px;
          max-width: 1100px;
          margin: 0 auto;
        }
        .lp-card {
          background: rgba(255, 255, 255, 0.25) !important;
          border: 1px solid rgba(255, 255, 255, 0.45) !important;
          padding: 40px 30px;
          border-radius: 20px;
          transition: transform 0.2s, border-color 0.2s;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03) !important;
          backdrop-filter: blur(16px) !important;
          -webkit-backdrop-filter: blur(16px) !important;
        }
        .lp-card:hover {
          transform: translateY(-4px);
          border-color: rgba(0,0,0,0.15) !important;
        }
        .lp-icon-wrap {
          width: 48px;
          height: 48px;
          background: rgba(0, 0, 0, 0.04) !important;
          border: 1px solid rgba(0, 0, 0, 0.08) !important;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          color: #0d0d12 !important;
        }
        .lp-card h3 {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 12px;
          color: #0d0d12 !important;
        }
        .lp-card p {
          font-size: 14px;
          line-height: 1.6;
          color: #666 !important;
        }

        /* ── Rich Details (Split columns showcase) ── */
        .lp-details-block {
          padding: 80px 8%;
          background: transparent;
        }
        .lp-details-container {
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 80px;
        }
        .lp-details-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 48px;
        }
        .lp-details-row:nth-child(even) {
          flex-direction: row-reverse;
        }
        .lp-details-col-text {
          flex: 1;
        }
        .lp-details-col-text h3 {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 16px;
          color: #0d0d12 !important;
        }
        .lp-details-col-text p {
          font-size: 15px;
          line-height: 1.6;
          color: #555 !important;
          margin-bottom: 24px;
        }
        .lp-details-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .lp-details-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 600;
          color: #333 !important;
        }
        .lp-details-item svg {
          color: #10b981;
          flex-shrink: 0;
        }
        .lp-details-col-visual {
          flex: 1.3;
          background: rgba(255, 255, 255, 0.25) !important;
          border: 1px solid rgba(255, 255, 255, 0.45) !important;
          border-radius: 20px;
          padding: 32px;
          min-height: 240px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03) !important;
          backdrop-filter: blur(16px) !important;
          -webkit-backdrop-filter: blur(16px) !important;
        }
        @media (max-width: 768px) {
          .lp-details-row, .lp-details-row:nth-child(even) {
            flex-direction: column;
            gap: 32px;
          }
        }

        /* ── FAQ Section ── */
        .lp-faq-section {
          padding: 100px 8% 80px;
          max-width: 800px;
          margin: 0 auto;
          width: 100%;
        }
        .lp-faq-title {
          text-align: center;
          margin-bottom: 48px;
        }
        .lp-faq-title h2 {
          font-size: 30px;
          font-weight: 800;
          color: #0d0d12 !important;
        }
        .lp-faq-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .lp-faq-item {
          border: 1px solid rgba(255, 255, 255, 0.45) !important;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.25) !important;
          overflow: hidden;
          transition: border-color 0.2s;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02) !important;
          backdrop-filter: blur(16px) !important;
          -webkit-backdrop-filter: blur(16px) !important;
        }
        .lp-faq-item:hover {
          border-color: rgba(255, 255, 255, 0.6) !important;
        }
        .lp-faq-q {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          font-weight: 700;
          cursor: pointer;
          font-size: 15px;
          user-select: none;
          color: #0d0d12 !important;
        }
        .lp-faq-a {
          padding: 0 24px 20px;
          font-size: 14.5px;
          line-height: 1.5;
          color: #555 !important;
        }
        .lp-faq-chevron {
          transition: transform 0.2s;
        }
        .lp-faq-chevron.active {
          transform: rotate(180deg);
        }

        /* ── CTA Banner ── */
        .lp-cta-banner {
          padding: 80px 8%;
          text-align: center;
          max-width: 1000px;
          margin: 40px auto 80px;
          width: 90%;
          background: linear-gradient(135deg, #0d0d12, #1a1a24) !important;
          border-radius: 24px;
          color: #ffffff;
          box-shadow: 0 20px 50px rgba(0,0,0,0.15);
        }
        .lp-cta-banner h2 {
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 16px;
        }
        .lp-cta-banner p {
          font-size: 16px;
          color: #aaa;
          max-width: 500px;
          margin: 0 auto 32px;
          line-height: 1.5;
        }
        .lp-cta-banner button {
          font-size: 15px;
          font-weight: 700;
          color: #000000;
          background: #ffffff;
          border: none;
          padding: 14px 32px;
          border-radius: 12px;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .lp-cta-banner button:hover {
          transform: translateY(-2px);
        }


        /* ── Interactive Mock Interface Card ── */
        .lp-mock-card {
          width: 100%;
          max-width: 620px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.25) !important;
          border: 1px solid rgba(255, 255, 255, 0.45) !important;
          border-radius: 24px;
          padding: 24px 28px;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.03) !important;
          backdrop-filter: blur(16px) !important;
          -webkit-backdrop-filter: blur(16px) !important;
          text-align: left;
        }
        .lp-mock-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        .lp-mock-title {
          font-size: 11px;
          font-weight: 700;
          color: #777788;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .lp-mock-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
        }
        .lp-mock-input-sec {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }
        .lp-mock-label {
          font-size: 10.5px;
          font-weight: 700;
          color: #777788;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .lp-mock-ws-badge {
          background: rgba(13, 13, 18, 0.04);
          border: 1px solid rgba(13, 13, 18, 0.08);
          border-radius: 99px;
          padding: 4px 12px;
          font-size: 12.5px;
          font-weight: 700;
          color: #0d0d12;
        }
         .lp-mock-typing-box {
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        .lp-mock-typed-text {
          font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
          font-size: 17px;
          color: #0d0d12;
          margin-top: 8px;
          letter-spacing: -0.01em;
        }
        .lp-mock-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        .lp-mock-grid-box {
          background: rgba(255, 255, 255, 0.3) !important;
          border: 1px solid rgba(255, 255, 255, 0.45) !important;
          border-radius: 12px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.01) !important;
        }
        .lp-mock-grid-lbl {
          font-size: 9px;
          font-weight: 700;
          color: #777788;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .lp-mock-grid-val {
          font-size: 14px;
          font-weight: 700;
          color: #0d0d12;
        }
        .lp-mock-ledger {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .lp-mock-ledger-hdr {
          font-size: 11px;
          font-weight: 700;
          color: #777788;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 4px;
        }
        .lp-mock-ledger-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 4px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.04);
        }
        .lp-mock-ledger-row:last-child {
          border-bottom: none;
        }
        .lp-mock-ledger-col {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13.5px;
          color: #333344;
          font-weight: 500;
        }
        .lp-mock-ledger-col strong {
          color: #0d0d12;
          font-weight: 600;
        }
        .lp-mock-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(13, 13, 18, 0.06);
          border: 1px solid rgba(13, 13, 18, 0.08);
          color: #0d0d12;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          text-transform: uppercase;
        }
        .lp-mock-avatar.success {
          background: rgba(13, 13, 18, 0.06);
          border-color: rgba(13, 13, 18, 0.08);
          color: #0d0d12;
        }
        .lp-mock-badge {
          font-size: 10.5px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 99px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .lp-mock-badge.pending {
          background: rgba(168, 106, 72, 0.08) !important;
          border: 1px solid rgba(168, 106, 72, 0.15) !important;
          color: #a86a48 !important;
        }
        .lp-mock-badge.settled {
          background: rgba(13, 13, 18, 0.04);
          border: 1px solid rgba(13, 13, 18, 0.08);
          color: #555566;
        }
        .lp-mock-ledger-val {
          font-size: 14px;
          font-weight: 700;
          color: #0d0d12;
          font-variant-numeric: tabular-nums;
        }
        .lp-mock-ledger-val.green {
          color: #0d0d12;
        }

        /* Mobile adjustments for mock card */
        @media (max-width: 600px) {
          .lp-mock-card {
            padding: 24px 20px;
          }
          .lp-mock-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .lp-mock-typed-text {
            font-size: 18px;
          }
        }

        /* ── Footer ── */
        .lp-footer {
          text-align: center;
          padding: 40px 8%;
          font-size: 13.5px;
          color: #292823 !important;
          background: #e6e4d9 !important;
          border-top: 1px solid rgba(0, 0, 0, 0.08);
          margin-top: auto;
        }
      `}</style>

      <div className="lp-root">
        {/* Header */}
        <header className={`lp-header ${isScrolled ? "scrolled" : ""}`}>
          <div className="lp-logo" onClick={() => navigate("/")}>
            <img src="/logo_black.png" alt="Fintra Logo" style={{ height: "28px", width: "auto", objectFit: "contain" }} />
          </div>
          <div className="lp-nav-actions">
            <button className="lp-btn-login" onClick={() => navigate("/login")}>
              Sign In
            </button>
            <button className="lp-btn-signup" onClick={() => navigate("/login?mode=signup")}>
              Launch App
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="lp-hero">
          <h1>Simplify Your Expenses. Settle Your Splits.</h1>
          <p>
            Track your personal budgets, split bills with friends, and manage your shared expenses all in one beautiful workspace.
          </p>
          <div className="lp-hero-ctas">
            <button className="lp-hero-cta" onClick={() => navigate("/login")}>
              Launch Workspace
              <ArrowRight size={18} />
            </button>
            <button className="lp-hero-sec" onClick={() => navigate("/login")}>
              Explore Ledger
            </button>
          </div>
        </section>

        {/* Core Steps Section */}
        <section className="lp-steps-section" style={{ padding: "0 8% 80px", maxWidth: "1100px", margin: "0 auto", width: "100%" }}>
          <div className="lp-grid">
            <div className="lp-card">
              <div style={{ fontSize: "11px", opacity: 0.5, fontWeight: 700, marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Step 01</div>
              <h3>Create Workspace</h3>
              <p>Segregate personal budgets from shared ledgers. Create private workspaces or invite friends to shared split ledgers.</p>
            </div>
            <div className="lp-card">
              <div style={{ fontSize: "11px", opacity: 0.5, fontWeight: 700, marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Step 02</div>
              <h3>Invite & Sync Dues</h3>
              <p>Send instant shared workspace invite tokens. Members can join and log rent, groceries, or travel expenses dynamically.</p>
            </div>
            <div className="lp-card">
              <div style={{ fontSize: "11px", opacity: 0.5, fontWeight: 700, marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Step 03</div>
              <h3>Auto-Settle Splits</h3>
              <p>Log transactions with custom categories. Let the split engine calculate balances and generate optimal settlement matrices.</p>
            </div>
          </div>
        </section>

        {/* Mock Interface Section */}
        <section className="lp-interface-section" style={{ padding: "0 8% 80px", maxWidth: "1100px", margin: "0 auto", width: "100%", textAlign: "center" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <div style={{ fontSize: "11px", color: "#10b981", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "12px" }}>The Interface</div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 38px)", fontWeight: 800, color: "#0d0d12", letterSpacing: "-0.03em" }}>A collaborative, modern ledger.</h2>
            <p style={{ fontSize: "15.5px", color: "#555", maxWidth: "600px", margin: "14px auto 0", lineHeight: 1.6 }}>
              Ditch complicated spreadsheets. Create shared spaces, invite your housemates or team members, log common expenses, and track balanced dues instantly.
            </p>
          </div>

          {/* Interactive Mock Card */}
          <div className="lp-mock-card">
            <div className="lp-mock-header">
              <span className="lp-mock-title">Shared Workspace Split Engine</span>
              <div className="lp-mock-status-dot" />
            </div>

            <div className="lp-mock-input-sec">
              <span className="lp-mock-label">Active Workspace:</span>
              <div className="lp-mock-ws-badge">Apartment 4B Split</div>
            </div>

            <div className="lp-mock-typing-box">
              <div className="lp-mock-label">WHAT YOU LOGGED:</div>
              <div className="lp-mock-typed-text">Grocery store checkout ₹1,500 split</div>
            </div>

            <div className="lp-mock-grid">
              <div className="lp-mock-grid-box">
                <span className="lp-mock-grid-lbl">TOTAL SPLIT</span>
                <span className="lp-mock-grid-val">₹1,500.00</span>
              </div>
              <div className="lp-mock-grid-box">
                <span className="lp-mock-grid-lbl">MEMBERS</span>
                <span className="lp-mock-grid-val">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "15px", height: "15px", marginRight: "6px", display: "inline-block", verticalAlign: "middle", marginTop: "-3px" }}>
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87" />
                    <path d="M16 3.13a4 4 0 010 7.75" />
                  </svg>
                  <span style={{ verticalAlign: "middle" }}>3 Active</span>
                </span>
              </div>
              <div className="lp-mock-grid-box">
                <span className="lp-mock-grid-lbl">ALLOCATION</span>
                <span className="lp-mock-grid-val">₹500.00 / head</span>
              </div>
            </div>

            <div className="lp-mock-ledger">
              <div className="lp-mock-ledger-hdr">Optimal Settlement Plan</div>
              
              <div className="lp-mock-ledger-row">
                <div className="lp-mock-ledger-col">
                  <span className="lp-mock-avatar">K</span>
                  <span>Kabir owes <strong>You</strong></span>
                </div>
                <div className="lp-mock-ledger-col">
                  <span className="lp-mock-badge pending">Pending</span>
                  <span className="lp-mock-ledger-val">₹500.00</span>
                </div>
              </div>

              <div className="lp-mock-ledger-row">
                <div className="lp-mock-ledger-col">
                  <span className="lp-mock-avatar">R</span>
                  <span>Riya owes <strong>You</strong></span>
                </div>
                <div className="lp-mock-ledger-col">
                  <span className="lp-mock-badge pending">Pending</span>
                  <span className="lp-mock-ledger-val">₹500.00</span>
                </div>
              </div>

              <div className="lp-mock-ledger-row">
                <div className="lp-mock-ledger-col">
                  <span className="lp-mock-avatar success">Y</span>
                  <span>You settled with <strong>Aman</strong></span>
                </div>
                <div className="lp-mock-ledger-col">
                  <span className="lp-mock-badge settled">Settled</span>
                  <span className="lp-mock-ledger-val green">₹250.00</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Metric Stats Banner */}
        <section className="lp-stats">
          <div className="lp-stat-box">
            <div className="lp-stat-val">100%</div>
            <div className="lp-stat-lbl">Data Ownership</div>
          </div>
          <div className="lp-stat-box">
            <div className="lp-stat-val">Real-time</div>
            <div className="lp-stat-lbl">Workspace Sync</div>
          </div>
          <div className="lp-stat-box">
            <div className="lp-stat-val">0</div>
            <div className="lp-stat-lbl">Ad Trackers</div>
          </div>
          <div className="lp-stat-box">
            <div className="lp-stat-val">Recharts</div>
            <div className="lp-stat-lbl">Dynamic Sheets</div>
          </div>
        </section>

        {/* Features Section */}
        <section className="lp-features-section">
          <div className="lp-features-title">
            <h2>Collaborative Ledger Infrastructure</h2>
            <p>Advanced metrics, budgets, and splits designed to keep your balances aligned.</p>
          </div>
          <div className="lp-grid">
            <div className="lp-card">
              <div className="lp-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "24px", height: "24px" }}>
                  <path d="M3 12h18M3 6h18M3 18h18" strokeWidth="2.2" />
                  <path d="M8 3v18M16 3v18" strokeWidth="1" strokeDasharray="2 2" />
                  <rect x="5" y="4" width="6" height="4" rx="1" fill="currentColor" stroke="none" />
                  <rect x="13" y="10" width="6" height="4" rx="1" fill="currentColor" stroke="none" />
                </svg>
              </div>
              <h3>Multi-Workspace Sheets</h3>
              <p>Toggle between separate financial vaults. Maintain dedicated lists of expenses, monthly budgets, and group metrics per workspace.</p>
            </div>

            <div className="lp-card">
              <div className="lp-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "24px", height: "24px" }}>
                  <circle cx="6" cy="18" r="3" strokeWidth="2" />
                  <circle cx="18" cy="18" r="3" strokeWidth="2" />
                  <circle cx="12" cy="6" r="3" strokeWidth="2" />
                  <path d="M12 9l-4.5 6M12 9l4.5 6" strokeWidth="1.8" />
                  <path d="M9 18h6" strokeWidth="1.8" />
                  <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
                </svg>
              </div>
              <h3>Auto-Balancing Split Engine</h3>
              <p>Ditch complex spreadsheets. Log common bills, allocate individual weights, and trace who owes whom through automated matrix sheets.</p>
            </div>

            <div className="lp-card">
              <div className="lp-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "24px", height: "24px" }}>
                  <path d="M3 3v18h18" strokeWidth="2" />
                  <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" strokeWidth="2" />
                  <path d="M15 8h4v4" strokeWidth="2" />
                  <path d="M7 14.3l3.8-3.8 2.8 2.7 5.1-5.2V21H7z" fill="currentColor" opacity="0.1" stroke="none" />
                </svg>
              </div>
              <h3>Recharts Audit Sheets</h3>
              <p>Visualize daily expense trends, track active budget threshold gaps, and receive smart engine insights dynamically.</p>
            </div>
          </div>
        </section>

        {/* Details Showcase Block */}
        <section className="lp-details-block">
          <div className="lp-details-container">
            {/* Detail Row 1 */}
            <div className="lp-details-row">
              <div className="lp-details-col-text">
                <div className="lp-icon-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "22px", height: "22px" }}>
                    <path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3z" strokeWidth="2" />
                    <path d="M12 7a2.5 2.5 0 00-2.5 2.5V11h5V9.5A2.5 2.5 0 0012 7z" />
                    <rect x="8.5" y="11" width="7" height="5" rx="1" fill="currentColor" stroke="none" />
                  </svg>
                </div>
                <h3>Personal Data Privacy Architecture</h3>
                <p>
                  We build with security-first parameters. Your workspaces, transaction ledgers, and budget profiles are securely synced using Firebase Firestore databases.
                </p>
                <div className="lp-details-list">
                  <div className="lp-details-item">
                    <Check size={16} />
                    <span>Firebase Encrypted Authentication schemes</span>
                  </div>
                  <div className="lp-details-item">
                    <Check size={16} />
                    <span>Vaulted Firestore ledger storage rules</span>
                  </div>
                </div>
              </div>
              <div className="lp-details-col-visual" style={{ padding: 0, overflow: "hidden", minHeight: "280px", height: "280px" }}>
                <img src="/security_vault.png" alt="Cybersecurity Vault" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
            </div>

            {/* Detail Row 2 */}
            <div className="lp-details-row">
              <div className="lp-details-col-text">
                <div className="lp-icon-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "22px", height: "22px" }}>
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 11-.57-8.38l5.67-5.67" strokeWidth="2" />
                    <path d="M13 10l-4 6h4v4l4-6h-4v-4z" fill="currentColor" stroke="none" />
                  </svg>
                </div>
                <h3>Collaborative Group Sync</h3>
                <p>
                  No more manually syncing ledger sheets. Invite partners or split-bill members using real-time synchronization channels. Updates reflect instantly across all screens.
                </p>
                <div className="lp-details-list">
                  <div className="lp-details-item">
                    <Check size={16} />
                    <span>Instant token-based invite links</span>
                  </div>
                  <div className="lp-details-item">
                    <Check size={16} />
                    <span>Optimized settlement calculations</span>
                  </div>
                </div>
              </div>
              <div className="lp-details-col-visual" style={{ padding: 0, overflow: "hidden", minHeight: "280px", height: "280px" }}>
                <img src="/meeting_sync.png" alt="Real-Time Workspace Collaboration" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Accordion Section */}
        <section className="lp-faq-section">
          <div className="lp-faq-title">
            <h2>Frequently Asked Questions</h2>
          </div>
          <div className="lp-faq-list">
            {faqs.map((faq, index) => (
              <div className="lp-faq-item" key={index}>
                <div className="lp-faq-q" onClick={() => toggleFaq(index)}>
                  <span>{faq.q}</span>
                  <ChevronDown className={`lp-faq-chevron ${activeFaq === index ? "active" : ""}`} size={16} />
                </div>
                {activeFaq === index && (
                  <div className="lp-faq-a">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* CTA Banner */}
        <section className="lp-cta-banner">
          <h2>Simplify your workspaces today</h2>
          <p>Create a secure ledger workspace and invite your partners or split-bill members.</p>
          <button onClick={() => navigate("/login")}>Launch Workspace</button>
        </section>

        {/* Footer */}
        <footer className="lp-footer">
          &copy; {new Date().getFullYear()} Fintra Ledger. All rights reserved.
        </footer>
      </div>
    </>
  );
}
