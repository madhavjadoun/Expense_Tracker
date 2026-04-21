import { create } from "zustand";
import { api } from "../services/api";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "../firebase";
import { notify, useNotificationStore } from "./useNotificationStore";
import { useUserStore } from "./useUserStore";
import { generateInsights } from "../utils/budgetInsights";
import { usePlanStore, isExpenseLimitReached } from "./usePlanStore";
import { useWorkspaceStore } from "./useWorkspaceStore";

// ─── localStorage helpers ────────────────────────────────────────────────────────────────
const WS_EXPENSE_MAP_KEY = "xpense_ws_expense_map";
const WS_BUDGETS_KEY     = "xpense_ws_budgets";

/** Per-user budget cache key (default workspace only). Scoped by uid. */
function budgetCacheKey(uid) {
  return uid ? `budget_monthly_${uid}` : null;
}

function loadCachedBudget(uid) {
  const key = budgetCacheKey(uid);
  if (!key) return 0;
  return loadJSON(key, 0);
}

function saveCachedBudget(uid, value) {
  const key = budgetCacheKey(uid);
  if (!key) return;
  saveJSON(key, value);
}

function loadJSON(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

/**
 * Re-apply stored workspaceId values to a fresh array of expenses from the
 * backend (which has no knowledge of client-side workspaces).
 */
function applyWorkspaceMap(expenses, map) {
  return expenses.map((e) => ({
    ...e,
    workspaceId: map[e.id] ?? "default",
  }));
}

function normalizeFirebaseUser(user) {
  if (!user) return null;
  return {
    uid: user.uid,
    name: user.displayName || "",
    email: user.email || "",
  };
}

function mapFirebaseAuthError(error, mode) {
  const code = error?.code || "";
  if (mode === "signup") {
    if (code === "auth/email-already-in-use") return "Account already exists";
    if (code === "auth/invalid-email") return "Invalid email";
    if (code === "auth/weak-password") {
      return "Password must be at least 6 characters";
    }
    return "Signup failed.";
  }
  if (code === "auth/user-not-found" || code === "auth/invalid-credential") {
    return "User not found";
  }
  if (code === "auth/wrong-password") return "Incorrect password";
  if (code === "auth/invalid-email") return "Invalid email";
  return "Login failed.";
}

function sortByDateDesc(a, b) {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

export const useAppStore = create((set, get) => ({
  user: null,

  theme: (() => {
    const saved = localStorage.getItem("theme") || "dark";
    document.documentElement.classList.toggle("dark", saved === "dark");
    return saved;
  })(),
  toggleTheme: () => set((s) => {
    const nextTheme = s.theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    return { theme: nextTheme };
  }),

  currency: localStorage.getItem("preferred_currency") || "INR",
  setCurrency: (currency) => {
    localStorage.setItem("preferred_currency", currency);
    set({ currency });
  },

  ui: {
    sidebarOpen: false, // mobile drawer
    sidebarCollapsed: false, // desktop
  },

  expenses: [],

  /**
   * Client-side map: expenseId → workspaceId.
   * Persisted in localStorage so workspaceId survives page refresh and
   * backend re-fetches (backend has no workspace concept).
   */
  workspaceExpenseMap: loadJSON(WS_EXPENSE_MAP_KEY, {}),

  /**
   * Per-workspace monthly budgets for non-default workspaces.
   * Map: workspaceId → number.
   * Default workspace budget is stored in budgetMonthly (MongoDB-synced).
   */
  workspaceBudgets: loadJSON(WS_BUDGETS_KEY, {}),

  // Monthly budget (per Firebase uid, default workspace — synced with MongoDB)
  // Initialised synchronously from localStorage so the value is visible on the
  // very first render — no async wait needed.
  budgetMonthly: (() => {
    try {
      const uid = localStorage.getItem("activeSessionUid");
      if (!uid) return 0;
      const key = `budget_monthly_${uid}`;
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : 0;
    } catch { return 0; }
  })(),

  // Generated insights (UI-only)
  insights: {
    lines: [],
    budgetStatus: "unknown",
  },
  budgetExceededNotified: false,

  loading: {
    auth: false,
    expenses: false,
  },

  error: {
    expenses: null,
  },

  // --- UI actions ---
  setAuthUser: (firebaseUser) => set({ user: normalizeFirebaseUser(firebaseUser) }),
  setSidebarOpen: (open) =>
    set((s) => ({ ui: { ...s.ui, sidebarOpen: open } })),
  toggleSidebarOpen: () =>
    set((s) => ({ ui: { ...s.ui, sidebarOpen: !s.ui.sidebarOpen } })),
  toggleSidebarCollapsed: () =>
    set((s) => ({ ui: { ...s.ui, sidebarCollapsed: !s.ui.sidebarCollapsed } })),

  /**
   * After login: sync profile + budget from MongoDB, then fetch expenses.
   * Sets localStorage activeSessionUid for per-user notification keys.
   * Does NOT clear in-memory expenses before fetching — avoids blank flash.
   */
  bootstrapUserSession: async (authUser) => {
    if (!authUser?.uid) return;
    const uid = authUser.uid;
    if (typeof window !== "undefined") {
      localStorage.setItem("activeSessionUid", uid);
    }
    useNotificationStore.getState().reloadFromStorage();

    // Pre-seed budget from localStorage (fast-path, already done in initial state
    // but re-applied here to handle user switching on the same device).
    const cachedBudget = loadCachedBudget(uid);

    // Reset error and set budget — do NOT clear expenses so there is no blank flash
    // if expenses were already in memory from a previous session render.
    set((s) => ({
      error: { ...s.error, expenses: null },
      budgetExceededNotified: false,
      budgetMonthly: cachedBudget,
    }));

    // Restore user-specific persisted state (uid-scoped localStorage keys)
    // BEFORE hitting the server, so initFromServer can merge correctly.
    useWorkspaceStore.getState().restoreForUser(uid);
    usePlanStore.getState().restoreForUser(uid);
    // Apply any expired subscription (e.g. paid plan whose 30-day window elapsed).
    usePlanStore.getState().checkExpiry();

    // Run profile sync and workspace fetch in parallel — they're independent.
    // This cuts bootstrap time roughly in half vs running them serially.
    await Promise.all([
      useUserStore.getState().syncProfileFromServer(authUser),
      api.fetchWorkspaces()
        .then((serverWorkspaces) => {
          useWorkspaceStore.getState().initFromServer(serverWorkspaces);
        })
        .catch(() => { /* Non-fatal: fall back to localStorage. */ }),
    ]);

    const prof   = useUserStore.getState().profile;
    const budget = Number(prof?.monthlyBudget) || cachedBudget;
    // Persist authoritative server value so next session loads instantly.
    saveCachedBudget(uid, budget);
    // Single atomic update — avoids an intermediate render with stale insights.
    set({ budgetMonthly: budget });

    const activeWsId = useWorkspaceStore.getState().activeWorkspaceId;
    await get().fetchExpenses(activeWsId);
  },


  setBudgetMonthly: async (nextBudget) => {
    const budget = Number(nextBudget);
    const safeBudget = Number.isFinite(budget) ? budget : 0;
    const uid = get().user?.uid;
    const prevProfile = useUserStore.getState().profile;
    useUserStore.getState().setProfile({ ...prevProfile, monthlyBudget: safeBudget });
    // Persist locally first so the value survives navigation without a server round-trip.
    if (uid) saveCachedBudget(uid, safeBudget);
    if (uid) {
      try {
        await api.saveProfile({ monthlyBudget: safeBudget });
      } catch {
        // offline / server down — local cache still updated
      }
    }
    const expenses = get().expenses;
    const insights = generateInsights(expenses, safeBudget);
    set({ budgetMonthly: safeBudget, insights });
    const wasNotified = get().budgetExceededNotified;
    const isExceeded = insights?.budgetStatus === "exceeded";
    if (isExceeded && !wasNotified) {
      notify({ type: "error", message: "Budget exceeded." });
      set({ budgetExceededNotified: true });
    } else if (!isExceeded && wasNotified) {
      set({ budgetExceededNotified: false });
    }
  },

  recomputeInsights: () => {
    const expenses = get().expenses;
    const budgetMonthly = get().budgetMonthly;
    const insights = generateInsights(expenses, budgetMonthly);
    set({ insights });
  },

  // --- Auth actions (UI-only) ---
  signup: async ({ name, email, password }) => {
    const normalizedEmail = (email || "").trim();
    const normalizedPassword = password || "";
    const trimmedName = (name || "").trim();
    if (!normalizedEmail) {
      return { ok: false, message: "Email should not be empty." };
    }
    if (normalizedPassword.length < 6) {
      return { ok: false, message: "Password must be at least 6 characters" };
    }
    set((s) => ({ loading: { ...s.loading, auth: true } }));
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        normalizedPassword
      );
      if (trimmedName) {
        await updateProfile(cred.user, { displayName: trimmedName });
      }
      const nextUser = {
        uid: cred.user.uid,
        name: trimmedName || cred.user.displayName || "",
        email: cred.user.email || normalizedEmail,
      };
      set((s) => ({ user: nextUser, loading: { ...s.loading, auth: false } }));
      return { ok: true, user: nextUser };
    } catch (e) {
      set((s) => ({ loading: { ...s.loading, auth: false } }));
      return { ok: false, message: mapFirebaseAuthError(e, "signup") };
    }
  },

  login: async ({ email, password }) => {
    const normalizedEmail = (email || "").trim();
    const normalizedPassword = password || "";
    if (!normalizedEmail) {
      return { ok: false, message: "Email should not be empty." };
    }
    if (normalizedPassword.length < 6) {
      return { ok: false, message: "Password must be at least 6 characters" };
    }
    set((s) => ({ loading: { ...s.loading, auth: true } }));
    try {
      const cred = await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        normalizedPassword
      );
      const nextUser = normalizeFirebaseUser(cred.user);
      set((s) => ({ user: nextUser, loading: { ...s.loading, auth: false } }));
      return { ok: true, user: nextUser };
    } catch (e) {
      set((s) => ({ loading: { ...s.loading, auth: false } }));
      return { ok: false, message: mapFirebaseAuthError(e, "login") };
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("activeSessionUid");
        // Clear legacy (unscoped) keys — these were used before uid-scoped storage.
        // restoreForUser() no longer reads them, so removing them prevents stale data.
        localStorage.removeItem("xpense_workspaces");
        localStorage.removeItem("xpense_active_workspace");
        localStorage.removeItem("xpense_current_plan");
      }
      useNotificationStore.getState().clearAll();
      useUserStore.getState().resetForLogout();
      // Reset workspace in-memory state (uid-scoped LS keys are preserved for next login).
      useWorkspaceStore.getState().resetForLogout();
      // Reset plan in-memory state (uid-scoped LS key is preserved for next login).
      usePlanStore.getState().resetPlan();
      set({
        user: null,
        expenses: [],
        budgetMonthly: 0,
        insights: { lines: [], budgetStatus: "unknown" },
        budgetExceededNotified: false,
        error: { expenses: null },
      });
      // Note: uid-scoped budget cache key is intentionally preserved so the
      // user's budget reloads instantly on next login (same device).
    }
  },

  /**
   * Permanently delete this account and ALL associated data.
   *
   * Order of operations (important — do not reorder):
   *   1. Call backend DELETE /api/profile/me
   *      → backend deletes expenses, profile, owned workspaces from MongoDB
   *      → backend calls Firebase Admin deleteUser (invalidates the ID token)
   *   2. Wipe every uid-scoped localStorage key for this user so a fresh
   *      signup on the same device starts with a completely clean slate.
   *   3. Sign out of Firebase Auth locally.
   *   4. Reset all Zustand store slices to their initial state.
   *
   * Returns { ok: true } on success or { ok: false, message } on error.
   * The caller is responsible for navigating away (e.g. to /signup).
   */
  deleteAccount: async () => {
    const uid = get().user?.uid;

    // ── 1. Server-side deletion ───────────────────────────────────────────────
    const result = await api.deleteAccount();
    if (!result.ok) {
      return { ok: false, message: result.message };
    }

    // ── 2. Wipe ALL uid-scoped localStorage keys for this user ───────────────
    if (uid && typeof window !== "undefined") {
      const keysToRemove = [
        // App-level keys
        "activeSessionUid",
        // Legacy (unscoped) keys
        "xpense_workspaces",
        "xpense_active_workspace",
        "xpense_current_plan",
        // Expense workspace maps (not uid-scoped — clear them too)
        "xpense_ws_expense_map",
        "xpense_ws_budgets",
        // Split data (Zustand persist)
        "split-storage",
        // uid-scoped budget
        `budget_monthly_${uid}`,
        // uid-scoped workspaces
        `xpense_workspaces_${uid}`,
        `xpense_active_workspace_${uid}`,
        // uid-scoped plan
        `xpense_current_plan_${uid}`,
        // uid-scoped billing history
        `xpense_billing_history_${uid}`,
        // uid-scoped subscription metadata
        `plan_${uid}`,
        // uid-scoped profile & avatar
        `profile_${uid}`,
        `avatar_${uid}`,
        // Legacy profile keys
        `profileData_${uid}`,
        `profileAvatar_${uid}`,
        // Legacy global billing history key (pre-uid-scope migration)
        "xpense_billing_history",
        // Notification keys (pattern: notifications_<uid>_*)
        // Enumerate them since we don't know the exact suffix
        ...Object.keys(localStorage).filter(
          (k) => k.startsWith(`notifications_${uid}`)
        ),
      ];
      keysToRemove.forEach((k) => {
        try { localStorage.removeItem(k); } catch { /* ignore */ }
      });
    }

    // ── 3. Firebase local sign-out ────────────────────────────────────────────
    try { await signOut(auth); } catch { /* ignore — token already invalidated */ }

    // ── 4. Reset all store slices ─────────────────────────────────────────────
    useNotificationStore.getState().clearAll();
    useUserStore.getState().resetForLogout();
    useWorkspaceStore.getState().resetForLogout();
    usePlanStore.getState().resetPlan();
    set({
      user: null,
      expenses: [],
      budgetMonthly: 0,
      insights: { lines: [], budgetStatus: "unknown" },
      budgetExceededNotified: false,
      error: { expenses: null },
    });

    return { ok: true };
  },

  // --- Expenses (with loading/error + optimistic updates) ---
  fetchExpenses: async (workspaceId) => {
    set((s) => ({
      loading: { ...s.loading, expenses: true },
      error:   { ...s.error,   expenses: null },
    }));
    try {
      const raw       = await api.fetchExpenses(workspaceId);
      const map       = get().workspaceExpenseMap;
      // Re-apply client-side workspaceId to every expense from the backend
      const hydrated  = applyWorkspaceMap(raw, map);
      const sorted    = hydrated.slice().sort(sortByDateDesc);
      const budget    = get().budgetMonthly;
      const insights  = generateInsights(sorted, budget);
      set((s) => ({ expenses: sorted, insights, loading: { ...s.loading, expenses: false } }));
      const wasNotified = get().budgetExceededNotified;
      const isExceeded  = insights?.budgetStatus === "exceeded";
      if (isExceeded && !wasNotified) {
        notify({ type: "error", message: "Budget exceeded." });
        set({ budgetExceededNotified: true });
      } else if (!isExceeded && wasNotified) {
        set({ budgetExceededNotified: false });
      }
      return { ok: true };
    } catch (e) {
      set((s) => ({
        loading: { ...s.loading, expenses: false },
        error:   { ...s.error, expenses: e?.message || "Failed to load expenses." },
      }));
      return { ok: false };
    }
  },

  addExpenseOptimistic: async (draftExpense) => {
    // ── Plan limit guard ───────────────────────────────────────────────────
    const planId = usePlanStore.getState().planId;
    if (isExpenseLimitReached(planId, get().expenses.length)) {
      return { ok: false, limitReached: true, message: "Limit reached! Upgrade your plan to add more expenses." };
    }

    // ── Workspace tag ───────────────────────────────────────────────────
    const workspaceId = draftExpense.workspaceId ?? "default";

    const tempId = crypto.randomUUID();
    const optimistic = {
      id:          tempId,
      amount:      Number(draftExpense.amount),
      category:    draftExpense.category,
      note:        draftExpense.note || "",
      date:        new Date().toISOString(),
      workspaceId, // ← always attached
      isRecurring:  Boolean(draftExpense.isRecurring),
      recurringType: draftExpense.isRecurring ? draftExpense.recurringType : null,
      _optimistic: true,
    };

    // Store workspaceId in the persistent map immediately (temp ID)
    const mapWithTemp = { ...get().workspaceExpenseMap, [tempId]: workspaceId };
    saveJSON(WS_EXPENSE_MAP_KEY, mapWithTemp);
    set({ workspaceExpenseMap: mapWithTemp });

    const prev = get().expenses;
    const nextExpenses = [optimistic, ...prev].slice().sort(sortByDateDesc);
    const insights     = generateInsights(nextExpenses, get().budgetMonthly);
    set({ expenses: nextExpenses, insights });

    const wasNotified = get().budgetExceededNotified;
    const isExceeded  = insights?.budgetStatus === "exceeded";
    if (isExceeded && !wasNotified) {
      notify({ type: "error", message: "Budget exceeded." });
      set({ budgetExceededNotified: true });
    } else if (!isExceeded && wasNotified) {
      set({ budgetExceededNotified: false });
    }

    try {
      const saved = await api.addExpense(optimistic);

      // Migrate temp ID → real ID in the workspace map
      const prevMap   = get().workspaceExpenseMap;
      const nextMap   = { ...prevMap, [saved.id]: workspaceId };
      delete nextMap[tempId];
      saveJSON(WS_EXPENSE_MAP_KEY, nextMap);
      set({ workspaceExpenseMap: nextMap });

      set((s) => {
        const updated = s.expenses
          .map((e) => (e.id === tempId ? { ...saved, workspaceId } : e))
          .slice()
          .sort(sortByDateDesc);
        return { expenses: updated, insights: generateInsights(updated, get().budgetMonthly) };
      });
      return { ok: true };
    } catch (e) {
      // Rollback — remove temp entry from map too
      const rolledMap = { ...get().workspaceExpenseMap };
      delete rolledMap[tempId];
      saveJSON(WS_EXPENSE_MAP_KEY, rolledMap);
      set({ expenses: prev, workspaceExpenseMap: rolledMap,
            insights: generateInsights(prev, get().budgetMonthly) });
      return { ok: false, message: e?.message || "Failed to add expense." };
    }
  },

  /** Per-workspace budget (non-default workspaces only). */
  setWorkspaceBudget: (workspaceId, amount) => {
    const safe = Number(amount) || 0;
    const next = { ...get().workspaceBudgets, [workspaceId]: safe };
    saveJSON(WS_BUDGETS_KEY, next);
    set({ workspaceBudgets: next });
  },

  deleteExpenseOptimistic: async (id) => {
    const prev        = get().expenses;
    const next        = prev.filter((e) => e.id !== id);
    const insights    = generateInsights(next, get().budgetMonthly);
    // Optimistic: remove from UI immediately
    set({ expenses: next, insights });
    const wasNotified = get().budgetExceededNotified;
    const isExceeded  = insights?.budgetStatus === "exceeded";
    if (isExceeded && !wasNotified) {
      notify({ type: "error", message: "Budget exceeded." });
      set({ budgetExceededNotified: true });
    } else if (!isExceeded && wasNotified) {
      set({ budgetExceededNotified: false });
    }

    // Clean up workspace map immediately (don't wait for API)
    const nextMap = { ...get().workspaceExpenseMap };
    delete nextMap[id];
    saveJSON(WS_EXPENSE_MAP_KEY, nextMap);
    set({ workspaceExpenseMap: nextMap });

    try {
      await api.deleteExpense(id);
      return { ok: true };
    } catch (e) {
      const msg = e?.message || "";
      // If "not found" — expense was already deleted or never in backend. Don't rollback.
      if (msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("404")) {
        return { ok: true };
      }
      // For genuine server errors — rollback UI
      set({ expenses: prev, insights: generateInsights(prev, get().budgetMonthly) });
      // Restore workspace map
      saveJSON(WS_EXPENSE_MAP_KEY, { ...get().workspaceExpenseMap, [id]: prev.find(e => e.id === id)?.workspaceId });
      return { ok: false, message: msg || "Failed to delete expense." };
    }
  },

  updateExpenseOptimistic: async (id, patch) => {
    const prev        = get().expenses;
    // Preserve workspaceId through the update — never let backend data overwrite it
    const existingWs  = prev.find((e) => e.id === id)?.workspaceId ?? "default";
    const nextExpenses = prev
      .map((e) => (e.id === id ? { ...e, ...patch, workspaceId: existingWs } : e))
      .slice()
      .sort(sortByDateDesc);
    const insights    = generateInsights(nextExpenses, get().budgetMonthly);
    set({ expenses: nextExpenses, insights });
    const wasNotified = get().budgetExceededNotified;
    const isExceeded  = insights?.budgetStatus === "exceeded";
    if (isExceeded && !wasNotified) {
      notify({ type: "error", message: "Budget exceeded." });
      set({ budgetExceededNotified: true });
    } else if (!isExceeded && wasNotified) {
      set({ budgetExceededNotified: false });
    }
    try {
      const saved = await api.updateExpense(id, patch);
      set((s) => {
        const updated = s.expenses
          // Preserve workspaceId — backend response doesn't include it
          .map((e) => (e.id === id ? { ...saved, workspaceId: existingWs } : e))
          .slice()
          .sort(sortByDateDesc);
        return { expenses: updated, insights: generateInsights(updated, get().budgetMonthly) };
      });
      return { ok: true };
    } catch (e) {
      set({ expenses: prev, insights: generateInsights(prev, get().budgetMonthly) });
      return { ok: false, message: e?.message || "Failed to update expense." };
    }
  },
}));

