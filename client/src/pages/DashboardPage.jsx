import { useEffect, useMemo, useState } from "react";
import { motion as Motion } from "framer-motion";
import { Plus } from "lucide-react";
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

  // Sync the budgetInput field whenever the active workspace changes
  useEffect(() => {
    setBudgetInput(String(effectiveBudget || ""));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspaceId]);
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
  }, [expenses, now]);

  const previousMonthTotal = useMemo(() => {
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
  }, [expenses, now]);

  const smartInsights = useMemo(() => {
    const cards = [];

    // 1) Spending trend vs previous month
    if (previousMonthTotal > 0) {
      const deltaPct = Math.round(
        ((monthTotals.total - previousMonthTotal) / previousMonthTotal) * 100
      );
      if (deltaPct > 0) {
        cards.push({
          icon: "↑",
          title: "Spending Trend",
          body: `Spending increased by ${Math.abs(deltaPct)}%`,
          tone: "text-red-200",
          accent: "border-red-400/20 bg-red-500/10",
        });
      } else if (deltaPct < 0) {
        cards.push({
          icon: "↓",
          title: "Spending Trend",
          body: `Spending decreased by ${Math.abs(deltaPct)}%`,
          tone: "text-emerald-200",
          accent: "border-emerald-400/20 bg-emerald-500/10",
        });
      } else {
        cards.push({
          icon: "→",
          title: "Spending Trend",
          body: "Spending remained stable vs last month",
          tone: "text-white/80",
          accent: "border-white/10 bg-white/4",
        });
      }
    } else {
      cards.push({
        icon: "→",
        title: "Spending Trend",
        body: "Add more data to compare with previous month",
        tone: "text-white/80",
        accent: "border-white/10 bg-white/4",
      });
    }

    // 2) Top category insight
    const topCategoryEntry = Object.entries(monthTotals.totals).sort(
      (a, b) => b[1] - a[1]
    )[0];
    if (topCategoryEntry && topCategoryEntry[1] > 0) {
      const label = topCategoryEntry[0].charAt(0).toUpperCase() + topCategoryEntry[0].slice(1);
      cards.push({
        icon: "🧠",
        title: "Top Category",
        body: `You spent most on ${label} this month`,
        tone: "text-white/85",
        accent: "border-white/10 bg-white/4",
      });
    }

    // 3) Budget insight
    if (budgetCalc.ratio > 1) {
      cards.push({
        icon: "⚠️",
        title: "Budget Insight",
        body: "Budget exceeded!",
        tone: "text-red-200",
        accent: "border-red-400/20 bg-red-500/10",
      });
    } else if (budgetCalc.ratio >= 0.8) {
      cards.push({
        icon: "⚠️",
        title: "Budget Insight",
        body: "You are close to your budget",
        tone: "text-amber-100",
        accent: "border-amber-300/20 bg-amber-500/10",
      });
    } else {
      cards.push({
        icon: "✓",
        title: "Budget Insight",
        body: "You are within your budget",
        tone: "text-emerald-200",
        accent: "border-emerald-400/20 bg-emerald-500/10",
      });
    }

    return cards;
  }, [monthTotals, previousMonthTotal, budgetCalc]);

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
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/12 ring-1 ring-emerald-400/20">
                    <div className="text-xs font-semibold text-emerald-300">AI</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white/90">Insights</div>
                    <div className="text-[11px] text-white/50">Smart spending tips</div>
                  </div>
                </div>

                <div
                  className={`text-[11px] font-semibold ${
                    budgetCalc.status === "exceeded"
                      ? "text-red-300"
                      : budgetCalc.status === "near"
                        ? "text-amber-200"
                        : "text-white/45"
                  }`}
                >
                  {budgetCalc.status === "exceeded"
                    ? "Action needed"
                    : budgetCalc.status === "near"
                      ? "Watch closely"
                      : "On track"}
                </div>
              </div>

              {loading || error ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="space-y-2">
                  {smartInsights.map((item, i) => (
                    <Motion.div
                      key={`${i}-${item.title}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, delay: i * 0.04 }}
                      className={`rounded-2xl border px-4 py-3 ${item.accent}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-sm">{item.icon}</span>
                        <div>
                          <div className="text-xs font-semibold text-white/85">
                            {item.title}
                          </div>
                          <div className={`mt-0.5 text-xs ${item.tone}`}>
                            {item.body}
                          </div>
                        </div>
                      </div>
                    </Motion.div>
                  ))}

                  {(!insights?.lines || insights.lines.length === 0) && !loading ? (
                    <div className="rounded-2xl border border-white/10 bg-white/4 px-4 py-6 text-xs text-white/55">
                      Add expenses to see insights.
                    </div>
                  ) : null}
                </div>
              )}
            </GlassCard>
          </ScrollReveal>

          <ScrollReveal delay={0.08}>
            <GlassCard className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold text-white/90">Charts</div>
                <div className="text-xs text-white/50">Placeholder</div>
              </div>
              {loading || error ? (
                <Skeleton className="h-56 w-full" />
              ) : (
                <div className="grid h-56 place-items-center rounded-2xl border border-dashed border-white/15 bg-white/4 text-sm text-white/55">
                  Chart area (connect later)
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
            <Button type="button" onClick={async () => {
              const amount = Number(expenseForm.amount);
              if (!amount || Number.isNaN(amount) || amount <= 0) {
                notify({ type: "error", message: "Invalid amount" });
                return;
              }
              const res = await addExpenseOptimistic({
                amount,
                category: expenseForm.category,
                note: expenseForm.note?.trim() || "",
                workspaceId: activeWorkspaceId,
              });
              if (res.ok) {
                notify({ type: "success", message: "Expense added" });
                setExpenseForm({ amount: "", category: "food", note: "" });
                setQuickAddOpen(false);
              } else {
                notify({ type: "error", message: res.message || "Something went wrong" });
              }
            }}>
              Add
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

