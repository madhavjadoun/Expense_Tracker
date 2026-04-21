/**
 * usePlanStore — global, reactive, localStorage-persisted plan state.
 *
 * This is the single source of truth for the active plan across the entire app.
 * Both PlansPage (read/write) and useAppStore addExpenseOptimistic (read) use it.
 */
import { create } from "zustand";

// Legacy (unscoped) key — only used as migration fallback.
const LS_PLAN_KEY_LEGACY = "xpense_current_plan";
/** Returns the uid-scoped plan key. */
const planKey = (uid) => `xpense_current_plan_${uid}`;

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

// ─── Subscription metadata helpers ───────────────────────────────────────────

/**
 * uid-scoped key for the full subscription object:
 *   { plan, startDate, endDate, nextPlan }
 * This is separate from the planId string key so the rest of the app
 * (limit guards, plan badges) still works via `planId` without changes.
 */
const subKey = (uid) => `plan_${uid}`;

function loadSub(uid) {
  if (!uid) return null;
  try {
    const raw = localStorage.getItem(subKey(uid));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveSub(uid, data) {
  if (!uid) return;
  try { localStorage.setItem(subKey(uid), JSON.stringify(data)); } catch {}
}

/** Returns an ISO string 30 days from now. */
function addDays30() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString();
}

/** Format ISO date → "21 Apr 2026" */
export function formatSubDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const usePlanStore = create((set, get) => ({
  /** Current active plan id: "free" | "pro" | "team" */
  planId: "free",

  /** Scheduled next plan (applied when endDate passes). null = no change pending. */
  nextPlan: null,

  /** ISO string — when the current paid plan expires. null for free / no expiry. */
  planEndDate: null,

  /** uid currently active in this store instance (set by restoreForUser). */
  _uid: null,

  /**
   * Called on login / app start with the Firebase uid.
   * Loads subscription metadata (with expiry check), falling back to the
   * old planId-only key for existing users who have no subscription object yet.
   */
  restoreForUser: (uid) => {
    if (!uid) return;

    const meta = loadSub(uid);
    if (meta) {
      // ── Check expiry ──────────────────────────────────────────────────────
      if (meta.endDate && new Date(meta.endDate) <= new Date()) {
        const newPlan = meta.nextPlan || "free";
        const fresh = {
          plan: newPlan,
          startDate: new Date().toISOString(),
          endDate: null,
          nextPlan: null,
        };
        saveSub(uid, fresh);
        try { localStorage.setItem(planKey(uid), newPlan); } catch {}
        set({ planId: newPlan, nextPlan: null, planEndDate: null, _uid: uid });
        return;
      }
      // ── Plan still active ─────────────────────────────────────────────────
      try { localStorage.setItem(planKey(uid), meta.plan); } catch {}
      set({
        planId:      meta.plan,
        nextPlan:    meta.nextPlan   ?? null,
        planEndDate: meta.endDate    ?? null,
        _uid: uid,
      });
      return;
    }

    // ── Fallback: old planId-only storage (existing users / migration) ────
    try {
      const v = localStorage.getItem(planKey(uid));
      if (v && ["free", "pro", "team"].includes(v)) {
        set({ planId: v, nextPlan: null, planEndDate: null, _uid: uid });
        return;
      }
    } catch {}

    // ── Brand-new user: default to free ──────────────────────────────────
    try { localStorage.setItem(planKey(uid), "free"); } catch {}
    set({ planId: "free", nextPlan: null, planEndDate: null, _uid: uid });
  },

  /**
   * Check if the current plan has expired and apply nextPlan if so.
   * Call this on app start and login (after restoreForUser).
   */
  checkExpiry: () => {
    const uid = get()._uid;
    if (!uid) return;
    const meta = loadSub(uid);
    if (!meta || !meta.endDate) return;
    if (new Date(meta.endDate) <= new Date()) {
      const newPlan = meta.nextPlan || "free";
      const fresh = {
        plan: newPlan,
        startDate: new Date().toISOString(),
        endDate: null,
        nextPlan: null,
      };
      saveSub(uid, fresh);
      try { localStorage.setItem(planKey(uid), newPlan); } catch {}
      set({ planId: newPlan, nextPlan: null, planEndDate: null });
    }
  },

  /**
   * Activate a paid plan immediately (upgrade path).
   * Sets a 30-day subscription window and clears any scheduled nextPlan.
   */
  activatePlan: (id) => {
    const uid = get()._uid;
    const endDate = addDays30();
    const meta = {
      plan:      id,
      startDate: new Date().toISOString(),
      endDate:   id === "free" ? null : endDate,
      nextPlan:  null,
    };
    saveSub(uid, meta);
    try { if (uid) localStorage.setItem(planKey(uid), id); } catch {}
    set({ planId: id, nextPlan: null, planEndDate: id === "free" ? null : endDate });
  },

  /**
   * Schedule a downgrade to `id` — does NOT change the active plan.
   * The new plan will be applied automatically when the endDate passes.
   */
  scheduleDowngrade: (id) => {
    const uid = get()._uid;
    const current = loadSub(uid) || {
      plan:      get().planId,
      startDate: new Date().toISOString(),
      endDate:   get().planEndDate,
      nextPlan:  null,
    };
    const updated = { ...current, nextPlan: id };
    saveSub(uid, updated);
    set({ nextPlan: id });
  },

  /**
   * Cancel a scheduled downgrade.
   */
  cancelScheduledChange: () => {
    const uid = get()._uid;
    const current = loadSub(uid);
    if (current) saveSub(uid, { ...current, nextPlan: null });
    set({ nextPlan: null });
  },

  /**
   * Legacy alias — kept for backward compatibility with any existing callers.
   * For upgrades use activatePlan; for downgrades use scheduleDowngrade.
   */
  setPlan: (id) => {
    get().activatePlan(id);
  },

  /**
   * Called on logout — resets in-memory plan to "free" but does NOT
   * remove the uid-scoped localStorage key. The user's plan survives
   * logout and is restored by restoreForUser() on next login.
   */
  resetPlan: () => {
    set({ planId: "free", _uid: null });
  },
}));
