/**
 * SplitPage — Splitwise-style split expense tracker.
 *
 * Layout:
 *   Left column  — Members panel (per workspace)
 *   Right column — Tabs: Balances | Expenses | History
 *
 * Key design decisions:
 *   • All balance math is done in the store helpers (computeNetBalances,
 *     simplifyDebts) — the page is purely presentational.
 *   • "Settle" records a settlement entry; it does NOT mutate split.share.
 *   • Deleting a history entry removes the settlement → balances adjust.
 *   • All values < ₹0.01 are hidden and buttons are disabled.
 */

import { useState, useMemo } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import {
  Users, Plus, Trash2, X, CheckCircle2, ArrowRight,
  SplitSquareVertical, TrendingUp, TrendingDown, UserPlus,
  ReceiptText, Handshake, IndianRupee, AlertCircle, History,
} from "lucide-react";
import GlassCard from "../components/GlassCard";
import ScrollReveal from "../components/ScrollReveal";
import Modal from "../components/Modal";
import { useWorkspaceStore } from "../store/useWorkspaceStore";
import { useAppStore } from "../store/useAppStore";
import {
  useSplitStore,
  computeNetBalances,
  simplifyDebts,
  r2,
} from "../store/useSplitStore";

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

function useFmt() {
  const currency = useAppStore((s) => s.currency);
  return (n) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
}

function formatDateTime(iso) {
  const d = new Date(iso);
  const day   = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year  = d.getFullYear();
  let hours   = d.getHours();
  const mins  = String(d.getMinutes()).padStart(2, "0");
  const ampm  = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${day}/${month}/${year} • ${hours}:${mins} ${ampm}`;
}

const CATEGORIES = ["food", "travel", "shopping", "entertainment", "utilities", "other"];

function hue(name) {
  return name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = "sm" }) {
  const h = hue(name);
  const cls = size === "lg" ? "h-10 w-10 text-sm" : "h-8 w-8 text-xs";
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-full font-bold text-white/90 ${cls}`}
      style={{ background: `hsl(${h},42%,30%)`, boxShadow: `0 0 0 2px hsl(${h},55%,55%,0.22)` }}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

