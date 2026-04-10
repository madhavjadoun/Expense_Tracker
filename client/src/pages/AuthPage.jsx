import { useMemo, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import GlassCard from "../components/GlassCard";
import Input from "../components/Input";
import Button from "../components/Button";
import Modal from "../components/Modal";
import ScrollReveal from "../components/ScrollReveal";
import Typewriter from "../components/Typewriter";
import { useAppStore } from "../store/useAppStore";
import { notify } from "../store/useNotificationStore";

const tabBase =
  "relative flex-1 rounded-xl px-3 py-2 text-sm font-medium transition";
const neonInputClass =
  "border-violet-300/20 bg-white/6 focus:border-violet-400/60 focus:ring-violet-400/30";
const floatingItems = [
  { kind: "text", symbol: "$", left: "6%", size: 24, delay: 0.0, duration: 9.5, drift: 14, opacity: 0.2, blur: 2 },
  { kind: "text", symbol: "₹", left: "12%", size: 22, delay: 1.3, duration: 11.8, drift: -18, opacity: 0.18, blur: 3 },
  { kind: "text", symbol: "💰", left: "18%", size: 26, delay: 2.2, duration: 14.6, drift: 16, opacity: 0.16, blur: 2 },
  { kind: "text", symbol: "💳", left: "24%", size: 20, delay: 0.8, duration: 10.9, drift: -12, opacity: 0.15, blur: 4 },
  { kind: "text", symbol: "$", left: "31%", size: 28, delay: 2.7, duration: 16.2, drift: 20, opacity: 0.14, blur: 4 },
  { kind: "text", symbol: "₹", left: "38%", size: 18, delay: 1.1, duration: 8.8, drift: -10, opacity: 0.22, blur: 2 },
  { kind: "text", symbol: "💰", left: "44%", size: 24, delay: 3.0, duration: 18.0, drift: 18, opacity: 0.13, blur: 5 },
  { kind: "text", symbol: "💳", left: "50%", size: 21, delay: 0.5, duration: 12.4, drift: -14, opacity: 0.17, blur: 3 },
  { kind: "text", symbol: "$", left: "57%", size: 19, delay: 1.9, duration: 9.9, drift: 11, opacity: 0.2, blur: 2 },
  { kind: "text", symbol: "₹", left: "63%", size: 23, delay: 2.8, duration: 15.4, drift: -20, opacity: 0.14, blur: 5 },
  { kind: "text", symbol: "💰", left: "69%", size: 27, delay: 0.7, duration: 17.1, drift: 17, opacity: 0.12, blur: 6 },
  { kind: "text", symbol: "💳", left: "74%", size: 18, delay: 2.1, duration: 10.3, drift: -13, opacity: 0.19, blur: 2 },
  { kind: "coin", left: "80%", size: 20, delay: 1.6, duration: 13.7, drift: 15, opacity: 0.18, blur: 3 },
  { kind: "card", left: "85%", size: 24, delay: 0.3, duration: 11.2, drift: -16, opacity: 0.16, blur: 4 },
  { kind: "coin", left: "90%", size: 17, delay: 2.4, duration: 8.6, drift: 10, opacity: 0.23, blur: 2 },
  { kind: "card", left: "95%", size: 21, delay: 3.2, duration: 19.0, drift: -18, opacity: 0.12, blur: 6 },
];

function passwordStrength(password) {
  const p = password || "";
  const lengthScore = p.length >= 10 ? 2 : p.length >= 7 ? 1 : 0;
  const numberScore = /\d/.test(p) ? 1 : 0;
  const specialScore = /[^A-Za-z0-9]/.test(p) ? 1 : 0;
  const score = lengthScore + numberScore + specialScore;
  if (score <= 1) return { label: "Weak", pct: 33 };
  if (score <= 3) return { label: "Medium", pct: 66 };
  return { label: "Strong", pct: 100 };
}

export default function AuthPage({ onAuthSuccess, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode === "signup" ? "signup" : "login"); // "login" | "signup"
  const [forgotOpen, setForgotOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const login = useAppStore((s) => s.login);
  const signup = useAppStore((s) => s.signup);
  const authLoading = useAppStore((s) => s.loading.auth);

  const title = useMemo(() => {
    return mode === "login" ? "Welcome back" : "Create your account";
  }, [mode]);

  const strength = useMemo(() => passwordStrength(password), [password]);
  const parallax = useMemo(() => {
    const x = mouse.x;
    const y = mouse.y;
    return {
      layer1: `translate3d(${x * 10}px, ${y * 10}px, 0)`,
      layer2: `translate3d(${x * 20}px, ${y * 20}px, 0)`,
      layer3: `translate3d(${x * 5}px, ${y * 2}px, 0)`,
    };
  }, [mouse.x, mouse.y]);

  async function handleResetPassword(e) {
    if (e) e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      notify({ type: "error", message: "Invalid email" });
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      notify({ type: "success", message: "Reset link sent! Check your inbox." });
      setForgotOpen(false);
    } catch (err) {
      console.error("Failure: Failed to send password reset email:", err);
      let errMsg = "Something went wrong";
      if (err.code === "auth/user-not-found") {
        errMsg = "No account found";
      } else if (err.code === "auth/invalid-email") {
        errMsg = "Invalid email";
      }
      notify({ type: "error", message: errMsg });
    }
  }

  async function handleSignup() {
    return signup({ name, email, password });
  }

  async function handleLogin() {
    return login({ email, password });
  }

  async function handleAuth() {
    if (!email || !password || (mode === "signup" && !name)) {
      notify({ type: "error", message: "Please fill all required fields." });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      notify({ type: "error", message: "Invalid email format." });
      return;
    }

    if (password.length < 6) {
      notify({ type: "error", message: "Password must be at least 6 characters long." });
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      notify({ type: "error", message: "Passwords do not match." });
      return;
    }

    const res =
      mode === "signup"
        ? await handleSignup()
        : await handleLogin();

    if (res.ok) {
      notify({
        type: "success",
        message: mode === "signup" ? "Account created successfully!" : "Logged in successfully!",
      });
      setIsLeaving(true);
      setTimeout(() => {
        onAuthSuccess?.();
      }, 260);
    } else {
      notify({ type: "error", message: res.message || "Authentication failed." });
    }
  }

  return (
    <Motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={isLeaving ? { opacity: 0, y: -8 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.26, ease: "easeOut" }}
      className="relative grid min-h-[calc(100vh-4rem)] place-items-center overflow-hidden px-4 py-8"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        setMouse({ x: nx, y: ny });
      }}
    >
      {/* Fullscreen ambient gradients */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <Motion.div
          className="absolute inset-0"
          style={{
            transform: parallax.layer1,
            transition: "transform 0.2s ease-out",
            willChange: "transform",
          }}
        >
          <Motion.div
            className="absolute -top-24 -left-24 h-[30rem] w-[30rem] rounded-full bg-violet-500/22 blur-3xl"
            animate={{ x: [0, 18, -12, 0], y: [0, 14, -10, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
          <Motion.div
            className="absolute top-12 right-[-8rem] h-[34rem] w-[34rem] rounded-full bg-blue-500/20 blur-3xl"
            animate={{ x: [0, -16, 14, 0], y: [0, -12, 16, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          />
          <Motion.div
            className="absolute bottom-[-10rem] left-1/3 h-[32rem] w-[32rem] rounded-full bg-emerald-500/18 blur-3xl"
            animate={{ x: [0, 14, -10, 0], y: [0, -10, 14, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
        </Motion.div>

        {/* Floating decorative glyphs */}
        <Motion.div
          className="absolute inset-0"
          style={{
            transform: parallax.layer2,
            transition: "transform 0.2s ease-out",
            willChange: "transform",
          }}
        >
          {floatingItems.map((item, idx) => (
            <Motion.div
              key={item.left + String(idx)}
              className="absolute top-[-10%]"
              style={{
                left: item.left,
                opacity: item.opacity,
                filter: `blur(${Math.max(0.8, item.blur * 0.45)}px) drop-shadow(0 0 8px rgba(148,163,184,.3))`,
                willChange: "transform",
              }}
              animate={{
                y: ["-100px", "100vh"],
                x: [0, item.drift, -item.drift * 0.7, item.drift * 0.4, 0],
                rotate: [0, 8, -6, 3],
              }}
              transition={{
                duration: item.duration,
                delay: item.delay,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              {item.kind === "text" ? (
                <span style={{ fontSize: `${item.size}px` }} className="font-semibold text-white">
                  {item.symbol}
                </span>
              ) : item.kind === "coin" ? (
                <svg width={item.size} height={item.size} viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,.9)" strokeWidth="1.4" />
                  <path d="M8.5 12h7M10 9.5h4M10 14.5h4" stroke="rgba(255,255,255,.85)" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width={item.size + 6} height={item.size} viewBox="0 0 28 20" fill="none">
                  <rect x="2" y="3" width="24" height="14" rx="3" stroke="rgba(255,255,255,.9)" strokeWidth="1.3" />
                  <rect x="5" y="7" width="18" height="2.5" rx="1" fill="rgba(255,255,255,.85)" />
                </svg>
              )}
            </Motion.div>
          ))}
        </Motion.div>
      </div>

      <div className="relative mx-auto w-full max-w-xl">
        <Motion.div
          className="pointer-events-none absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-r from-violet-500/25 via-blue-500/15 to-emerald-500/20 blur-3xl"
          animate={{ opacity: [0.6, 0.95, 0.65] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <ScrollReveal delay={0.05}>
          <Motion.div
            style={{
              transform: parallax.layer3,
              transition: "transform 0.2s ease-out",
              willChange: "transform",
            }}
          >
            <GlassCard className="p-5 shadow-[0_0_65px_rgba(99,102,241,0.22)] transition hover:shadow-[0_0_80px_rgba(99,102,241,0.28)] sm:p-6">
            <div className="mb-5 text-center">
              <h1 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl min-h-[40px]">
                <Typewriter text="Finance, without the noise." />
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                Secure access to your expense workspace.
              </p>
            </div>
            <div className="mb-4 flex gap-2 rounded-2xl border border-white/10 bg-white/5 p-1">
              <button
                className={`${tabBase} ${
                  mode === "login"
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:text-white/80"
                }`}
                onClick={() => setMode("login")}
              >
                Login
              </button>
              <button
                className={`${tabBase} ${
                  mode === "signup"
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:text-white/80"
                }`}
                onClick={() => setMode("signup")}
              >
                Signup
              </button>
            </div>

            <AnimatePresence mode="wait">
              <Motion.div
                key={mode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div>
                  <div className="text-lg font-semibold text-white/90 min-h-[28px]">
                    <Typewriter text={title} />
                  </div>
                  <div className="text-xs text-white/55">
                    {mode === "login"
                      ? "Sign in to continue."
                      : "Create your account."}
                  </div>
                </div>

                <div className="grid gap-3">
                  {mode === "signup" ? (
                    <Input
                      label="Name"
                      type="text"
                      className={neonInputClass}
                      placeholder="Your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  ) : null}
                  <Input
                    label="Email"
                    type="email"
                    className={neonInputClass}
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Input
                    label="Password"
                    type="password"
                    className={neonInputClass}
                    placeholder="••••••••"
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />

                  {mode === "signup" ? (
                    <div className="rounded-2xl border border-white/10 bg-white/4 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-medium text-white/70">
                          Password strength
                        </div>
                        <div className="text-xs text-white/55">
                          {strength.label}
                        </div>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                        <Motion.div
                          className="h-full rounded-full bg-emerald-400/70"
                          initial={{ width: 0 }}
                          animate={{ width: `${strength.pct}%` }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  ) : null}

                  {mode === "signup" ? (
                    <Input
                      label="Confirm password"
                      type="password"
                      className={neonInputClass}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  ) : null}
                </div>

                <div className="flex items-center justify-start gap-3">
                  <button
                    className="text-xs text-white/60 underline-offset-4 hover:text-white/85 hover:underline"
                    onClick={() => setForgotOpen(true)}
                    type="button"
                  >
                    Forgot Password?
                  </button>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-violet-500/90 via-blue-500/85 to-emerald-500/80 text-white shadow-[0_16px_50px_rgba(59,130,246,0.35)] hover:shadow-[0_20px_65px_rgba(59,130,246,0.45)]"
                  onClick={handleAuth}
                  type="button"
                  disabled={authLoading || isLeaving}
                >
                  {authLoading || isLeaving
                    ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
                        Please wait...
                      </span>
                    )
                    : mode === "login"
                      ? "Login"
                      : "Create account"}
                </Button>
              </Motion.div>
            </AnimatePresence>
            </GlassCard>
          </Motion.div>
        </ScrollReveal>
      </div>

      <Modal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        title="Reset password"
      >
        <form onSubmit={handleResetPassword} className="space-y-3">
          <div className="text-sm text-white/70">
            Enter your email and we’ll send a reset link.
          </div>
          <Input 
            label="Email" 
            type="email" 
            placeholder="you@example.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setForgotOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleResetPassword}>Send link</Button>
          </div>
        </form>
      </Modal>
    </Motion.div>
  );
}

