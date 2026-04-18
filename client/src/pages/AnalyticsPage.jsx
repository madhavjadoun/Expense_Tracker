import { useMemo, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import GlassCard from "../components/GlassCard";
import ScrollReveal from "../components/ScrollReveal";
import { Skeleton, SkeletonText } from "../components/Skeleton";
import ChartSwitcher from "../components/ChartSwitcher";
import { useAppStore } from "../store/useAppStore";
import { useWorkspaceStore } from "../store/useWorkspaceStore";

function DarkTooltipContent({ active, payload, label, total, currency }) {
  if (!active || !payload || !payload.length) return null;
  const first = payload[0];
  const firstVal = first?.value ?? 0;
  const pct = total ? Math.round((firstVal / total) * 100) : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#020617]/95 px-3 py-2 text-xs text-white/80">
      <div className="font-semibold">
        {first?.name || label || "Category"}
      </div>
      <div className="mt-1 space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="text-[11px] text-white/65">
            {entry.name || entry.dataKey}:{" "}
            {new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: currency || "INR",
              maximumFractionDigits: 0,
            }).format(entry.value ?? 0)}
          </div>
        ))}
      </div>
      {pct ? (
        <div className="text-[11px] text-white/65">Share: {pct}%</div>
      ) : null}
    </div>
  );
}

