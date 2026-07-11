import { useMemo, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import Input from "../components/Input";
import Modal from "../components/Modal";
import { useAppStore } from "../store/useAppStore";
import { notify } from "../store/useNotificationStore";

/* ── Password strength ─────────────────────────────────── */
function passwordStrength(p = "") {
  const len  = p.length >= 10 ? 2 : p.length >= 7 ? 1 : 0;
  const num  = /\d/.test(p) ? 1 : 0;
  const spec = /[^A-Za-z0-9]/.test(p) ? 1 : 0;
  const s    = len + num + spec;
  if (s <= 1) return { label: "Weak",   pct: 33,  color: "#d97706" };
  if (s <= 3) return { label: "Medium", pct: 66,  color: "#859E7A" };
  return           { label: "Strong",  pct: 100, color: "#10B981" };
}

/*
  ── SVG Clip-path constants ──────────────────────────────
  The image panel occupies 52% width with a 14° angled right-edge cut.
  Clip-paths are in % units so they scale perfectly with any viewport.

  LOGIN:  image on LEFT  → clip cuts into right side (top-right pulled inward)
  SIGNUP: image on RIGHT → image flips, clip cuts into left side
*/
const CLIP_LOGIN  = "polygon(0 0, 100% 0, 88% 100%, 0 100%)";
const CLIP_SIGNUP = "polygon(12% 0, 100% 0, 100% 100%, 0 100%)";

/* Mobile: hide image, show full-width form */

/* ── Framer spring ──────────────────────────────────────── */
const PANEL_SPRING = { type: "spring", stiffness: 340, damping: 38, mass: 1 };

/* ── Input style ─────────────────────────────────────────  */
const inputCls =
  "w-full rounded-2xl border border-white/12 bg-white/[0.05] px-4 py-3 text-[13px] text-white/90 placeholder:text-white/35 focus:border-[#859E7A]/60 focus:ring-2 focus:ring-[#859E7A]/20 outline-none transition-all duration-300";

export default function AuthPage({ onAuthSuccess, initialMode = "login" }) {
  const [mode,            setMode]            = useState(initialMode === "signup" ? "signup" : "login");
  const [forgotOpen,      setForgotOpen]      = useState(false);
  const [isLeaving,       setIsLeaving]       = useState(false);
  const [name,            setName]            = useState("");
  const [email,           setEmail]           = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe,      setRememberMe]      = useState(false);

  const login       = useAppStore((s) => s.login);
  const signup      = useAppStore((s) => s.signup);
  const authLoading = useAppStore((s) => s.loading.auth);

  const strength = useMemo(() => passwordStrength(password), [password]);
  const isLogin  = mode === "login";

  /* ── Handlers ────────────────────────────────────────── */
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
    setName(""); setPassword(""); setConfirmPassword("");
    setMode(isLogin ? "signup" : "login");
  }

  /* ── Render ──────────────────────────────────────────── */
  return (
    <div className="relative flex min-h-screen w-full overflow-hidden bg-[#0D1810]">

      {/* ════════════════════════════════════════════════════
          IMAGE PANEL  (hidden on mobile, 52% on md+)
      ════════════════════════════════════════════════════ */}
      <div
        className="hidden md:block"
        style={{
          position:    "absolute",
          top:         0,
          left:        isLogin ? 0 : "auto",
          right:       isLogin ? "auto" : 0,
          width:       "52%",
          height:      "100%",
          zIndex:      10,
        }}
      >
        {/* Clip container — SVG polygon for crisp angled edge */}
        <div
          style={{
            width:      "100%",
            height:     "100%",
            clipPath:   isLogin ? CLIP_LOGIN : CLIP_SIGNUP,
            borderRadius: "32px",
            overflow:   "hidden",
          }}
        >
          {/* ── Ken Burns base: slow infinite zoom ── */}
          <Motion.div
            key={mode}
            initial={{ scale: 1.08, opacity: 0 }}
            animate={{ scale: 1.0,  opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ opacity: { duration: 0.9 }, scale: { duration: 14, ease: "linear" } }}
            style={{
              width:              "100%",
              height:             "100%",
              backgroundImage:    `url(${isLogin ? "/auth_login.png" : "/auth_signup.png"})`,
              backgroundSize:     "cover",
              backgroundPosition: "center",
            }}
          />

          {/* ── Gradient overlay for text legibility ── */}
          <div
            style={{
              position:   "absolute",
              inset:      0,
              background: isLogin
                ? "linear-gradient(135deg, rgba(13,24,16,0.45) 0%, rgba(13,24,16,0.1) 60%, transparent 100%)"
                : "linear-gradient(225deg, rgba(13,24,16,0.45) 0%, rgba(13,24,16,0.1) 60%, transparent 100%)",
              pointerEvents: "none",
            }}
          />

          {/* ── Editorial label bottom ── */}
          <Motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            style={{
              position:    "absolute",
              bottom:      36,
              left:        isLogin ? 40 : "auto",
              right:       isLogin ? "auto" : 40,
              display:     "flex",
              flexDirection: "column",
              gap:         6,
            }}
          >
            <span style={{ fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(232,237,230,0.5)", fontWeight: 600 }}>
              {isLogin ? "Budget Ledger · Monthly Review" : "New Journal · Fresh Start"}
            </span>
            <span style={{ fontSize: 22, fontWeight: 300, color: "#E8EDE6", lineHeight: 1.3, fontStyle: "italic", fontFamily: "Georgia, serif", whiteSpace: "pre-line" }}>
              {isLogin ? "Back to your\nclarity." : "My money.\nMy rules."}
            </span>
          </Motion.div>
        </div>
      </div>

      {/* Mobile background image (subtle) — shows on small screens only */}
      <div
        className="absolute inset-0 md:hidden"
        style={{
          backgroundImage: `url(${isLogin ? "/auth_login.png" : "/auth_signup.png"})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.15,
          zIndex: 0,
        }}
      />

      {/* ════════════════════════════════════════════════════
          FORM PANEL  (full width on mobile, 48% on md+)
      ════════════════════════════════════════════════════ */}
      <Motion.div
        key="form-panel"
        animate={{
          x:       0,
          opacity: isLeaving ? 0 : 1,
        }}
        transition={{ ...PANEL_SPRING, opacity: { duration: 0.25 } }}
        className={`relative z-20 flex min-h-screen w-full items-center justify-center px-5 py-10 md:absolute md:top-0 md:h-full md:w-[48%] md:px-10 ${
          isLogin ? "md:right-0 md:left-auto" : "md:left-0 md:right-auto"
        }`}
      >
        <div style={{ width: "100%", maxWidth: 380 }}>
          {/* InsightX wordmark */}
          <div style={{
            display:        "flex",
            alignItems:     "center",
            gap:            8,
            marginBottom:   48,
          }}>
            <div style={{
              width:        12,
              height:       12,
              borderRadius: "50%",
              border:       "1.5px solid #859E7A",
            }} />
            <span style={{
              fontSize:      10,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color:         "#859E7A",
              fontWeight:    700,
            }}>InsightX</span>
          </div>

          {/* Heading block */}
          <AnimatePresence mode="wait">
            <Motion.div
              key={mode + "-heading"}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{ marginBottom: 32 }}
            >
              <div style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(133,158,122,0.7)", marginBottom: 10, fontWeight: 600 }}>
                {isLogin ? "Secure Access" : "Create Account"}
              </div>
              <h1 style={{ fontSize: 32, fontWeight: 300, color: "#E8EDE6", lineHeight: 1.1, letterSpacing: "-0.02em", fontFamily: "Georgia, serif" }}>
                {isLogin ? (
                  <>Welcome <span style={{ fontStyle: "italic" }}>back.</span></>
                ) : (
                  <>Start your <span style={{ fontStyle: "italic" }}>journey.</span></>
                )}
              </h1>
              <p style={{ marginTop: 8, fontSize: 12, color: "rgba(232,237,230,0.55)", fontWeight: 300, lineHeight: 1.6 }}>
                {isLogin
                  ? "Sign in to your quiet ledger and continue tracking with clarity."
                  : "Create your space for intentional, mindful expense tracking."}
              </p>
            </Motion.div>
          </AnimatePresence>

          {/* Form fields */}
          <AnimatePresence mode="wait">
            <Motion.form
              key={mode + "-form"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onSubmit={(e) => { e.preventDefault(); handleAuth(); }}
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              {!isLogin && (
                <div>
                  <label style={{ display: "block", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(133,158,122,0.8)", marginBottom: 6, fontWeight: 600 }}>Name</label>
                  <input
                    type="text"
                    className={inputCls}
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(133,158,122,0.8)", marginBottom: 6, fontWeight: 600 }}>Email</label>
                <input
                  type="email"
                  className={inputCls}
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(133,158,122,0.8)", marginBottom: 6, fontWeight: 600 }}>Password</label>
                <input
                  type="password"
                  className={inputCls}
                  placeholder="••••••••"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* Password strength bar */}
              {!isLogin && password.length > 0 && (
                <Motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)", padding: "10px 14px", background: "rgba(0,0,0,0.15)" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 10, color: "rgba(232,237,230,0.5)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Strength</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: strength.color }}>{strength.label}</span>
                  </div>
                  <div style={{ height: 3, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                    <Motion.div
                      animate={{ width: `${strength.pct}%` }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      style={{ height: "100%", borderRadius: 99, background: strength.color }}
                    />
                  </div>
                </Motion.div>
              )}

              {!isLogin && (
                <div>
                  <label style={{ display: "block", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(133,158,122,0.8)", marginBottom: 6, fontWeight: 600 }}>Confirm Password</label>
                  <input
                    type="password"
                    className={inputCls}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              )}

              {/* Remember me & forgot */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: "#859E7A" }}
                  />
                  <span style={{ fontSize: 11, color: "rgba(232,237,230,0.6)" }}>Remember me</span>
                </label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setForgotOpen(true)}
                    style={{ fontSize: 11, color: "#859E7A", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}
                  >
                    Forgot password
                  </button>
                )}
              </div>

              {/* Primary CTA */}
              <button
                type="submit"
                disabled={authLoading || isLeaving}
                style={{
                  marginTop:     8,
                  width:         "100%",
                  padding:       "14px 0",
                  borderRadius:  99,
                  background:    "#859E7A",
                  color:         "#101E16",
                  fontSize:      12,
                  fontWeight:    700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  border:        "none",
                  cursor:        authLoading || isLeaving ? "not-allowed" : "pointer",
                  opacity:       authLoading || isLeaving ? 0.7 : 1,
                  transition:    "all 0.25s ease",
                  boxShadow:     "0 8px 24px rgba(133,158,122,0.28)",
                }}
                onMouseEnter={(e) => { e.target.style.background = "#10B981"; e.target.style.color = "#fff"; }}
                onMouseLeave={(e) => { e.target.style.background = "#859E7A"; e.target.style.color = "#101E16"; }}
              >
                {authLoading || isLeaving ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                    <span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(16,30,22,0.3)", borderTopColor: "#101E16", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                    Please wait…
                  </span>
                ) : isLogin ? "Log In" : "Create Account"}
              </button>

              {/* Toggle link */}
              <p style={{ textAlign: "center", marginTop: 16, fontSize: 11, color: "rgba(232,237,230,0.45)" }}>
                {isLogin ? "New here? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={switchMode}
                  style={{ color: "#859E7A", background: "none", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 11, textDecoration: "underline", textUnderlineOffset: 3 }}
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </p>
            </Motion.form>
          </AnimatePresence>
        </div>
      </Motion.div>

      {/* ── Spinner keyframes ── */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Reset Password Modal ── */}
      <Modal open={forgotOpen} onClose={() => setForgotOpen(false)} title="Reset password">
        <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: 14, padding: 4 }}>
          <p style={{ fontSize: 12, color: "rgba(232,237,230,0.7)", fontWeight: 300 }}>
            Enter your email and we'll send you a reset link.
          </p>
          <input
            type="email"
            className={inputCls}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button
              type="button"
              onClick={() => setForgotOpen(false)}
              style={{ padding: "10px 18px", borderRadius: 12, fontSize: 12, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "rgba(232,237,230,0.8)", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleResetPassword}
              style={{ padding: "10px 18px", borderRadius: 12, fontSize: 12, background: "#859E7A", color: "#101E16", border: "none", fontWeight: 700, cursor: "pointer" }}
            >
              Send link
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
