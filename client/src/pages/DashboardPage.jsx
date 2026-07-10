import { useEffect, useMemo, useState } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Zap,
  Lightbulb,
  Activity,
  ShieldCheck,
  Clock,
  Flame,
  RefreshCw,
  AlertTriangle,
  Wallet,
  Search,
  ChevronDown,
  Trophy,
  Utensils,
  Car,
  ShoppingBag,
  Package
} from "lucide-react";
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
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const categories = [
  { key: "food", label: "Food" },
  { key: "travel", label: "Travel" },
  { key: "shopping", label: "Shopping" },
  { key: "other", label: "Other" },
];

function CustomTooltip({ active, payload, formatMoney }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-white/[0.08] bg-[#0d0f14]/95 p-3 shadow-2xl backdrop-blur-md text-white">
        <p className="text-[10px] uppercase tracking-wider text-white/40">Day {payload[0].payload.name}</p>
        <p className="text-xs font-bold text-[#84cc16] mt-1">Spent: {formatMoney(payload[0].value)}</p>
        {payload[1] && <p className="text-xs font-semibold text-[#eab308] mt-0.5">Avg: {formatMoney(payload[1].value)}</p>}
      </div>
    );
  }
  return null;
}

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

  const theme = useAppStore((s) => s.theme);
  const isLightTheme = theme === "light";

  // ── Light-theme 3-tint card palette ──────────────────────────────
  // card1Class  → #FFFFFF  pure white  (primary KPI – highest visual weight)
  // cardBgClass → #F3F8F2  sage tint   (secondary KPI + metric cards)
  // cardGrayClass → #F6F7F9 cool gray  (functional / insight panels)
  const card1Class = isLightTheme
    ? "bg-gradient-to-b from-[#000000] via-[#233529] to-[#75907A] border border-white/[0.08] no-invert hover:border-white/70 hover:ring-1 hover:ring-white/20"
    : "border border-white/[0.09] shadow-[0_12px_40px_rgba(0,0,0,0.35)] hover:border-white/20 transition-all duration-300";

  const cardBgClass = isLightTheme
    ? "bg-[#090B0A] border border-[#1A1E1C] hover:border-white/50 hover:ring-1 hover:ring-white/20"
    : "bg-gradient-to-b from-[#090E0A] via-[#182C1C] to-[#324E38] border border-white/[0.05] shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:border-white/12 transition-all duration-300";

  const cardGrayClass = isLightTheme
    ? "bg-[#090B0A] border border-[#1A1E1C] hover:border-white/50 hover:ring-1 hover:ring-white/20"
    : "bg-gradient-to-b from-[#090E0A] via-[#182C1C] to-[#324E38] border border-white/[0.05] shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:border-white/12 transition-all duration-300";

  // Effective budget for the active workspace
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
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setBudgetInput(String(effectiveBudget || ""));
    }
  }, [activeWorkspaceId, effectiveBudget, isFocused]);

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

  const CONTROL_DEFAULTS = {
    todayTotal: 0, yesterdayTotal: 0, todayVsYestPct: null,
    last3: [], dailyLimit: 0, dailyStatus: "unset", streak: 0, overspendAlert: false,
  };

  const controlPanel = useMemo(() => {
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

    const last3 = [...(expenses || [])]
      .filter(e => !Number.isNaN(new Date(e?.date).getTime()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);

    const totalDaysInMonth = new Date(todayY, todayM + 1, 0).getDate();
    const dailyLimit = effectiveBudget > 0 ? effectiveBudget / totalDaysInMonth : 0;
    const dailyStatus =
      dailyLimit === 0    ? "unset"
      : todayTotal > dailyLimit          ? "exceeded"
      : todayTotal >= dailyLimit * 0.7   ? "risk"
      : "safe";

    const dayTotalsMap = {};
    for (const e of expenses || []) {
      const d = new Date(e?.date);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      dayTotalsMap[key] = (dayTotalsMap[key] || 0) + (Number(e?.amount) || 0);
    }

    let streak = 0;
    if (expenses && expenses.length > 0) {
      for (let i = 1; i <= 30; i++) {
        const d = new Date(todayY, todayM, todayD - i);
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
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

  const smartPanel = useMemo(() => {
    const today = new Date();
    const dayOfMonth = today.getDate();
    const totalDaysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysRemaining = totalDaysInMonth - dayOfMonth;

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

    const catCounts = {};
    for (const e of expenses || []) {
      const cat = e?.category || "other";
      catCounts[cat] = (catCounts[cat] || 0) + 1;
    }
    const activeCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0] || null;

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

  const spendingScore = useMemo(() => {
    if (loading || !expenses || expenses.length === 0)
      return { score: null, label: "No data", grade: "—", color: "blue" };

    let score = 100;

    if (effectiveBudget > 0) {
      const ratio = monthTotals.total / effectiveBudget;
      if (ratio >= 1)        score -= 40;
      else if (ratio >= 0.9) score -= 28;
      else if (ratio >= 0.8) score -= 18;
      else if (ratio >= 0.6) score -= 8;
    } else {
      score -= 10;
    }

    const streak = controlPanel.streak || 0;
    score += Math.min(15, streak * 2);

    if (previousMonthTotal > 0) {
      const trendRatio = monthTotals.total / previousMonthTotal;
      if (trendRatio < 0.85)  score += 10;
      else if (trendRatio < 1) score += 5;
      else if (trendRatio > 1.2) score -= 10;
    }

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

  const monthComparison = useMemo(() => {
    if (loading) return { pct: null, direction: null };
    if (previousMonthTotal === 0 && monthTotals.total === 0) return { pct: null, direction: null };
    if (previousMonthTotal === 0) return { pct: null, direction: "up", label: "First month of data" };
    const pct = Math.round(((monthTotals.total - previousMonthTotal) / previousMonthTotal) * 100);
    return { pct: Math.abs(pct), direction: pct >= 0 ? "up" : "down", label: pct === 0 ? "Same as last month" : null };
  }, [monthTotals.total, previousMonthTotal, loading]);

  const ICON_MAP = {
    AlertTriangle, TrendingUp, TrendingDown, Zap,
    Lightbulb, Activity, ShieldCheck, Clock, Flame, RefreshCw,
  };

  // Recharts Sales Volume data calculation (daily breakdown for the current month)
  const chartData = useMemo(() => {
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const dailyData = Array.from({ length: daysInMonth }, (_, idx) => {
      const day = idx + 1;
      return {
        name: `${day}`,
        Spent: 0,
        Average: 0,
      };
    });

    const ty = today.getFullYear();
    const tm = today.getMonth();
    const dailyAvg = monthTotals.total / (today.getDate() || 1);

    for (const e of expenses || []) {
      const d = new Date(e?.date);
      if (d.getFullYear() === ty && d.getMonth() === tm) {
        const dayIdx = d.getDate() - 1;
        if (dayIdx >= 0 && dayIdx < daysInMonth) {
          dailyData[dayIdx].Spent += Number(e?.amount) || 0;
        }
      }
    }

    return dailyData.map((d) => ({
      ...d,
      Average: Math.round(dailyAvg),
      Spent: Math.round(d.Spent),
    }));
  }, [expenses, monthTotals.total]);

  // Top 3 category breakdown bubble data
  const topCategoriesBubble = useMemo(() => {
    const list = Object.entries(monthTotals.totals)
      .map(([key, value]) => ({
        category: key,
        value,
        percentage: monthTotals.total > 0 ? Math.round((value / monthTotals.total) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value);
    return list.slice(0, 3);
  }, [monthTotals]);

  return (
    <div className="w-full space-y-6">
      {/* Greeting Header */}
      <Motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex items-center justify-between gap-4 border-b border-white/[0.04] pb-4"
      >
        <div>
          <div className={`text-[11px] font-bold uppercase tracking-widest select-none ${
            isLightTheme ? "text-[#84cc16]" : "text-[#EFF2F0]"
          }`}>
            {activeWs?.name || "Personal Finance"} Workspace
          </div>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-white/95 sm:text-4xl">
            <Typewriter text={greeting} />
          </h2>
          <p className="mt-1.5 text-sm text-white/40 font-medium">
            Overview of your financial performance
          </p>
        </div>
        <button
          onClick={() => setQuickAddOpen(true)}
          className="flex items-center gap-1.5 rounded-full bg-[#111827] border border-transparent hover:border-white/50 text-white px-4 py-2.5 text-xs font-semibold transition active:scale-95 cursor-pointer"
        >
          <Plus size={14} />
          <span>Add Expense</span>
        </button>
      </Motion.div>

      {/* Top row: 3 Key KPI cards matching mockup */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Card 1: Spent This Month (Total Revenue mockup equivalent - dynamic styling) */}
        <ScrollReveal delay={0.05}>
          <div className={`relative overflow-hidden rounded-[24px] p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-[2px] hover:shadow-md cursor-pointer ${card1Class}`}>
            {!isLightTheme && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[24px]">
                {/* Background mockup gradient: top pitch black to bottom green */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#000000] via-[#031E0D] to-[#094423]" />
                
                {/* Moving fog shape 1: wide cloud drifting left/right */}
                <Motion.div
                  animate={{
                    x: [-90, 90, -90],
                    y: [12, -8, 12],
                    opacity: [0.15, 0.28, 0.15],
                  }}
                  transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute -bottom-24 -left-20 h-52 w-96 rounded-full bg-white/[0.11] blur-3xl"
                />

                {/* Moving fog shape 2: second cloud drifting opposite */}
                <Motion.div
                  animate={{
                    x: [90, -90, 90],
                    y: [-8, 12, -8],
                    opacity: [0.22, 0.12, 0.22],
                  }}
                  transition={{
                    duration: 16,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute -bottom-20 -right-20 h-44 w-80 rounded-full bg-[#E2E8F0]/[0.10] blur-3xl"
                />

                {/* Moving fog shape 3: central rising cloud scaling */}
                <Motion.div
                  animate={{
                    x: [-30, 30, -30],
                    scale: [1, 1.28, 1],
                    opacity: [0.18, 0.26, 0.18],
                  }}
                  transition={{
                    duration: 9,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute bottom-[-40px] left-1/4 h-36 w-72 rounded-full bg-white/[0.09] blur-2xl"
                />
              </div>
            )}
            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <div className={`grid h-9 w-9 place-items-center rounded-xl transition-colors duration-300 ${
                  isLightTheme
                    ? "bg-white/[0.04] text-white/60"
                    : "bg-white/10 text-white/90"
                }`}>
                  <Wallet size={16} />
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider rounded-md px-2.5 py-1 border transition-colors duration-300 ${
                  isLightTheme
                    ? "text-white/40 bg-white/[0.03] border-white/[0.06]"
                    : "text-white/85 bg-white/5 border-white/[0.06]"
                }`}>
                  <span>Month Total</span>
                </div>
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-white/40">Spent this month</span>
                <h3 className="mt-1 text-2xl font-bold text-white tracking-tight">
                  {loading ? <Skeleton className="h-8 w-32" /> : formatMoney(monthTotals.total)}
                </h3>
              </div>
              <div className="flex items-center justify-between text-[11px] text-white/60 pt-1">
                <div className="flex items-center gap-1">
                  {monthComparison.direction === "down" ? (
                    <span className="text-[#52b147] font-bold px-2 py-0.5 rounded-full bg-[#162e22] border border-[#52b147]/20">-{monthComparison.pct}% MoM</span>
                  ) : monthComparison.pct !== null ? (
                    <span className="text-red-400 font-bold px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">+{monthComparison.pct}% MoM</span>
                  ) : (
                    <span className="text-white/40">First record</span>
                  )}
                </div>
                <span className="text-white/35 truncate max-w-[120px] text-right">
                  {smartPanel.suggestionCat ? `Top: ${smartPanel.suggestionCat}` : "No spendings"}
                </span>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Card 2: Spent Yesterday (Active Users mockup equivalent) */}
        <ScrollReveal delay={0.1}>
          <div className={`rounded-[24px] p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-[2px] hover:shadow-md cursor-pointer ${cardBgClass}`}>
            <div className="flex items-center justify-between">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.04] text-white/60">
                <Activity size={16} />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white/40">
                <span>Daily Log</span>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-white/40">Spent yesterday</span>
              <h3 className="mt-1 text-2xl font-bold text-white tracking-tight">
                {loading ? <Skeleton className="h-8 w-24" /> : formatMoney(controlPanel.yesterdayTotal)}
              </h3>
            </div>
            <div className="mt-4 flex items-center justify-between text-[11px] text-white/60">
              <div className="flex items-center gap-1">
                {controlPanel.todayVsYestPct !== null ? (
                  <span className={`font-semibold px-2 py-0.5 rounded-full ${
                    controlPanel.todayVsYestPct > 0 
                      ? (isLightTheme ? "text-red-400 bg-red-500/10 border border-red-500/20" : "text-[#E09882] bg-[#E09882]/10 border border-[#E09882]/20")
                      : (isLightTheme ? "text-[#52b147] bg-[#162e22] border border-[#52b147]/20" : "text-white/80 bg-white/10 border border-white/10")
                  }`}>
                    {controlPanel.todayVsYestPct > 0 ? "▲" : "▼"} {Math.abs(controlPanel.todayVsYestPct)}% today
                  </span>
                ) : (
                  <span className="text-white/40">Yesterday no spend</span>
                )}
              </div>
              {controlPanel.streak > 0 ? (
                <span className={`font-semibold flex items-center gap-1 ${isLightTheme ? "text-amber-400" : "text-[#D9C39E]"}`}>
                  <Flame size={12} fill="currentColor" />
                  {controlPanel.streak}d streak
                </span>
              ) : (
                <span className="text-white/35 font-normal">No streak</span>
              )}
            </div>
          </div>
        </ScrollReveal>

        {/* Card 3: Remaining Budget (Conversion Rate mockup equivalent with integrated inline controls) */}
        <ScrollReveal delay={0.15}>
          <div className={`rounded-[24px] p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-[2px] hover:shadow-md cursor-pointer ${cardBgClass}`}>
            <div className="flex items-center justify-between">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.04] text-white/60">
                <ShieldCheck size={16} />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-white/40 uppercase font-semibold">Limit:</span>
                <input
                  type="number"
                  value={budgetInput}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBudgetInput(val);
                    const num = Number(val);
                    if (!Number.isNaN(num)) saveEffectiveBudget(num);
                  }}
                  className="w-16 rounded-lg border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white outline-none focus:border-[#7CC6FF]/50 transition text-center"
                />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-white/40">Remaining Budget</span>
              <h3 className={`mt-1 text-2xl font-bold tracking-tight ${budgetCalc.status === "exceeded" ? (isLightTheme ? "text-red-400 animate-pulse" : "text-[#E09882]") : "text-white"}`}>
                {loading ? <Skeleton className="h-8 w-24" /> : formatMoney(budgetCalc.remaining)}
              </h3>
            </div>
            <div className="mt-4">
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
                <Motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, budgetCalc.ratio * 100)}%` }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{
                    background:
                      budgetCalc.status === "exceeded"
                        ? (isLightTheme ? "rgba(239, 68, 68, 0.85)" : "#E09882")
                        : budgetCalc.status === "near"
                          ? (isLightTheme ? "rgba(245, 158, 11, 0.85)" : "#D9C39E")
                          : (isLightTheme ? "rgba(132, 204, 22, 0.85)" : "#EFF2F0")
                  }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[9px] text-white/40">
                <span>{Math.round(budgetCalc.ratio * 100)}% Used</span>
                <span className="font-semibold capitalize text-white/60">
                  {budgetCalc.status === "exceeded" ? "Overlimit" : budgetCalc.status === "near" ? "Risk limit" : "Safe"}
                </span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* Mid Row: Spending Score, No-Spend Streak, Vs Last Month */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

        {/* Spending Score Card */}
        <ScrollReveal delay={0.05}>
          <div className={`rounded-[24px] p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-[2px] hover:shadow-md cursor-pointer ${cardBgClass}`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Spending Score</span>
              <Activity size={14} className="text-white/30" />
            </div>
            <div className="flex items-center gap-4">
              {/* Circular score ring */}
              <div className="relative flex items-center justify-center flex-shrink-0">
                <svg width="64" height="64" className="-rotate-90">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                  <circle
                    cx="32" cy="32" r="26" fill="none"
                    stroke={spendingScore.color === "emerald" ? (isLightTheme ? "#84cc16" : "#EFF2F0") : spendingScore.color === "blue" ? "#7CC6FF" : spendingScore.color === "amber" ? (isLightTheme ? "#eab308" : "#D9C39E") : (isLightTheme ? "#f87171" : "#E09882")}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 26}`}
                    strokeDashoffset={`${2 * Math.PI * 26 * (1 - (spendingScore.score ?? 0) / 100)}`}
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-sm font-extrabold text-white/95 leading-none">{spendingScore.score ?? "—"}</span>
                  <span className="block text-[8px] text-white/40 leading-none mt-0.5">/100</span>
                </div>
              </div>
              <div>
                <p className={`text-base font-bold ${spendingScore.color === "emerald" ? (isLightTheme ? "text-[#84cc16]" : "text-[#EFF2F0]") : spendingScore.color === "blue" ? "text-[#7CC6FF]" : spendingScore.color === "amber" ? (isLightTheme ? "text-amber-400" : "text-[#D9C39E]") : (isLightTheme ? "text-red-400" : "text-[#E09882]")}`}>
                  {spendingScore.label}
                </p>
                <p className="text-[10px] text-white/40 mt-0.5">Grade: <span className="text-white/70 font-semibold">{spendingScore.grade}</span></p>
                <p className="text-[9px] text-white/30 mt-1 leading-tight">Budget usage · streak · spending trend</p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* No-Spend Streak Card */}
        <ScrollReveal delay={0.1}>
          <div className={`rounded-[24px] p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-[2px] hover:shadow-md cursor-pointer ${cardBgClass}`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">No-Spend Streak</span>
              <Flame size={14} className="text-white/30" />
            </div>
            <div className="flex items-center gap-3">
              <div className={`grid h-10 w-10 place-items-center rounded-xl ${
                isLightTheme ? "bg-amber-500/10 text-amber-400 animate-pulse" : "bg-[#D9C39E]/10 text-[#D9C39E]"
              }`}>
                <Flame size={20} fill="currentColor" />
              </div>
              <div>
                <p className="text-white/95 font-extrabold text-2xl leading-none">
                  {controlPanel.streak > 0 ? (
                    <><span>{controlPanel.streak}</span> <span className="text-base font-semibold text-white/50">days</span></>
                  ) : (
                    <span className="text-base font-semibold text-white/40">No streak yet</span>
                  )}
                </p>
                <p className="text-[10px] text-white/40 mt-1">
                  {controlPanel.streak > 0 ? (
                    <span className={`flex items-center gap-1 font-medium ${
                      isLightTheme ? "text-amber-400" : "text-[#D9C39E]"
                    }`}>
                      Incredible streak!
                      <Trophy size={11} />
                    </span>
                  ) : (
                    "Spend-free days build here"
                  )}
                </p>
              </div>
            </div>
            {controlPanel.streak > 0 && (
              <div className="flex items-center gap-1 mt-4">
                {Array.from({ length: Math.min(controlPanel.streak, 7) }).map((_, i) => (
                  <Flame key={i} size={14} className={isLightTheme ? "text-amber-400" : "text-[#D9C39E]"} fill="currentColor" />
                ))}
                {controlPanel.streak > 7 && (
                  <span className="text-[10px] text-white/50 font-semibold ml-1">+{controlPanel.streak - 7}</span>
                )}
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* Vs Last Month Card */}
        <ScrollReveal delay={0.15}>
          <div className={`rounded-[24px] p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-[2px] hover:shadow-md cursor-pointer ${cardBgClass}`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Vs Last Month</span>
              {monthComparison.direction === "down"
                ? <TrendingDown size={14} className="text-[#84cc16]" />
                : <TrendingUp size={14} className={isLightTheme ? "text-red-400" : "text-[#E09882]"} />
              }
            </div>
            <p className={`text-2xl font-extrabold leading-none ${monthComparison.direction === "down" ? "text-[#84cc16]" : monthComparison.pct !== null ? (isLightTheme ? "text-red-400" : "text-[#E09882]") : "text-white/60"}`}>
              {monthComparison.pct !== null
                ? `${monthComparison.direction === "down" ? "-" : "+"}${monthComparison.pct}%`
                : "—"
              }
              <span className="ml-2 text-sm font-medium text-white/40">vs prev</span>
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-white/40">This mo.</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full bg-white/30 rounded-full" style={{ width: previousMonthTotal > 0 ? `${Math.min(100, (monthTotals.total / Math.max(monthTotals.total, previousMonthTotal)) * 100)}%` : "0%" }} />
                  </div>
                  <span className="text-white/60 font-semibold w-10 text-right">{formatMoney(monthTotals.total)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-white/40">Last mo.</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full bg-white/20 rounded-full" style={{ width: previousMonthTotal > 0 ? `${Math.min(100, (previousMonthTotal / Math.max(monthTotals.total, previousMonthTotal)) * 100)}%` : "0%" }} />
                  </div>
                  <span className="text-white/40 font-semibold w-10 text-right">{formatMoney(previousMonthTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

      </div>

      {/* Bottom Row: Spending Control and AI Smart Insights */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left Side: Real-time spending control */}
        <div className={`rounded-[24px] p-6 shadow-sm space-y-4 transition-all duration-300 ease-out ${cardGrayClass}`}>
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
            <div className="flex items-center gap-2">
              <div className={`grid h-8 w-8 place-items-center rounded-lg ${
                isLightTheme ? "bg-[#84cc16]/10 text-[#84cc16]" : "bg-white/10 text-white/90"
              }`}>
                <ShieldCheck size={14} />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white/95">Spending Control</h3>
                <p className="text-[9px] text-white/40">Daily status & recent actions</p>
              </div>
            </div>
            <div className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
              controlPanel.dailyStatus === "exceeded" ? (isLightTheme ? "border-red-500/20 bg-red-500/10 text-red-300" : "border-[#E09882]/20 bg-[#E09882]/10 text-[#E09882]")
              : controlPanel.dailyStatus === "risk"     ? (isLightTheme ? "border-amber-500/20 bg-amber-500/10 text-amber-300" : "border-[#D9C39E]/20 bg-[#D9C39E]/10 text-[#D9C39E]")
              : controlPanel.dailyStatus === "safe"     ? (isLightTheme ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-white/12 bg-white/5 text-white/80")
              : "border-white/10 bg-white/5 text-white/40"
            }`}>
              {controlPanel.dailyStatus === "exceeded" ? "Limit Hit"
              : controlPanel.dailyStatus === "risk"    ? "Risk Zone"
              : controlPanel.dailyStatus === "safe"    ? "Safe Today"
              : "No Budget"}
            </div>
          </div>

          <div className="space-y-3.5">
            {/* Daily limit tracker bar */}
            {controlPanel.dailyLimit > 0 ? (
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-white/40">Today vs Limit</span>
                  <span className="font-semibold text-white/80">
                    {formatMoney(Math.round(controlPanel.todayTotal))}
                    <span className="text-white/30 font-normal"> / {formatMoney(Math.round(controlPanel.dailyLimit))}</span>
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                  <Motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (controlPanel.todayTotal / controlPanel.dailyLimit) * 100)}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      controlPanel.dailyStatus === "exceeded" ? (isLightTheme ? "bg-red-400/80" : "bg-[#E09882]")
                      : controlPanel.dailyStatus === "risk"   ? (isLightTheme ? "bg-amber-400/80" : "bg-[#D9C39E]")
                      : (isLightTheme ? "bg-[#84cc16]/80" : "bg-white/80")
                    }`}
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 p-3 text-center text-[10px] text-white/35">
                Set a monthly limit to track daily budgets
              </div>
            )}

            {/* Overspend Warning Alerts */}
            <AnimatePresence>
              {(controlPanel.dailyStatus === "risk" || controlPanel.dailyStatus === "exceeded") && (
                <Motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-[10px] ${
                    isLightTheme 
                      ? "border-red-500/20 bg-red-500/5 text-red-200/85" 
                      : "border-[#E09882]/20 bg-[#E09882]/5 text-[#E09882]/90"
                  }`}>
                    <Flame size={12} className={`shrink-0 mt-0.5 ${isLightTheme ? "text-red-300" : "text-[#E09882]"}`} />
                    <span>
                      {controlPanel.dailyStatus === "exceeded"
                        ? "Daily budget limit reached! We recommend halting spending for the day."
                        : "Caution: You have utilized over 70% of today's budget limit."}
                    </span>
                  </div>
                </Motion.div>
              )}
            </AnimatePresence>

            {/* Recent list transactions */}
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-white/30 block mb-2">Recent Transactions</span>
              {controlPanel.last3.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/[0.06] py-5 text-center text-[10px] text-white/35">
                  No spend records logged
                </div>
              ) : (
                <div className="space-y-1.5">
                  {controlPanel.last3.map((e, idx) => (
                    <div key={e.id || idx} className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.01] px-3.5 py-2 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="text-white/50 flex h-4 w-4 items-center justify-center">
                          {e.category === "food" ? <Utensils size={13} /> : e.category === "travel" ? <Car size={13} /> : e.category === "shopping" ? <ShoppingBag size={13} /> : <Package size={13} />}
                        </span>
                        <span className="text-white/70 capitalize font-medium">{e.category}</span>
                      </div>
                      <span className="font-semibold text-white/90">{formatMoney(Number(e.amount))}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: AI Smart Insights */}
        <div className={`rounded-[24px] p-6 shadow-sm space-y-4 transition-all duration-300 ease-out ${cardGrayClass}`}>
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
            <div className="flex items-center gap-2">
              <div className={`grid h-8 w-8 place-items-center rounded-lg ${
                isLightTheme ? "bg-[#84cc16]/10 text-[#84cc16]" : "bg-white/10 text-white/90"
              }`}>
                <Zap size={14} />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white/95">Smart Insights</h3>
                <p className="text-[9px] text-white/40">AI-powered tracking engine</p>
              </div>
            </div>
            <div className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase ${
              isLightTheme
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                : "border-white/12 bg-white/5 text-white/80"
            }`}>
              <span>Live</span>
            </div>
          </div>

          <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
            {expenses.length === 0 ? (
              <div className="py-8 text-center text-[10px] text-white/35 border border-dashed border-white/[0.06] rounded-xl">
                Add expenses to activate intelligence engine
              </div>
            ) : (
              dynamicInsights.map((ins, i) => {
                const IconComp = ICON_MAP[ins.iconName] || Zap;
                return (
                  <Motion.div
                    key={ins.type}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.04 }}
                    className={`rounded-xl border px-3.5 py-2.5 ${ins.style.border} ${ins.style.bg}`}
                  >
                    <div className="flex items-start gap-2">
                      <IconComp size={12} className={`shrink-0 mt-0.5 ${ins.style.icon}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-bold text-white/90">{ins.title}</div>
                        <div className={`mt-0.5 text-[10px] leading-relaxed ${ins.style.text}`}>{ins.body}</div>
                      </div>
                    </div>
                  </Motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Quick Add Modal */}
      <Modal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} title="Add Expense">
        <div className="space-y-4 p-1">
          <Input
            label="Amount"
            inputMode="decimal"
            placeholder="e.g. 250"
            value={expenseForm.amount}
            onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))}
          />
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-white/92">Category</span>
            <select
              className="w-full rounded-xl border border-white/12 bg-[#0e1116] px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#7CC6FF]/50 focus:ring-2 focus:ring-[#7CC6FF]/25 cursor-pointer"
              value={expenseForm.category}
              onChange={(e) => setExpenseForm((f) => ({ ...f, category: e.target.value }))}
            >
              {categories.map((c) => (
                <option key={c.key} value={c.key} className="bg-[#090b0e]">{c.label}</option>
              ))}
            </select>
          </label>
          <Input
            label="Note"
            placeholder="Short details..."
            value={expenseForm.note}
            onChange={(e) => setExpenseForm((f) => ({ ...f, note: e.target.value }))}
          />
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setQuickAddOpen(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-normal border border-white/20 hover:border-white/40 bg-transparent hover:bg-white/[0.06] text-white/80 hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-transparent hover:border-white/50 bg-[#111827] text-white transition active:scale-95 cursor-pointer shadow-md"
              onClick={() => {
                const amount = Number(expenseForm.amount);
                if (!amount || Number.isNaN(amount) || amount <= 0) {
                  notify({ type: "error", message: "Invalid amount" });
                  return;
                }
                setQuickAddOpen(false);
                setExpenseForm({ amount: "", category: "food", note: "" });
                notify({ type: "success", message: "Expense added" });
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
              }}
            >
              Add
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
