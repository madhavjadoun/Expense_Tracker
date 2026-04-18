/**
 * usePlanStore — global, reactive, localStorage-persisted plan state.
 *
 * This is the single source of truth for the active plan across the entire app.
 * Both PlansPage (read/write) and useAppStore addExpenseOptimistic (read) use it.
 */
import { create } from "zustand";

const LS_PLAN_KEY = "xpense_current_plan";

// ─── Plan limit definitions ───────────────────────────────────────────────────
export const PLAN_LIMITS = {
  free: { expenses: 50,       members: 3        },
  pro:  { expenses: Infinity, members: 10       },
  team: { expenses: Infinity, members: Infinity },
};

/** Workspace limits per plan (free=1, pro=3, team=unlimited) */
export const PLAN_WORKSPACE_LIMITS = {
  free: 1,
  pro:  3,
  team: Infinity,
};

/** Returns the workspace cap for a given planId. */
export function getWorkspaceLimit(planId) {
  return PLAN_WORKSPACE_LIMITS[planId] ?? 1;
}

/** Returns true when the workspace count hits or exceeds the plan cap. */
export function isWorkspaceLimitReached(planId, totalWorkspaces) {
  const limit = getWorkspaceLimit(planId);
  return limit !== Infinity && totalWorkspaces >= limit;
}

// ─── Derived helpers (pure, no state) ────────────────────────────────────────

/** Returns the expense cap for a given planId. */
export function getExpenseLimit(planId) {
  return PLAN_LIMITS[planId]?.expenses ?? 50;
}

/** Returns true when the expense count hits or exceeds the plan cap. */
export function isExpenseLimitReached(planId, totalExpenses) {
  const limit = getExpenseLimit(planId);
  return limit !== Infinity && totalExpenses >= limit;
}

/**
 * Returns a 0-100 usage percentage.
 * Unlimited plans always return 0 (progress bar hidden / "∞" shown).
 */
export function getUsagePercent(planId, totalExpenses) {
  const limit = getExpenseLimit(planId);
  if (limit === Infinity) return 0;
  return Math.min(100, Math.round((totalExpenses / limit) * 100));
}

/**
 * Color token for the usage progress bar.
 * < 50%  → emerald
 * 50–80% → amber
 * > 80%  → red
 */
export function getUsageColor(usagePercent) {
  if (usagePercent > 80) return "red";
  if (usagePercent >= 50) return "amber";
  return "emerald";
}

// ─── Store ───────────────────────────────────────────────────────────────────

function loadPlan() {
  try {
    const v = localStorage.getItem(LS_PLAN_KEY);
    if (v && ["free", "pro", "team"].includes(v)) return v;
  } catch {}
  return "free";
}

export const usePlanStore = create((set) => ({
  /** Current plan id: "free" | "pro" | "team" */
  planId: loadPlan(),

  /** Update plan id and persist to localStorage immediately. */
  setPlan: (id) => {
    try { localStorage.setItem(LS_PLAN_KEY, id); } catch {}
    set({ planId: id });
  },
}));