export default function AnalyticsPage() {
  const loading  = useAppStore((s) => s.loading?.expenses);
  const error    = useAppStore((s) => s.error?.expenses);
  const allExpenses = useAppStore((s) => s.expenses);
  const currency = useAppStore((s) => s.currency);

  // Filter expenses to the active workspace (same as Dashboard & Expenses pages)
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const activeWs = useWorkspaceStore((s) => s.workspaces.find((w) => w.id === s.activeWorkspaceId));
  const expenses = useMemo(
    () => allExpenses.filter((e) => (e.workspaceId ?? "default") === activeWorkspaceId),
    [allExpenses, activeWorkspaceId]
  );

  const [chartType, setChartType] = useState("line");
  const [period, setPeriod]       = useState("weekly");

  function startOfDay(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  // Week starts on Monday.
  function startOfWeekMonday(d) {
    const day = d.getDay(); // 0=Sun..6=Sat
    const diff = (day + 6) % 7;
    const start = new Date(d);
    start.setDate(d.getDate() - diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  function startOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }

  function inRange(dt, start, endExcl) {
    const t = dt.getTime();
    return t >= start.getTime() && t < endExcl.getTime();
  }

  const now = useMemo(() => new Date(), []);

  const currentRange = useMemo(() => {
    if (period === "monthly") {
      const start = startOfMonth(now);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return { start, end };
    }
    const start = startOfWeekMonday(startOfDay(now));
    const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
    return { start, end };
  }, [period, now]);

  const previousRange = useMemo(() => {
    if (period === "monthly") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start, end };
    }
    const end = new Date(currentRange.start);
    const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { start, end };
  }, [period, now, currentRange.start]);

  const expensesInRange = useMemo(() => {
    return (expenses || []).filter((e) => {
      const dt = new Date(e?.date);
      if (Number.isNaN(dt.getTime())) return false;
      return inRange(dt, currentRange.start, currentRange.end);
    });
  }, [expenses, currentRange]);

  const expensesInPreviousRange = useMemo(() => {
    return (expenses || []).filter((e) => {
      const dt = new Date(e?.date);
      if (Number.isNaN(dt.getTime())) return false;
      return inRange(dt, previousRange.start, previousRange.end);
    });
  }, [expenses, previousRange]);

  const categoryData = useMemo(() => {
    const totals = { food: 0, travel: 0, shopping: 0, other: 0 };
    for (const e of expensesInRange) {
      const cat = (e?.category || "other").toLowerCase();
      const amt = Number(e?.amount) || 0;
      if (totals[cat] === undefined) totals.other += amt;
      else totals[cat] += amt;
    }
    return Object.keys(totals).map((k) => ({ category: k, value: totals[k] }));
  }, [expensesInRange]);

  const totalExpense = useMemo(
    () => categoryData.reduce((sum, x) => sum + x.value, 0),
    [categoryData]
  );

  const topCategory = useMemo(() => {
    return [...categoryData].sort((a, b) => b.value - a.value)[0]?.category;
  }, [categoryData]);

  const lineData = useMemo(() => {
    const start = currentRange.start;
    const end = currentRange.end;
    const rows = [];
    const cursor = new Date(start);
    while (cursor < end) {
      const dayStart = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const amount = expensesInRange.reduce((sum, e) => {
        const dt = new Date(e?.date);
        if (Number.isNaN(dt.getTime())) return sum;
        if (!inRange(dt, dayStart, dayEnd)) return sum;
        return sum + (Number(e?.amount) || 0);
      }, 0);
      rows.push({
        name:
          period === "weekly"
            ? dayStart.toLocaleDateString(undefined, { weekday: "short" })
            : dayStart.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        amount,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return rows;
  }, [expensesInRange, currentRange, period]);

  const trendChange = useMemo(() => {
    const prevTotal = expensesInPreviousRange.reduce(
      (sum, e) => sum + (Number(e?.amount) || 0),
      0
    );
    if (!prevTotal) return { deltaPct: 0, direction: "flat", prevTotal };
    const pct = ((totalExpense - prevTotal) / prevTotal) * 100;
    const rounded = Math.round(pct);
    if (rounded > 0) return { deltaPct: rounded, direction: "up", prevTotal };
    if (rounded < 0) return { deltaPct: Math.abs(rounded), direction: "down", prevTotal };
    return { deltaPct: 0, direction: "flat", prevTotal };
  }, [totalExpense, expensesInPreviousRange]);

  const smartInsights = useMemo(() => {
    const lines = [];
    if (topCategory) {
      lines.push(`You spent more on ${topCategory} this ${period === "weekly" ? "week" : "month"}.`);
    }
    if (trendChange.direction === "up") {
      lines.push(`Spending increased by ${trendChange.deltaPct}% vs previous ${period === "weekly" ? "week" : "month"}.`);
    } else if (trendChange.direction === "down") {
      lines.push(`Spending decreased by ${trendChange.deltaPct}% vs previous ${period === "weekly" ? "week" : "month"}.`);
    } else {
      lines.push(`Spending is stable vs previous ${period === "weekly" ? "week" : "month"}.`);
    }
    if (!lines.length) lines.push("Add more expenses to unlock deeper insights.");
    return lines;
  }, [topCategory, trendChange, period]);

  const colors = {
    food: "rgba(34,197,94,.85)", // emerald
    travel: "rgba(59,130,246,.80)", // blue
    shopping: "rgba(148,163,184,.75)", // slate
    other: "rgba(16,185,129,.55)", // emerald-variant
  };

  const money = useMemo(() => {
    return (n) =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(n);
  }, [currency]);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <div className="text-xs text-white/50">
            Analytics
            {activeWs && activeWs.id !== "default" && (
              <span className="ml-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/50">
                {activeWs.name}
              </span>
            )}
          </div>
          <div className="text-xl font-semibold text-white/90">Spending insights</div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-xl border border-white/10 bg-white/5 p-0.5 text-xs text-white/70">
            <button
              type="button"
              onClick={() => setPeriod("weekly")}
              className={`rounded-lg px-2 py-1 ${
                period === "weekly" ? "bg-white/15 text-white" : ""
              }`}
            >
              Weekly
            </button>
            <button
              type="button"
              onClick={() => setPeriod("monthly")}
              className={`rounded-lg px-2 py-1 ${
                period === "monthly" ? "bg-white/15 text-white" : ""
              }`}
            >
              Monthly
            </button>
          </div>
          <ChartSwitcher value={chartType} onChange={setChartType} />
        </div>
      </div>

      <div className="mb-4 grid gap-4 md:grid-cols-3">
        {[
          { label: "Total expense", value: money(totalExpense) },
          { label: "Top category", value: topCategory },
          {
            label:
              period === "weekly" ? "vs previous week" : "vs previous period",
            value:
              trendChange.direction === "up"
                ? `↑ ${trendChange.deltaPct}%`
                : trendChange.direction === "down"
                  ? `↓ ${trendChange.deltaPct}%`
                  : "—",
          },
        ].map((x, idx) => (
          <ScrollReveal key={x.label} delay={0.03 * idx}>
            <GlassCard className="p-5">
              <div className="text-xs text-white/55">{x.label}</div>
              <div className="mt-2 text-lg font-semibold text-white/90">
                {loading ? <Skeleton className="h-5 w-24" /> : x.value}
              </div>
            </GlassCard>
          </ScrollReveal>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ScrollReveal>
          <GlassCard className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-white/90">
                Visualization
              </div>
              <div className="text-xs text-white/45">
                {chartType === "pie"
                  ? "Category breakdown"
                  : chartType === "bar"
                    ? "Category totals"
                    : "Total trend"}
              </div>
            </div>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-40 w-full" />
                <SkeletonText lines={2} />
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
                <div className="text-sm font-semibold text-white/85">
                  Something went wrong
                </div>
                <div className="mt-1 text-xs text-white/55">{error}</div>
              </div>
            ) : (
              <div className="h-64 rounded-2xl border border-white/10 bg-white/4 p-3">
                <AnimatePresence mode="wait">
                  <Motion.div
                    key={chartType}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="h-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === "pie" ? (
                        <PieChart>
                          <Tooltip
                            cursor={{ fill: "transparent" }}
                            content={(props) => (
                              <DarkTooltipContent
                                {...props}
                                total={totalExpense}
                                currency={currency}
                              />
                            )}
                          />
                          <Pie
                            data={categoryData}
                            dataKey="value"
                            nameKey="category"
                            innerRadius={54}
                            outerRadius={86}
                            paddingAngle={2}
                          >
                            {categoryData.map((d) => (
                              <Cell key={d.category} fill={colors[d.category]} />
                            ))}
                          </Pie>
                        </PieChart>
                      ) : chartType === "bar" ? (
                        <BarChart data={categoryData}>
                          <CartesianGrid stroke="rgba(255,255,255,.06)" />
                          <XAxis
                            dataKey="category"
                            tick={{ fill: "rgba(255,255,255,.55)", fontSize: 12 }}
                            axisLine={{ stroke: "rgba(255,255,255,.10)" }}
                            tickLine={{ stroke: "rgba(255,255,255,.10)" }}
                          />
                          <YAxis
                            tick={{ fill: "rgba(255,255,255,.55)", fontSize: 12 }}
                            axisLine={{ stroke: "rgba(255,255,255,.10)" }}
                            tickLine={{ stroke: "rgba(255,255,255,.10)" }}
                          />
                          <Tooltip
                            cursor={{ fill: "transparent" }}
                            content={(props) => (
                              <DarkTooltipContent
                                {...props}
                                total={totalExpense}
                                currency={currency}
                              />
                            )}
                          />
                          <Bar
                            dataKey="value"
                            activeBar={false}
                            radius={[10, 10, 8, 8]}
                            animationDuration={700}
                            animationEasing="ease-out"
                          >
                            {categoryData.map((d) => (
                              <Cell key={d.category} fill={colors[d.category]} />
                            ))}
                          </Bar>
                        </BarChart>
                      ) : (
                        <LineChart data={lineData}>
                          <defs>
                            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="rgba(59,130,246,1)" />
                              <stop offset="55%" stopColor="rgba(99,102,241,.95)" />
                              <stop offset="100%" stopColor="rgba(16,185,129,.95)" />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="rgba(255,255,255,.06)" />
                          <XAxis
                            dataKey="name"
                            tick={{ fill: "rgba(255,255,255,.55)", fontSize: 12 }}
                            axisLine={{ stroke: "rgba(255,255,255,.10)" }}
                            tickLine={{ stroke: "rgba(255,255,255,.10)" }}
                          />
                          <YAxis
                            tick={{ fill: "rgba(255,255,255,.55)", fontSize: 12 }}
                            axisLine={{ stroke: "rgba(255,255,255,.10)" }}
                            tickLine={{ stroke: "rgba(255,255,255,.10)" }}
                          />
                          <Tooltip
                            cursor={{ fill: "transparent" }}
                            content={(props) => (
                              <DarkTooltipContent 
                                {...props} 
                                total={totalExpense} 
                                currency={currency} 
                              />
                            )}
                          />
                          <Line
                            type="monotone"
                            dataKey="amount"
                            name="Daily spend"
                            stroke="url(#lineGradient)"
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 4, fill: "rgba(255,255,255,.95)" }}
                          />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </Motion.div>
                </AnimatePresence>
              </div>
            )}
          </GlassCard>
        </ScrollReveal>

        <ScrollReveal delay={0.05}>
          <GlassCard className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-white/90">
                Smart insights
              </div>
              <div className="text-xs text-white/45">
                {period === "weekly" ? "Weekly view" : "Monthly view"}
              </div>
            </div>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-40 w-full" />
                <SkeletonText lines={2} />
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-white/10 bg-white/4 p-4 text-xs text-white/55">
                Unable to load breakdown.
              </div>
            ) : (
              <div className="space-y-2">
                {smartInsights.map((line, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-white/10 bg-white/4 px-4 py-3 text-sm text-white/80"
                  >
                    {line}
                  </div>
                ))}
                <div className="mt-3 rounded-2xl border border-white/10 bg-white/4 px-4 py-3">
                  <div className="text-xs text-white/55">Top category</div>
                  <div className="mt-1 text-sm font-semibold text-white/90">
                    {topCategory || "—"}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/4 px-4 py-3">
                  <div className="text-xs text-white/55">Current vs previous</div>
                  <div
                    className={`mt-1 text-sm font-semibold ${
                      trendChange.direction === "up"
                        ? "text-red-300"
                        : trendChange.direction === "down"
                          ? "text-emerald-300"
                          : "text-white/85"
                    }`}
                  >
                    {trendChange.direction === "up"
                      ? `↑ ${trendChange.deltaPct}%`
                      : trendChange.direction === "down"
                        ? `↓ ${trendChange.deltaPct}%`
                        : "No change"}
                  </div>
                </div>
              </div>
            )}
          </GlassCard>
        </ScrollReveal>
      </div>
    </div>
  );
}

