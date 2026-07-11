import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";
import { ArrowRight, Compass, Wind, Sparkles } from "lucide-react";
import { motion as Motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

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

export default function LandingPage() {
  const navigate = useNavigate();
  const theme    = useAppStore((s) => s.theme);
  const isLight  = theme === "light";

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
        orb1:       "rgba(61,102,71,0.08)",
        orb2:       "rgba(16,30,22,0.05)",
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
        orb1:       "rgba(133,158,122,0.10)",
        orb2:       "rgba(16,185,129,0.06)",
      };

  const [parsed, setParsed] = useState(false);
  const { displayed, done: twDone } = useTypewriter("Dinner with friends 2450 food", {
    startDelay: 900,
    speed: 52,
    onDone: () => setTimeout(() => setParsed(true), 320),
  });

  // ── Parallax refs ────────────────────────────────────────────────────────
  const heroRef        = useRef(null);   // hero section wrapper
  const heroTextRef    = useRef(null);   // left text block
  const heroImageRef   = useRef(null);   // right image card
  const orb1Ref        = useRef(null);   // floating bg orb 1
  const orb2Ref        = useRef(null);   // floating bg orb 2
  const orb3Ref        = useRef(null);   // floating bg orb 3
  const philLeftRef    = useRef(null);   // philosophy left col
  const philRightRef   = useRef(null);   // philosophy right col (cards)
  const mockupRef      = useRef(null);   // interface mockup card
  const princCol1Ref   = useRef(null);   // principles col 1
  const princCol2Ref   = useRef(null);   // principles col 2
  const princCol3Ref   = useRef(null);   // principles col 3
  const ctaHeadRef     = useRef(null);   // CTA heading
  const scrollLineRef  = useRef(null);   // animated horizontal line

  useEffect(() => {
    const ctx = gsap.context(() => {

      // ── 1. HERO: true multi-layer parallax ──────────────────────────────
      // Background orbs move slowest (deepest layer)
      gsap.to(orb1Ref.current, {
        y: -160,
        x: 40,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 2,
        },
      });
      gsap.to(orb2Ref.current, {
        y: -80,
        x: -30,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 3,
        },
      });
      gsap.to(orb3Ref.current, {
        y: -220,
        x: 60,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1.5,
        },
      });

      // Hero text moves at 0.4x scroll speed (medium layer)
      gsap.to(heroTextRef.current, {
        y: -80,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1.2,
        },
      });

      // Hero image moves at 0.55x scroll speed — slightly faster than text
      // creating the "image coming forward" depth illusion
      gsap.to(heroImageRef.current, {
        y: -120,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });

      // ── 2. PHILOSOPHY: sticky left, floating right cards ────────────────
      // Left column floats up slowly as right cards scroll in fast
      gsap.fromTo(philLeftRef.current,
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: philLeftRef.current,
            start: "top 85%",
            end: "top 30%",
            scrub: 1.5,
          },
        }
      );

      // Right cards: each card floats in from a different y offset
      const philCards = philRightRef.current?.querySelectorAll(".phil-card");
      if (philCards?.length) {
        philCards.forEach((card, i) => {
          gsap.fromTo(card,
            { y: 80 + i * 30, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              ease: "none",
              scrollTrigger: {
                trigger: philRightRef.current,
                start: "top 80%",
                end: "top 15%",
                scrub: 1 + i * 0.2,
              },
            }
          );
        });
      }

      // ── 3. INTERFACE: mockup drifts up at 0.6x speed ────────────────────
      gsap.fromTo(mockupRef.current,
        { y: 80, opacity: 0 },
        {
          y: -20,
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: mockupRef.current,
            start: "top 85%",
            end: "top -20%",
            scrub: 1.8,
          },
        }
      );

      // ── 4. PRINCIPLES: each column at different speeds ───────────────────
      // Column 1 arrives earliest, col 3 arrives latest — wave effect
      [princCol1Ref, princCol2Ref, princCol3Ref].forEach((ref, i) => {
        gsap.fromTo(ref.current,
          { y: 50 + i * 25, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            ease: "none",
            scrollTrigger: {
              trigger: ref.current,
              start: "top 88%",
              end: "top 35%",
              scrub: 0.9 + i * 0.25,
            },
          }
        );
      });

      // ── 5. CTA: fade + scale tied to scroll ─────────────────────────────
      gsap.fromTo(ctaHeadRef.current,
        { y: 40, opacity: 0, scale: 0.97 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: ctaHeadRef.current,
            start: "top 85%",
            end: "top 40%",
            scrub: 1.4,
          },
        }
      );

      // ── 6. Scroll indicator line that draws in ───────────────────────────
      if (scrollLineRef.current) {
        gsap.fromTo(scrollLineRef.current,
          { scaleX: 0, transformOrigin: "left center" },
          {
            scaleX: 1,
            ease: "none",
            scrollTrigger: {
              trigger: document.body,
              start: "top top",
              end: "bottom bottom",
              scrub: 0.5,
            },
          }
        );
      }

    });

    return () => ctx.revert();
  }, []);

  return (
    <div className={`no-invert min-h-screen font-sans selection:bg-[#859E7A]/30 transition-colors duration-700 overflow-x-hidden ${P.pageBg} ${P.text}`}>

      {/* ── Scroll progress line ─────────────────────────────────────────── */}
      <div
        ref={scrollLineRef}
        className="fixed top-0 left-0 right-0 z-[999] h-[2px] origin-left"
        style={{ background: P.accent, scaleX: 0 }}
      />

      {/* ══ HEADER ══════════════════════════════════════════ */}
      <Motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-7xl px-4 sm:px-8 py-5 sm:py-8 flex items-center justify-between"
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

      {/* ══ HERO ═══════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative mx-auto max-w-7xl px-4 sm:px-8 py-8 md:py-20 min-h-[88vh] grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center overflow-hidden"
      >
        {/* ── Floating background orbs (parallax layers 0, 1, 2) ─────────── */}
        <div
          ref={orb1Ref}
          className="pointer-events-none absolute -top-20 -right-20 w-[480px] h-[480px] rounded-full blur-3xl"
          style={{ background: P.orb1, willChange: "transform" }}
        />
        <div
          ref={orb2Ref}
          className="pointer-events-none absolute bottom-10 -left-24 w-[360px] h-[360px] rounded-full blur-3xl"
          style={{ background: P.orb2, willChange: "transform" }}
        />
        <div
          ref={orb3Ref}
          className="pointer-events-none absolute top-1/3 left-1/3 w-[240px] h-[240px] rounded-full blur-3xl"
          style={{ background: P.orb1, opacity: 0.5, willChange: "transform" }}
        />

        {/* ── Left text (medium layer) ─────────────────────────────────── */}
        <div ref={heroTextRef} className="relative z-10 lg:col-span-6 space-y-6" style={{ willChange: "transform" }}>
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
              className="text-3xl sm:text-5xl lg:text-[3.6rem] font-light tracking-tight leading-[1.06] font-serif"
            >
              The art of
            </Motion.h1>
            <Motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.27, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl sm:text-5xl lg:text-[3.6rem] font-light tracking-tight leading-[1.06] font-serif italic"
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

        {/* ── Right image (foreground layer — fastest) ─────────────────── */}
        <div ref={heroImageRef} className="relative z-10 lg:col-span-6 flex justify-end" style={{ willChange: "transform" }}>
          <div className={`relative rounded-[28px] overflow-hidden border w-full max-w-[500px] shadow-2xl ${P.cardBg} ${P.border}`}>
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
                style={{ background: P.overlayBg, borderColor: P.overlayBdr }}
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
          </div>
        </div>

        {/* Scroll hint */}
        <Motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className={`text-[9px] uppercase tracking-widest ${P.textMuted} opacity-50`}>Scroll</span>
          <div className={`w-px h-10 origin-top`} style={{ background: P.accent, opacity: 0.3 }}>
            <Motion.div
              animate={{ scaleY: [0, 1, 0], y: [0, 20, 40] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="w-full h-1/2 origin-top"
              style={{ background: P.accent }}
            />
          </div>
        </Motion.div>
      </section>

      {/* ══ SECTION 2 – PHILOSOPHY ════════════════════════════════════════ */}
      <section
        id="philosophy"
        className={`py-20 sm:py-32 border-t ${P.border} overflow-hidden`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12">

          {/* Left col — floats up slowly on scroll */}
          <div ref={philLeftRef} className="lg:col-span-5 space-y-4 lg:sticky lg:top-24 self-start" style={{ willChange: "transform, opacity" }}>
            <span className={`text-[10px] uppercase font-bold tracking-widest ${P.textMuted}`}>The Premise</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight font-serif">
              A dialogue with <br />
              <span className="italic font-normal">your daily ledger.</span>
            </h2>
            <p className={`text-sm font-light leading-relaxed ${P.textFaint}`}>
              InsightX is built on the philosophy that tracking is not restriction — it is understanding the gravity of your choices. Every entry is an act of deliberate awareness.
            </p>
          </div>

          {/* Right col — cards float in at staggered speeds */}
          <div ref={philRightRef} className="lg:col-span-7 lg:pl-12 grid grid-cols-1 sm:grid-cols-2 gap-10">
            {[
              { n: "01", title: "Natural Language Parser", body: "Type transactions as you speak. Engine extracts amount, category, and date dynamically." },
              { n: "02", title: "Silent Limit Guard",      body: "No loud alerts. Muted visual markers reflect budget status when approaching limits." },
              { n: "03", title: "Shared Workspaces",       body: "Split bills and track collective debts with family or friends without messy spreadsheets." },
              { n: "04", title: "No-Spend Streaks",        body: "Observe consecutive spend-free days with minimalist streak indicators." },
            ].map(({ n, title, body }) => (
              <div key={n} className="phil-card space-y-2" style={{ willChange: "transform, opacity" }}>
                <span className={`text-[10px] font-mono block opacity-40 ${P.text}`}>{n} /</span>
                <h4 className={`text-xs font-bold uppercase tracking-wider ${P.text}`}>{title}</h4>
                <p className={`text-[11px] leading-relaxed ${P.textFaint}`}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SECTION 3 – INTERFACE ════════════════════════════════════════ */}
      <section
        id="interface"
        className={`py-20 sm:py-32 border-t ${P.border} ${P.sectionAlt} overflow-hidden`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-8 space-y-12">
          {/* Section heading — standard fade reveal */}
          <div className="text-center max-w-xl mx-auto space-y-3">
            <span className={`text-[10px] uppercase font-bold tracking-widest ${P.textMuted}`}>The Interface</span>
            <h2 className="text-3xl font-light tracking-tight font-serif">
              A quiet, <span className="italic font-normal">uncluttered ledger.</span>
            </h2>
            <p className={`text-xs leading-relaxed ${P.textFaint}`}>
              No spreadsheets, no flashing charts. Type in one natural line; AI maps categories, recurrence, and limits in real-time.
            </p>
          </div>

          {/* Mockup card — drifts upward at 0.6x scroll speed */}
          <div ref={mockupRef} className="max-w-2xl mx-auto" style={{ willChange: "transform, opacity" }}>
            <div className={`rounded-3xl border p-4 sm:p-6 md:p-8 space-y-6 shadow-lg ${P.cardBg} ${P.border}`}>
              <div className={`flex items-center justify-between border-b pb-4 ${P.border}`}>
                <span className={`text-[10px] uppercase font-bold tracking-wider opacity-50 ${P.text}`}>Live Transaction Input</span>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: P.accent }} />
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
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                      <span className={`font-mono text-[9px] w-12 sm:w-16 shrink-0 opacity-40 ${P.text}`}>{item.date}</span>
                      <span className={`font-medium truncate ${P.text}`}>{item.desc}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                      <span className={`hidden sm:inline text-[10px] px-2 py-0.5 rounded-full border ${P.chipBg}`}>{item.cat}</span>
                      <span className={`font-mono font-semibold text-[11px] sm:text-xs ${P.text}`}>{item.amt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECTION 4 – PRINCIPLES ════════════════════════════════════════ */}
      <section
        id="principles"
        className={`py-20 sm:py-32 border-t ${P.border} overflow-hidden`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-8 space-y-12">
          <div className="space-y-3">
            <span className={`text-[10px] uppercase font-bold tracking-widest ${P.textMuted}`}>Core Values</span>
            <h2 className="text-3xl font-light tracking-tight font-serif">
              Timeless guidelines for <br />
              <span className="italic font-normal">financial tranquility.</span>
            </h2>
          </div>

          {/* Three columns — each arrives at different scroll speed (wave) */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 border-t border-b ${P.border} divide-y sm:divide-y-0 sm:divide-x ${P.divider}`}>
            {[
              { ref: princCol1Ref, icon: Wind,     n: "01", title: "Clarification", body: "Remove the noise of traditional charts. Budget, streaks, and score summarized in one serene daily snapshot.", pad: "md:pr-8" },
              { ref: princCol2Ref, icon: Compass,  n: "02", title: "Autonomy",      body: "Share expenses and settle balances effortlessly. Keep your shared workspace in equilibrium, always.", pad: "md:px-8" },
              { ref: princCol3Ref, icon: Sparkles, n: "03", title: "Reflection",    body: "Intelligence that reflects your patterns gently — automated insights that suggest minor adjustments, never commands.", pad: "md:pl-8" },
            ].map(({ ref, icon: Icon, n, title, body, pad }) => (
              <div
                key={n}
                ref={ref}
                className={`py-10 space-y-4 ${pad}`}
                style={{ willChange: "transform, opacity" }}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border opacity-80 ${P.textMuted} ${P.border}`}>
                  <Icon size={14} />
                </div>
                <h3 className={`text-xs font-bold tracking-wider uppercase ${P.text}`}>{n} / {title}</h3>
                <p className={`text-[11px] leading-relaxed ${P.textFaint}`}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ══════════════════════════════════════════════════════════ */}
      <section className={`py-24 sm:py-36 border-t text-center ${P.border} ${P.sectionAlt} overflow-hidden`}>
        <div
          ref={ctaHeadRef}
          className="mx-auto max-w-4xl px-4 sm:px-8 space-y-6"
          style={{ willChange: "transform, opacity" }}
        >
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight font-serif">
              Welcome to <span className="italic font-normal">financial composure.</span>
            </h2>
            <p className={`text-xs max-w-sm mx-auto leading-relaxed ${P.textFaint}`}>
              Step inside the space and experience tracking designed with deliberate intent and luxurious clarity.
            </p>
          </div>

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

      {/* ══ FOOTER ════════════════════════════════════════════════════════ */}
      <footer className={`py-10 border-t text-[10px] tracking-wider uppercase opacity-40 ${P.border} ${P.text}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
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