// ─── Balance chip ─────────────────────────────────────────────────────────────
function BalChip({ value, fmt }) {
  if (Math.abs(value) < 0.01) {
    return (
      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-white/40">
        Settled
      </span>
    );
  }
  const pos = value > 0;
  return (
    <span className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tabular-nums ${
      pos ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-300"
          : "border-red-400/25 bg-red-500/10 text-red-300"
    }`}>
      {pos ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {pos ? "+" : ""}{fmt(value)}
    </span>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-widest text-white/35">
      {children}
    </div>
  );
}

// ─── Add Expense Modal ────────────────────────────────────────────────────────
function AddExpenseModal({ open, onClose, members, workspaceId }) {
  const addSplitExpense = useSplitStore((s) => s.addSplitExpense);
  const fmt = useFmt();

  const INIT = {
    description: "", totalAmount: "", category: "food",
    participantIds: [],
    paidBy: {}, // memberId → amount string
  };
  const [form, setForm] = useState(INIT);
  const [error, setError] = useState("");

  function reset() { setForm(INIT); setError(""); }
  function handleClose() { reset(); onClose(); }

  function toggleParticipant(id) {
    setForm((f) => {
      const next = f.participantIds.includes(id)
        ? f.participantIds.filter((x) => x !== id)
        : [...f.participantIds, id];
      return { ...f, participantIds: next };
    });
  }

  function setPaid(id, val) {
    setForm((f) => ({ ...f, paidBy: { ...f.paidBy, [id]: val } }));
  }

  function distributeEqually() {
    const total = Number(form.totalAmount);
    if (!total || !form.participantIds.length) return;
    const each = r2(total / form.participantIds.length);
    const next = {};
    form.participantIds.forEach((id) => { next[id] = String(each); });
    setForm((f) => ({ ...f, paidBy: next }));
  }

  function handleSubmit() {
    const total = Number(form.totalAmount);
    if (!total || total <= 0)            { setError("Enter a valid total amount."); return; }
    if (!form.participantIds.length)     { setError("Select at least one participant."); return; }

    const paidSum = form.participantIds.reduce(
      (a, id) => a + (Number(form.paidBy[id]) || 0), 0
    );
    if (Math.abs(paidSum - total) > 0.5) {
      setError(`Payments must sum to ${fmt(total)}. Currently ${fmt(paidSum)}.`);
      return;
    }

    const paidBy = form.participantIds
      .map((id) => ({ memberId: id, amount: Number(form.paidBy[id]) || 0 }))
      .filter((p) => p.amount > 0);

    addSplitExpense({
      workspaceId,
      description:    form.description,
      totalAmount:    total,
      category:       form.category,
      participantIds: form.participantIds,
      paidBy,
    });
    handleClose();
  }

  const totalNum = Number(form.totalAmount) || 0;
  const perPerson = form.participantIds.length > 0 && totalNum > 0
    ? r2(totalNum / form.participantIds.length)
    : 0;

  // Live paid-vs-total status
  const paidSum = form.participantIds.reduce(
    (a, id) => a + (Number(form.paidBy[id]) || 0), 0
  );
  const paidDiff = r2(paidSum - totalNum);
  const paidOk = Math.abs(paidDiff) < 0.01;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Split Expense"
      maxWidth="max-w-lg"
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={handleClose}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/8">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit}
            className="rounded-xl bg-violet-500/85 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 active:scale-95">
            Add Expense
          </button>
        </div>
      }
    >
      <div className="space-y-4">

        {/* ── Description + Amount + Category ── */}
        <input
          type="text"
          placeholder="What was this for?"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-violet-400/35 focus:ring-2 focus:ring-violet-400/12"
        />

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-[11px] font-medium text-white/50">Total Amount</span>
            <div className="relative">
              <IndianRupee size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="number" min={0} placeholder="0"
                value={form.totalAmount}
                onChange={(e) => setForm((f) => ({ ...f, totalAmount: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-8 pr-3 py-2.5 text-sm text-white placeholder-white/30 outline-none transition focus:border-violet-400/35"
              />
            </div>
          </label>
          <label className="block space-y-1">
            <span className="text-[11px] font-medium text-white/50">Category</span>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-[#0d1224] px-3 py-2.5 text-sm text-white outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </label>
        </div>

        {/* ── Participants ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <SectionLabel>Split Between</SectionLabel>
            {perPerson > 0 && (
              <span className="text-[11px] text-violet-300">{fmt(perPerson)} / person</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => {
              const sel = form.participantIds.includes(m.id);
              return (
                <button key={m.id} type="button" onClick={() => toggleParticipant(m.id)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition active:scale-95 ${
                    sel
                      ? "border-violet-400/35 bg-violet-500/15 text-violet-200"
                      : "border-white/10 bg-white/5 text-white/55 hover:bg-white/8"
                  }`}>
                  <Avatar name={m.name} size="xs" />
                  {m.name}
                  {sel && <CheckCircle2 size={11} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Who paid ── */}
        <AnimatePresence>
          {form.participantIds.length > 0 && (
            <Motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <SectionLabel>Who Paid</SectionLabel>
                  <button type="button" onClick={distributeEqually}
                    className="text-[11px] font-medium text-violet-400 hover:underline">
                    Distribute equally
                  </button>
                </div>
                <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.025] p-3">
                  {form.participantIds.map((id) => {
                    const m = members.find((m) => m.id === id);
                    return (
                      <div key={id} className="flex items-center gap-3">
                        <Avatar name={m?.name ?? "?"} />
                        <span className="min-w-[72px] text-xs font-medium text-white/80">{m?.name}</span>
                        <div className="relative flex-1">
                          <IndianRupee size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/35" />
                          <input
                            type="number" min={0} placeholder="0"
                            value={form.paidBy[id] ?? ""}
                            onChange={(e) => setPaid(id, e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-white/5 pl-7 pr-3 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:border-violet-400/35"
                          />
                        </div>
                      </div>
                    );
                  })}
                  {/* Paid total vs required */}
                  {totalNum > 0 && (
                    <div className={`flex justify-between rounded-xl border px-3 py-2 text-xs font-medium ${
                      paidOk
                        ? "border-emerald-400/18 bg-emerald-500/8 text-emerald-300"
                        : "border-amber-400/18 bg-amber-500/8 text-amber-300"
                    }`}>
                      <span>Payments entered</span>
                      <span className="tabular-nums">{fmt(paidSum)} / {fmt(totalNum)}</span>
                    </div>
                  )}
                </div>
              </div>
            </Motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-500/8 px-3 py-2 text-xs text-red-300">
            <AlertCircle size={12} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── Settle Modal ─────────────────────────────────────────────────────────────
function SettleModal({ open, onClose, txn, members, workspaceId }) {
  const recordSettlement = useSplitStore((s) => s.recordSettlement);
  const fmt = useFmt();
  const [note, setNote] = useState("");

  const from = members.find((m) => m.id === txn?.from);
  const to   = members.find((m) => m.id === txn?.to);

  function handleConfirm() {
    if (!txn || txn.amount <= 0.01) return;
    recordSettlement({ workspaceId, from: txn.from, to: txn.to, amount: txn.amount, note });
    setNote("");
    onClose();
  }

  if (!txn || !from || !to) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Settle Up"
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/8">
            Cancel
          </button>
          <button type="button" onClick={handleConfirm}
            className="flex items-center gap-2 rounded-xl bg-emerald-500/85 px-4 py-2 text-sm font-medium text-emerald-950 transition hover:bg-emerald-500 active:scale-95">
            <CheckCircle2 size={14} />
            Confirm
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Who → whom + amount */}
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/4 px-4 py-4">
          <div className="flex items-center gap-3">
            <Avatar name={from.name} size="lg" />
            <div>
              <div className="text-sm font-semibold text-white/90">{from.name}</div>
              <div className="text-xs text-red-300">owes</div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="text-base font-bold text-emerald-300">{fmt(txn.amount)}</div>
            <ArrowRight size={18} className="text-white/30" />
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-semibold text-white/90">{to.name}</div>
              <div className="text-xs text-emerald-300">receives</div>
            </div>
            <Avatar name={to.name} size="lg" />
          </div>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-white/50">Note (optional)</span>
          <input
            type="text"
            placeholder="e.g. Paid via UPI…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-emerald-400/35 focus:ring-2 focus:ring-emerald-400/12"
          />
        </label>
      </div>
    </Modal>
  );
}

// ─── Debt Row ─────────────────────────────────────────────────────────────────
function DebtRow({ txn, members, fmt, onSettle }) {
  const from = members.find((m) => m.id === txn.from);
  const to   = members.find((m) => m.id === txn.to);
  if (!from || !to || txn.amount <= 0.01) return null;
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3 transition hover:border-white/18 hover:bg-white/[0.04]">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar name={from.name} />
        <div className="min-w-0">
          <div className="text-xs font-semibold text-white/85 truncate">{from.name}</div>
          <div className="text-[10px] text-red-300">owes</div>
        </div>
        <ArrowRight size={14} className="shrink-0 text-white/25" />
        <Avatar name={to.name} />
        <div className="min-w-0">
          <div className="text-xs font-semibold text-white/85 truncate">{to.name}</div>
          <div className="text-[10px] text-emerald-300">receives</div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-sm font-bold text-amber-300 tabular-nums">{fmt(txn.amount)}</span>
        <button
          type="button"
          onClick={() => onSettle(txn)}
          disabled={txn.amount <= 0.01}
          className="flex items-center gap-1.5 rounded-xl border border-emerald-400/22 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/18 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
        >
          <Handshake size={12} />
          Settle
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SplitPage() {
  const fmt = useFmt();

  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const activeWs          = useWorkspaceStore((s) => s.workspaces.find((w) => w.id === s.activeWorkspaceId));

  const allMembers    = useSplitStore((s) => s.members);
  const splitExpenses = useSplitStore((s) => s.splitExpenses);
  const settlements   = useSplitStore((s) => s.settlements);
  const addMember     = useSplitStore((s) => s.addMember);
  const removeMember  = useSplitStore((s) => s.removeMember);
  const deleteExpense = useSplitStore((s) => s.deleteExpense);
  const deleteSettlement = useSplitStore((s) => s.deleteSettlement);

  const members   = allMembers[activeWorkspaceId] ?? [];
  const wsExpenses = useMemo(
    () => splitExpenses.filter((e) => e.workspaceId === activeWorkspaceId),
    [splitExpenses, activeWorkspaceId]
  );
  const wsSettlements = useMemo(
    () => settlements.filter((s) => s.workspaceId === activeWorkspaceId && !s.deleted),
    [settlements, activeWorkspaceId]
  );

  // Net balances and settlement plan
  const netBalances = useMemo(
    () => computeNetBalances(splitExpenses, settlements, activeWorkspaceId),
    [splitExpenses, settlements, activeWorkspaceId]
  );
  const debts = useMemo(() => simplifyDebts(netBalances), [netBalances]);

  // Summary totals
  const totalOwed   = Math.abs(Object.values(netBalances).filter((v) => v < -0.01).reduce((a, b) => a + b, 0));
  const totalCredit = Object.values(netBalances).filter((v) => v > 0.01).reduce((a, b) => a + b, 0);

  // UI state
  const [newMemberName, setNewMemberName] = useState("");
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [settleTarget, setSettleTarget]     = useState(null);
  const [activeTab, setActiveTab]           = useState("balances");

  function handleAddMember() {
    if (!newMemberName.trim()) return;
    addMember(activeWorkspaceId, newMemberName.trim());
    setNewMemberName("");
  }

  const tabs = [
    { id: "balances",  label: "Balances",  icon: Handshake },
    { id: "expenses",  label: "Expenses",  icon: ReceiptText },
    { id: "history",   label: "History",   icon: History },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl">

      {/* ── Header ── */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-white/45">
            <SplitSquareVertical size={13} className="text-violet-400" />
            Split
            {activeWs && (
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/40">
                {activeWs.name}
              </span>
            )}
          </div>
          <div className="text-xl font-semibold text-white/90">Expense Splitting</div>
          <div className="text-xs text-white/40 mt-0.5">Manage shared expenses easily</div>
        </div>
        <button
          type="button"
          onClick={() => setAddExpenseOpen(true)}
          disabled={members.length < 2}
          title={members.length < 2 ? "Add at least 2 members first" : ""}
          className="flex items-center gap-2 rounded-2xl border border-violet-400/28 bg-violet-500/12 px-4 py-2.5 text-sm font-medium text-violet-300 transition hover:bg-violet-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-35"
        >
          <Plus size={15} />
          Add Split Expense
        </button>
      </div>

      {/* ── Summary cards ── */}
      {members.length >= 2 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <GlassCard className="flex items-center gap-4 p-5">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-500/12">
              <TrendingDown size={20} className="text-red-300" />
            </div>
            <div>
              <div className="text-xs text-white/45">Outstanding debt</div>
              <div className="mt-0.5 text-lg font-bold text-red-300">{fmt(totalOwed)}</div>
            </div>
          </GlassCard>
          <GlassCard className="flex items-center gap-4 p-5">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-500/12">
              <TrendingUp size={20} className="text-emerald-300" />
            </div>
            <div>
              <div className="text-xs text-white/45">Outstanding credit</div>
              <div className="mt-0.5 text-lg font-bold text-emerald-300">{fmt(totalCredit)}</div>
            </div>
          </GlassCard>
          <GlassCard className="flex items-center gap-4 p-5">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-500/12">
              <Handshake size={20} className="text-amber-300" />
            </div>
            <div>
              <div className="text-xs text-white/45">Pending settlements</div>
              <div className="mt-0.5 text-lg font-bold text-amber-300">{debts.length}</div>
            </div>
          </GlassCard>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">

        {/* ── Members panel ── */}
        <ScrollReveal>
          <GlassCard className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
                <Users size={15} className="text-violet-400" />
                Members
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/40">
                {members.length}
              </span>
            </div>

            {/* Add member */}
            <div className="mb-4 flex gap-2">
              <input
                type="text"
                placeholder="Add member name…"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
                maxLength={32}
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/30 outline-none transition focus:border-violet-400/35 focus:ring-2 focus:ring-violet-400/10"
              />
              <button
                type="button"
                onClick={handleAddMember}
                disabled={!newMemberName.trim()}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-500/85 text-white transition hover:bg-violet-500 disabled:pointer-events-none disabled:opacity-40 active:scale-95"
              >
                <UserPlus size={13} />
              </button>
            </div>

            {members.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/12 px-3 py-5 text-center text-xs text-white/35">
                Add at least 2 members to start splitting expenses
              </div>
            ) : (
              <AnimatePresence>
                <div className="space-y-1">
                  {members.map((m) => {
                    const bal = netBalances[m.id] ?? 0;
                    return (
                      <Motion.div
                        key={m.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.15 }}
                        className="group flex items-center justify-between gap-2 rounded-xl px-2 py-2 hover:bg-white/4"
                      >
                        <div className="flex items-center gap-2.5">
                          <Avatar name={m.name} />
                          <span className="text-xs font-medium text-white/85">{m.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BalChip value={bal} fmt={fmt} />
                          <button
                            type="button"
                            onClick={() => removeMember(activeWorkspaceId, m.id)}
                            className="hidden shrink-0 rounded-lg p-1 text-white/25 transition hover:bg-red-500/10 hover:text-red-400 group-hover:block"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </Motion.div>
                    );
                  })}
                </div>
              </AnimatePresence>
            )}
          </GlassCard>
        </ScrollReveal>

        {/* ── Right panel (tabs) ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Tab bar */}
          <div className="flex rounded-2xl border border-white/10 bg-white/4 p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition ${
                  activeTab === t.id
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-white/45 hover:text-white/70"
                }`}
              >
                <t.icon size={12} />
                {t.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* ─ Balances tab ─ */}
            {activeTab === "balances" && (
              <Motion.div key="balances"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                <GlassCard className="p-5">
                  <div className="mb-4 text-sm font-semibold text-white/90">Settlement Plan</div>
                  {members.length < 2 ? (
                    <div className="rounded-xl border border-dashed border-white/12 px-4 py-8 text-center text-xs text-white/35">
                      Add at least 2 members and create a split expense to see balances.
                    </div>
                  ) : debts.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-400/15 bg-emerald-500/8 px-4 py-8 text-center">
                      <CheckCircle2 size={30} className="text-emerald-400" />
                      <div className="text-sm font-semibold text-emerald-300">All settled up!</div>
                      <div className="text-xs text-white/40">No outstanding balances.</div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {debts.map((d, i) => (
                        <DebtRow key={i} txn={d} members={members} fmt={fmt} onSettle={setSettleTarget} />
                      ))}
                    </div>
                  )}
                </GlassCard>
              </Motion.div>
            )}

            {/* ─ Expenses tab ─ */}
            {activeTab === "expenses" && (
              <Motion.div key="expenses"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                <GlassCard className="p-5">
                  <div className="mb-4 text-sm font-semibold text-white/90">Split Expenses</div>
                  {wsExpenses.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/12 px-4 py-8 text-center text-xs text-white/35">
                      No split expenses yet. Add one above.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {wsExpenses.map((exp) => {
                        const perPerson = r2(exp.totalAmount / (exp.splits?.length || 1));
                        return (
                          <div key={exp.id} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                            <div className="mb-3 flex items-start justify-between gap-2">
                              <div>
                                <div className="text-sm font-semibold text-white/90">{exp.description}</div>
                                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-white/40">
                                  <span>{exp.category}</span>
                                  <span>·</span>
                                  <span>{new Date(exp.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
                                  <span>·</span>
                                  <span>{fmt(perPerson)}/person</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white/90">{fmt(exp.totalAmount)}</span>
                                <button type="button" onClick={() => deleteExpense(exp.id)}
                                  className="rounded-lg p-1 text-white/25 transition hover:bg-red-500/10 hover:text-red-400">
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>

                            {/* Paid-by pills */}
                            {(exp.splits ?? []).some((sp) => sp.paid > 0.01) && (
                              <div className="mb-2 flex flex-wrap gap-1.5">
                                {exp.splits.filter((sp) => sp.paid > 0.01).map((sp) => {
                                  const m = members.find((mm) => mm.id === sp.memberId);
                                  return (
                                    <span key={sp.memberId}
                                      className="rounded-full border border-blue-400/20 bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-300">
                                      {m?.name ?? sp.memberId} paid {fmt(sp.paid)}
                                    </span>
                                  );
                                })}
                              </div>
                            )}

                            {/* Per-person share chips */}
                            <div className="flex flex-wrap gap-1.5">
                              {(exp.splits ?? []).map((sp) => {
                                const m = members.find((mm) => mm.id === sp.memberId);
                                const net = r2(sp.paid - sp.share);
                                const settled = net >= 0;
                                return (
                                  <span key={sp.memberId}
                                    className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                                      settled
                                        ? "border-emerald-400/22 bg-emerald-500/10 text-emerald-300"
                                        : "border-white/10 bg-white/5 text-white/55"
                                    }`}>
                                    {settled ? <CheckCircle2 size={10} /> : null}
                                    {m?.name ?? sp.memberId} · {fmt(sp.share)}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </GlassCard>
              </Motion.div>
            )}

            {/* ─ History tab ─ */}
            {activeTab === "history" && (
              <Motion.div key="history"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                <GlassCard className="p-5">
                  <div className="mb-4 text-sm font-semibold text-white/90">Settlement History</div>
                  {wsSettlements.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/12 px-4 py-8 text-center text-xs text-white/35">
                      No settlements recorded yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {wsSettlements.map((s) => {
                        const from = members.find((m) => m.id === s.from);
                        const to   = members.find((m) => m.id === s.to);
                        return (
                          <div key={s.id}
                            className="group flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3 hover:border-white/18">
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar name={from?.name ?? "?"} />
                              <div className="flex items-center gap-1.5 text-xs min-w-0">
                                <span className="font-semibold text-white/85">{from?.name}</span>
                                <ArrowRight size={12} className="shrink-0 text-white/30" />
                                <span className="font-semibold text-white/85">{to?.name}</span>
                                {s.note && <span className="text-white/35">· {s.note}</span>}
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2.5">
                              <span className="text-sm font-bold text-emerald-300 tabular-nums">
                                {fmt(s.amount)}
                              </span>
                              <span className="text-[10px] text-white/30">
                                {formatDateTime(s.settledAt)}
                              </span>
                              <button
                                type="button"
                                onClick={() => deleteSettlement(s.id)}
                                className="hidden rounded-lg p-1 text-white/25 transition hover:bg-red-500/10 hover:text-red-400 group-hover:block"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </GlassCard>
              </Motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* ── Modals ── */}
      <AddExpenseModal
        open={addExpenseOpen}
        onClose={() => setAddExpenseOpen(false)}
        members={members}
        workspaceId={activeWorkspaceId}
      />
      <SettleModal
        open={Boolean(settleTarget)}
        onClose={() => setSettleTarget(null)}
        txn={settleTarget}
        members={members}
        workspaceId={activeWorkspaceId}
      />
    </div>
  );
}
