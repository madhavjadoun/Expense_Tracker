import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { ArrowRight, Compass, Wind, Sparkles } from "lucide-react";
import { motion as Motion } from "framer-motion";
import { useEffect, useState } from "react";

/* ─── Typewriter hook ─── */
function useTypewriter(text, { startDelay = 0, speed = 55, onDone } = {}) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    let i = 0;
    setDisplayed("");
    setDone(false);
    let tid, iid;
    tid = setTimeout(() => {
      iid = setInterval(() => {
        i += 1;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(iid);
          setDone(true);
          onDone?.();
        }
      }, speed);
    }, startDelay);
    return () => { clearTimeout(tid); clearInterval(iid); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  return { displayed, done };
}

/*
  COLOR SYSTEM (matching main app palette exactly)
  ─────────────────────────────────────────────────
  Dark mode  (app default):
    bg-deep    #101E16   (darkest forest green)
    bg-mid     #162B1E   (card surfaces)
    bg-card    #1C3325   (slightly lighter card)
    border     #263D2B / rgba(133,158,122,0.15)
    text-main  #E8EDE6   (soft warm white)
    text-muted #859E7A   (sage / muted green)
    accent     #859E7A   (sage green — same as app)
    accent2    #10B981   (emerald — app's emerald-500)

  Light mode (app uses CSS invert — landing page is .no-invert so renders literal):
    We mirror dark palette softly:
    bg-deep    #F0F4F1   (barely-green off-white)
    bg-mid     #E8EDE6   (light sage surface)
    bg-card    #DDE5D9   (slightly deeper card)
    border     #C5D3BE
    text-main  #101E16   (dark forest = high contrast on light)
    text-muted #3D6647
    accent     #3D6647
*/

