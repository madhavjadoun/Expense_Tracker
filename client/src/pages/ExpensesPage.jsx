import { useEffect, useMemo, useState } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import ScrollReveal from "../components/ScrollReveal";
import { Skeleton } from "../components/Skeleton";
import Modal from "../components/Modal";
import Input from "../components/Input";
import Button from "../components/Button";
import { useAppStore } from "../store/useAppStore";
import { useWorkspaceStore } from "../store/useWorkspaceStore";
import { notify } from "../store/useNotificationStore";
import { Plus, Download, Search, SlidersHorizontal, X, Pencil, Trash2, Utensils, Car, ShoppingBag, Coins, Repeat } from "lucide-react";

const categories = [
  { key: "food", label: "Food" },
  { key: "travel", label: "Travel" },
  { key: "shopping", label: "Shopping" },
  { key: "other", label: "Other" },
];

export default function ExpensesPage() {
  const currency = useAppStore((s) => s.currency);
  const formatMoney = useMemo(() => {
    return (n) =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(n);
  }, [currency]);

  const allExpenses = useAppStore((s) => s.expenses);
  const loading = useAppStore((s) => s.loading?.expenses);
  const error = useAppStore((s) => s.error?.expenses);
  const fetchExpenses = useAppStore((s) => s.fetchExpenses);
  const addExpenseOptimistic = useAppStore((s) => s.addExpenseOptimistic);
  const deleteExpenseOptimistic = useAppStore((s) => s.deleteExpenseOptimistic);
  const updateExpenseOptimistic = useAppStore((s) => s.updateExpenseOptimistic);

  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const activeWs = useWorkspaceStore((s) => s.workspaces.find((w) => w.id === s.activeWorkspaceId));
  const expenses = useMemo(
    () => allExpenses.filter((e) => (e.workspaceId ?? "default") === activeWorkspaceId),
    [allExpenses, activeWorkspaceId]
  );

  const [form, setForm] = useState({
    amount: "",
    category: "food",
    note: "",
    isRecurring: false,
    recurringType: "monthly",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDateFilter, setSelectedDateFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [sortOption, setSortOption] = useState("latest");
  const [expandedId, setExpandedId] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editForm, setEditForm] = useState({
    amount: "",
    category: "food",
    note: "",
    date: "",
  });
  const [deleteCandidate, setDeleteCandidate] = useState(null);

  const categoryIcon = {
    food: <Utensils size={14} className="text-white/60" />,
    travel: <Car size={14} className="text-white/60" />,
    shopping: <ShoppingBag size={14} className="text-white/60" />,
    other: <Coins size={14} className="text-white/60" />,
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const total = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );

  const visibleExpenses = useMemo(() => {
    const items = expenses || [];
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    const day = startOfWeek.getDay();
    const diffFromMonday = (day + 6) % 7;
    startOfWeek.setDate(startOfWeek.getDate() - diffFromMonday);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const parsedCustomStart = customStartDate ? new Date(customStartDate) : null;
    const parsedCustomEnd = customEndDate ? new Date(customEndDate) : null;
    if (parsedCustomEnd) parsedCustomEnd.setHours(23, 59, 59, 999);

    return items
      .filter((e) => {
        const note = (e.note || "").toLowerCase();
        const cat = (e.category || "").toLowerCase();
        const q = debouncedSearchQuery.toLowerCase().trim();
        if (q) {
          if (!note.includes(q) && !cat.includes(q)) return false;
        }
        if (selectedCategory !== "all" && e.category !== selectedCategory) return false;
        if (selectedDateFilter !== "all") {
          const d = new Date(e.date);
          if (Number.isNaN(d.getTime())) return false;
          if (selectedDateFilter === "today" && (d < startOfToday || d >= startOfTomorrow)) return false;
          if (selectedDateFilter === "week" && (d < startOfWeek || d >= endOfWeek)) return false;
          if (selectedDateFilter === "month" && (d < startOfMonth || d >= endOfMonth)) return false;
          if (selectedDateFilter === "custom") {
            if (parsedCustomStart && d < parsedCustomStart) return false;
            if (parsedCustomEnd && d > parsedCustomEnd) return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        const da = new Date(a.date).getTime();
        const db = new Date(b.date).getTime();
        if (sortOption === "latest") return db - da;
        if (sortOption === "oldest") return da - db;
        if (sortOption === "highest") return b.amount - a.amount;
        if (sortOption === "lowest") return a.amount - b.amount;
        return 0;
      });
  }, [expenses, debouncedSearchQuery, selectedCategory, selectedDateFilter, customStartDate, customEndDate, sortOption]);

  const hasActiveFilters =
    debouncedSearchQuery.trim() ||
    selectedCategory !== "all" ||
    selectedDateFilter !== "all" ||
    sortOption !== "latest";

  function clearAllFilters() {
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setSelectedCategory("all");
    setSelectedDateFilter("all");
    setCustomStartDate("");
    setCustomEndDate("");
    setSortOption("latest");
  }

  function addExpense() {
    const amount = Number(form.amount);
    if (!amount || Number.isNaN(amount) || amount <= 0) return;
    const successMsg = form.isRecurring ? "Recurring expense added" : "Expense added";
    notify({ type: "success", message: successMsg });
    setForm((f) => ({ ...f, amount: "", note: "", isRecurring: false, recurringType: "monthly" }));
    addExpenseOptimistic({
      amount,
      category: form.category,
      note: form.note?.trim() || "",
      workspaceId: activeWorkspaceId,
      isRecurring: form.isRecurring,
      recurringType: form.isRecurring ? form.recurringType : null,
    }).then((res) => {
      if (!res.ok && !res.limitReached) {
        notify({ type: "error", message: res.message || "Failed to save expense" });
      }
    });
  }

  function deleteExpense(id) {
    notify({ type: "success", message: "Expense deleted" });
    deleteExpenseOptimistic(id).then((res) => {
      if (!res.ok) {
        notify({ type: "error", message: res.message || "Failed to delete" });
      }
    });
  }

  function openEdit(expense) {
    setEditingExpense(expense);
    setEditForm({
      amount: String(expense?.amount || ""),
      category: expense?.category || "food",
      note: expense?.note || "",
      date: expense?.date
        ? new Date(expense.date).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
    });
  }

  async function saveEdit() {
    const amount = Number(editForm.amount);
    if (!amount || Number.isNaN(amount) || amount <= 0) {
      notify({ type: "error", message: "Please enter a valid amount." });
      return;
    }
    if (!editingExpense?.id) return;
    const res = await updateExpenseOptimistic(editingExpense.id, {
      amount,
      category: editForm.category,
      note: editForm.note,
      date: new Date(editForm.date).toISOString(),
    });
    if (res.ok) {
      notify({ type: "success", message: "Expense updated" });
      setEditingExpense(null);
    } else {
      notify({ type: "error", message: res.message || "Something went wrong" });
    }
  }

  function exportToCSV() {
    if (!visibleExpenses || visibleExpenses.length === 0) return;
    const headers = ["Date", "Description", "Amount", "Category"];
    const rows = visibleExpenses.map((exp) => [
      new Date(exp.date).toLocaleDateString(),
      `"${(exp.note || "").replace(/"/g, '""')}"`,
      Number(exp.amount).toFixed(2),
      exp.category,
    ]);
    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "expenses.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const theme = useAppStore((s) => s.theme);
  const isLightTheme = theme === "light";

  const cardBaseLeft = isLightTheme
    ? "rounded-[24px] bg-[#090B0A] border border-[#1A1E1C] shadow-sm transition-all duration-300 ease-out hover:border-white/50 hover:ring-1 hover:ring-white/20"
    : "rounded-[24px] border border-white/[0.05] bg-[#1b1b1d] shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-300 ease-out hover:border-white/12";

  const cardBaseRight = isLightTheme
    ? "rounded-[24px] bg-[#090B0A] border border-[#1A1E1C] shadow-sm transition-all duration-300 ease-out hover:border-white/50 hover:ring-1 hover:ring-white/20"
    : "rounded-[24px] border border-white/[0.05] bg-[#1b1b1d] shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-300 ease-out hover:border-white/12";

  const selectBase = `w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-white/80 outline-none transition cursor-pointer ${
    isLightTheme ? "focus:border-[#84cc16]/40 focus:ring-1 focus:ring-[#84cc16]/20" : "focus:border-white/30 focus:ring-1 focus:ring-white/10"
  }`;
  const inputBase = `w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white/85 placeholder-white/25 outline-none transition ${
    isLightTheme ? "focus:border-[#84cc16]/40 focus:ring-1 focus:ring-[#84cc16]/20" : "focus:border-white/30 focus:ring-1 focus:ring-white/10"
  }`;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">

      {/* Page Header */}
      <Motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex flex-wrap items-start sm:items-center justify-between gap-3 border-b border-white/[0.04] pb-4"
      >
        <div>
          <div className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest ${isLightTheme ? "text-[#84cc16]" : "text-[#EFF2F0]"}` }>
            Expenses
            {activeWs && activeWs.id !== "default" && (
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                isLightTheme
                  ? "border-[#84cc16]/20 bg-[#84cc16]/10 text-[#84cc16]/80"
                  : "border-white/15 bg-white/10 text-white/80"
              }`}>
                {activeWs.name}
              </span>
            )}
          </div>
          <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-white/95">
            All Expenses
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-white/40 font-medium">
            {loading ? "Loading..." : `${expenses.length} total · ${formatMoney(total)} spent`}
          </p>
        </div>
        <button
          type="button"
          onClick={exportToCSV}
          disabled={visibleExpenses.length === 0}
          className={`flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 sm:px-4 py-2 text-xs font-semibold transition disabled:pointer-events-none disabled:opacity-30 shrink-0 ${
            isLightTheme
              ? "text-white/60 hover:border-[#84cc16]/30 hover:bg-[#84cc16]/10 hover:text-[#84cc16]"
              : "text-white/60 hover:border-white/30 hover:bg-white/10 hover:text-white/90"
          }`}
        >
          <Download size={12} />
          <span className="hidden sm:inline">Export CSV</span>
        </button>
      </Motion.div>

      <div className="grid gap-6 lg:grid-cols-3">

        {/* ── Add Expense Card ── */}
        <ScrollReveal>
          <div className={`${cardBaseLeft} p-6`}>
            <div className="flex items-center gap-2 mb-5">
              <div className={`grid h-8 w-8 place-items-center rounded-xl ${
                isLightTheme ? "bg-[#84cc16]/10 text-[#84cc16]" : "bg-white/10 text-[#EFF2F0]"
              }`}>
                <Plus size={15} />
              </div>
              <h3 className="text-sm font-bold text-white/90">Add Expense</h3>
            </div>

            <div className="space-y-4">
              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Amount</label>
                <input
                  className={inputBase}
                  inputMode="decimal"
                  placeholder="e.g. 250"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addExpense()}
                />
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Category</label>
                <select
                  className={selectBase}
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {categories.map((c) => (
                    <option key={c.key} value={c.key} className="bg-[#0e1116]">{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Note */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Note</label>
                <input
                  className={inputBase}
                  placeholder="Short note…"
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                />
              </div>

              {/* Recurring toggle */}
              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 transition hover:bg-white/[0.04]">
                <input
                  type="checkbox"
                  checked={form.isRecurring}
                  onChange={(e) => setForm((f) => ({ ...f, isRecurring: e.target.checked }))}
                  className={`h-3.5 w-3.5 cursor-pointer rounded ${
                    isLightTheme ? "accent-[#84cc16]" : "accent-white"
                  }`}
                />
                <span className="text-xs font-medium text-white/60 flex items-center gap-1.5">
                  <Repeat size={12} className="text-white/45" />
                  Recurring expense
                </span>
              </label>

              {form.isRecurring && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Repeat every</label>
                  <select
                    className={selectBase}
                    value={form.recurringType}
                    onChange={(e) => setForm((f) => ({ ...f, recurringType: e.target.value }))}
                  >
                    <option value="monthly" className="bg-[#0e1116]">Month</option>
                    <option value="weekly" className="bg-[#0e1116]">Week</option>
                  </select>
                </div>
              )}

              <button
                type="button"
                onClick={addExpense}
                className={`w-full rounded-xl py-2.5 text-sm font-bold text-black transition active:scale-[0.98] ${
                  isLightTheme ? "bg-[#84cc16] hover:bg-[#a3e635]" : "bg-[#EFF2F0] hover:bg-white"
                }`}
              >
                Add Expense
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* ── Expenses List Card ── */}
        <ScrollReveal delay={0.05} className="lg:col-span-2">
          <div className={`${cardBaseRight} p-6`}>

            {/* List Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-white/90">Recent Expenses</h3>
                <p className="text-[11px] text-white/40 mt-0.5">{visibleExpenses.length} items</p>
              </div>
            </div>

            {/* Filters */}
            <div className="space-y-3 mb-5">
              {/* Search bar */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                <input
                  className={`w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-9 pr-3 py-2 text-sm text-white/80 placeholder-white/25 outline-none transition ${
                    isLightTheme ? "focus:border-[#84cc16]/40 focus:ring-1 focus:ring-[#84cc16]/20" : "focus:border-white/30 focus:ring-1 focus:ring-white/10"
                  }`}
                  placeholder="Search by note or category…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Filter dropdowns */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-white/35">Category</label>
                  <select className={selectBase} value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                    <option value="all" className="bg-[#0e1116]">All</option>
                    <option value="food" className="bg-[#0e1116]">Food</option>
                    <option value="travel" className="bg-[#0e1116]">Travel</option>
                    <option value="shopping" className="bg-[#0e1116]">Shopping</option>
                    <option value="other" className="bg-[#0e1116]">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-white/35">Date</label>
                  <select className={selectBase} value={selectedDateFilter} onChange={(e) => setSelectedDateFilter(e.target.value)}>
                    <option value="all" className="bg-[#0e1116]">All dates</option>
                    <option value="today" className="bg-[#0e1116]">Today</option>
                    <option value="week" className="bg-[#0e1116]">This week</option>
                    <option value="month" className="bg-[#0e1116]">This month</option>
                    <option value="custom" className="bg-[#0e1116]">Custom range</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-white/35">Sort</label>
                  <select className={selectBase} value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                    <option value="latest" className="bg-[#0e1116]">Latest</option>
                    <option value="oldest" className="bg-[#0e1116]">Oldest</option>
                    <option value="highest" className="bg-[#0e1116]">Highest</option>
                    <option value="lowest" className="bg-[#0e1116]">Lowest</option>
                  </select>
                </div>
              </div>

              {/* Custom date range */}
              {selectedDateFilter === "custom" && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-white/35">From</label>
                    <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className={inputBase} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-white/35">To</label>
                    <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className={inputBase} />
                  </div>
                </div>
              )}

              {/* Active filter chips */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {debouncedSearchQuery.trim() && (
                    <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 text-[10px] text-white/60">
                      "{debouncedSearchQuery.trim()}"
                    </span>
                  )}
                  {selectedCategory !== "all" && (
                    <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 text-[10px] text-white/60 capitalize">
                      {selectedCategory}
                    </span>
                  )}
                  {selectedDateFilter !== "all" && (
                    <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 text-[10px] text-white/60">
                      {selectedDateFilter}
                    </span>
                  )}
                  {sortOption !== "latest" && (
                    <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 text-[10px] text-white/60">
                      {sortOption}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 text-[10px] text-white/50 hover:text-white/80 transition"
                  >
                    <X size={9} /> Clear
                  </button>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-white/[0.04] mb-4" />

            {/* Expense List */}
            <div className="space-y-2">
              {error ? (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-center">
                  <p className="text-sm font-semibold text-red-300">Something went wrong</p>
                  <p className="mt-1 text-xs text-white/40">{error}</p>
                  <button
                    type="button"
                    onClick={fetchExpenses}
                    className="mt-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-xs text-white/60 hover:text-white/90 transition"
                  >
                    Retry
                  </button>
                </div>
              ) : loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                    <Skeleton className="h-3 w-14" />
                  </div>
                ))
              ) : visibleExpenses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/[0.08] py-10 text-center">
                  <p className="text-sm font-medium text-white/50">No expenses found</p>
                  <p className="mt-1 text-xs text-white/30">Try changing or clearing your filters.</p>
                </div>
              ) : (
                <AnimatePresence>
                  {visibleExpenses.map((e) => (
                    <Motion.div
                      key={e.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition hover:border-white/[0.12] hover:bg-white/[0.04]"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center">
                            {categoryIcon[e.category] || <Coins size={14} className="text-white/60" />}
                          </span>
                          <span className="truncate text-sm font-semibold text-white/85">
                            {e.note && e.note.length > 48 && expandedId !== e.id
                              ? `${e.note.slice(0, 48)}…`
                              : e.note || "Expense"}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 pl-6">
                          <span className="text-[11px] text-white/40 capitalize">{e.category}</span>
                          <span className="text-white/20">·</span>
                          <span className="text-[11px] text-white/40">
                            {new Date(e.date).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                          {e.isRecurring && (
                            <span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-semibold flex items-center gap-1 ${
                              isLightTheme
                                ? "border-[#84cc16]/20 bg-[#84cc16]/10 text-[#84cc16]/80"
                                : "border-white/15 bg-white/10 text-white/80"
                            }`}>
                              <Repeat size={9} />
                              {e.recurringType}
                            </span>
                          )}
                          {e.isAutoGenerated && (
                            <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-white/35">
                              auto
                            </span>
                          )}
                        </div>
                        {e.note && e.note.length > 48 && (
                          <button
                            type="button"
                            onClick={() => setExpandedId((prev) => (prev === e.id ? null : e.id))}
                            className="mt-1 pl-6 text-[10px] text-white/40 hover:text-white/70 transition"
                          >
                            {expandedId === e.id ? "Show less" : "Show more"}
                          </button>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-sm font-bold text-white/90 min-w-[72px] text-right">
                          {formatMoney(e.amount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => openEdit(e)}
                          className={`grid h-7 w-7 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/50 transition ${
                            isLightTheme ? "hover:border-[#84cc16]/30 hover:bg-[#84cc16]/10 hover:text-[#84cc16]" : "hover:border-white/30 hover:bg-white/10 hover:text-white/90"
                          }`}
                        >
                          <Pencil size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteCandidate(e)}
                          className="grid h-7 w-7 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-white/50 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </Motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* ── Edit Modal ── */}
      <Modal
        open={Boolean(editingExpense)}
        onClose={() => setEditingExpense(null)}
        title="Edit expense"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={(e) => { e.preventDefault(); setEditingExpense(null); }}>Cancel</Button>
            <Button type="button" onClick={(e) => { e.preventDefault(); saveEdit(); }}>Save</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input label="Amount" inputMode="decimal" value={editForm.amount} onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))} />
          <label className="block space-y-1">
            <span className="text-xs font-medium text-white/70">Category</span>
            <select
              className={`w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition ${
                isLightTheme ? "focus:border-[#84cc16]/35 focus:ring-2 focus:ring-[#84cc16]/15" : "focus:border-white/30 focus:ring-1 focus:ring-white/10"
              }`}
              value={editForm.category}
              onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
            >
              {categories.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </label>
          <Input label="Date" type="date" value={editForm.date} onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))} />
          <label className="block space-y-1">
            <span className="text-xs font-medium text-white/70">Note</span>
            <textarea
              className={`min-h-24 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition ${
                isLightTheme ? "focus:border-[#84cc16]/35 focus:ring-2 focus:ring-[#84cc16]/15" : "focus:border-white/30 focus:ring-1 focus:ring-white/10"
              }`}
              value={editForm.note}
              onChange={(e) => setEditForm((f) => ({ ...f, note: e.target.value }))}
            />
          </label>
        </div>
      </Modal>

      {/* ── Delete Confirm Modal ── */}
      <Modal
        open={Boolean(deleteCandidate)}
        onClose={() => setDeleteCandidate(null)}
        title="Delete expense"
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={(e) => { e.preventDefault(); setDeleteCandidate(null); }}>Cancel</Button>
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                const idToDelete = deleteCandidate?.id;
                if (!idToDelete) return;
                setDeleteCandidate(null);
                deleteExpense(idToDelete);
              }}
            >
              Confirm
            </Button>
          </div>
        }
      >
        <div className="text-sm text-white/70">
          Are you sure you want to delete this expense?
        </div>
      </Modal>
    </div>
  );
}
