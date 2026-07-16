import { useEffect, useMemo, useState, useRef } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
import Modal from "../components/Modal";
import { useAppStore } from "../store/useAppStore";
import { notify } from "../store/useNotificationStore";

function passwordStrength(p = "") {
  const len  = p.length >= 10 ? 2 : p.length >= 7 ? 1 : 0;
  const num  = /\d/.test(p) ? 1 : 0;
  const spec = /[^A-Za-z0-9]/.test(p) ? 1 : 0;
  const s    = len + num + spec;
  if (s <= 1) return { label: "Weak",   pct: 33,  color: "#ef4444" };
  if (s <= 3) return { label: "Medium", pct: 66,  color: "#f59e0b" };
  return           { label: "Strong",  pct: 100, color: "#22c55e" };
}

export default function AuthPage({ onAuthSuccess, initialMode = "login" }) {
  useEffect(() => {
    // Force dark mode on html tag while AuthPage is mounted to prevent light theme inversion
    const html = document.documentElement;
    const originalTheme = localStorage.getItem("theme") || "light";
    html.classList.add("dark");
    return () => {
      // Restore original dark class if next page matches light theme
      if (originalTheme !== "dark") {
        html.classList.remove("dark");
      }
    };
  }, []);

  const navigate = useNavigate();
  const [mode,            setMode]            = useState(initialMode === "signup" ? "signup" : "login");
  const [forgotOpen,      setForgotOpen]      = useState(false);
  const [isLeaving,       setIsLeaving]       = useState(false);
  const [name,            setName]            = useState("");
  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe,      setRememberMe]      = useState(false);
  const [showPass,        setShowPass]        = useState(false);

  const [typedText, setTypedText] = useState("");
  const [showBubble, setShowBubble] = useState(true);
  const targetText = mode === "signup" ? "Welcome! Let's get started!" : "Hii there, welcome back!";
  const isInitialMount = useRef(true);

  // Dynamic typing animation that bypasses Chrome back/forward history transitions
  useEffect(() => {
    let isBack = false;
    try {
      const navs = window.performance.getEntriesByType("navigation");
      if (navs && navs[0] && navs[0].type === "back_forward") {
        isBack = true;
      }
    } catch (e) {}

    if (isInitialMount.current && isBack) {
      setTypedText(targetText);
      setShowBubble(false);
      isInitialMount.current = false;
      return;
    }

    isInitialMount.current = false;
    let index = 0;
    setTypedText("");
    setShowBubble(true);
    let timeoutId = null;

    const interval = setInterval(() => {
      if (index < targetText.length) {
        setTypedText(targetText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        timeoutId = setTimeout(() => {
          setShowBubble(false);
        }, 2000);
      }
    }, 75);

    return () => {
      clearInterval(interval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [mode, targetText]);

  // Intercept browser back button to redirect directly to landing page ("/")
  useEffect(() => {
    window.history.pushState(null, null, window.location.pathname);
    
    const handlePopState = () => {
      window.history.pushState(null, null, window.location.pathname);
      navigate("/", { replace: true });
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [navigate]);

  const login       = useAppStore((s) => s.login);
  const signup      = useAppStore((s) => s.signup);
  const authLoading = useAppStore((s) => s.loading.auth);

  const strength = useMemo(() => passwordStrength(password), [password]);
  const isLogin  = mode === "login";

  async function handleResetPassword(e) {
    e?.preventDefault();
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !re.test(email)) { notify({ type: "error", message: "Invalid email" }); return; }
    try {
      await sendPasswordResetEmail(auth, email);
      notify({ type: "success", message: "Reset link sent! Check your inbox." });
      setForgotOpen(false);
    } catch (err) {
      const msg = err.code === "auth/user-not-found" ? "No account found"
                : err.code === "auth/invalid-email"  ? "Invalid email"
                : "Something went wrong";
      notify({ type: "error", message: msg });
    }
  }

  async function handleAuth() {
    if (!email || !password || (!isLogin && !name)) {
      notify({ type: "error", message: "Please fill all required fields." }); return;
    }
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) { notify({ type: "error", message: "Invalid email format." }); return; }
    if (password.length < 6) { notify({ type: "error", message: "Password must be at least 6 characters." }); return; }
    if (!isLogin && password !== confirmPassword) { notify({ type: "error", message: "Passwords do not match." }); return; }

    const res = isLogin ? await login({ email, password }) : await signup({ name, email, password });
    if (res.ok) {
      notify({ type: "success", message: isLogin ? "Logged in!" : "Account created!" });
      setIsLeaving(true);
      setTimeout(() => onAuthSuccess?.(), 300);
    } else {
      notify({ type: "error", message: res.message || "Authentication failed." });
    }
  }

  function switchMode() {
    setName(""); setPassword(""); setConfirmPassword(""); setShowPass(false);
    setMode(isLogin ? "signup" : "login");
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ax-page {
          min-height: 100vh;
          background: linear-gradient(to bottom, #c6c5b9 0%, #e3e1d7 50%, #f3f2ea 100%) !important;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
        }

        /* ── Main card ── */
        .ax-card {
          background: rgba(255, 255, 255, 0.25) !important;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.45) !important;
          border-radius: 24px;
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.4),
            0 30px 80px rgba(0, 0, 0, 0.05),
            0 0 120px rgba(255, 255, 255, 0.02) inset;
          width: 100%;
          max-width: 1080px;
          min-height: 650px;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }

        /* subtle top glow line */
        .ax-card::before {
          content: "";
          position: absolute;
          top: 0; left: 10%; right: 10%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
        }

        /* ── Top bar ── */
        .ax-topbar {
          display: flex;
          align-items: center;
          padding: 24px 32px;
          gap: 10px;
          position: relative;
          z-index: 10;
        }
        .ax-logo-icon {
          width: 32px;
          height: 32px;
          background: rgba(13, 13, 18, 0.05);
          border: 1px solid rgba(13, 13, 18, 0.12);
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ax-logo-icon svg { width: 16px; height: 16px; }
        .ax-logo-name {
          font-size: 16px;
          font-weight: 800;
          color: #0d0d12 !important;
          letter-spacing: -0.02em;
        }

        /* ── Body ── */
        .ax-body {
          flex: 1;
          display: flex;
          align-items: stretch;
        }

        /* Left: SVG centred & big */
        .ax-illus {
          flex: 55;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px 20px 32px 32px;
          position: relative;
        }
        /* soft glow behind SVG */
        .ax-illus::before {
          content: "";
          position: absolute;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .ax-illus img {
          width: 100%;
          max-width: 530px;
          height: auto;
          object-fit: contain;
          position: relative;
          z-index: 1;
          filter: brightness(0.98);
        }

        /* ── Centre divider ── */
        .ax-divider {
          width: 1px;
          flex-shrink: 0;
          position: relative;
          margin: 32px 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        /* gradient line */
        .ax-divider::before {
          content: "";
          position: absolute;
          top: 0; bottom: 0;
          left: 50%;
          width: 1px;
          transform: translateX(-50%);
          background: linear-gradient(
            to bottom,
            transparent 0%,
            rgba(0, 0, 0, 0.05) 20%,
            rgba(0, 0, 0, 0.12) 50%,
            rgba(0, 0, 0, 0.05) 80%,
            transparent 100%
          );
        }
        /* glowing dot in centre with breathing/pulse animation */
        @keyframes pulseGlow {
          0% {
            box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.01), 0 0 8px rgba(0, 0, 0, 0.02);
            border-color: rgba(0, 0, 0, 0.08);
          }
          55% {
            box-shadow: 0 0 0 5px rgba(0, 0, 0, 0.03), 0 0 15px rgba(0, 0, 0, 0.08);
            border-color: rgba(0, 0, 0, 0.2);
          }
          100% {
            box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.01), 0 0 8px rgba(0, 0, 0, 0.02);
            border-color: rgba(0, 0, 0, 0.08);
          }
        }
        .ax-divider-dot {
          position: relative;
          z-index: 2;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(243, 242, 234, 0.95);
          border: 1px solid rgba(0, 0, 0, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulseGlow 4s infinite ease-in-out;
        }
        .ax-divider-dot::after {
          content: "";
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #0d0d12;
          box-shadow: 0 0 6px rgba(0, 0, 0, 0.15);
        }

        /* Right: form */
        .ax-form-zone {
          flex: 45;
          padding: 48px 48px 48px 24px;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
        }

        .ax-heading {
          font-size: 28px;
          font-weight: 900;
          color: #0d0d12 !important;
          margin-bottom: 4px;
          letter-spacing: -0.03em;
        }
        .ax-subhead {
          font-size: 13px;
          color: #555566 !important;
          margin-bottom: 22px;
        }
        .ax-subhead button {
          color: #0d0d12 !important;
          font-weight: 700;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 13px;
          padding: 0;
          text-decoration: underline;
        }
        .ax-subhead button:hover { color: #000000 !important; }

        /* Google button */
        .ax-google-btn {
          width: 100%;
          padding: 11px 0;
          border-radius: 10px;
          border: 1px solid rgba(13, 13, 18, 0.12) !important;
          background: rgba(255, 255, 255, 0.4) !important;
          font-size: 13.5px;
          font-weight: 600;
          color: #0d0d12 !important;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
          margin-bottom: 16px;
        }
        .ax-google-btn:hover {
          border-color: #0d0d12 !important;
          background: rgba(255, 255, 255, 0.65) !important;
          color: #000000 !important;
        }

        /* Divider */
        .ax-or {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          font-size: 11px;
          color: #666677 !important;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .ax-or::before, .ax-or::after {
          content: "";
          flex: 1;
          height: 1px;
          background: rgba(13, 13, 18, 0.08) !important;
        }

        /* Form */
        .ax-form { display: flex; flex-direction: column; gap: 12px; }

        .ax-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 5px;
        }
        .ax-label {
          font-size: 12px;
          font-weight: 700;
          color: #444455 !important;
          letter-spacing: 0.02em;
        }
        .ax-forgot {
          font-size: 12px;
          color: #555566 !important;
          background: none;
          border: none;
          cursor: pointer;
          font-weight: 600;
          padding: 0;
          text-decoration: underline;
        }
        .ax-forgot:hover { color: #0d0d12 !important; }

        .ax-input-wrap { position: relative; }
        .ax-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 9px;
          border: 1px solid rgba(13, 13, 18, 0.12) !important;
          background: rgba(255, 255, 255, 0.4) !important;
          font-size: 14px;
          color: #0d0d12 !important;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        .ax-input:focus {
          border-color: rgba(13, 13, 18, 0.35) !important;
          box-shadow: 0 0 0 3px rgba(13, 13, 18, 0.05) !important;
        }
        .ax-input::placeholder { color: rgba(13, 13, 18, 0.35) !important; }
        .ax-input.has-icon { padding-right: 40px; }

        /* Webkit autofill override for light theme matching */
        .ax-input:-webkit-autofill,
        .ax-input:-webkit-autofill:hover,
        .ax-input:-webkit-autofill:focus,
        .ax-input:-webkit-autofill:active {
          -webkit-text-fill-color: #0d0d12 !important;
          -webkit-box-shadow: 0 0 0 1000px rgba(255, 255, 255, 0.7) inset !important;
          box-shadow: 0 0 0 1000px rgba(255, 255, 255, 0.7) inset !important;
          transition: background-color 5000s ease-in-out 0s;
        }

        .ax-eye {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #666;
          display: flex;
          align-items: center;
        }
        .ax-eye:hover { color: #0d0d12 !important; }

        /* strength */
        .ax-strength {
          padding: 9px 12px;
          border-radius: 9px;
          background: rgba(255, 255, 255, 0.4) !important;
          border: 1px solid rgba(13, 13, 18, 0.12) !important;
        }
        .ax-str-row {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #555566 !important;
          margin-bottom: 6px;
          font-weight: 500;
        }
        .ax-str-bar {
          height: 3px;
          border-radius: 99px;
          background: #d6d5cb !important;
          overflow: hidden;
        }
        .ax-str-fill {
          height: 100%;
          border-radius: 99px;
          transition: width 0.3s ease;
        }

        /* Remember me */
        .ax-check-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #444455 !important;
          cursor: pointer;
        }
        .ax-check-label input {
          width: 14px;
          height: 14px;
          accent-color: #242426 !important;
          cursor: pointer;
        }

        /* Submit */
        .ax-submit {
          width: 100%;
          padding: 12px 0;
          border-radius: 10px;
          background: #242426 !important;
          color: #ffffff !important;
          font-size: 14px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          letter-spacing: 0.01em;
          transition: opacity 0.18s, box-shadow 0.18s;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08) !important;
          margin-top: 4px;
        }
        .ax-submit:hover:not(:disabled) {
          opacity: 0.9;
          box-shadow: 0 6px 28px rgba(0, 0, 0, 0.15) !important;
        }
        .ax-submit:disabled { opacity: 0.45; cursor: not-allowed; }

        /* modal */
        .ax-modal-input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 9px;
          border: 1px solid rgba(13, 13, 18, 0.12) !important;
          background: rgba(255, 255, 255, 0.4) !important;
          font-size: 14px;
          color: #0d0d12 !important;
          outline: none;
          transition: border-color 0.18s;
        }
        .ax-modal-input:focus { border-color: #0d0d12 !important; }
        .ax-modal-input::placeholder { color: rgba(13, 13, 18, 0.35) !important; }
        .ax-modal-input:-webkit-autofill,
        .ax-modal-input:-webkit-autofill:hover,
        .ax-modal-input:-webkit-autofill:focus {
          -webkit-text-fill-color: #0d0d12 !important;
          -webkit-box-shadow: 0 0 0 1000px rgba(255, 255, 255, 0.7) inset !important;
          box-shadow: 0 0 0 1000px rgba(255, 255, 255, 0.7) inset !important;
          transition: background-color 5000s ease-in-out 0s;
        }
        .ax-modal-row { display: flex; justify-content: flex-end; gap: 8px; margin-top: 6px; }
        .ax-modal-cancel {
          padding: 9px 16px; border-radius: 8px; font-size: 13px;
          border: 1px solid rgba(13, 13, 18, 0.15); background: transparent; color: #555566 !important; cursor: pointer;
        }
        .ax-modal-cancel:hover { border-color: #242426; color: #242426 !important; }
        .ax-modal-send {
          padding: 9px 16px; border-radius: 8px; font-size: 13px;
          background: #242426 !important;
          color: #fff !important; border: none; font-weight: 700; cursor: pointer;
          box-shadow: 0 4px 14px rgba(0,0,0,0.15);
        }

        /* Force Light Glass modal overrides inside ax-page */
        .ax-page [role="dialog"] {
          background: rgba(243, 242, 236, 0.98) !important;
          border: 1px solid rgba(13, 13, 18, 0.12) !important;
          color: #0d0d12 !important;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12) !important;
          border-radius: 16px !important;
          max-width: 380px !important;
          width: 90% !important;
        }
        /* Top header container */
        .ax-page [role="dialog"] > div:first-child {
          padding: 20px 20px 6px !important;
        }
        /* Scrollable body container */
        .ax-page [role="dialog"] > div:nth-child(2) {
          padding: 4px 20px 20px !important;
        }
        .ax-page [role="dialog"] .font-bold {
          color: #0d0d12 !important;
          font-weight: 800;
          font-size: 15px !important;
        }
        .ax-page [role="dialog"] [class*="text-white"] {
          color: #0d0d12 !important;
        }
        .ax-page [role="dialog"] [aria-label="Close modal"] {
          color: #555566 !important;
        }
        .ax-page [role="dialog"] [aria-label="Close modal"] svg {
          color: #555566 !important;
          stroke: #555566 !important;
        }
        .ax-page [role="dialog"] [aria-label="Close modal"]:hover svg {
          color: #0d0d12 !important;
          stroke: #0d0d12 !important;
        }
        .ax-modal-desc {
          font-size: 13px;
          color: #555566 !important;
          line-height: 1.45;
          margin-bottom: 2px;
        }

        /* Responsive */
        @media (max-width: 680px) {
          .ax-illus { display: none; }
          .ax-form-zone { width: 100%; padding: 16px 28px 40px; }
          .ax-card { max-width: 440px; }
        }
      `}</style>

      <div className="ax-page">
        <div className="ax-card">

          {/* ── Logo top-left ── */}
          <div className="ax-topbar" style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
            <img src="/logo_black.png" alt="Fintra Logo" style={{ height: "28px", width: "auto", objectFit: "contain" }} />
          </div>

          {/* ── Body ── */}
          <div className="ax-body">

            {/* Left: SVG big & centred with typing speech bubble */}
            <div className="ax-illus">
              {/* Speech Bubble (Fixed Width & Left Anchored for Left-to-Right typing with fade-out) */}
              <div 
                className={`absolute top-[20%] left-[58%] sm:left-[60%] z-10 w-[195px] rounded-[22px] rounded-bl-none border border-white/20 bg-white/45 px-5 py-4 shadow-lg backdrop-blur-xl transition-all duration-500 ease-in-out ${
                  showBubble ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
                }`}
              >
                <div className="text-[14px] font-bold text-black/80 flex items-center gap-0.5">
                  <span>{typedText}</span>
                  <span className="h-3.5 w-1 bg-black/60 animate-pulse shrink-0" style={{ display: typedText.length < targetText.length ? "inline-block" : "none", marginLeft: "2px" }} />
                </div>
              </div>

              <img src="/animation.svg" alt="Fintra illustration" />
            </div>

            {/* Centre aesthetic divider */}
            <div className="ax-divider">
              <div className="ax-divider-dot" />
            </div>

            {/* Right: Form */}
            <div className="ax-form-zone">
              <h1 className="ax-heading" style={{ marginBottom: "20px" }}>
                {isLogin ? "Welcome back" : "Create account"}
              </h1>

              <form
                className="ax-form"
                onSubmit={(e) => { e.preventDefault(); handleAuth(); }}
              >
                {!isLogin && (
                  <div>
                    <div className="ax-label-row">
                      <span className="ax-label">Full name</span>
                    </div>
                    <div className="ax-input-wrap">
                      <input
                        type="text"
                        className="ax-input"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <div className="ax-label-row">
                    <span className="ax-label">Email</span>
                  </div>
                  <div className="ax-input-wrap">
                    <input
                      type="email"
                      className="ax-input"
                      placeholder="alan.turing@example.com"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <div className="ax-label-row">
                    <span className="ax-label">Password</span>
                    {isLogin && (
                      <button type="button" className="ax-forgot" onClick={() => setForgotOpen(true)}>
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="ax-input-wrap">
                    <input
                      type={showPass ? "text" : "password"}
                      className="ax-input has-icon"
                      placeholder="••••••••••"
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="button" className="ax-eye" onClick={() => setShowPass(p => !p)} tabIndex={-1}>
                      {showPass ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {!isLogin && password.length > 0 && (
                  <div className="ax-strength">
                    <div className="ax-str-row">
                      <span>Password strength</span>
                      <span style={{ color: strength.color, fontWeight: 700 }}>{strength.label}</span>
                    </div>
                    <div className="ax-str-bar">
                      <div className="ax-str-fill" style={{ width: `${strength.pct}%`, background: strength.color }} />
                    </div>
                  </div>
                )}

                {!isLogin && (
                  <div>
                    <div className="ax-label-row">
                      <span className="ax-label">Confirm password</span>
                    </div>
                    <div className="ax-input-wrap">
                      <input
                        type="password"
                        className="ax-input"
                        placeholder="••••••••••"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <label className="ax-check-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Remember me
                </label>

                <button
                  type="submit"
                  className="ax-submit"
                  disabled={authLoading || isLeaving}
                >
                  {authLoading || isLeaving
                    ? "Please wait…"
                    : isLogin ? "Log in" : "Create Account"}
                </button>

                <p className="ax-subhead" style={{ marginTop: "16px", textAlign: "center", marginBottom: "0" }}>
                  {isLogin
                    ? <>New here? <button type="button" onClick={switchMode}>Create an account.</button></>
                    : <>Already have one? <button type="button" onClick={switchMode}>Sign in.</button></>}
                </p>
              </form>
            </div>
          </div>

        </div>

        {/* Reset Password Modal */}
        <Modal open={forgotOpen} onClose={() => setForgotOpen(false)} title="Reset password">
          <form
            onSubmit={handleResetPassword}
            style={{ display: "flex", flexDirection: "column", gap: 10, padding: 0 }}
          >
            <p className="ax-modal-desc">
              Enter your email and we'll send you a reset link.
            </p>
            <input
              type="email"
              className="ax-modal-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="ax-modal-row">
              <button type="button" className="ax-modal-cancel" onClick={() => setForgotOpen(false)}>Cancel</button>
              <button type="button" className="ax-modal-send" onClick={handleResetPassword}>Send link</button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  );
}