export default function LandingPage() {
  const navigate = useNavigate();
  const theme    = useAppStore((s) => s.theme);
  const isLight  = theme === "light";

  // Palette shortcuts
  const P = isLight
    ? {
        pageBg:     "bg-[#F0F4F1]",
        sectionAlt: "bg-[#E8EDE6]",
        cardBg:     "bg-[#EBF0E8]",
        cardBg2:    "bg-[#DDE5D9]",
        border:     "border-[#C5D3BE]",
        divider:    "divide-[#C5D3BE]",
        text:       "text-[#101E16]",
        textMuted:  "text-[#3D6647]",
        textFaint:  "text-[#3D6647]/60",
        accent:     "#3D6647",
        accentCls:  "text-[#3D6647]",
        btnPrimary: "bg-[#101E16] text-[#F0F4F1] hover:bg-[#3D6647]",
        btnSecBdr:  "border-[#101E16]/25 hover:border-[#101E16]/50 text-[#101E16]",
        chipBg:     "bg-[#DDE5D9] border-[#C5D3BE] text-[#101E16]",
        overlayBg:  "rgba(240,244,241,0.88)",
        overlayBdr: "rgba(197,211,190,0.7)",
        headerBtn:  "border-[#101E16] bg-[#101E16] text-[#F0F4F1] hover:bg-transparent hover:text-[#101E16]",
        circle:     "border-[#101E16]",
      }
    : {
        pageBg:     "bg-[#101E16]",
        sectionAlt: "bg-[#0D1A12]",
        cardBg:     "bg-[#162B1E]",
        cardBg2:    "bg-[#1C3325]",
        border:     "border-[#263D2B]",
        divider:    "divide-[#263D2B]",
        text:       "text-[#E8EDE6]",
        textMuted:  "text-[#859E7A]",
        textFaint:  "text-[#859E7A]/70",
        accent:     "#859E7A",
        accentCls:  "text-[#859E7A]",
        btnPrimary: "bg-[#859E7A] text-[#101E16] hover:bg-[#10B981] hover:text-white",
        btnSecBdr:  "border-[#859E7A]/30 hover:border-[#859E7A]/70 text-[#E8EDE6]",
        chipBg:     "bg-[#1C3325] border-[#263D2B] text-[#E8EDE6]",
        overlayBg:  "rgba(16,30,22,0.88)",
        overlayBdr: "rgba(38,61,43,0.8)",
        headerBtn:  "border-[#859E7A] bg-[#859E7A] text-[#101E16] hover:bg-transparent hover:text-[#859E7A]",
        circle:     "border-[#859E7A]",
      };

  const [parsed, setParsed] = useState(false);
  const { displayed, done: twDone } = useTypewriter("Dinner with friends 2450 food", {
    startDelay: 900,
    speed: 52,
    onDone: () => setTimeout(() => setParsed(true), 320),
  });

  return (
    <div className={`no-invert min-h-screen font-sans selection:bg-[#859E7A]/30 transition-colors duration-700 overflow-x-hidden ${P.pageBg} ${P.text}`}>

      {/* ══ HEADER ══════════════════════════════════════════ */}
      <Motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-7xl px-8 py-8 flex items-center justify-between"
      >
        <div className={`flex items-center gap-2 tracking-widest text-xs font-semibold uppercase ${P.text}`}>
          <Motion.span
            initial={{ rotate: -18, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`w-3.5 h-3.5 rounded-full border ${P.circle}`}
          />
          <span>InsightX</span>
        </div>

        <nav className={`hidden md:flex items-center gap-10 text-[11px] font-medium tracking-wider uppercase opacity-60 ${P.text}`}>
          <a href="#philosophy" className="hover:opacity-100 transition-opacity duration-300">Philosophy</a>
          <a href="#interface"  className="hover:opacity-100 transition-opacity duration-300">Interface</a>
          <a href="#principles" className="hover:opacity-100 transition-opacity duration-300">Principles</a>
        </nav>

        <button
          onClick={() => navigate("/login")}
          className={`group flex items-center gap-1.5 px-4 py-2 text-[11px] font-semibold tracking-wider uppercase rounded-full border transition-all duration-500 ${P.headerBtn}`}
        >
          Enter Space
          <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform duration-300" />
        </button>
      </Motion.header>

      {/* ══ HERO ══════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-8 pt-6 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        {/* Left text */}
        <div className="lg:col-span-6 space-y-7">
          <Motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
            className={`text-[10px] uppercase font-bold tracking-widest block ${P.textMuted}`}
          >
            Quiet Ledger · Intentional Tracking
          </Motion.span>

          <div className="space-y-1">
            <Motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl sm:text-5xl lg:text-[3.6rem] font-light tracking-tight leading-[1.06] font-serif"
            >
              The art of
            </Motion.h1>
            <Motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.27, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl sm:text-5xl lg:text-[3.6rem] font-light tracking-tight leading-[1.06] font-serif italic"
            >
              deliberate tracking.
            </Motion.h1>
          </div>

          <Motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
            className={`text-sm leading-relaxed max-w-md font-light ${P.textFaint}`}
          >
            An editorial expense tracker for absolute financial clarity. Document spending in plain text, coordinate shared workspaces, and observe habits without the clutter of traditional dashboards.
          </Motion.p>

          <Motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.58, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-6 pt-1"
          >
            <button
              onClick={() => navigate("/signup")}
              className={`px-6 py-3 rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-300 shadow-sm hover:shadow-md active:scale-[0.98] ${P.btnPrimary}`}
            >
              Begin Journey
            </button>
            <button
              onClick={() => navigate("/login")}
              className={`text-xs font-semibold tracking-wider uppercase border-b pb-0.5 hover:opacity-60 transition-opacity duration-300 ${P.textMuted} border-current`}
            >
              Sign In
            </button>
          </Motion.div>
        </div>

        {/* Right — notebook image */}
        <div className="lg:col-span-6 flex justify-end">
          <Motion.div
            initial={{ opacity: 0, scale: 1.05, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
            className={`relative rounded-[28px] overflow-hidden border w-full max-w-[500px] shadow-2xl ${P.cardBg} ${P.border}`}
          >
            <div className="relative overflow-hidden rounded-[22px] m-2.5">
              <Motion.img
                src="/editorial_notebook.png"
                alt="Handcrafted expense notebook with pen, receipts, and coffee on a wooden desk"
                initial={{ scale: 1.07 }}
                animate={{ scale: 1 }}
                transition={{ duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
                className="w-full aspect-[4/3.5] object-cover"
              />

              {/* Light sweep shimmer */}
              <Motion.div
                initial={{ x: "-110%" }}
                animate={{ x: "220%" }}
                transition={{ duration: 1.1, delay: 0.65, ease: "easeInOut" }}
                className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/18 to-transparent pointer-events-none"
                style={{ transform: "skewX(-12deg)" }}
              />

              {/* AI parse chip */}
              <Motion.div
                initial={{ opacity: 0, y: 10, scale: 0.93 }}
                animate={parsed ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-4 left-4 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl backdrop-blur-md border shadow-lg"
                style={{
                  background: P.overlayBg,
                  borderColor: P.overlayBdr,
                }}
              >
                <span className={`text-[8px] uppercase tracking-widest font-bold ${P.textMuted}`}>AI Parsed</span>
                <span className={`text-[10px] font-mono font-semibold ${P.text}`}>
                  Dinner ₹2,450 → 🍔 Food
                </span>
              </Motion.div>
            </div>

            {/* Caption strip */}
            <div className={`px-5 py-3 flex items-center justify-between text-[10px] font-medium tracking-wide opacity-50 ${P.text}`}>
              <span>Morning Ledger</span>
              <span>InsightX</span>
            </div>
          </Motion.div>
        </div>
      </section>

      {/* ══ SECTION 2 – PHILOSOPHY ════════════════════════════ */}
      <Motion.section
        id="philosophy"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className={`py-20 border-t ${P.border}`}
      >
        <div className="mx-auto max-w-7xl px-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5 space-y-4">
            <span className={`text-[10px] uppercase font-bold tracking-widest ${P.textMuted}`}>The Premise</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight font-serif">
              A dialogue with <br />
              <span className="italic font-normal">your daily ledger.</span>
            </h2>
            <p className={`text-sm font-light leading-relaxed ${P.textFaint}`}>
              InsightX is built on the philosophy that tracking is not restriction — it is understanding the gravity of your choices. Every entry is an act of deliberate awareness.
            </p>
          </div>
          <div className="lg:col-span-7 lg:pl-12 grid grid-cols-1 sm:grid-cols-2 gap-8">
            {[
              { n: "01", title: "Natural Language Parser", body: "Type transactions as you speak. Engine extracts amount, category, and date dynamically." },
              { n: "02", title: "Silent Limit Guard",      body: "No loud alerts. Muted visual markers reflect budget status when approaching limits." },
              { n: "03", title: "Shared Workspaces",       body: "Split bills and track collective debts with family or friends without messy spreadsheets." },
              { n: "04", title: "No-Spend Streaks",        body: "Observe consecutive spend-free days with minimalist streak indicators." },
            ].map(({ n, title, body }) => (
              <div key={n} className="space-y-2">
                <span className={`text-[10px] font-mono block opacity-40 ${P.text}`}>{n} /</span>
                <h4 className={`text-xs font-bold uppercase tracking-wider ${P.text}`}>{title}</h4>
                <p className={`text-[11px] leading-relaxed ${P.textFaint}`}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </Motion.section>

      {/* ══ SECTION 3 – INTERFACE ════════════════════════════ */}
      <Motion.section
        id="interface"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className={`py-20 border-t ${P.border} ${P.sectionAlt}`}
      >
        <div className="mx-auto max-w-7xl px-8 space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <span className={`text-[10px] uppercase font-bold tracking-widest ${P.textMuted}`}>The Interface</span>
            <h2 className="text-3xl font-light tracking-tight font-serif">
              A quiet, <span className="italic font-normal">uncluttered ledger.</span>
            </h2>
            <p className={`text-xs leading-relaxed ${P.textFaint}`}>
              No spreadsheets, no flashing charts. Type in one natural line; AI maps categories, recurrence, and limits in real-time.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className={`rounded-3xl border p-6 sm:p-8 space-y-6 shadow-lg ${P.cardBg} ${P.border}`}>
              <div className={`flex items-center justify-between border-b pb-4 ${P.border}`}>
                <span className={`text-[10px] uppercase font-bold tracking-wider opacity-50 ${P.text}`}>Live Transaction Input</span>
                <span className={`w-2 h-2 rounded-full animate-pulse`} style={{ background: P.accent }} />
              </div>

              <div className="space-y-2">
                <div className={`text-[9px] uppercase tracking-wider opacity-40 ${P.text}`}>What you type:</div>
                <div className={`text-base sm:text-lg font-mono font-light border-b pb-2 flex items-center justify-between ${P.border}`}>
                  <span className={P.text}>{displayed}</span>
                  {!twDone && <span className="w-[2px] h-5 animate-pulse ml-0.5 inline-block" style={{ background: P.accent }} />}
                </div>
              </div>

              <Motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={parsed ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-3 gap-4"
              >
                {[
                  { label: "Amount",     value: "₹2,450.00", mono: true  },
                  { label: "Category",   value: "🍔 Food",    mono: false },
                  { label: "Recurrence", value: "One-time",   mono: false },
                ].map(({ label, value, mono }, i) => (
                  <Motion.div
                    key={label}
                    initial={{ opacity: 0, y: 6 }}
                    animate={parsed ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.4, delay: i * 0.09, ease: [0.16, 1, 0.3, 1] }}
                    className={`p-3.5 rounded-2xl border text-center space-y-1 ${P.cardBg2} ${P.border}`}
                  >
                    <span className={`block text-[8px] uppercase tracking-widest opacity-40 ${P.text}`}>{label}</span>
                    <span className={`text-xs font-semibold ${mono ? "font-mono" : ""} ${P.text}`}>{value}</span>
                  </Motion.div>
                ))}
              </Motion.div>

              <div className={`border-t pt-5 space-y-3 ${P.border}`}>
                <div className={`text-[9px] uppercase tracking-wider opacity-40 ${P.text}`}>Ledger Records</div>
                {[
                  { desc: "Dinner with friends",     cat: "🍔 Food",      amt: "₹2,450.00", date: "Today"      },
                  { desc: "Weekly organic groceries", cat: "🛍️ Shopping", amt: "₹1,200.00", date: "Yesterday"  },
                  { desc: "Office workspace split",   cat: "🏠 Rent",      amt: "₹8,000.00", date: "2 days ago" },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center justify-between text-xs py-2 border-b last:border-0 ${P.border}`}>
                    <div className="flex items-center gap-4">
                      <span className={`font-mono text-[9px] w-16 shrink-0 opacity-40 ${P.text}`}>{item.date}</span>
                      <span className={`font-medium ${P.text}`}>{item.desc}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${P.chipBg}`}>{item.cat}</span>
                      <span className={`font-mono font-semibold ${P.text}`}>{item.amt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Motion.section>

      {/* ══ SECTION 4 – PRINCIPLES ════════════════════════════ */}
      <Motion.section
        id="principles"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className={`py-20 border-t ${P.border}`}
      >
        <div className="mx-auto max-w-7xl px-8 space-y-12">
          <div className="space-y-3">
            <span className={`text-[10px] uppercase font-bold tracking-widest ${P.textMuted}`}>Core Values</span>
            <h2 className="text-3xl font-light tracking-tight font-serif">
              Timeless guidelines for <br />
              <span className="italic font-normal">financial tranquility.</span>
            </h2>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-3 border-t border-b ${P.border} divide-y md:divide-y-0 md:divide-x ${P.divider}`}>
            {[
              { icon: Wind,     n: "01", title: "Clarification", body: "Remove the noise of traditional charts. Budget, streaks, and score summarized in one serene daily snapshot." },
              { icon: Compass,  n: "02", title: "Autonomy",      body: "Share expenses and settle balances effortlessly. Keep your shared workspace in equilibrium, always." },
              { icon: Sparkles, n: "03", title: "Reflection",    body: "Intelligence that reflects your patterns gently — automated insights that suggest minor adjustments, never commands." },
            ].map(({ icon: Icon, n, title, body }, i) => (
              <Motion.div
                key={n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                className={`py-8 space-y-4 ${i === 0 ? "md:pr-8" : i === 1 ? "md:px-8" : "md:pl-8"}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border opacity-80 ${P.textMuted} ${P.border}`}>
                  <Icon size={14} />
                </div>
                <h3 className={`text-xs font-bold tracking-wider uppercase ${P.text}`}>{n} / {title}</h3>
                <p className={`text-[11px] leading-relaxed ${P.textFaint}`}>{body}</p>
              </Motion.div>
            ))}
          </div>
        </div>
      </Motion.section>

      {/* ══ CTA ══════════════════════════════════════════════ */}
      <section className={`py-32 border-t text-center ${P.border} ${P.sectionAlt}`}>
        <div className="mx-auto max-w-4xl px-8 space-y-6">
          <Motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight font-serif">
              Welcome to <span className="italic font-normal">financial composure.</span>
            </h2>
            <p className={`text-xs max-w-sm mx-auto leading-relaxed ${P.textFaint}`}>
              Step inside the space and experience tracking designed with deliberate intent and luxurious clarity.
            </p>
          </Motion.div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => navigate("/signup")}
              className={`px-8 py-3 rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.98] ${P.btnPrimary}`}
            >
              Begin Journey
            </button>
            <button
              onClick={() => navigate("/login")}
              className={`px-8 py-3 rounded-full text-xs font-semibold tracking-wider uppercase border transition-all duration-300 active:scale-[0.98] ${P.btnSecBdr}`}
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════ */}
      <footer className={`py-10 border-t text-[10px] tracking-wider uppercase opacity-40 ${P.border} ${P.text}`}>
        <div className="mx-auto max-w-7xl px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <span>&copy; {new Date().getFullYear()} InsightX. All rights reserved.</span>
          <div className="flex gap-8">
            <a href="#philosophy" className="hover:opacity-100 transition-opacity">Philosophy</a>
            <a href="#interface"  className="hover:opacity-100 transition-opacity">Interface</a>
            <a href="#principles" className="hover:opacity-100 transition-opacity">Principles</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
