import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import {
  Check, CreditCard, Calendar, TrendingUp,
  FileText, Download, AlertTriangle,
  ChevronUp, ChevronDown, Lock, Info,
} from "lucide-react";
import ScrollReveal from "../components/ScrollReveal";
import Modal from "../components/Modal";
import { useAppStore } from "../store/useAppStore";
import { usePlanStore, getExpenseLimit, getUsagePercent, getUsageColor } from "../store/usePlanStore";
import { api } from "../services/api";
import toast from "react-hot-toast";

// ─── Constants ────────────────────────────────────────────────────────────────

// LS_PLAN_KEY is now owned by usePlanStore — do not write it directly here.
const LS_BILLING_KEY = "xpense_billing_history";

const PLAN_ORDER = ["free", "pro", "team"];

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "₹0",
    priceNum: 0,
    period: "/month",
    description: "Perfect to get started",
    icon: "🌱",
    accentBorder: "border-white/12",
    currentBorder: "border-emerald-400/30 shadow-[0_0_0_2px_rgba(52,211,153,0.12),0_20px_50px_rgba(0,0,0,0.5)]",
    glowStyle: { background: "linear-gradient(145deg, rgba(2,6,23,0.90) 0%, rgba(148,163,184,0.07) 100%)" },
    features: [
      { text: "1 Workspace",             included: true,  gated: false, tooltip: "One personal workspace for your expenses." },
      { text: "3 Members per workspace", included: true,  gated: false, tooltip: "Invite up to 3 members to collaborate." },
      { text: "50 Expenses / month",     included: true,  gated: false, tooltip: "Track up to 50 expense entries per month." },
      { text: "AI categorization",       included: false, gated: true,  tooltip: "Automatically categorise expenses using AI. Requires Pro or Team." },
      { text: "Monthly insights email",  included: false, gated: true,  tooltip: "Receive a monthly summary report via email. Requires Pro or Team." },
    ],
    limits: { expenses: 50, members: 3 },
    badge: null,
    badgeClass: "",
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹199",
    priceNum: 199,
    period: "/month",
    description: "Best for individuals & power users",
    icon: "⚡",
    accentBorder: "border-emerald-400/30 shadow-[0_0_0_1px_rgba(52,211,153,0.15),0_20px_55px_rgba(52,211,153,0.11)]",
    currentBorder: "border-emerald-400/48 shadow-[0_0_0_2px_rgba(52,211,153,0.24),0_28px_70px_rgba(52,211,153,0.18)]",
    glowStyle: { background: "linear-gradient(145deg, rgba(2,6,23,0.93) 0%, rgba(52,211,153,0.11) 100%)" },
    features: [
      { text: "3 Workspaces",              included: true, gated: false, tooltip: "Create up to 3 separate workspaces." },
      { text: "10 Members per workspace",  included: true, gated: false, tooltip: "Grow your team with up to 10 members per workspace." },
      { text: "Unlimited Expenses",        included: true, gated: false, tooltip: "No monthly cap on expense entries." },
      { text: "AI categorization enabled", included: true, gated: false, tooltip: "AI automatically tags and categorises your expenses." },
      { text: "Monthly insights email",    included: true, gated: false, tooltip: "Get a personalised monthly spending report via email." },
    ],
    limits: { expenses: Infinity, members: 10 },
    badge: "Most Popular",
    badgeClass: "bg-gradient-to-r from-emerald-500 to-teal-400 text-emerald-950",
  },
  {
    id: "team",
    name: "Team",
    price: "₹499",
    priceNum: 499,
    period: "/month",
    description: "Collaborate without limits",
    icon: "🚀",
    accentBorder: "border-violet-400/25 shadow-[0_0_0_1px_rgba(139,92,246,0.15),0_20px_55px_rgba(139,92,246,0.10)]",
    currentBorder: "border-violet-400/48 shadow-[0_0_0_2px_rgba(139,92,246,0.24),0_28px_70px_rgba(139,92,246,0.18)]",
    glowStyle: { background: "linear-gradient(145deg, rgba(2,6,23,0.93) 0%, rgba(139,92,246,0.11) 100%)" },
    features: [
      { text: "Unlimited Workspaces",      included: true, gated: false, tooltip: "Create as many workspaces as you need." },
      { text: "Unlimited Members",         included: true, gated: false, tooltip: "No limit on team size per workspace." },
      { text: "Unlimited Expenses",        included: true, gated: false, tooltip: "Track as many expense entries as you like." },
      { text: "AI categorization enabled", included: true, gated: false, tooltip: "Full AI-powered expense tagging and insights." },
      { text: "Monthly insights email",    included: true, gated: false, tooltip: "Comprehensive monthly report delivered to your inbox." },
    ],
    limits: { expenses: Infinity, members: Infinity },
    badge: "Best Value",
    badgeClass: "bg-gradient-to-r from-violet-500 to-purple-400 text-white",
  },
];

