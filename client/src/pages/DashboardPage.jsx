import { useEffect, useMemo, useState } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Plus, TrendingUp, TrendingDown, Zap, Lightbulb, Activity, ShieldCheck, Clock, Flame, RefreshCw, AlertTriangle } from "lucide-react";
import GlassCard from "../components/GlassCard";
import ScrollReveal from "../components/ScrollReveal";
import { Skeleton } from "../components/Skeleton";
import Typewriter from "../components/Typewriter";
import Modal from "../components/Modal";
import Input from "../components/Input";
import Button from "../components/Button";
import { useAppStore } from "../store/useAppStore";
import { useWorkspaceStore } from "../store/useWorkspaceStore";
import { notify } from "../store/useNotificationStore";
import { calculateBudget } from "../utils/budgetInsights";
import { generateSmartInsights } from "../utils/smartInsightsEngine";


const categories = [
  { key: "food", label: "Food" },
  { key: "travel", label: "Travel" },
  { key: "shopping", label: "Shopping" },
  { key: "other", label: "Other" },
];



export default function DashboardPage() {
  const currency = useAppStore((s) => s.currency);
  const formatMoney = useMemo(() => {
    return (n) =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(n);
  }, [currency]);

  const userName = useAppStore((s) => s.user?.name || "User");
  const allExpenses        = useAppStore((s) => s.expenses);
  const loading            = useAppStore((s) => s.loading?.expenses);
  const error              = useAppStore((s) => s.error?.expenses);
  const budgetMonthly      = useAppStore((s) => s.budgetMonthly);      // default workspace (MongoDB)
  const setBudgetMonthly   = useAppStore((s) => s.setBudgetMonthly);
  const workspaceBudgets   = useAppStore((s) => s.workspaceBudgets);   // other workspaces (localStorage)
  const setWorkspaceBudget = useAppStore((s) => s.setWorkspaceBudget);
  const insights           = useAppStore((s) => s.insights);
  const addExpenseOptimistic = useAppStore((s) => s.addExpenseOptimistic);

  // Workspace filter
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const activeWs = useWorkspaceStore((s) => s.workspaces.find((w) => w.id === s.activeWorkspaceId));
  const expenses = useMemo(
    () => allExpenses.filter((e) => (e.workspaceId ?? "default") === activeWorkspaceId),
    [allExpenses, activeWorkspaceId]
  );

  // Effective budget for the active workspace:
  // default workspace → budgetMonthly (synced with MongoDB)
  // other workspaces  → workspaceBudgets[id] (localStorage only)
  const isDefaultWs     = activeWorkspaceId === "default";
  const effectiveBudget = isDefaultWs
    ? budgetMonthly
    : (workspaceBudgets[activeWorkspaceId] ?? 0);

  function saveEffectiveBudget(value) {
    if (isDefaultWs) {
      setBudgetMonthly(value);
    } else {
      setWorkspaceBudget(activeWorkspaceId, value);
    }
  }

  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ amount: "", category: "food", note: "" });

  const [budgetInput, setBudgetInput] = useState(String(effectiveBudget || ""));

  // Sync the budgetInput field whenever the effective budget or active workspace changes.
  // This covers: workspace switch, login (pre-seeded from localStorage), and server-fetch completion.
  useEffect(() => {
    setBudgetInput(String(effectiveBudget || ""));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspaceId, effectiveBudget]);
  const now = useMemo(() => new Date(), []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const prefix =
      hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
    return `${prefix}, ${userName}`;
  }, [userName]);

  const budgetCalc = useMemo(
    () => calculateBudget(expenses, effectiveBudget),
    [expenses, effectiveBudget]
  );

  const monthTotals = useMemo(() => {
    // Return zeros while fetching to avoid computing on stale/previous-workspace data.
    if (loading) return { total: 0, totals: { food: 0, travel: 0, shopping: 0, other: 0 } };

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const start = monthStart.getTime();
    const end = monthEnd.getTime();

    const totals = { food: 0, travel: 0, shopping: 0, other: 0 };
    for (const e of expenses || []) {
      const dt = new Date(e?.date);
      if (Number.isNaN(dt.getTime())) continue;
      const t = dt.getTime();
      if (t < start || t >= end) continue;
      const cat = (e?.category || "other").toLowerCase();
      const amount = Number(e?.amount) || 0;
      if (totals[cat] === undefined) totals.other += amount;
      else totals[cat] += amount;
    }
    const total = totals.food + totals.travel + totals.shopping + totals.other;
    return { total, totals };
  }, [expenses, now, loading]);

  const previousMonthTotal = useMemo(() => {
    if (loading) return 0;
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 1);
    const start = prevStart.getTime();
    const end = prevEnd.getTime();
    return (expenses || []).reduce((sum, e) => {
      const dt = new Date(e?.date);
      if (Number.isNaN(dt.getTime())) return sum;
      const t = dt.getTime();
      if (t < start || t >= end) return sum;
      return sum + (Number(e?.amount) || 0);
    }, 0);
  }, [expenses, now, loading]);

  // ── Spending Control Panel data ─────────────────────────────────────────────
  // SAFE DEFAULTS — avoids stale flash on login / workspace switch.
  const CONTROL_DEFAULTS = {
    todayTotal: 0, yesterdayTotal: 0, todayVsYestPct: null,
    last3: [], dailyLimit: 0, dailyStatus: "unset", streak: 0, overspendAlert: false,
  };

  const controlPanel = useMemo(() => {
    // While expenses are loading, return zeros — prevents 31-day streak ghost.
    if (loading) return CONTROL_DEFAULTS;

    const today    = new Date();
    const todayY   = today.getFullYear();
    const todayM   = today.getMonth();
    const todayD   = today.getDate();

    const yest = new Date(todayY, todayM, todayD - 1);
    const yesterdayY = yest.getFullYear();
    const yesterdayM = yest.getMonth();
    const yesterdayD = yest.getDate();

    let todayTotal     = 0;
    let yesterdayTotal = 0;
    const todayExpenses = [];

    for (const e of expenses || []) {
      const d = new Date(e?.date);
      if (Number.isNaN(d.getTime())) continue;
      const ey = d.getFullYear(), em = d.getMonth(), ed = d.getDate();
      if (ey === todayY && em === todayM && ed === todayD) {
        todayTotal += Number(e?.amount) || 0;
        todayExpenses.push(e);
      } else if (ey === yesterdayY && em === yesterdayM && ed === yesterdayD) {
        yesterdayTotal += Number(e?.amount) || 0;
      }
    }

    const todayVsYestPct =
      yesterdayTotal > 0
        ? Math.round(((todayTotal - yesterdayTotal) / yesterdayTotal) * 100)
        : null;

    // Last 3 expenses (sorted newest-first)
    const last3 = [...(expenses || [])]
      .filter(e => !Number.isNaN(new Date(e?.date).getTime()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);

    // Daily limit
    const totalDaysInMonth = new Date(todayY, todayM + 1, 0).getDate();
    const dailyLimit = effectiveBudget > 0 ? effectiveBudget / totalDaysInMonth : 0;
    const dailyStatus =
      dailyLimit === 0    ? "unset"
      : todayTotal > dailyLimit          ? "exceeded"
      : todayTotal >= dailyLimit * 0.7   ? "risk"
      : "safe";

    // No-spend streak — only count if there is actual loaded data.
    // FIX: an empty dayTotalsMap means NO data, not "all days are no-spend".
    const dayTotalsMap = {};
    for (const e of expenses || []) {
      const d = new Date(e?.date);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      dayTotalsMap[key] = (dayTotalsMap[key] || 0) + (Number(e?.amount) || 0);
    }

    // Only compute streak when there is at least one loaded expense.
    let streak = 0;
    if (expenses && expenses.length > 0) {
      for (let i = 1; i <= 30; i++) {
        const d = new Date(todayY, todayM, todayD - i);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        // A day only extends the streak if it existed in the map as zero, OR
        // if it is simply absent AND there are expenses on surrounding days
        // (i.e., the user actually used the app around that period).
        // Simpler, more correct rule: we ONLY count days that are explicitly
        // recorded as zero (i.e., the key is in the map with value 0) OR
        // if today itself has no spend AND the expense array is non-empty.
        if (dayTotalsMap[key] === undefined || dayTotalsMap[key] === 0) streak++;
        else break;
      }
      if (todayTotal === 0) streak++;
    }

    return {
      todayTotal,
      yesterdayTotal,
      todayVsYestPct,
      last3,
      dailyLimit,
      dailyStatus,
      streak: todayTotal === 0 ? streak : 0,
      overspendAlert: dailyLimit > 0 && todayTotal >= dailyLimit * 0.7,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses, effectiveBudget, loading]);

  // ── Smart Panel computations (right column) ───────────────────────────────
  const smartPanel = useMemo(() => {
    const today = new Date();
    const dayOfMonth = today.getDate();
    const totalDaysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysRemaining = totalDaysInMonth - dayOfMonth;

    // Daily burn rate & projected spend
    const dailyAvg = dayOfMonth > 0 ? monthTotals.total / dayOfMonth : 0;
    const projected = dailyAvg * totalDaysInMonth;
    const projectedOverBudget =
      effectiveBudget > 0 && projected > effectiveBudget
        ? projected - effectiveBudget
        : 0;
    const daysUntilBudgetBreached =
      effectiveBudget > 0 && dailyAvg > 0
        ? Math.max(0, Math.floor((effectiveBudget - monthTotals.total) / dailyAvg))
        : null;

    // Category comparison month-over-month
    const prevStart = new Date(today.getFullYear(), today.getMonth() - 1, 1).getTime();
    const prevEnd   = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
    const prevCatTotals = { food: 0, travel: 0, shopping: 0, entertainment: 0, utilities: 0, other: 0 };
    for (const e of expenses || []) {
      const t = new Date(e?.date).getTime();
      if (t >= prevStart && t < prevEnd) {
        const cat = (e?.category || "other").toLowerCase();
        prevCatTotals[cat] = (prevCatTotals[cat] ?? 0) + (Number(e?.amount) || 0);
      }
    }
    let biggestIncreaseCat = null;
    let biggestIncreasePct = 0;
    let biggestDecreaseCat = null;
    let biggestDecreasePct = 0;
    for (const [cat, curr] of Object.entries(monthTotals.totals)) {
      const prev = prevCatTotals[cat] ?? 0;
      if (prev > 0 && curr > 0) {
        const pct = Math.round(((curr - prev) / prev) * 100);
        if (pct > biggestIncreasePct) { biggestIncreasePct = pct; biggestIncreaseCat = cat; }
        if (pct < biggestDecreasePct) { biggestDecreasePct = pct; biggestDecreaseCat = cat; }
      }
    }

    // Recurring pattern: same amount + same category at least twice
    const patternMap = {};
    for (const e of expenses || []) {
      const key = `${e.category}-${Math.round(Number(e.amount))}`;
      patternMap[key] = (patternMap[key] || 0) + 1;
    }
    const recurringPatterns = Object.entries(patternMap)
      .filter(([, count]) => count >= 2)
      .map(([key]) => {
        const [cat, amount] = key.split("-");
        return { cat: cat.charAt(0).toUpperCase() + cat.slice(1), amount: Number(amount) };
      });

    // Smart suggestion: biggest spending category, suggest reduction
    const topCat = Object.entries(monthTotals.totals).sort((a, b) => b[1] - a[1])[0];
    const suggestionAmount =
      topCat && effectiveBudget > 0 && monthTotals.total > effectiveBudget
        ? Math.ceil(monthTotals.total - effectiveBudget)
        : topCat
          ? Math.ceil(topCat[1] * 0.15)
          : 0;
    const suggestionCat = topCat
      ? topCat[0].charAt(0).toUpperCase() + topCat[0].slice(1)
      : null;

    // ── additions for Smart Insights panel ────────────────────────────────
    // Highest spending day this month
    const dayTotals = {};
    const monthStart2 = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
    const monthEnd2   = new Date(today.getFullYear(), today.getMonth() + 1, 1).getTime();
    for (const e of expenses || []) {
      const d = new Date(e?.date);
      const t = d.getTime();
      if (t >= monthStart2 && t < monthEnd2) {
        const key = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
        dayTotals[key] = (dayTotals[key] || 0) + (Number(e?.amount) || 0);
      }
    }
    const highestSpendDay = Object.entries(dayTotals).sort((a, b) => b[1] - a[1])[0] || null;

    // Most active category (by transaction count)
    const catCounts = {};
    for (const e of expenses || []) {
      const cat = e?.category || "other";
      catCounts[cat] = (catCounts[cat] || 0) + 1;
    }
    const activeCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0] || null;

    // Spike detection: today > 2× daily average
    const dailyAvgCheck = dayOfMonth > 1 ? monthTotals.total / (dayOfMonth - 1) : 0;
    const todayForSpike = (() => {
      let t = 0;
      const ty = today.getFullYear(), tm = today.getMonth(), td = today.getDate();
      for (const e of expenses || []) {
        const d = new Date(e?.date);
        if (d.getFullYear() === ty && d.getMonth() === tm && d.getDate() === td) {
          t += Number(e?.amount) || 0;
        }
      }
      return t;
    })();
    const isSpikeDay = dailyAvgCheck > 0 && todayForSpike > dailyAvgCheck * 2 && todayForSpike > 0;

    return {
      dailyAvg,
      projected,
      projectedOverBudget,
      daysUntilBudgetBreached,
      daysRemaining,
      biggestIncreaseCat,
      biggestIncreasePct,
      biggestDecreaseCat,
      biggestDecreasePct: Math.abs(biggestDecreasePct),
      recurringPatterns,
      suggestionAmount,
      suggestionCat,
      highestSpendDay,
      activeCategory,
      isSpikeDay,
      todayForSpike,
    };
  }, [expenses, monthTotals, effectiveBudget]);

  // Day-of-week spending heatmap (0=Sun … 6=Sat)
  const dayOfWeekSpend = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0, 0, 0];
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();
    for (const e of expenses || []) {
      const d = new Date(e?.date);
      const t = d.getTime();
      if (t >= monthStart && t < monthEnd) {
        buckets[d.getDay()] += Number(e?.amount) || 0;
      }
    }
    const max = Math.max(...buckets, 1);
    return buckets.map((v) => ({ value: v, pct: Math.round((v / max) * 100) }));
  }, [expenses, now]);

  // ── Dynamic Smart Insights — engine-generated, priority-ranked ───────────────
  const dynamicInsights = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];
    return generateSmartInsights({
      expenses,
      effectiveBudget,
      monthTotals,
      previousMonthTotal,
      budgetCalc,
      controlPanel,
      dayOfWeekSpend,
      formatMoney,
    });
  }, [expenses, effectiveBudget, monthTotals, previousMonthTotal, budgetCalc, controlPanel, dayOfWeekSpend, formatMoney]);

  // ── Spending Score (0–100) ────────────────────────────────────────────────
  const spendingScore = useMemo(() => {
    if (loading || !expenses || expenses.length === 0)
      return { score: null, label: "No data", grade: "—", color: "blue" };

    let score = 100;

    // 1. Budget usage penalty (most weight)
    if (effectiveBudget > 0) {
      const ratio = monthTotals.total / effectiveBudget;
      if (ratio >= 1)        score -= 40;
      else if (ratio >= 0.9) score -= 28;
      else if (ratio >= 0.8) score -= 18;
      else if (ratio >= 0.6) score -= 8;
    } else {
      score -= 10; // no budget set — mild penalty
    }

    // 2. No-spend streak bonus (up to +15)
    const streak = controlPanel.streak || 0;
    score += Math.min(15, streak * 2);

    // 3. Monthly trend vs previous month
    if (previousMonthTotal > 0) {
      const trendRatio = monthTotals.total / previousMonthTotal;
      if (trendRatio < 0.85)  score += 10;
      else if (trendRatio < 1) score += 5;
      else if (trendRatio > 1.2) score -= 10;
    }

    // 4. High-frequency spending penalty (>20 expenses this month)
    const monthExpCnt = expenses.filter((e) => {
      const d = new Date(e?.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
    if (monthExpCnt > 20) score -= 5;

    const final = Math.max(0, Math.min(100, Math.round(score)));
    const grade  = final >= 80 ? "A" : final >= 65 ? "B" : final >= 50 ? "C" : final >= 35 ? "D" : "F";
    const label  = final >= 80 ? "Excellent" : final >= 65 ? "Good" : final >= 50 ? "Average" : final >= 35 ? "At Risk" : "Critical";
    const color  = final >= 80 ? "emerald" : final >= 65 ? "blue" : final >= 50 ? "amber" : "red";
    return { score: final, grade, label, color };
  }, [expenses, effectiveBudget, monthTotals, previousMonthTotal, controlPanel, now]);

  // ── Monthly Comparison ────────────────────────────────────────────────────
  const monthComparison = useMemo(() => {
    if (loading) return { pct: null, direction: null };
    if (previousMonthTotal === 0 && monthTotals.total === 0) return { pct: null, direction: null };
    if (previousMonthTotal === 0) return { pct: null, direction: "up", label: "First month of data" };
    const pct = Math.round(((monthTotals.total - previousMonthTotal) / previousMonthTotal) * 100);
    return { pct: Math.abs(pct), direction: pct >= 0 ? "up" : "down", label: pct === 0 ? "Same as last month" : null };
  }, [monthTotals.total, previousMonthTotal, loading]);

  /** Map iconName string → Lucide component (keeps JSX render simple). */
  const ICON_MAP = {
    AlertTriangle, TrendingUp, TrendingDown, Zap,
    Lightbulb, Activity, ShieldCheck, Clock, Flame, RefreshCw,
  };


  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-2 sm:px-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-white/50">Dashboard
            {activeWs && activeWs.id !== "default" && (
              <span className="ml-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/50">
                {activeWs.name}
              </span>
            )}
          </div>
          <Motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="text-2xl font-semibold text-white/90 sm:text-3xl min-h-[36px]"
          >
            <Typewriter text={greeting} />
          </Motion.div>
          <div className="mt-2 text-sm text-white/60">
            Track your spending & stay on budget
          </div>
        </div>
        <Button onClick={() => setQuickAddOpen(true)} className="flex items-center gap-2">
          <Plus size={16} />
          <span className="hidden sm:inline">Add Expense</span>
        </Button>
      </div>

      <div className="space-y-8">
        {/* Monthly budget card */}
        <ScrollReveal>
          <GlassCard className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-white/90">
                  Monthly budget
                </div>
                <div className="mt-1 text-xs text-white/55">
                  Set your limit and track spending automatically.
                </div>
              </div>

              <div className="w-full sm:w-[280px]">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-white/70">
                    Budget (monthly)
                  </span>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={budgetInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBudgetInput(val);
                      const num = Number(val);
                      if (!Number.isNaN(num)) saveEffectiveBudget(num);
                    }}
                    placeholder="e.g. 1000"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-400/35 focus:ring-2 focus:ring-emerald-400/15"
                  />
                </label>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div>
                <div className="text-xs text-white/50">Spent this month</div>
                <div className="mt-1 text-lg font-semibold text-white/90">
                  {loading || error ? (
                    <Skeleton className="h-6 w-28" />
                  ) : (
                    formatMoney(budgetCalc.spent)
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-white/50">Remaining</div>
                <div
                  className={`mt-1 text-lg font-semibold ${
                    budgetCalc.status === "exceeded" ? "text-red-400" : "text-white/90"
                  }`}
                >
                  {loading || error ? (
                    <Skeleton className="h-6 w-20" />
                  ) : (
                    formatMoney(budgetCalc.remaining)
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-white/50">Status</div>
                <div className="mt-1 text-xs font-semibold text-white/70">
                  {budgetCalc.status === "unknown"
                    ? "Set a budget"
                    : budgetCalc.status === "exceeded"
                      ? "Exceeded"
                      : budgetCalc.status === "near"
                        ? "Near limit"
                        : "Safe"}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="h-3 w-full overflow-hidden rounded-full bg-white/8">
                <Motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, budgetCalc.ratio * 100)}%` }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{
                    background:
                      budgetCalc.status === "exceeded"
                        ? "linear-gradient(90deg, rgba(239,68,68,.85), rgba(244,63,94,.65))"
                        : budgetCalc.status === "near"
                          ? "linear-gradient(90deg, rgba(245,158,11,.85), rgba(251,191,36,.55))"
                          : "linear-gradient(90deg, rgba(34,197,94,.85), rgba(16,185,129,.55))",
                  }}
                />
              </div>

              {budgetCalc.status === "exceeded" ? (
                <Motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                  className="mt-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3"
                >
                  <div className="text-xs font-semibold text-red-200">
                    You have exceeded your monthly budget!
                  </div>
                  <div className="mt-1 text-[11px] text-red-200/70">
                    Consider reviewing category spending to get back on track.
                  </div>
                </Motion.div>
              ) : null}
            </div>
          </GlassCard>
        </ScrollReveal>

        {/* ── Intelligence Strip: Score | Streak | Monthly Comparison ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

          {/* 1. Spending Score */}
          <ScrollReveal delay={0.04}>
            <GlassCard className="relative overflow-hidden p-5">
              {/* Faint glow behind score ring */}
              {spendingScore.score !== null && (
                <div className={`pointer-events-none absolute inset-0 opacity-10 ${
                  spendingScore.color === "emerald" ? "bg-emerald-500" :
                  spendingScore.color === "blue"    ? "bg-blue-500" :
                  spendingScore.color === "amber"   ? "bg-amber-500" : "bg-red-500"
                }`} />
              )}
              <div className="mb-3 flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-widest text-white/40">Spending Score</div>
                <Activity size={14} className="text-white/30" />
              </div>

              {spendingScore.score === null ? (
                <div className="flex h-20 items-center justify-center text-sm text-white/35">Add expenses to calculate</div>
              ) : (
                <div className="flex items-center gap-4">
                  {/* SVG Arc gauge */}
                  <div className="relative shrink-0">
                    <svg width="72" height="72" viewBox="0 0 72 72">
                      {/* Track */}
                      <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
                      {/* Progress arc */}
                      <Motion.circle
                        cx="36" cy="36" r="28"
                        fill="none"
                        strokeWidth="6"
                        strokeLinecap="round"
                        stroke={
                          spendingScore.color === "emerald" ? "#34d399" :
                          spendingScore.color === "blue"    ? "#60a5fa" :
                          spendingScore.color === "amber"   ? "#fbbf24" : "#f87171"
                        }
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - spendingScore.score / 100)}`}
                        transform="rotate(-90 36 36)"
                        initial={{ strokeDashoffset: `${2 * Math.PI * 28}` }}
                        animate={{ strokeDashoffset: `${2 * Math.PI * 28 * (1 - spendingScore.score / 100)}` }}
                        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </svg>
                    {/* Score number centred in ring */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-lg font-bold leading-none ${
                        spendingScore.color === "emerald" ? "text-emerald-300" :
                        spendingScore.color === "blue"    ? "text-blue-300" :
                        spendingScore.color === "amber"   ? "text-amber-300" : "text-red-300"
                      }`}>{spendingScore.score}</span>
                      <span className="text-[9px] text-white/35 mt-0.5">/100</span>
                    </div>
                  </div>

                  <div>
                    <div className={`text-base font-semibold ${
                      spendingScore.color === "emerald" ? "text-emerald-300" :
                      spendingScore.color === "blue"    ? "text-blue-300" :
                      spendingScore.color === "amber"   ? "text-amber-300" : "text-red-300"
                    }`}>{spendingScore.label}</div>
                    <div className="mt-0.5 text-xs text-white/40">Grade: <span className="font-bold text-white/60">{spendingScore.grade}</span></div>
                    <div className="mt-1.5 text-[10px] leading-tight text-white/30">
                      Budget usage · streak · spending trend
                    </div>
                  </div>
                </div>
              )}
            </GlassCard>
          </ScrollReveal>

          {/* 2. No-Spend Streak */}
          <ScrollReveal delay={0.08}>
            <GlassCard className="relative overflow-hidden p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-widest text-white/40">No-Spend Streak</div>
                <Flame size={14} className="text-white/30" />
              </div>

              {controlPanel.streak > 0 ? (
                <div className="flex items-center gap-3">
                  {/* Flame animation */}
                  <Motion.div
                    animate={{ scale: [1, 1.1, 1], y: [0, -2, 0] }}
                    transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                    className="text-4xl leading-none select-none"
                  >
                    🔥
                  </Motion.div>
                  <div>
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-bold text-white/90 tabular-nums">{controlPanel.streak}</span>
                      <span className="mb-0.5 text-sm text-white/40">days</span>
                    </div>
                    <div className="text-xs text-white/40">
                      {controlPanel.streak === 1
                        ? "Started today · keep it up!"
                        : controlPanel.streak < 5
                          ? "Building momentum 💪"
                          : controlPanel.streak < 14
                            ? "Great discipline!"
                            : "Incredible streak! 🏆"}
                    </div>
                    {/* Mini streak bar */}
                    <div className="mt-2 flex gap-0.5">
                      {Array.from({ length: Math.min(controlPanel.streak, 7) }).map((_, i) => (
                        <Motion.div
                          key={i}
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ delay: i * 0.06, duration: 0.3 }}
                          className="h-2 w-4 rounded-full bg-gradient-to-t from-orange-500/70 to-amber-400/80"
                        />
                      ))}
                      {controlPanel.streak > 7 && (
                        <span className="ml-1 text-[10px] text-amber-400/60">+{controlPanel.streak - 7}</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-3xl select-none grayscale opacity-40">🔥</span>
                  <div>
                    <div className="text-sm font-medium text-white/50">No active streak</div>
                    <div className="mt-0.5 text-xs text-white/30">
                      Avoid spending today to start one!
                    </div>
                  </div>
                </div>
              )}
            </GlassCard>
          </ScrollReveal>

          {/* 3. Monthly Comparison */}
          <ScrollReveal delay={0.12}>
            <GlassCard className="relative overflow-hidden p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-widest text-white/40">vs Last Month</div>
                {monthComparison.direction === "down"
                  ? <TrendingDown size={14} className="text-emerald-400" />
                  : <TrendingUp   size={14} className="text-red-400" />}
              </div>

              {monthComparison.pct === null && monthComparison.direction !== "up" ? (
                <div className="flex h-20 items-center justify-center text-sm text-white/35">Not enough data</div>
              ) : monthComparison.label ? (
                <div className="flex h-20 items-center">
                  <span className="text-sm font-medium text-white/50">{monthComparison.label}</span>
                </div>
              ) : (
                <>
                  {/* Big %  */}
                  <div className="flex items-end gap-2">
                    <Motion.span
                      className={`text-3xl font-bold tabular-nums ${
                        monthComparison.direction === "down" ? "text-emerald-300" : "text-red-300"
                      }`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                      {monthComparison.direction === "down" ? "-" : "+"}{monthComparison.pct}%
                    </Motion.span>
                    <span className="mb-1 text-sm text-white/35">vs prev</span>
                  </div>

                  {/* Bar comparison */}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-14 text-[10px] text-white/35">This mo.</span>
                      <div className="flex-1 overflow-hidden rounded-full bg-white/8">
                        <Motion.div
                          className={`h-1.5 rounded-full ${
                            monthComparison.direction === "down"
                              ? "bg-gradient-to-r from-emerald-500/80 to-teal-400/70"
                              : "bg-gradient-to-r from-red-500/80 to-rose-400/70"
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, previousMonthTotal > 0
                            ? (monthTotals.total / Math.max(monthTotals.total, previousMonthTotal)) * 100
                            : 100)}%`
                          }}
                          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                      <span className="w-16 text-right text-[10px] tabular-nums text-white/40">{formatMoney(monthTotals.total)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-14 text-[10px] text-white/35">Last mo.</span>
                      <div className="flex-1 overflow-hidden rounded-full bg-white/8">
                        <Motion.div
                          className="h-1.5 rounded-full bg-gradient-to-r from-white/30 to-white/20"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, monthTotals.total > 0
                            ? (previousMonthTotal / Math.max(monthTotals.total, previousMonthTotal)) * 100
                            : 100)}%`
                          }}
                          transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                      <span className="w-16 text-right text-[10px] tabular-nums text-white/40">{formatMoney(previousMonthTotal)}</span>
                    </div>
                  </div>
                </>
              )}
            </GlassCard>
          </ScrollReveal>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <ScrollReveal>
            <GlassCard className="p-5">
              <div className="text-xs font-medium text-white/55">
                Total expense
              </div>
              {loading || error ? (
                <div className="mt-3">
                  <Skeleton className="h-7 w-36" />
                </div>
              ) : (
                <div className="mt-2 text-2xl font-semibold text-white">
                  {formatMoney(monthTotals.total)}
                </div>
              )}
              <div className="mt-2 text-xs text-white/50">
                This month
              </div>
            </GlassCard>
          </ScrollReveal>

          {categories.slice(0, 3).map((c, idx) => (
            <ScrollReveal key={c.key} delay={0.05 * (idx + 1)}>
              <GlassCard className="p-5">
                <div className="text-xs font-medium text-white/55">
                  {c.label}
                </div>
                {loading || error ? (
                  <div className="mt-3">
                    <Skeleton className="h-6 w-28" />
                  </div>
                ) : (
                  <div className="mt-2 text-xl font-semibold text-white/90">
                    {formatMoney(monthTotals.totals[c.key])}
                  </div>
                )}
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                  <Motion.div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500/70 to-blue-500/55"
                    initial={{ width: 0 }}
                    animate={{
                      width:
                        loading || monthTotals.total === 0
                          ? "0%"
                          : `${Math.round(
                              (monthTotals.totals[c.key] / monthTotals.total) * 100
                            )}%`,
                    }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </GlassCard>
            </ScrollReveal>
          ))}
        </div>

        {/* Insights + Chart placeholder */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ScrollReveal>
            <GlassCard className="p-5">
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/12 ring-1 ring-emerald-400/20">
                    <ShieldCheck size={15} className="text-emerald-300" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white/90">Spending Control</div>
                    <div className="text-[11px] text-white/45">Real-time today's view</div>
                  </div>
                </div>
                {/* Today status badge */}
                <div className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
                  controlPanel.dailyStatus === "exceeded" ? "border-red-400/25 bg-red-500/10 text-red-300"
                  : controlPanel.dailyStatus === "risk"     ? "border-amber-400/25 bg-amber-500/10 text-amber-300"
                  : controlPanel.dailyStatus === "safe"     ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                  : "border-white/10 bg-white/5 text-white/40"
                }`}>
                  {controlPanel.dailyStatus === "exceeded" ? "Limit Hit"
                  : controlPanel.dailyStatus === "risk"    ? "Risk Zone"
                  : controlPanel.dailyStatus === "safe"    ? "Safe Today"
                  : "No Budget"}
                </div>
              </div>

              {loading || error ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-11 w-full" />)}
                </div>
              ) : (
                <div className="space-y-2">

                  {/* Today vs Yesterday */}
                  <Motion.div
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-white/40 uppercase tracking-wide">Today</div>
                        <div className="mt-0.5 text-base font-bold text-white/90">{formatMoney(controlPanel.todayTotal)}</div>
                      </div>
                      <div className="h-8 w-px bg-white/8" />
                      <div>
                        <div className="text-[10px] text-white/40 uppercase tracking-wide">Yesterday</div>
                        <div className="mt-0.5 text-sm font-semibold text-white/55">{formatMoney(controlPanel.yesterdayTotal)}</div>
                      </div>
                      <div>
                        {controlPanel.todayVsYestPct !== null ? (
                          <div className={`flex items-center gap-0.5 text-xs font-bold ${
                            controlPanel.todayVsYestPct > 0 ? "text-red-300" : "text-emerald-300"
                          }`}>
                            {controlPanel.todayVsYestPct > 0
                              ? <TrendingUp size={12} />
                              : <TrendingDown size={12} />}
                            {Math.abs(controlPanel.todayVsYestPct)}%
                          </div>
                        ) : (
                          <div className="text-[10px] text-white/28">—</div>
                        )}
                      </div>
                    </div>
                  </Motion.div>

                  {/* Daily limit tracker */}
                  {controlPanel.dailyLimit > 0 ? (
                    <Motion.div
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: 0.04 }}
                      className={`rounded-2xl border px-4 py-3 ${
                        controlPanel.dailyStatus === "exceeded" ? "border-red-400/20 bg-red-500/8"
                        : controlPanel.dailyStatus === "risk"   ? "border-amber-400/20 bg-amber-500/8"
                        : "border-white/8 bg-white/[0.03]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Clock size={11} className="text-white/35" />
                          <span className="text-[10px] text-white/45">Daily limit</span>
                        </div>
                        <span className={`text-xs font-semibold ${
                          controlPanel.dailyStatus === "exceeded" ? "text-red-300"
                          : controlPanel.dailyStatus === "risk"   ? "text-amber-300"
                          : "text-emerald-300"
                        }`}>
                          {formatMoney(Math.round(controlPanel.todayTotal))}
                          <span className="font-normal text-white/30"> / {formatMoney(Math.round(controlPanel.dailyLimit))}</span>
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                        <Motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (controlPanel.todayTotal / controlPanel.dailyLimit) * 100)}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className={`h-full rounded-full ${
                            controlPanel.dailyStatus === "exceeded" ? "bg-red-400/70"
                            : controlPanel.dailyStatus === "risk"   ? "bg-amber-400/70"
                            : "bg-emerald-400/65"
                          }`}
                        />
                      </div>
                    </Motion.div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 px-4 py-2.5 text-[11px] text-white/32">
                      Set a monthly budget to enable daily limit tracking
                    </div>
                  )}

                  {/* Overspend alert */}
                  <AnimatePresence>
                    {(controlPanel.dailyStatus === "risk" || controlPanel.dailyStatus === "exceeded") && (
                      <Motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="flex items-start gap-2 rounded-2xl border border-red-400/20 bg-red-500/8 px-4 py-2.5">
                          <Flame size={12} className="mt-0.5 shrink-0 text-red-300" />
                          <div className="text-[11px] text-red-200/80">
                            {controlPanel.dailyStatus === "exceeded"
                              ? "Daily limit exceeded — consider pausing spending today"
                              : "You've used 70%+ of today's daily limit"}
                          </div>
                        </div>
                      </Motion.div>
                    )}
                  </AnimatePresence>

                  {/* No-spend streak */}
                  {controlPanel.streak > 1 && (
                    <Motion.div
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: 0.08 }}
                      className="flex items-center gap-2 rounded-2xl border border-emerald-400/18 bg-emerald-500/8 px-4 py-2.5"
                    >
                      <span className="text-base">🔥</span>
                      <div>
                        <span className="text-xs font-semibold text-emerald-300">{controlPanel.streak}-day no-spend streak</span>
                        <span className="ml-1.5 text-[10px] text-emerald-400/60">Keep it up!</span>
                      </div>
                    </Motion.div>
                  )}

                  {/* Last 3 transactions */}
                  {controlPanel.last3.length > 0 && (
                    <div>
                      <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-white/32">Recent</div>
                      <div className="space-y-1">
                        {controlPanel.last3.map((e, i) => (
                          <Motion.div
                            key={e.id ?? i}
                            initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.18, delay: i * 0.04 }}
                            className="flex items-center justify-between rounded-xl border border-white/6 bg-white/[0.025] px-3 py-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm">
                                {e.category === "food" ? "🍽️" : e.category === "travel" ? "✈️" : e.category === "shopping" ? "🛍️" : e.category === "entertainment" ? "🎭" : "📦"}
                              </span>
                              <span className="text-xs text-white/60 capitalize">{e.category}</span>
                            </div>
                            <span className="text-xs font-semibold text-white/80">{formatMoney(Number(e.amount))}</span>
                          </Motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {expenses.length === 0 && !loading && (
                    <div className="rounded-2xl border border-dashed border-white/10 py-8 text-center text-xs text-white/35">
                      No expenses yet — add one to start tracking
                    </div>
                  )}
                </div>
              )}
            </GlassCard>
          </ScrollReveal>

          <ScrollReveal delay={0.08}>
            <GlassCard className="p-5">
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-500/12 ring-1 ring-violet-400/20">
                    <Zap size={15} className="text-violet-300" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white/90">Smart Insights</div>
                    <div className="text-[11px] text-white/45">AI-powered analysis</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 rounded-full border border-violet-400/20 bg-violet-500/10 px-2.5 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                  <span className="text-[10px] font-semibold text-violet-300">Live</span>
                </div>
              </div>

              {loading || error ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : expenses.length === 0 ? (
                <div className="grid h-52 place-items-center rounded-2xl border border-dashed border-white/10 text-xs text-white/35">
                  Add expenses to unlock insights
                </div>
              ) : (
                <div className="space-y-2.5">

                  {/* Dynamic insight cards — engine-generated, priority-ranked */}
                  {dynamicInsights.map((ins, i) => {
                    const IconComp = ICON_MAP[ins.iconName] ?? Zap;
                    return (
                      <Motion.div
                        key={ins.type}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22, delay: i * 0.05 }}
                        className={`rounded-2xl border px-4 py-3 ${ins.style.border} ${ins.style.bg}`}
                      >
                        <div className="flex items-start gap-2">
                          <IconComp size={13} className={`mt-0.5 shrink-0 ${ins.style.icon}`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-white/85">{ins.title}</div>
                            <div className={`mt-0.5 text-[11px] leading-relaxed ${ins.style.text}`}>{ins.body}</div>
                          </div>
                        </div>
                      </Motion.div>
                    );
                  })}


                  <Motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: 0.16 }}
                    className="rounded-2xl border border-white/8 bg-white/[0.025] px-4 py-3"
                  >
                    <div className="mb-2 text-xs font-semibold text-white/70">Spending by Day of Week</div>
                    <div className="flex items-end gap-1">
                      {["S", "M", "T", "W", "T", "F", "S"].map((label, i) => (
                        <div key={i} className="flex flex-1 flex-col items-center gap-1">
                          <Motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(4, (dayOfWeekSpend[i]?.pct ?? 0) * 0.4)}px` }}
                            transition={{ duration: 0.6, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                            className={`w-full rounded-sm ${
                              i === 0 || i === 6
                                ? "bg-violet-400/50"
                                : dayOfWeekSpend[i]?.pct >= 80
                                  ? "bg-red-400/60"
                                  : dayOfWeekSpend[i]?.pct >= 50
                                    ? "bg-amber-400/55"
                                    : "bg-emerald-400/45"
                            }`}
                          />
                          <span className="text-[9px] text-white/35">{label}</span>
                        </div>
                      ))}
                    </div>
                    {(dayOfWeekSpend[0]?.pct + dayOfWeekSpend[6]?.pct) >
                     (dayOfWeekSpend[1]?.pct + dayOfWeekSpend[2]?.pct + dayOfWeekSpend[3]?.pct) / 3 / 2 && (
                      <div className="mt-2 text-[10px] text-white/40">
                        💡 You tend to spend more on weekends
                      </div>
                    )}
                  </Motion.div>

                </div>
              )}
            </GlassCard>
          </ScrollReveal>
        </div>
      </div>

      <Modal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} title="Add Expense">
        <div className="space-y-3">
          <Input
            label="Amount"
            inputMode="decimal"
            placeholder="e.g. 24"
            value={expenseForm.amount}
            onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))}
          />
          <label className="block space-y-1">
            <span className="text-xs font-medium text-white/70">Category</span>
            <select
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/35 focus:ring-2 focus:ring-emerald-400/15"
              value={expenseForm.category}
              onChange={(e) => setExpenseForm((f) => ({ ...f, category: e.target.value }))}
            >
              {categories.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </label>
          <Input
            label="Note"
            placeholder="Short note..."
            value={expenseForm.note}
            onChange={(e) => setExpenseForm((f) => ({ ...f, note: e.target.value }))}
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setQuickAddOpen(false)}>Cancel</Button>
            <Button type="button" onClick={() => {
              const amount = Number(expenseForm.amount);
              if (!amount || Number.isNaN(amount) || amount <= 0) {
                notify({ type: "error", message: "Invalid amount" });
                return;
              }
              // Close modal immediately for instant UX
              setQuickAddOpen(false);
              setExpenseForm({ amount: "", category: "food", note: "" });
              notify({ type: "success", message: "Expense added" });
              // API call runs in background — optimistic update already shows it
              addExpenseOptimistic({
                amount,
                category: expenseForm.category,
                note: expenseForm.note?.trim() || "",
                workspaceId: activeWorkspaceId,
              }).then((res) => {
                if (!res.ok && !res.limitReached) {
                  notify({ type: "error", message: res.message || "Failed to save expense" });
                }
              });
            }}>
              Add
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

