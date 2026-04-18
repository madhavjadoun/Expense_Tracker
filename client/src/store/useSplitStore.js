/**
 * useSplitStore — split expense system (Splitwise-style, workspace-isolated).
 *
 * ─── Data model ─────────────────────────────────────────────────────────────
 *
 *  members      { [workspaceId]: [{ id, name }] }
 *
 *  splitExpenses  [{
 *    id, workspaceId, description, totalAmount,
 *    splits: [{ memberId, share, paid }],   ← never mutated after creation
 *    createdAt
 *  }]
 *
 *  settlements  [{
 *    id, workspaceId, from, to, amount, note, settledAt
 *  }]
 *
 * ─── Balance formula ────────────────────────────────────────────────────────
 *  raw net[member] = Σ paid[member] − Σ share[member]   (across all expenses)
 *  adj net[member] = raw net − Σ settled_amounts_from[member]
 *                             + Σ settled_amounts_to[member]
 *
 * ─── Settlement algorithm ───────────────────────────────────────────────────
 *  Greedy O(n log n): sort creditors desc, debtors desc,
 *  repeatedly match min(creditor, debtor) until both lists are empty.
 *  Each match is one { from, to, amount } transaction.
 *
 * ─── Persistence ────────────────────────────────────────────────────────────
 *  Zustand persist → localStorage key "split-storage".
 *  Only members, splitExpenses, settlements are persisted.
 *  Deletes are reflected immediately and survive refresh.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ─── Constants ────────────────────────────────────────────────────────────────
const EPSILON = 0.01; // values below this are treated as zero

// ─── Pure math helpers (exported so SplitPage can use them) ──────────────────

/** Round to 2 decimal places and collapse sub-penny residue to 0. */
export function r2(n) {
  const v = Math.round(n * 100) / 100;
  return Math.abs(v) < EPSILON ? 0 : v;
}

/**
 * Compute raw net balance per member across all (workspace) split expenses.
 * net > 0  → member is owed money (they paid more than their share)
 * net < 0  → member owes money   (they paid less than their share)
 *
 * Returns { [memberId]: number }
 */
export function computeRawBalances(splitExpenses, workspaceId) {
  const net = {};
  for (const exp of splitExpenses) {
    if (exp.workspaceId !== workspaceId) continue;
    for (const sp of exp.splits ?? []) {
      const credit = r2(sp.paid ?? 0);
      const debit  = r2(sp.share ?? 0);
      net[sp.memberId] = r2((net[sp.memberId] ?? 0) + credit - debit);
    }
  }
  return net;
}

/**
 * Adjust raw balances by applying already-recorded settlements.
 * Settling means the debtor (from) has paid the creditor (to) outside the
 * split expense — so we subtract from `from` debt and add to `to` credit.
 *
 * Returns { [memberId]: number }
 */
export function applySettlements(rawNet, settlements, workspaceId) {
  const net = { ...rawNet };
  for (const s of settlements) {
    if (s.workspaceId !== workspaceId) continue;
    const amt = r2(s.amount);
    if (amt < EPSILON) continue;
    net[s.from] = r2((net[s.from] ?? 0) + amt);  // debtor paid → reduce debt
    net[s.to]   = r2((net[s.to]   ?? 0) - amt);  // creditor received → reduce credit
  }
  // Zero-clamp floating residue
  for (const key of Object.keys(net)) {
    if (Math.abs(net[key]) < EPSILON) net[key] = 0;
  }
  return net;
}

/**
 * Full net balance: raw − settlements combined in one call.
 */
export function computeNetBalances(splitExpenses, settlements, workspaceId) {
  const raw = computeRawBalances(splitExpenses, workspaceId);
  return applySettlements(raw, settlements, workspaceId);
}

/**
 * Minimum-transaction greedy debt simplification.
 * Input: { [memberId]: net } where net > 0 = creditor, net < 0 = debtor.
 * Returns: [{ from: memberId, to: memberId, amount }]  filtered to amount > EPSILON.
 */