const DEFAULT_BILLING = [
  { date: "10 Apr 2026", plan: "Pro",  amount: "₹199", status: "Success" },
  { date: "10 Mar 2026", plan: "Free", amount: "₹0",   status: "Active"  },
  { date: "10 Feb 2026", plan: "Free", amount: "₹0",   status: "Active"  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function planRank(id) { return PLAN_ORDER.indexOf(id); }
function getCtaDirection(planId, currentId) {
  if (planId === currentId) return "current";
  return planRank(planId) > planRank(currentId) ? "upgrade" : "downgrade";
}
function getCtaLabel(planId, currentId) {
  const d = getCtaDirection(planId, currentId);
  return d === "current" ? "Current Plan" : d === "upgrade" ? "Upgrade" : "Downgrade";
}

function exportCSV(rows) {
  const lines = [
    ["Date", "Plan", "Amount", "Status"].join(","),
    ...rows.map((r) => [r.date, r.plan, r.amount, r.status].join(",")),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = "billing-history.csv"; a.click();
  URL.revokeObjectURL(url);
}

function loadFromLS(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function saveToLS(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function todayLabel() {
  return new Date().toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function Tooltip({ text, children }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  return (
    <span
      ref={ref}
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <Motion.span
            role="tooltip"
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 w-52 rounded-xl border border-white/12 bg-[#0b1224]/95 px-3 py-2 text-[11px] leading-relaxed text-white/70 shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl"
          >
            {text}
            <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-white/10" />
          </Motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

// ─── Feature Item ─────────────────────────────────────────────────────────────

function FeatureItem({ text, included, gated, tooltip, currentPlanId }) {
  const locked = gated && currentPlanId === "free";
  return (
    <li className="flex items-center gap-2.5 text-sm">
      <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full text-[10px] font-bold transition-colors ${
        included
          ? "bg-emerald-500/20 text-emerald-300"
          : "bg-white/5 text-white/20"
      }`}>
        {included ? <Check size={10} strokeWidth={3} /> : "✕"}
      </span>
      <span className={`flex flex-1 items-center gap-1.5 transition-opacity ${
        included ? "text-white/72" : "text-white/28 line-through decoration-white/16"
      }`}>
        <span>{text}</span>
        {locked && <Lock size={10} className="shrink-0 text-white/28" />}
      </span>
      {tooltip && (
        <Tooltip text={tooltip}>
          <Info size={12} className="shrink-0 cursor-help text-white/22 hover:text-white/50 transition-colors" tabIndex={0} />
        </Tooltip>
      )}
    </li>
  );
}

// ─── Usage Bar ────────────────────────────────────────────────────────────────
// Color system:  < 50% → emerald │ 50–80% → amber │ > 80% → red

function UsageBar({ label, used, max }) {
  const isUnlimited = max === Infinity;
  const pct         = isUnlimited ? 0 : Math.min(100, Math.round((used / max) * 100));
  const colorToken  = isUnlimited ? "emerald" : getUsageColor(pct);

  const gradients = {
    emerald: "from-emerald-500/85 to-teal-400/65",
    amber:   "from-amber-500/85 to-yellow-400/65",
    red:     "from-red-500/85 to-rose-400/65",
  };
  const labelColor = {
    emerald: "text-white/56",
    amber:   "text-amber-300",
    red:     "text-red-300",
  };
  const valueColor = {
    emerald: "text-white/72",
    amber:   "text-amber-300",
    red:     "text-red-300",
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className={labelColor[colorToken]}>{label}</span>
        <span className={`font-medium tabular-nums ${valueColor[colorToken]}`}>
          {isUnlimited ? `${used} / ∞` : `${used} / ${max}`}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
        {isUnlimited ? (
          <div className="h-full w-full rounded-full bg-gradient-to-r from-emerald-500/85 to-teal-400/65 opacity-28" />
        ) : (
          <Motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className={`h-full rounded-full bg-gradient-to-r ${gradients[colorToken]}`}
          />
        )}
      </div>
    </div>
  );
}

// ─── Status Pill ─────────────────────────────────────────────────────────────

function StatusPill({ status }) {
  const map = {
    Success: "bg-emerald-500/14 text-emerald-300 border-emerald-400/18",
    Active:  "bg-blue-500/14 text-blue-300 border-blue-400/18",
    Failed:  "bg-red-500/14 text-red-300 border-red-400/18",
    Pending: "bg-amber-500/14 text-amber-300 border-amber-400/18",
  };
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${map[status] ?? map.Active}`}>
      {status}
    </span>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────

function ConfirmModal({ open, onClose, plan, direction, onConfirm, loading }) {
  // Keyboard: Enter → confirm
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Enter" && !loading) { onConfirm(); }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, loading, onConfirm]);

  if (!plan) return null;
  const isPro       = plan.id === "pro";
  const isTeam      = plan.id === "team";
  const isDowngrade = direction === "downgrade";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isDowngrade ? `Downgrade to ${plan.name}` : `Upgrade to ${plan.name}`}
    >
      <div className="space-y-4">
        {/* Plan preview */}
        <div className={`rounded-xl border p-4 ${
          isPro  ? "border-emerald-400/20 bg-emerald-500/7"
          : isTeam ? "border-violet-400/20 bg-violet-500/7"
          : "border-white/10 bg-white/3"
        }`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{plan.icon}</span>
              <div>
                <div className={`font-semibold text-sm ${
                  isPro ? "text-emerald-300" : isTeam ? "text-violet-300" : "text-white/85"
                }`}>
                  {plan.name} Plan
                </div>
                <div className="text-[11px] text-white/42">{plan.description}</div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xl font-bold text-white">{plan.price}</div>
              <div className="text-xs text-white/38">{plan.period}</div>
            </div>
          </div>
          <div className={`my-3 h-px ${isPro ? "bg-emerald-400/12" : isTeam ? "bg-violet-400/12" : "bg-white/7"}`} />
          <ul className="space-y-2">
            {plan.features.map((f) => (
              <li key={f.text} className="flex items-center gap-2 text-xs">
                <span className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full ${
                  f.included ? "bg-emerald-500/20 text-emerald-300" : "bg-white/5 text-white/20"
                }`}>
                  {f.included ? <Check size={8} strokeWidth={3} /> : "✕"}
                </span>
                <span className={f.included ? "text-white/62" : "text-white/25 line-through"}>{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {isDowngrade && (
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-400/20 bg-amber-500/8 px-3.5 py-3">
            <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-300" />
            <div className="text-xs text-amber-200 leading-relaxed">
              Downgrading will immediately reduce your limits. Make sure your current usage fits within the new plan limits.
            </div>
          </div>
        )}

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-white/60 transition hover:bg-white/9 hover:text-white/82 disabled:opacity-50 disabled:pointer-events-none"
          >
            Cancel
          </button>
          <Motion.button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 22 }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition disabled:pointer-events-none disabled:opacity-60 ${
              isDowngrade
                ? "bg-amber-500/80 text-amber-950 hover:bg-amber-500/90"
                : isPro
                  ? "bg-emerald-500/90 text-emerald-950 shadow-[0_8px_30px_rgba(34,197,94,.22)] hover:bg-emerald-500"
                  : isTeam
                    ? "bg-violet-500/80 text-white shadow-[0_8px_30px_rgba(139,92,246,.18)] hover:bg-violet-500/90"
                    : "bg-white/10 text-white/80 hover:bg-white/14"
            }`}
          >
            {loading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            {isDowngrade ? "Confirm Downgrade" : "Confirm Upgrade"}
          </Motion.button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({ plan, currentPlanId, index, onRequestSwitch }) {
  const isCurrent   = plan.id === currentPlanId;
  const direction   = getCtaDirection(plan.id, currentPlanId);
  const ctaLabel    = getCtaLabel(plan.id, currentPlanId);
  const isPro       = plan.id === "pro";
  const isTeam      = plan.id === "team";
  const isFreeCard  = plan.id === "free";

  // Disable downgrade for Free (already lowest), upgrade for Team (already highest) when current
  const isDisabledAction =
    (currentPlanId === "free"  && direction === "downgrade") ||
    (currentPlanId === "team"  && direction === "upgrade");

  return (
    <ScrollReveal delay={index * 0.07}>
      <Motion.div
        whileHover={{ y: isCurrent ? -2 : -6, scale: isCurrent ? 1 : isPro ? 1.02 : 1.01 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
        className={`relative flex h-full flex-col rounded-2xl border p-6 transition-all duration-300 ${
          isCurrent ? plan.currentBorder : plan.accentBorder
        } hover:border-white/18`}
        style={plan.glowStyle}
      >
        {/* Active Plan badge — green, replaces old "✓ Current Plan" */}
        {isCurrent && (
          <div className="absolute -top-3.5 left-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/18 px-3 py-0.5 text-[11px] font-semibold text-emerald-300 shadow-[0_4px_16px_rgba(52,211,153,0.18)] backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              Active Plan
            </span>
          </div>
        )}

        {/* Plan-specific badge (Most Popular / Best Value) */}
        {plan.badge && !isCurrent && (
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <span className={`rounded-full px-3 py-0.5 text-[11px] font-semibold shadow-lg ${plan.badgeClass}`}>
              {plan.badge}
            </span>
          </div>
        )}

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-3">
            <div className={`grid h-10 w-10 place-items-center rounded-xl text-xl transition-all ${
              isPro  ? "bg-emerald-500/15 ring-1 ring-emerald-400/25"
              : isTeam ? "bg-violet-500/15 ring-1 ring-violet-400/25"
              : "bg-white/5 ring-1 ring-white/10"
            } ${isCurrent ? "scale-105" : ""}`}>
              {plan.icon}
            </div>
            <div>
              <div className={`text-base font-semibold ${
                isPro ? "text-emerald-300" : isTeam ? "text-violet-300" : "text-white/88"
              }`}>
                {plan.name}
              </div>
              <div className="text-[11px] text-white/40">{plan.description}</div>
            </div>
          </div>

          <div className="mt-5 flex items-end gap-1">
            <span className="text-4xl font-bold tracking-tight text-white">{plan.price}</span>
            <span className="mb-1 text-sm text-white/38">{plan.period}</span>
          </div>
        </div>

        {/* Divider */}
        <div className={`mb-5 h-px w-full ${
          isPro ? "bg-emerald-400/11" : isTeam ? "bg-violet-400/11" : "bg-white/7"
        }`} />

        {/* Features */}
        <ul className="mb-7 flex-1 space-y-3.5">
          {plan.features.map((f) => (
            <FeatureItem
              key={f.text}
              text={f.text}
              included={f.included}
              gated={f.gated}
              tooltip={f.tooltip}
              currentPlanId={currentPlanId}
            />
          ))}
        </ul>

        {/* CTA */}
        {isCurrent ? (
          <button
            disabled
            id={`plan-cta-${plan.id}`}
            className="inline-flex w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-xl border border-emerald-400/20 bg-emerald-500/8 px-4 py-2.5 text-sm font-medium text-emerald-300/70"
          >
            <Check size={13} strokeWidth={2.5} />
            Current Plan
          </button>
        ) : isDisabledAction ? (
          <button
            disabled
            id={`plan-cta-${plan.id}`}
            className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-xl border border-white/8 bg-white/3 px-4 py-2.5 text-sm font-medium text-white/22 opacity-50"
            title={currentPlanId === "team" ? "You're already on the highest plan" : "Free is the lowest plan"}
          >
            {direction === "upgrade" ? "Upgrade" : "Downgrade"}
          </button>
        ) : (
          <Motion.button
            id={`plan-cta-${plan.id}`}
            type="button"
            onClick={() => onRequestSwitch(plan, direction)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 22 }}
            className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 ${
              direction === "upgrade"
                ? isPro
                  ? "bg-emerald-500/90 text-emerald-950 shadow-[0_12px_36px_rgba(34,197,94,.22)] hover:bg-emerald-500"
                  : isTeam
                    ? "bg-violet-500/80 text-white shadow-[0_12px_36px_rgba(139,92,246,.18)] hover:bg-violet-500/90"
                    : "border border-white/10 bg-white/7 text-white/78 hover:bg-white/12"
                : "border border-amber-400/22 bg-amber-500/9 text-amber-300 hover:bg-amber-500/16"
            }`}
          >
            {direction === "upgrade"
              ? <ChevronUp size={14} strokeWidth={2.5} />
              : <ChevronDown size={14} strokeWidth={2.5} />
            }
            {ctaLabel}
          </Motion.button>
        )}
      </Motion.div>
    </ScrollReveal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PlansPage() {
  // ── Global plan state (shared with useAppStore limit guard) ──
  const currentPlanId    = usePlanStore((s) => s.planId);
  const setPlanInStore   = usePlanStore((s) => s.setPlan);

  // Helper that keeps billing LS in sync then also updates the global store
  function setCurrentPlanId(id) {
    setPlanInStore(id);         // → writes localStorage + triggers reactive updates everywhere
  }

  const [billingHistory, setBillingHistoryRaw] = useState(() => loadFromLS(LS_BILLING_KEY, DEFAULT_BILLING));

  function setBillingHistory(updater) {
    setBillingHistoryRaw((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      saveToLS(LS_BILLING_KEY, next);
      return next;
    });
  }

  // ── Modal state ──
  const [modalPlan,      setModalPlan]      = useState(null);
  const [modalDir,       setModalDir]       = useState("upgrade");
  const [modalOpen,      setModalOpen]      = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // ── Real expense count from app store (reactive) ──
  const allExpenses  = useAppStore((s) => s.expenses);
  const expenseCount = allExpenses?.length ?? 0;
  const memberCount  = 2;

  const currentPlan = PLANS.find((p) => p.id === currentPlanId) ?? PLANS[0];
  const expenseMax  = getExpenseLimit(currentPlanId);  // from usePlanStore helpers
  const memberMax   = currentPlan.limits.members;
  const nextBilling = currentPlanId === "free" ? "N/A" : "10 May 2026";

  // ── Derived values (NOT stored as state) ──
  const usagePct           = getUsagePercent(currentPlanId, expenseCount);
  const expenseLimitReached = expenseMax !== Infinity && expenseCount >= expenseMax;
  const memberLimitReached  = memberMax  !== Infinity && memberCount >= memberMax;
  const anyLimitReached     = expenseLimitReached || memberLimitReached;

  // ── Handlers ──
  function handleRequestSwitch(plan, direction) {
    setModalPlan(plan);
    setModalDir(direction);
    setModalOpen(true);
  }

  const handleClose = useCallback(() => {
    if (!confirmLoading) { setModalOpen(false); setModalPlan(null); }
  }, [confirmLoading]);

  const handleConfirm = useCallback(async () => {
    if (!modalPlan || confirmLoading) return;
    setConfirmLoading(true);
    try { await api.upgradePlan(modalPlan.id); } catch { /* optimistic */ }
    finally {
      setBillingHistory((prev) => [
        { date: todayLabel(), plan: modalPlan.name, amount: modalPlan.price, status: "Success" },
        ...prev,
      ]);
      setCurrentPlanId(modalPlan.id);
      setModalOpen(false);
      setModalPlan(null);
      setConfirmLoading(false);
      toast.success("Plan updated successfully");
    }
  }, [modalPlan, confirmLoading]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-2 sm:px-6">

      {/* ── Limit warning banner ── */}
      <AnimatePresence>
        {anyLimitReached && (
          <Motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.28 }}
            className="mb-6 overflow-hidden"
          >
            <div className="flex items-center gap-3 rounded-xl border border-red-400/22 bg-red-500/10 px-4 py-3">
              <AlertTriangle size={16} className="shrink-0 text-red-300" />
              <div className="flex-1 text-sm font-medium text-red-200">
                You have reached your {expenseLimitReached ? "expense" : "member"} limit —{" "}
                <span className="text-red-300 underline underline-offset-2">upgrade to continue.</span>
              </div>
              <button
                type="button"
                onClick={() => handleRequestSwitch(PLANS[1], "upgrade")}
                className="shrink-0 rounded-lg border border-red-400/22 bg-red-500/12 px-3 py-1 text-xs font-semibold text-red-200 transition hover:bg-red-500/20"
              >
                Upgrade Now
              </button>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>

      {/* ── Page header ── */}
      <div className="mb-9">
        <div className="text-xs font-medium uppercase tracking-widest text-white/36">Billing</div>
        <Motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.26, ease: "easeOut" }}
          className="mt-1 text-2xl font-semibold text-white/90 sm:text-3xl"
        >
          Choose Your Plan
        </Motion.div>
        <Motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.06, ease: "easeOut" }}
          className="mt-1.5 text-sm text-white/48"
        >
          Upgrade or downgrade any time — no lock-in
        </Motion.p>
      </div>

      {/* ── Current Plan + Usage ── */}
      <div className="mb-9 grid gap-4 lg:grid-cols-2">

        {/* Current Plan card */}
        <ScrollReveal>
          <div className="flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.025] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-sm transition-all">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/12 ring-1 ring-emerald-400/20">
                  <CreditCard size={18} className="text-emerald-300" />
                </div>
                <div>
                  <div className="text-[11px] text-white/42">Current Plan</div>
                  <div className="flex items-center gap-2">
                    <div className="text-base font-semibold text-white/90">{currentPlan.name}</div>
                    <span className="text-base">{currentPlan.icon}</span>
                  </div>
                </div>
              </div>
              {/* Active badge with pulse dot */}
              <div className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                <span className="text-[11px] font-semibold text-emerald-300">Active</span>
              </div>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/7 bg-white/[0.025] px-3 py-2.5">
                <div className="flex items-center gap-1.5 text-[10px] text-white/38">
                  <Calendar size={10} /> Billing Date
                </div>
                <div className="mt-1 text-sm font-medium text-white/75">{nextBilling}</div>
              </div>
              <div className="rounded-xl border border-white/7 bg-white/[0.025] px-3 py-2.5">
                <div className="flex items-center gap-1.5 text-[10px] text-white/38">
                  <TrendingUp size={10} /> Monthly Cost
                </div>
                <div className="mt-1 text-sm font-medium text-white/75">
                  {currentPlan.price}<span className="text-xs text-white/35">/mo</span>
                </div>
              </div>
            </div>

            <Motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 420, damping: 22 }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/4 px-4 py-2 text-sm font-medium text-white/58 transition hover:bg-white/8 hover:text-white/82"
            >
              <FileText size={13} />
              Manage Subscription
            </Motion.button>
          </div>
        </ScrollReveal>

        {/* Usage card */}
        <ScrollReveal delay={0.06}>
          <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.025] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/12 ring-1 ring-blue-400/20">
                <TrendingUp size={18} className="text-blue-300" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white/84">Usage This Month</div>
                <div className="text-[11px] text-white/38">
                  Limits for <span className="font-medium text-white/52">{currentPlan.name}</span> plan
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-5">
              <UsageBar label="Expenses used" used={expenseCount} max={expenseMax} />
              <UsageBar label="Members"        used={memberCount}  max={memberMax}  />
            </div>

            {/* Feature-gate nudge */}
            <AnimatePresence>
              {currentPlanId === "free" && (
                <Motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.22 }}
                  className="mt-5 rounded-xl border border-white/8 bg-white/[0.025] px-3.5 py-3"
                >
                  <div className="flex items-start gap-2 text-xs text-white/42 leading-relaxed">
                    <Lock size={11} className="mt-0.5 shrink-0 text-white/28" />
                    <span>
                      AI categorization &amp; unlimited expenses are locked on Free.{" "}
                      <button
                        type="button"
                        onClick={() => handleRequestSwitch(PLANS[1], "upgrade")}
                        className="font-semibold text-emerald-400 underline underline-offset-2 hover:text-emerald-300 transition-colors"
                      >
                        Upgrade to Pro →
                      </button>
                    </span>
                  </div>
                </Motion.div>
              )}
            </AnimatePresence>

            {currentPlanId !== "free" && (
              <div className="mt-5 flex items-center gap-1.5 text-[11px] text-white/35">
                <Check size={10} className="text-emerald-400 shrink-0" />
                Unlimited expenses on your current plan
              </div>
            )}
          </div>
        </ScrollReveal>
      </div>

      {/* ── Plan cards ── */}
      <div className="mb-10 grid grid-cols-1 gap-5 md:grid-cols-3 lg:gap-7">
        {PLANS.map((plan, i) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            index={i}
            currentPlanId={currentPlanId}
            onRequestSwitch={handleRequestSwitch}
          />
        ))}
      </div>

      {/* ── Billing History ── */}
      <ScrollReveal delay={0.1}>
        <div className="rounded-2xl border border-white/10 bg-white/[0.025] backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-white/7 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 ring-1 ring-white/10">
                <FileText size={15} className="text-white/55" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white/84">Billing History</div>
                <div className="text-[11px] text-white/36">Past payments &amp; statements</div>
              </div>
            </div>
            <Motion.button
              type="button"
              onClick={() => exportCSV(billingHistory)}
              disabled={billingHistory.length === 0}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 380, damping: 22 }}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/4 px-3 py-1.5 text-xs font-medium text-white/52 transition hover:bg-white/8 hover:text-white/78 disabled:pointer-events-none disabled:opacity-30"
            >
              <Download size={12} />
              Export CSV
            </Motion.button>
          </div>

          {/* Empty state */}
          {billingHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-5 py-12 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/8 bg-white/3 text-2xl">
                🧾
              </div>
              <div className="text-sm font-medium text-white/55">No billing history yet</div>
              <div className="text-xs text-white/32">
                Your payment records will appear here after your first plan change.
              </div>
            </div>
          ) : (
            <>
              {/* Table — desktop */}
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/6">
                      {["Date", "Plan", "Amount", "Status"].map((h) => (
                        <th key={h} className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-white/32">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {billingHistory.map((row, i) => (
                      <Motion.tr
                        key={`${row.date}-${i}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: Math.min(i * 0.04, 0.2) }}
                        className="border-b border-white/5 transition hover:bg-white/[0.018] last:border-0"
                      >
                        <td className="px-5 py-3.5 font-medium text-white/65">{row.date}</td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-white/70">
                            <span>{row.plan === "Pro" ? "⚡" : row.plan === "Team" ? "🚀" : "🌱"}</span>
                            {row.plan}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-white/80">{row.amount}</td>
                        <td className="px-5 py-3.5">
                          <StatusPill status={row.status} />
                        </td>
                      </Motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards — mobile */}
              <div className="space-y-2 p-4 sm:hidden">
                {billingHistory.map((row, i) => (
                  <div
                    key={`${row.date}-${i}`}
                    className="flex items-center justify-between rounded-xl border border-white/7 bg-white/[0.025] px-3.5 py-3"
                  >
                    <div>
                      <div className="text-xs font-medium text-white/70">{row.date}</div>
                      <div className="mt-0.5 text-[11px] text-white/38">
                        {row.plan === "Pro" ? "⚡" : row.plan === "Team" ? "🚀" : "🌱"}{" "}
                        {row.plan} · {row.amount}
                      </div>
                    </div>
                    <StatusPill status={row.status} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </ScrollReveal>

      {/* Footer */}
      <Motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.45 }}
        className="mt-9 text-center text-xs text-white/25"
      >
        All plans include core expense tracking. Prices are exclusive of applicable taxes.
      </Motion.div>

      {/* Confirmation modal */}
      <ConfirmModal
        open={modalOpen}
        onClose={handleClose}
        plan={modalPlan}
        direction={modalDir}
        onConfirm={handleConfirm}
        loading={confirmLoading}
      />
    </div>
  );
}
