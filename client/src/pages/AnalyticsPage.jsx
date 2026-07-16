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
  Area,
  AreaChart,
  ReferenceLine,
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
  const [selectedChart, setSelectedChart] = useState("bar");

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

  const theme = useAppStore((s) => s.theme);
  const isLightTheme = theme === "light";

  const cardWhiteClass = isLightTheme
    ? "bg-[#090B0A] border border-[#1A1E1C] hover:border-white/50 hover:ring-1 hover:ring-white/20"
    : "bg-[#1b1b1d] border border-white/[0.05] shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:border-white/12 transition-all duration-300";

  const cardSageClass = isLightTheme
    ? "bg-[#090B0A] border border-[#1A1E1C] hover:border-white/50 hover:ring-1 hover:ring-white/20"
    : "bg-[#1b1b1d] border border-white/[0.05] shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:border-white/12 transition-all duration-300";

  const cardGrayClass = isLightTheme
    ? "bg-[#090B0A] border border-[#1A1E1C] hover:border-white/50 hover:ring-1 hover:ring-white/20"
    : "bg-[#1b1b1d] border border-white/[0.05] shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:border-white/12 transition-all duration-300";

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end border-b-2 border-white/10 pb-4">
        <div>
          <div className={`text-[11px] font-bold uppercase tracking-widest select-none ${
            isLightTheme ? "text-[#84cc16]" : "text-[#EFF2F0]"
          }`}>
            {activeWs?.name || "Personal Finance"} Analytics
          </div>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-white/95 sm:text-4xl">
            Spending Insights
          </h2>
          <p className="mt-1.5 text-sm text-white/40 font-medium">
            Deep statistical breakdown of workspace allocations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-xl border-2 border-white/20 bg-white/5 p-0.5 text-xs text-white/70">
            <button
              type="button"
              onClick={() => setPeriod("weekly")}
              className={`rounded-lg px-2.5 py-1 transition cursor-pointer ${
                period === "weekly" ? "bg-white/15 text-white font-semibold" : "hover:text-white"
              }`}
            >
              Weekly
            </button>
            <button
              type="button"
              onClick={() => setPeriod("monthly")}
              className={`rounded-lg px-2.5 py-1 transition cursor-pointer ${
                period === "monthly" ? "bg-white/15 text-white font-semibold" : "hover:text-white"
              }`}
            >
              Monthly
            </button>
          </div>
        </div>
      </div>

      {/* Top 3 KPI Cards */}
      <div className="grid gap-5 grid-cols-1 md:grid-cols-3">
        {[
          { label: "Total expense", value: money(totalExpense) },
          { label: "Top category", value: topCategory ? topCategory.charAt(0).toUpperCase() + topCategory.slice(1) : "—" },
          {
            label: period === "weekly" ? "vs previous week" : "vs previous period",
            value:
              trendChange.direction === "up"
                ? `▲ ${trendChange.deltaPct}%`
                : trendChange.direction === "down"
                  ? `▼ ${trendChange.deltaPct}%`
                  : "—",
            colorClass: trendChange.direction === "down" ? "text-[#52b147]" : trendChange.direction === "up" ? "text-red-400" : "text-white"
          },
        ].map((x, idx) => {
          const cls = idx === 2 ? cardSageClass : cardWhiteClass;
          return (
            <ScrollReveal key={x.label} delay={0.03 * idx}>
              <div className={`rounded-[24px] p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-[2px] hover:shadow-md cursor-pointer ${cls}`}>
                <div className="text-[11px] uppercase tracking-wider font-semibold text-white/40">{x.label}</div>
                <div className={`mt-2 text-2xl font-bold tracking-tight ${x.colorClass || "text-white"}`}>
                  {loading ? <Skeleton className="h-8 w-24" /> : x.value}
                </div>
              </div>
            </ScrollReveal>
          );
        })}
      </div>

      {/* Grid containing Chart Selector (Left) and Smart Insights (Right) */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Left Column: Dynamic Chart Container */}
        <ScrollReveal delay={0.05}>
          <div className={`rounded-[24px] p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-[2px] hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[470px] ${cardSageClass}`}>
            <div>
              {/* Dropdown Selector Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/[0.08] pb-4 mb-4">
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-semibold text-white/40">Select View</span>
                  <h3 className="text-sm font-bold text-white/90">Chart Visualization</h3>
                </div>
                <div>
                  <select
                    value={selectedChart}
                    onChange={(e) => setSelectedChart(e.target.value)}
                    className="rounded-xl border border-white/20 bg-white/[0.05] px-3 py-1.5 text-xs text-white outline-none hover:bg-white/[0.10] hover:border-white/40 transition cursor-pointer max-w-[220px]"
                  >
                    <option value="pie" className="bg-[#0e1116] text-white">Pie Chart</option>
                    <option value="bar" className="bg-[#0e1116] text-white">Bar Chart (Histogram)</option>
                    <option value="area" className="bg-[#0e1116] text-white">Line Chart</option>
                  </select>
                </div>
              </div>

              {/* Selected Chart Rendering */}
              <div className="relative h-80 w-full mt-4">
                {loading ? (
                  <Skeleton className="h-full w-full rounded-xl" />
                ) : (
                  <AnimatePresence mode="wait">
                    <Motion.div
                      key={selectedChart}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="h-full w-full"
                    >
                      {selectedChart === "bar" && (
                        <div className="h-full w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                              <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                              <XAxis dataKey="category" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} tickLine={false} axisLine={false} className="capitalize" />
                              <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} tickLine={false} axisLine={false} />
                              <Tooltip cursor={{ fill: "transparent" }} content={(props) => <DarkTooltipContent {...props} total={totalExpense} currency={currency} />} />
                              {totalExpense > 0 && (
                                <ReferenceLine 
                                  y={totalExpense / 4} 
                                  stroke={isLightTheme ? "#84cc16" : "#EFF2F0"} 
                                  strokeDasharray="4 4" 
                                  label={{ value: '1 Week Avg.', fill: isLightTheme ? '#84cc16' : '#EFF2F0', fontSize: 10, position: 'top', className: 'font-semibold opacity-75' }} 
                                />
                              )}
                              <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={32}>
                                {categoryData.map((d, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={colors[d.category] || colors.other}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {selectedChart === "area" && (
                        <div className="h-full w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={lineData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                              <defs>
                                <linearGradient id="areaGradient2" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={isLightTheme ? "#84cc16" : "#EFF2F0"} stopOpacity={0.25} />
                                  <stop offset="95%" stopColor={isLightTheme ? "#84cc16" : "#EFF2F0"} stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
                              <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} tickLine={false} axisLine={false} />
                              <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} tickLine={false} axisLine={false} />
                              <Tooltip cursor={{ fill: "transparent" }} content={(props) => <DarkTooltipContent {...props} total={totalExpense} currency={currency} />} />
                              <Area
                                type="monotone"
                                dataKey="amount"
                                stroke={isLightTheme ? "#84cc16" : "#EFF2F0"}
                                strokeWidth={2.5}
                                fillOpacity={1}
                                fill="url(#areaGradient2)"
                                activeDot={{ r: 5, fill: "#ffffff", stroke: isLightTheme ? "#84cc16" : "#EFF2F0", strokeWidth: 2 }}
                                isAnimationActive={true}
                                animationDuration={900}
                                animationEasing="ease-in-out"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {selectedChart === "pie" && (
                        <div className="h-full flex items-center justify-center relative">
                          <div className="h-full w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={categoryData}
                                  dataKey="value"
                                  nameKey="category"
                                  innerRadius={0}
                                  outerRadius={85}
                                  paddingAngle={2}
                                >
                                  {categoryData.map((d, index) => (
                                    <Cell
                                      key={`cell-${index}`}
                                      fill={colors[d.category] || colors.other}
                                      stroke="rgba(255, 255, 255, 0.1)"
                                      strokeWidth={1.5}
                                    />
                                  ))}
                                </Pie>
                                <Tooltip cursor={{ fill: "transparent" }} content={(props) => <DarkTooltipContent {...props} total={totalExpense} currency={currency} />} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                    </Motion.div>
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Right Column: Smart Insights & Comparison Panel */}
        <ScrollReveal delay={0.1}>
          <div className={`rounded-[24px] p-6 shadow-sm flex flex-col justify-between min-h-[470px] ${cardGrayClass}`}>
            <div className="space-y-4">
              {/* Title Header */}
              <div className="border-b-2 border-white/10 pb-4">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-white/40">AI Engine</span>
                <h3 className="text-sm font-bold text-white/95">Smart Insights</h3>
              </div>

              {/* Smart Insights List */}
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              ) : (
                <div className="space-y-2.5">
                  {smartInsights.map((line, idx) => (
                    <div key={idx} className="rounded-xl border-2 border-white/10 bg-white/[0.01] px-4 py-3 text-xs text-white/70 leading-relaxed capitalize">
                      {line}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comparison Trends Section */}
            <div className="mt-4 pt-4 border-t-2 border-white/10">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-white/40 block mb-3">Comparison Trend</span>
              <div className="space-y-2">
                <div className="rounded-xl border-2 border-white/10 bg-white/[0.01] px-4 py-2.5 flex items-center justify-between text-xs">
                  <span className="text-white/50">Workspace top category</span>
                  <span className="font-bold text-white/95 capitalize">{topCategory || "—"}</span>
                </div>
                <div className="rounded-xl border-2 border-white/10 bg-white/[0.01] px-4 py-2.5 flex items-center justify-between text-xs">
                  <span className="text-white/50">Current vs previous period</span>
                  <span className={`font-bold ${
                    trendChange.direction === "up" ? "text-red-400"
                    : trendChange.direction === "down" ? "text-[#52b147]"
                    : "text-white/80"
                  }`}>
                    {trendChange.direction === "up" ? `▲ ${trendChange.deltaPct}% Up`
                    : trendChange.direction === "down" ? `▼ ${trendChange.deltaPct}% Down`
                    : "Stable"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}