export function simplifyDebts(netBalances) {
  const creditors = [];
  const debtors   = [];

  for (const [id, bal] of Object.entries(netBalances)) {
    if (bal >  EPSILON) creditors.push({ id, amount:  bal });
    if (bal < -EPSILON) debtors.push({   id, amount: -bal });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a,   b) => b.amount - a.amount);

  const txns = [];
  let ci = 0, di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const c = creditors[ci];
    const d = debtors[di];
    const amount = r2(Math.min(c.amount, d.amount));

    if (amount > EPSILON) {
      txns.push({ from: d.id, to: c.id, amount });
    }

    c.amount = r2(c.amount - amount);
    d.amount = r2(d.amount - amount);

    if (c.amount < EPSILON) ci++;
    if (d.amount < EPSILON) di++;
  }

  return txns.filter((t) => t.amount > EPSILON);
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSplitStore = create(
  persist(
    (set, get) => ({

      // ── State ────────────────────────────────────────────────────────────

      /** { [workspaceId]: [{ id, name }] } */
      members: {},

      /**
       * [{
       *   id, workspaceId, description, totalAmount,
       *   splits: [{ memberId, share, paid }],
       *   createdAt
       * }]
       */
      splitExpenses: [],

      /**
       * [{ id, workspaceId, from, to, amount, note, settledAt }]
       * Represents real-world payments made outside the app.
       * Used to adjust net balances. Deleting this ALSO removes its effect
       * from the balance math (since computeNetBalances re-applies them).
       */
      settlements: [],

      // ── Member management ─────────────────────────────────────────────────

      addMember: (workspaceId, name) => {
        const trimmed = name.trim();
        if (!trimmed) return false;
        const existing = get().members[workspaceId] ?? [];
        if (existing.some((m) => m.name.toLowerCase() === trimmed.toLowerCase())) return false;
        set((s) => ({
          members: {
            ...s.members,
            [workspaceId]: [...existing, { id: crypto.randomUUID(), name: trimmed }],
          },
        }));
        return true;
      },

      removeMember: (workspaceId, memberId) => {
        set((s) => ({
          members: {
            ...s.members,
            [workspaceId]: (s.members[workspaceId] ?? []).filter((m) => m.id !== memberId),
          },
        }));
      },

      // ── Split expense management ──────────────────────────────────────────

      /**
       * Add a new split expense.
       * @param {object} params
       * @param {string} params.workspaceId
       * @param {string} params.description
       * @param {number} params.totalAmount
       * @param {string} params.category
       * @param {Array<{ memberId: string, paid: number }>} params.paidBy
       *   — each entry: who paid and how much (totals must equal totalAmount)
       * @param {string[]} params.participantIds — who shares the cost equally
       */
      addSplitExpense: ({ workspaceId, description, totalAmount, category, paidBy, participantIds }) => {
        const safeTotal = r2(Number(totalAmount));
        if (safeTotal < EPSILON) return null;
        if (!participantIds?.length) return null;

        const share = r2(safeTotal / participantIds.length);

        // Build a paid-lookup from paidBy array
        const paidMap = {};
        for (const p of paidBy ?? []) {
          paidMap[p.memberId] = r2(Number(p.amount) || 0);
        }

        const splits = participantIds.map((memberId) => ({
          memberId,
          share,
          paid: paidMap[memberId] ?? 0,
        }));

        const expense = {
          id: crypto.randomUUID(),
          workspaceId,
          description: description.trim() || "Split Expense",
          totalAmount: safeTotal,
          category: category || "other",
          splits,
          createdAt: new Date().toISOString(),
        };

        set((s) => ({ splitExpenses: [expense, ...s.splitExpenses] }));
        return expense;
      },

      /**
       * Delete a split expense AND all its related settlements.
       * This ensures deleted expenses don't leave ghost settlement rows.
       */
      deleteExpense: (expenseId) => {
        set((s) => {
          const exp = s.splitExpenses.find((e) => e.id === expenseId);
          if (!exp) return {};

          // Collect member IDs involved in this expense
          const memberIds = new Set((exp.splits ?? []).map((sp) => sp.memberId));

          // Remove settlements that were entirely within this expense's participants
          // (conservative: only remove if BOTH from & to were in this expense)
          const cleanedSettlements = s.settlements.filter(
            (st) =>
              st.workspaceId !== exp.workspaceId ||
              !(memberIds.has(st.from) && memberIds.has(st.to))
          );

          return {
            splitExpenses: s.splitExpenses.filter((e) => e.id !== expenseId),
            settlements: cleanedSettlements,
          };
        });
      },

      // ── Settlement management ─────────────────────────────────────────────

      /**
       * Record that `from` paid `to` the given amount outside the app.
       * This adjusts net balances immediately and persists to localStorage.
       * Silently ignored if amount <= EPSILON.
       */
      recordSettlement: ({ workspaceId, from, to, amount, note = "" }) => {
        const safeAmt = r2(Number(amount));
        if (safeAmt < EPSILON) return null;

        const entry = {
          id: crypto.randomUUID(),
          workspaceId,
          from,
          to,
          amount: safeAmt,
          note: note.trim(),
          settledAt: new Date().toISOString(),
        };

        set((s) => ({ settlements: [entry, ...s.settlements] }));
        return entry;
      },

      /**
       * Delete a settlement history entry.
       * We mark it deleted:true instead of removing it from the array.
       * applySettlements still processes it, so the debt stays settled in the
       * Balances tab — it never comes back. The entry simply disappears from
       * the History tab and survives page refresh correctly.
       */
      deleteSettlement: (settlementId) => {
        set((s) => ({
          settlements: s.settlements.map((st) =>
            st.id === settlementId ? { ...st, deleted: true } : st
          ),
        }));
      },
    }),

    // ── Persist config ─────────────────────────────────────────────────────
    {
      name: "split-storage",
      storage: createJSONStorage(() => localStorage),
      // Only persist the data slices — not derived/computed state
      partialize: (s) => ({
        members:       s.members,
        splitExpenses: s.splitExpenses,
        settlements:   s.settlements,
      }),
    }
  )
);
