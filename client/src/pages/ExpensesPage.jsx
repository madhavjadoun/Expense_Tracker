import { useEffect, useMemo, useState } from "react";
import { motion as Motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import GlassCard from "../components/GlassCard";
import ScrollReveal from "../components/ScrollReveal";
import Input from "../components/Input";
import Button from "../components/Button";
import { Skeleton } from "../components/Skeleton";
import Modal from "../components/Modal";
import { useAppStore } from "../store/useAppStore";
import { notify } from "../store/useNotificationStore";

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

  const location = useLocation();
  const user = useAppStore((s) => s.user);
  const expenses = useAppStore((s) => s.expenses);
  const loading = useAppStore((s) => s.loading?.expenses);
  const error = useAppStore((s) => s.error?.expenses);
  const fetchExpenses = useAppStore((s) => s.fetchExpenses);
  const addExpenseOptimistic = useAppStore((s) => s.addExpenseOptimistic);
  const deleteExpenseOptimistic = useAppStore((s) => s.deleteExpenseOptimistic);
  const updateExpenseOptimistic = useAppStore((s) => s.updateExpenseOptimistic);
  const [form, setForm] = useState({
    amount: "",
    category: "food",
    note: "",
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
    food: "🍔",
    travel: "🚗",
    shopping: "🛍️",
    other: "💰",
  };

  useEffect(() => {
    // Refresh when switching accounts or entering the route.
    if (location.pathname === "/expenses" && user?.uid) {
      fetchExpenses();
    }
  }, [fetchExpenses, location.pathname, user?.uid]);

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
    const day = startOfWeek.getDay(); // 0 Sun, 1 Mon...
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
          const matchesNote = note.includes(q);
          const matchesCategory = cat.includes(q);
          if (!matchesNote && !matchesCategory) return false;
        }
        if (selectedCategory !== "all" && e.category !== selectedCategory) {
          return false;
        }
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
  }, [
    expenses,
    debouncedSearchQuery,
    selectedCategory,
    selectedDateFilter,
    customStartDate,
    customEndDate,
    sortOption,
  ]);

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

  async function addExpense() {
    const amount = Number(form.amount);
    if (!amount || Number.isNaN(amount) || amount <= 0) return;



    const res = await addExpenseOptimistic({
      amount,
      category: form.category,
      note: form.note?.trim() || "",
    });

    if (res.ok) {

      notify({ type: "success", message: "Expense added" });
      setForm((f) => ({ ...f, amount: "", note: "" }));
    } else {
      console.error("Failed to add expense:", res.message);
      notify({ type: "error", message: res.message || "Something went wrong" });
    }
  }

  async function deleteExpense(id) {
    const res = await deleteExpenseOptimistic(id);
    if (res.ok) {
      notify({ type: "success", message: "Expense deleted" });
    } else {
      notify({ type: "error", message: res.message || "Something went wrong" });
    }
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

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <div className="text-xs text-white/50">Expenses</div>
          <div className="text-xl font-semibold text-white/90">
            All expenses
          </div>
        </div>
        <div className="text-sm font-semibold text-white/85">
          {loading ? "—" : formatMoney(total)}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ScrollReveal>
          <GlassCard className="p-5">
            <div className="mb-3 text-sm font-semibold text-white/90">
              Add expense
            </div>
            <div className="grid gap-3">
              <Input
                label="Amount"
                inputMode="decimal"
                placeholder="e.g. 24"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
              />

              <label className="block space-y-1">
                <span className="text-xs font-medium text-white/70">
                  Category
                </span>
                <select
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/35 focus:ring-2 focus:ring-emerald-400/15"
                  value={form.category}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, category: e.target.value }))
                  }
                >
                  {categories.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>

              <Input
                label="Note"
                placeholder="Short note…"
                value={form.note}
                onChange={(e) =>
                  setForm((f) => ({ ...f, note: e.target.value }))
                }
              />

              <Button type="button" onClick={(e) => { e.preventDefault(); addExpense(); }}>Add</Button>
            </div>
          </GlassCard>
        </ScrollReveal>

        <ScrollReveal delay={0.05} className="lg:col-span-2">
          <GlassCard className="p-5">
            <div className="mb-4 space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm font-semibold text-white/90">
                  Recent
                </div>
                <div className="text-xs text-white/45">
                  {visibleExpenses.length} items
                </div>
              </div>

              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <div className="flex-1">
                  <Input
                    label="Search"
                    placeholder="Search by note or category…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="grid flex-1 gap-2 sm:grid-cols-3">
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-white/70">
                      Category
                    </span>
                    <select
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-emerald-400/35 focus:ring-2 focus:ring-emerald-400/15"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      <option value="all">All</option>
                      <option value="food">Food</option>
                      <option value="travel">Travel</option>
                      <option value="shopping">Shopping</option>
                      <option value="other">Other</option>
                    </select>
                  </label>

                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-white/70">
                      Date
                    </span>
                    <select
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-emerald-400/35 focus:ring-2 focus:ring-emerald-400/15"
                      value={selectedDateFilter}
                      onChange={(e) => setSelectedDateFilter(e.target.value)}
                    >
                      <option value="all">All dates</option>
                      <option value="today">Today</option>
                      <option value="week">This week</option>
                      <option value="month">This month</option>
                      <option value="custom">Custom range</option>
                    </select>
                  </label>

                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-white/70">
                      Sort
                    </span>
                    <select
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-emerald-400/35 focus:ring-2 focus:ring-emerald-400/15"
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value)}
                    >
                      <option value="latest">Latest</option>
                      <option value="oldest">Oldest</option>
                      <option value="highest">Highest amount</option>
                      <option value="lowest">Lowest amount</option>
                    </select>
                  </label>
                </div>
              </div>

              {selectedDateFilter === "custom" ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-white/70">From</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-emerald-400/35 focus:ring-2 focus:ring-emerald-400/15"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-white/70">To</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-emerald-400/35 focus:ring-2 focus:ring-emerald-400/15"
                    />
                  </label>
                </div>
              ) : null}

              {hasActiveFilters ? (
                <div className="flex flex-wrap items-center gap-2">
                  {debouncedSearchQuery.trim() ? (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/75">
                      Search: {debouncedSearchQuery.trim()}
                    </span>
                  ) : null}
                  {selectedCategory !== "all" ? (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/75">
                      Category: {selectedCategory}
                    </span>
                  ) : null}
                  {selectedDateFilter !== "all" ? (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/75">
                      Date: {selectedDateFilter}
                    </span>
                  ) : null}
                  {sortOption !== "latest" ? (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/75">
                      Sort: {sortOption}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:bg-white/7 hover:text-white/90"
                  >
                    Clear all
                  </button>
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              {error ? (
                <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
                  <div className="text-sm font-semibold text-white/85">
                    Something went wrong
                  </div>
                  <div className="mt-1 text-xs text-white/55">{error}</div>
                  <div className="mt-3">
                    <Button type="button" variant="subtle" onClick={(e) => { e.preventDefault(); fetchExpenses(); }}>
                      Retry
                    </Button>
                  </div>
                </div>
              ) : null}

              {loading
                ? Array.from({ length: 7 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/4 px-4 py-3"
                    >
                      <div className="min-w-0 flex-1 space-y-2">
                        <Skeleton className="h-3 w-2/3" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                      <Skeleton className="h-3 w-16" />
                    </div>
                  ))
                : visibleExpenses.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/4 px-4 py-6 text-center text-xs text-white/55">
                      <div className="font-medium text-white/75">No expenses found</div>
                      <div className="mt-1">Try changing or clearing your filters.</div>
                    </div>
                  ) : (
                    visibleExpenses.map((e) => (
                    <Motion.div
                      key={e.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/4 px-4 py-3 transition hover:border-white/20 hover:bg-white/6"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-white/85">
                          {e.note && e.note.length > 48 && expandedId !== e.id
                            ? `${e.note.slice(0, 48)}...`
                            : e.note || "Expense"}
                        </div>
                        <div className="mt-0.5 text-xs text-white/50">
                          {categoryIcon[e.category] || "💰"} {e.category} •{" "}
                          {new Date(e.date).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "2-digit",
                          })}
                        </div>
                        {e.note && e.note.length > 48 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId((prev) => (prev === e.id ? null : e.id))
                            }
                            className="mt-1 text-[11px] text-white/60 underline-offset-2 hover:text-white/85 hover:underline"
                          >
                            {expandedId === e.id ? "Show less" : "Show more"}
                          </button>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <div className="min-w-[90px] text-right text-sm font-semibold text-white">
                          {formatMoney(e.amount)}
                        </div>
                        <button
                          type="button"
                          onClick={() => openEdit(e)}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/7 hover:text-white/90"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteCandidate(e)}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/7 hover:text-white/90"
                        >
                          Delete
                        </button>
                      </div>
                    </Motion.div>
                  )))}
            </div>
          </GlassCard>
        </ScrollReveal>
      </div>

      <Modal
        open={Boolean(editingExpense)}
        onClose={() => setEditingExpense(null)}
        title="Edit expense"
      >
        <div className="space-y-3">
          <Input
            label="Amount"
            inputMode="decimal"
            value={editForm.amount}
            onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
          />
          <label className="block space-y-1">
            <span className="text-xs font-medium text-white/70">Category</span>
            <select
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/35 focus:ring-2 focus:ring-emerald-400/15"
              value={editForm.category}
              onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
            >
              {categories.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <Input
            label="Date"
            type="date"
            value={editForm.date}
            onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
          />
          <label className="block space-y-1">
            <span className="text-xs font-medium text-white/70">Note</span>
            <textarea
              className="min-h-24 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-400/35 focus:ring-2 focus:ring-emerald-400/15"
              value={editForm.note}
              onChange={(e) => setEditForm((f) => ({ ...f, note: e.target.value }))}
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={(e) => { e.preventDefault(); setEditingExpense(null); }}>
              Cancel
            </Button>
            <Button type="button" onClick={(e) => { e.preventDefault(); saveEdit(); }}>Save</Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(deleteCandidate)}
        onClose={() => setDeleteCandidate(null)}
        title="Delete expense"
      >
        <div className="space-y-3">
          <div className="text-sm text-white/70">
            Are you sure you want to delete this expense?
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={(e) => { e.preventDefault(); setDeleteCandidate(null); }}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={async (e) => {
                e.preventDefault();
                if (!deleteCandidate?.id) return;
                await deleteExpense(deleteCandidate.id);
                setDeleteCandidate(null);
              }}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

